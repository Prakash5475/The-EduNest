#!/usr/bin/env python3
"""
Parses edunest_database_schema.sql (source of truth — originally 138 tables /
197 FKs, verified against a live MySQL 8 server; 6 tables were added across
Phases 2-4 for Product Customization, Checkout, and Production Tracking,
bringing it to 144 tables — see CHANGELOG.md) and emits prisma/schema.prisma.

This exists because `prisma db pull` needs to download a schema-engine binary
from binaries.prisma.sh, which isn't reachable from this sandbox's egress
allowlist. Deriving the schema straight from the SQL (rather than hand-typing
141 models) keeps it byte-accurate to the real database. Run `npx prisma
generate` in a normal dev/CI environment (unrestricted network) to produce
the client -- see README "Prisma" section.
"""
import re
import sys
from collections import OrderedDict

SQL_PATH = "edunest_database_schema.sql"
OUT_PATH = "prisma/schema.prisma"

with open(SQL_PATH, "r") as f:
    sql = f.read()

# Strip line comments (-- ...) but keep content otherwise intact
sql = re.sub(r"--.*", "", sql)

# Split into CREATE TABLE blocks
table_pattern = re.compile(
    r"CREATE TABLE\s+(\w+)\s*\((.*?)\)\s*ENGINE=InnoDB(.*?);",
    re.DOTALL,
)

def snake_to_pascal(name: str) -> str:
    return "".join(p.capitalize() for p in name.split("_"))

def snake_to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])

def singularize(name):
    if name.endswith("ies"):
        return name[:-3] + "y"
    if name.endswith("ses") or name.endswith("xes") or name.endswith("ches") or name.endswith("shes"):
        return name[:-2]
    if name.endswith("s"):
        return name[:-1]
    return name

# ---- Pass 1: collect ENUM definitions per table.column, and column lines ----
tables = OrderedDict()  # name -> dict(columns=[...], pk=[...], uniques=[...], fks=[...])
enums = OrderedDict()   # EnumName -> [values]
enum_lookup = {}        # (table, column) -> EnumName

for m in table_pattern.finditer(sql):
    tname = m.group(1)
    body = m.group(2)
    tail = m.group(3)  # partition clause etc (after the closing paren, before ;)

    # Split body into top-level comma-separated definitions (balanced parens)
    defs = []
    depth = 0
    cur = ""
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            defs.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        defs.append(cur.strip())

    columns = []
    pk = []
    uniques = []  # list of (name, [cols])
    fks = []      # (col, ref_table, ref_col, on_delete, on_update)
    plain_indexes = []

    for d in defs:
        d = d.strip()
        if not d:
            continue
        if d.upper().startswith("PRIMARY KEY"):
            cols = re.findall(r"\((.*?)\)", d)[0]
            pk = [c.strip() for c in cols.split(",")]
            continue
        if d.upper().startswith("UNIQUE KEY"):
            mm = re.match(r"UNIQUE KEY\s+(\w+)\s*\((.*?)\)", d, re.IGNORECASE)
            if mm:
                uniques.append((mm.group(1), [c.strip() for c in mm.group(2).split(",")]))
            continue
        if d.upper().startswith("KEY "):
            mm = re.match(r"KEY\s+(\w+)\s*\((.*?)\)", d, re.IGNORECASE)
            if mm:
                plain_indexes.append((mm.group(1), [c.strip() for c in mm.group(2).split(",")]))
            continue
        if d.upper().startswith("CONSTRAINT"):
            mm = re.match(
                r"CONSTRAINT\s+(\w+)\s+FOREIGN KEY\s*\((\w+)\)\s+REFERENCES\s+(\w+)\s*\((\w+)\)(.*)",
                d, re.IGNORECASE,
            )
            if mm:
                fk_name, col, ref_table, ref_col, rest = mm.groups()
                on_delete = "Cascade" if "ON DELETE CASCADE" in rest.upper() else (
                    "SetNull" if "ON DELETE SET NULL" in rest.upper() else "Restrict"
                )
                on_update = "Cascade" if "ON UPDATE CASCADE" in rest.upper() else "Restrict"
                fks.append((fk_name, col, ref_table, ref_col, on_delete, on_update))
            continue
        if d.upper().startswith("CHECK") or d.upper().startswith("FULLTEXT"):
            continue
        # Otherwise: a column definition
        # name TYPE [UNSIGNED] [(...)]? [NOT NULL|NULL] [DEFAULT ...] [ON UPDATE ...] [COMMENT '...']
        cmt = re.match(r"^(\w+)\s+(.*)$", d)
        if not cmt:
            continue
        col_name, rest = cmt.groups()
        rest = rest.strip()
        if "PRIMARY KEY" in rest.upper() and not pk:
            pk = [col_name]
        columns.append((col_name, rest))

    tables[tname] = dict(
        columns=columns, pk=pk, uniques=uniques, fks=fks,
        plain_indexes=plain_indexes,
        partitioned="PARTITION BY" in tail.upper(),
    )

    # Extract enums from column definitions
    for col_name, rest in columns:
        emm = re.match(r"ENUM\((.*?)\)", rest, re.IGNORECASE)
        if emm:
            raw_vals = emm.group(1)
            vals = [v.strip().strip("'") for v in re.findall(r"'([^']*)'", raw_vals)]
            enum_name = snake_to_pascal(singularize(tname)) + snake_to_pascal(col_name)
            enums[enum_name] = vals
            enum_lookup[(tname, col_name)] = enum_name

print(f"Parsed {len(tables)} tables, {len(enums)} enums", file=sys.stderr)

# ---- Type mapping ----
def map_type(tname, col_name, rest):
    r = rest.upper()
    nullable = "NOT NULL" not in r and "PRIMARY KEY" not in r
    has_default_now = "DEFAULT CURRENT_TIMESTAMP" in r
    on_update_now = "ON UPDATE CURRENT_TIMESTAMP" in r
    is_uuid_default = "DEFAULT (UUID())" in rest.upper()
    is_autoincrement = "AUTO_INCREMENT" in r

    attrs = []
    prisma_type = None
    db_native = None

    if re.match(r"BIGINT\s+UNSIGNED", r):
        prisma_type = "BigInt"
        db_native = "@db.UnsignedBigInt"
    elif re.match(r"INT\s+UNSIGNED", r):
        prisma_type = "Int"
        db_native = "@db.UnsignedInt"
    elif re.match(r"SMALLINT\s+UNSIGNED", r):
        prisma_type = "Int"
        db_native = "@db.UnsignedSmallInt"
    elif re.match(r"TINYINT\s+UNSIGNED", r):
        prisma_type = "Int"
        db_native = "@db.UnsignedTinyInt"
    elif re.match(r"TINYINT\(1\)", r):
        prisma_type = "Boolean"
    elif re.match(r"TINYINT", r):
        prisma_type = "Int"
        db_native = "@db.TinyInt"
    elif re.match(r"BIGINT", r):
        prisma_type = "BigInt"
    elif re.match(r"INT", r):
        prisma_type = "Int"
    elif re.match(r"SMALLINT", r):
        prisma_type = "Int"
        db_native = "@db.SmallInt"
    elif r.startswith("DECIMAL"):
        mm = re.match(r"DECIMAL\((\d+),(\d+)\)", r)
        p, s = mm.groups() if mm else ("12", "2")
        prisma_type = "Decimal"
        db_native = f"@db.Decimal({p}, {s})"
    elif r.startswith("CHAR("):
        mm = re.match(r"CHAR\((\d+)\)", r)
        n = mm.group(1) if mm else "36"
        prisma_type = "String"
        db_native = f"@db.Char({n})"
    elif r.startswith("VARCHAR("):
        mm = re.match(r"VARCHAR\((\d+)\)", r)
        n = mm.group(1) if mm else "255"
        prisma_type = "String"
        db_native = f"@db.VarChar({n})"
    elif r.startswith("ENUM"):
        prisma_type = enum_lookup.get((tname, col_name), "String")
    elif r.startswith("TEXT"):
        prisma_type = "String"
        db_native = "@db.Text"
    elif r.startswith("MEDIUMTEXT"):
        prisma_type = "String"
        db_native = "@db.MediumText"
    elif r.startswith("LONGTEXT"):
        prisma_type = "String"
        db_native = "@db.LongText"
    elif r.startswith("JSON"):
        prisma_type = "Json"
    elif r.startswith("DATE") and not r.startswith("DATETIME"):
        prisma_type = "DateTime"
        db_native = "@db.Date"
    elif r.startswith("DATETIME"):
        prisma_type = "DateTime"
    elif r.startswith("TIMESTAMP"):
        prisma_type = "DateTime"
    elif r.startswith("FLOAT") or r.startswith("DOUBLE"):
        prisma_type = "Float"
    else:
        prisma_type = "String"

    return dict(
        prisma_type=prisma_type,
        db_native=db_native,
        nullable=nullable,
        has_default_now=has_default_now,
        on_update_now=on_update_now,
        is_uuid_default=is_uuid_default,
        is_autoincrement=is_autoincrement,
    )

# ---- Build relation info: for each FK, we need field names on both sides ----
# many-to-one field name on the child = camel(referenced table singular) [+ suffix if column doesn't match "<ref>_id"]
lines = []
lines.append("// ============================================================================")
lines.append("// THE EDUNEST — Prisma schema (MySQL)")
lines.append("// Auto-derived from edunest_database_schema.sql (144 tables / 204 FKs — 138")
lines.append("// tables / 197 FKs verified live in Phase 1; +6 tables added across Phases")
lines.append("// 2-4 (Customization, Checkout, Production Tracking), structurally checked")
lines.append("// but not yet re-run against a live server).")
lines.append("// Do not hand-edit column")
lines.append("// types here — change the SQL and regenerate via scripts/sql_to_prisma.py.")
lines.append("// ============================================================================")
lines.append("")
lines.append('generator client {')
lines.append('  provider = "prisma-client-js"')
lines.append('}')
lines.append("")
lines.append('datasource db {')
lines.append('  provider = "mysql"')
lines.append('  url      = env("DATABASE_URL")')
lines.append('}')
lines.append("")

# Enums block
for ename, vals in enums.items():
    lines.append(f"enum {ename} {{")
    for v in vals:
        ident = re.sub(r"[^A-Za-z0-9_]", "_", v)
        if re.match(r"^\d", ident):
            ident = "_" + ident
        if ident == v:
            lines.append(f"  {ident}")
        else:
            lines.append(f'  {ident} @map("{v}")')
    lines.append("}")
    lines.append("")

table_to_model = {t: snake_to_pascal(singularize(t)) for t in tables}

# Relation naming: collect, per referenced table, list of (child_table, fk_col) to disambiguate
fk_by_ref = {}
for tname, t in tables.items():
    for fk_name, col, ref_table, ref_col, on_delete, on_update in t["fks"]:
        fk_by_ref.setdefault(ref_table, []).append((tname, col))

for tname, t in tables.items():
    model_name = table_to_model[tname]
    lines.append(f"model {model_name} {{")

    fk_cols = {col: (ref_table, ref_col, on_delete, on_update, fk_name)
               for fk_name, col, ref_table, ref_col, on_delete, on_update in t["fks"]}

    col_field_names = {}
    col_nullable = {}
    for col_name, rest in t["columns"]:
        info = map_type(tname, col_name, rest)
        field = snake_to_camel(col_name)
        col_field_names[col_name] = field
        is_pk_member = col_name in t["pk"]
        col_nullable[col_name] = info["nullable"] and not is_pk_member
        parts = [field, info["prisma_type"]]
        if info["nullable"] and not is_pk_member:
            parts[1] += "?"
        attrs = []
        if len(t["pk"]) == 1 and t["pk"][0] == col_name:
            attrs.append("@id")
        if is_pk_member and info["is_autoincrement"]:
            attrs.append("@default(autoincrement())")
        if info["is_uuid_default"]:
            attrs.append("@default(uuid())")
        if info["has_default_now"] and not info["is_uuid_default"]:
            attrs.append("@default(now())")
        if info["on_update_now"]:
            attrs.append("@updatedAt")
        if col_name != field:
            attrs.append(f'@map("{col_name}")')
        if info["db_native"]:
            attrs.append(info["db_native"])
        line = "  " + " ".join(parts) + (" " + " ".join(attrs) if attrs else "")
        lines.append(line)

    # composite primary key
    if len(t["pk"]) > 1:
        mapped = ", ".join(col_field_names.get(c, snake_to_camel(c)) for c in t["pk"])
        lines.append(f"  @@id([{mapped}])")

    # relation fields (belongs-to, i.e. this table has the FK column)
    used_rel_names = set()
    for fk_name, col, ref_table, ref_col, on_delete, on_update in t["fks"]:
        if ref_table not in tables:
            continue  # deferred FK to a table defined later in a different section we didn't capture (shouldn't happen)
        ref_model = table_to_model[ref_table]
        base_rel_name = snake_to_camel(singularize(ref_table))
        rel_field = base_rel_name
        if rel_field in col_field_names.values() or rel_field in used_rel_names:
            rel_field = base_rel_name + "Ref"
        used_rel_names.add(rel_field)
        ref_field = col_field_names.get(ref_col, snake_to_camel(ref_col))
        # relation name must be unique per pair of models when multiple FKs point same direction
        rel_name = fk_name
        opt = "?" if col_nullable.get(col, False) else ""
        lines.append(
            f'  {rel_field} {ref_model}{opt} @relation("{rel_name}", fields: [{col_field_names[col]}], '
            f'references: [{ref_field}], onDelete: {on_delete}, onUpdate: {on_update})'
        )

    # unique constraints (skip ones that are exactly the single PK)
    for uname, cols in t["uniques"]:
        mapped = ", ".join(col_field_names.get(c, snake_to_camel(c)) for c in cols)
        lines.append(f'  @@unique([{mapped}], map: "{uname}")')

    # plain indexes
    for iname, cols in t["plain_indexes"]:
        mapped = ", ".join(col_field_names.get(c, snake_to_camel(c)) for c in cols)
        lines.append(f'  @@index([{mapped}], map: "{iname}")')

    lines.append(f'  @@map("{tname}")')
    lines.append("}")
    lines.append("")

# Now add back-relation fields (one-to-many "opposite" side) for every FK
model_extra_lines = {m: [] for m in table_to_model.values()}
for tname, t in tables.items():
    for fk_name, col, ref_table, ref_col, on_delete, on_update in t["fks"]:
        if ref_table not in tables:
            continue
        child_field = snake_to_camel(tname)
        # ensure uniqueness if a table has multiple FKs into the same ref table
        model_extra_lines[table_to_model[ref_table]].append((child_field, table_to_model[tname], fk_name))

# Rebuild output inserting opposite relation lines into each model body
final_lines = []
i = 0
current_model = None
seen_names_per_model = {}
while i < len(lines):
    line = lines[i]
    mm = re.match(r"^model (\w+) \{$", line)
    if mm:
        current_model = mm.group(1)
        seen_names_per_model[current_model] = set()
    if line.strip().startswith("@@map(") and current_model:
        extras = model_extra_lines.get(current_model, [])
        # de-dup / disambiguate names
        name_counts = {}
        for child_field, child_model, fk_name in extras:
            name_counts[child_field] = name_counts.get(child_field, 0) + 1
        for child_field, child_model, fk_name in extras:
            fname = child_field
            if name_counts[fname] > 1:
                fname = f"{child_field}_{fk_name}"
            if fname in seen_names_per_model[current_model]:
                fname = f"{fname}_{fk_name}"
            seen_names_per_model[current_model].add(fname)
            final_lines.append(f'  {fname} {child_model}[] @relation("{fk_name}")')
        current_model = None
    final_lines.append(line)
    i += 1

with open(OUT_PATH, "w") as f:
    f.write("\n".join(final_lines) + "\n")

print(f"Wrote {OUT_PATH}", file=sys.stderr)
