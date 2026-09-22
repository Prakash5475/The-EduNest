# Changelog

Tracks backend changes made on top of the original Phase 1 foundation, in the
order they were built. See `README.md` for setup and `docs/database_documentation.md`
for the schema.

## Phase 2 — Catalog, Cart, Wishlist, Product Customization

### Schema changes (`edunest_database_schema.sql` — now 141 tables / 200 FKs, was 138 / 197)

- **Added `products.is_customizable`** (`TINYINT(1) NOT NULL DEFAULT 0`). The
  Design Requirement Handbook's Product Details screen shows a "Customize
  Product" button only for customizable products, but nothing in the original
  schema recorded which products qualify. Minimal one-column addition, no
  redesign.
- **Added three new tables for the Product Customization workflow**
  (handbook Screen 9), which had no backing tables at all in the original
  schema:
  - `customization_requests` — one row per request: school, product, quantity,
    spec fields (custom text, color, size, material, branding/printing
    requirements, special instructions), `status` (`pending_review` →
    `reviewed` → `approved`/`rejected`), reviewer + review notes, and
    `converted_cart_item_id` (set once an approved request becomes a cart
    line, so the cart can show "Customized — Approved" against the exact
    approved spec).
  - `customization_files` — logo / artwork / reference-image uploads per
    request (kept as a child table rather than fixed columns, so a request
    can carry multiple reference images).
  - `customization_status_history` — audit trail of every status change,
    mirroring the existing `order_status_history` / `quotation_status_history`
    pattern already used elsewhere in this schema.
- These were added as a new `MODULE 8B` block in the SQL file (not
  renumbering the modules after it), following the file's existing naming,
  indexing, and deferred-FK conventions exactly. `scripts/sql_to_prisma.py`
  was updated to read the SQL from the repo root (`./edunest_database_schema.sql`)
  instead of a sandbox-specific upload path, and re-run to regenerate
  `prisma/schema.prisma` (141 tables, 73 enums — confirmed by the script's own
  parse-count output and a full relation-resolution pass).
- **Not yet done:** these 3 tables have not been executed against a live
  MySQL server (only the original 138 were, during Phase 1). Run
  `npx prisma migrate deploy` or load the SQL file directly and confirm
  before depending on this in production.

### Modules built

- **Catalog** — Categories, Brands, Products (with variants, images, specs,
  tags, inventory), search/filter/sort/pagination, related products,
  frequently-bought-together (from real order co-occurrence), compare,
  server-side MOQ enforcement, audited stock adjustments, low-stock report.
- **Cart & Wishlist** — per-school active cart, MOQ-enforced add/update,
  server-computed unit price snapshots, coupon *preview* (real validation
  against `Coupon`/`CouponUsage`, not persisted — see note below), default
  wishlist with move-to-cart, recently-viewed tracking.
- **Product Customization** — full request → review → approve/reject
  workflow against the new tables above; only `approved` requests can convert
  into a cart line; `rejected` requests can be edited and resubmitted.

### Known scope notes (called out rather than silently dropped or faked)

- **Bulk-pricing tiers** (e.g. "50–199 units = ₹X" from the handbook) still
  have no backing table. `Product` only has `basePrice` / `mrp` /
  `minOrderQty`. Needs a decision: add a `product_price_tiers` table, or
  confirm tiered pricing belongs to `DealerProduct` instead.
- **Coupons apply to `Order`, not `ShoppingCart`** — `CouponUsage` requires
  an `orderId`, and `shopping_carts` has no coupon column. `/cart/coupon-preview`
  validates and previews the discount for display only; the coupon is
  actually applied when the order is created in the Checkout phase.
- **`CartItem.itemType = 'kit'`** is not yet supported — `Kit` pricing lives
  in a separate `KitPricing` table that isn't built out yet, and accepting a
  client-supplied price for a kit would be a price-tampering hole. Cart only
  accepts `'product'` items until the Kits module ships.

## Phase 3 — Checkout, Payments (Razorpay), Orders

### Schema changes (`edunest_database_schema.sql` — now 142 tables / ~202 FKs, was 141 / 200)

- **Added `shipping_methods` table** (name, rate, estimated delivery days,
  active flag) + `orders.shipping_method_id` FK. The Checkout screen's
  Delivery Method selector (Standard/Express/Bulk Freight, each with its own
  price and delivery window) had no source of truth to compute
  `orders.shipping_amount` from — this is a lookup table, same pattern as
  `taxes`, not hardcoded prices in application code. Seeded 3 default methods
  in `prisma/seed.ts` (Standard/Express/Bulk Freight) since Checkout can't
  function with zero methods to choose from.
- **Added `payments.payment_type`** (`advance` / `balance` / `full` /
  `refund`). Without this there was no way to tell an order's first
  (50%-or-more) payment apart from its later balance settlement — needed for
  enforcing the advance rule, for Payment History's colour-coded tags, and
  for invoice-type selection.
- **Added `invoices.invoice_type`** (`advance_receipt` / `final_invoice`).
  The handbook explicitly distinguishes an immediate Advance Receipt from the
  Final GST Invoice issued once an order is fully settled; nothing recorded
  which was which.
- Regenerated via `scripts/sql_to_prisma.py`: 142 tables, 75 enums. Same
  caveat as Phase 2 — structurally validated, not yet re-run against a live
  MySQL server.
- **Did NOT add:** stored `amountPaid`/`balanceDue` columns on `Order`. These
  are computed on demand from `SUM(payments.amount WHERE status='success')`
  instead — real aggregation per the "never fabricate, always compute from
  the database" rule, and avoids a derived value that could drift from the
  actual payment records.

### Modules built

- **Checkout** — converts the active cart into an `Order` (`pending` /
  `unpaid`), validates billing/shipping addresses and delivery method belong
  to the school, computes real per-line GST from each product's assigned
  `Tax` rate, applies a validated coupon discount, computes
  `productionDeadline`/`expectedDeliveryDate` defaults from the chosen
  shipping method's estimated days (admin-overridable once the Admin Orders
  module lands), and generates a unique order number. Does not charge
  anything — payment is a separate step.
- **Payments (Razorpay)** — `POST /payments/initiate` computes the
  chargeable amount **entirely server-side** (never trusts a frontend
  number): the first payment on an order must be the configured minimum
  advance percentage (`ADVANCE_PAYMENT_MIN_PERCENT`, default 50) or the full
  total; once an advance is paid, only the real remaining balance may be
  charged. Creates a real Razorpay order via the official `razorpay` SDK.
  `POST /payments/:id/verify` re-verifies the checkout callback's HMAC
  signature (`orderId|paymentId` per Razorpay's documented scheme) before
  trusting it — a failed signature marks the payment failed, not successful.
  `POST /payments/webhook` independently verifies the separate webhook
  secret and handles `payment.captured`, `payment.failed`,
  `refund.processed`, `order.paid` — this is the authoritative confirmation
  path (idempotent with the client-side verify call, since a browser closing
  mid-checkout shouldn't leave a real payment unconfirmed). Raw request body
  capture was added to `app.ts`'s `express.json()` specifically so webhook
  signatures can be verified against the exact bytes Razorpay signed.
  On success, generates the Advance Receipt or Final GST Invoice
  (`invoices`/`invoice_items`) from the order's real line items — PDF
  rendering itself isn't wired up yet (`invoices.file_id` stays null until
  that phase); the invoice *data* is real.
- **Orders (school-facing)** — list (with tab-style status filtering),
  detail (items, payments, invoices, status history), cancel (only before
  `processing` begins, per the handbook), reorder (re-adds every
  still-orderable line from a past order, skipping anything now
  discontinued or below the current MOQ instead of failing the whole
  request). `remainingDays` is computed live from `productionDeadline`, not
  stored.

### Known scope notes

- Invoice **PDF generation** isn't implemented yet — invoice records exist
  with real amounts/line items, but no PDF is rendered/stored in Cloudinary.
- **Razorpay refunds** (`razorpayService.createRefund`) are implemented but
  not yet exposed via an admin-facing endpoint — refunds currently only get
  recorded when Razorpay's `refund.processed` webhook fires for a
  dashboard-initiated refund.
- Found and fixed a real bug before it shipped: the `/orders/:id/cancel`
  route was initially validated with a params-only schema whose body rule
  (`z.object({}).optional()`) silently strips any body content — so a
  client-supplied cancellation `reason` would have vanished. Gave it its own
  schema instead of reusing the generic id-param one.

### Infrastructure fix (Phase 2)

- Added a global `BigInt.prototype.toJSON` (see `src/utils/bigint.ts`).
  Every id/FK in this schema is a `BigInt`, and `res.json()` throws on those
  by default — this was a Phase 1 gap that would have broken the very first
  catalog response. Applied once globally instead of hand-writing a
  serializer per model.

## Phase 4 — Production Tracking, Priority Management

### Schema changes (`edunest_database_schema.sql` — now 144 tables / ~204 FKs, was 142 / 202)

- **Added `production_checkpoints`** — one append-only row per checkpoint
  update (`order_received` → `cutting` → `stitching` → `logo` → `printing` →
  `color_matching` → `quality_check` → `ready` → `packed` → `dispatched` →
  `delivered` → `completed`, matching the requirement exactly), with
  `completion_percentage`, `notes`, and `updated_by`. `order_timeline`
  already existed for free-text events, but nothing modeled a constrained
  checkpoint enum with completion percentage, and nothing enforced
  "never overwrite previous records" — this is deliberately insert-only.
- **Added `production_checkpoint_images`** — child table for photos attached
  to a checkpoint update (dealers documenting progress).
- Regenerated via `scripts/sql_to_prisma.py`: 144 tables, 77 enums.
- **Found and fixed a real generator bug**: the script silently dropped a
  column literally named `checkpoint` on this table — every other column
  and every FK-derived relation name generated correctly, just not that one
  scalar field (the model came out with no stage-like field at all). Root
  cause not fully isolated given time constraints, but reproducible: a
  column named identically to its own table's singular form appears to
  collide with something in the script's field-naming logic. Worked around
  by renaming the column to **`stage`** — regenerating confirmed this fixed
  it (`stage ProductionCheckpointStage` now present). The application code
  (`production.repository.ts`/`.service.ts`/`.validators.ts`) uses `stage`,
  not `checkpoint`, accordingly. If you add other tables later, avoid a
  column name matching its table's singular form, or debug the column-
  parsing loop in `scripts/sql_to_prisma.py` (~lines 60-120) properly.

### Modules built

- **Production Tracking** — append-only checkpoint log
  (`order_received → cutting → stitching → logo → printing → color_matching →
  quality_check → ready → packed → dispatched → delivered → completed`),
  restricted to the order's assigned dealer or admin/staff. Certain
  checkpoints (`dispatched`/`delivered`/`completed`) also advance
  `Order.status` so tracking pages that only read the order status stay in
  sync. Every update notifies the school and admin/staff (via the new shared
  `notifyUser`/`notifyUsersWithRole` helpers — persists a real `Notification`
  row, not just a socket blip) and emits a live `order:tracking-update`
  event to an authorization-checked `order:{id}` Socket.IO room (only the
  order's school, its assigned dealer, or admin/staff may join).
- **Quotation & Dealer Assignment** — built entirely on the existing
  `QuotationRequest → DealerQuotation → DealerQuotationItem →
  AcceptedQuotation` tables, no migration needed:
  - School submits a Master Quotation (`QuotationRequest`) with any mix of
    catalog products, kits, or free-text custom items.
  - Admin assigns disjoint subsets of its line items to one or more dealers
    in one call — one `DealerQuotation` per dealer, each seeing only its own
    assigned items (enforced by `DealerQuotationItem`'s unique constraint on
    `quotationRequestProductId`, which makes double-assignment a DB-level
    conflict, not just an application check). Initial pricing defaults to
    each product's real `basePrice`; the dealer can revise it.
  - Dealers see and can revise **only their own** quotations
    (`dealer/mine`) — cross-dealer visibility is impossible by construction
    (every dealer-facing query filters by `dealerId`).
  - School accepts or rejects each dealer's quotation independently.
    Accepting converts *that dealer's* items into a new `Order` (its own
    `dealerId`, its own line items, its own GST via each product's real
    `Tax`, its own delivery deadline from the dealer's
    `expectedCompletionDate`) — reusing the same `Payment`/Razorpay/50%-
    advance pipeline built in Phase 3, since it's just another `Order`.
  - **Known limitation**: `DealerQuotation` has a
    `@@unique([quotationRequestId, dealerId])` constraint, so a dealer can
    only be assigned once per request in the current implementation —
    assigning the same dealer a second batch of items on the same request
    isn't supported yet (would need an "add items to an existing dealer
    quotation" endpoint rather than always creating a new one).

### Still to build

Priority/deadline dashboard aggregation queries (Critical/Near-Deadline/Late
Orders widgets — `orderRepository.findLate`/`findNearDeadline` exist as
building blocks, but no Admin Dashboard endpoint assembles them yet), Reports,
full Admin/Dealer portal surfaces, Support, Settings. Tracked here rather
than left undocumented.

## Phase 5 — Settings, Support, Admin/Dealer Dashboards, Dealer Capacity, Reports

No schema changes — everything in this phase was confirmed to already have
backing tables (`ApplicationSetting`/`SchoolSetting`/`DealerSetting`/
`PaymentSetting`/`EmailSetting`/`SmsSetting`/`ThemeSetting`,
`SupportTicket`/`TicketReply`, plus the generic `Attachment` polymorphic
table for ticket file uploads) before writing any code, per the standing
instruction to check first.

### Modules built

- **Settings** — platform-wide `ApplicationSetting` (admin), payment/email/
  SMS gateway config (admin), theme/branding scoped platform-wide or per-
  school, and self-service `SchoolSetting`/`DealerSetting` for each account
  type's own preferences. All simple key-value upserts — deliberately thin,
  since these are configuration records, not business logic.
- **Support** — tickets (auto-populates `schoolId`/`dealerId` from whoever
  raised it), replies with internal notes restricted to staff (never visible
  to the raiser — enforced in the service, not just hidden in the UI),
  assignment, status/priority updates, file attachments via the generic
  `Attachment` table, and real notifications on every state change (ticket
  created → notifies staff; staff reply → notifies raiser; non-staff reply →
  notifies staff; resolved/closed → notifies raiser).
- **Admin Dashboard** — `getSummary()` runs real aggregation across revenue
  (today/month/all-time from successful `Payment` rows), orders by status
  and by priority, per-order outstanding balance (computed from real payment
  sums, not a flat total), production-in-progress count, dealer status
  breakdown, pending quotations/assignments, low-stock count (reusing the
  existing `productRepository.lowStock()`), late/near-deadline orders
  (reusing `orderRepository.findLate`/`findNearDeadline` from Phase 4), 10
  most recent orders, and unread admin notification count. Separate
  endpoints for top products/categories (real `OrderItem` aggregation) and a
  monthly revenue trend using a raw parameterized SQL query
  (`DATE_FORMAT(created_at, '%Y-%m')` — Prisma's query builder can't express
  a date-truncated `groupBy` portably, so this one endpoint uses
  `$queryRaw` with a properly parameterized value, not string interpolation).
- **Dealer Capacity** (`dealerCapacity.service.ts`) — real per-dealer
  workload snapshot: active orders, orders in production, near-deadline
  count, overdue count, pending deliveries, completed count, and average
  production time (computed from completed orders' `placedAt`→`updatedAt`
  span — the schema has no dedicated "production started" timestamp, so this
  is the closest real proxy available; noted here rather than silently
  presented as exact). Capacity % and Available/Moderate/Overloaded status
  are derived from active-order count against a fixed threshold
  (`CAPACITY_ORDER_THRESHOLD = 40`, a starting default — not sourced from
  any config table, since none exists for it; if you want this admin-tunable
  it belongs in `ApplicationSetting`). Wired into quotation dealer-assignment:
  assigning work to an overloaded dealer now returns a `capacityWarning` on
  the response and separately notifies staff — the admin can still proceed
  (override), per the requirement.
- **Dealer Dashboard** — single endpoint combining a dealer's own capacity
  snapshot, recent assigned orders, and recent production checkpoints they
  logged. Scoped via `requireDealerContext`, so a dealer can only ever see
  their own data — there is no dealer-facing endpoint anywhere in this
  backend that accepts another dealer's ID.
- **Reports** — orders/payments/GST/invoices/dealer-performance/production/
  priority/quotations, each returning real aggregated JSON (date-range
  filterable where it makes sense). Reuses existing repositories rather than
  duplicating queries.

### Explicitly not done (tracked, not silently skipped)

- **PDF/Excel/CSV export** — the Reports endpoints return structured JSON
  only. No `pdfkit`/`exceljs`/`csv-stringify` (or similar) wiring exists yet.
  Given this was built in a sandbox with no network access to verify a new
  heavy dependency actually installs and behaves, I chose not to add
  half-verified binary-export code. This is the single largest gap between
  what was asked for and what's delivered.
- **Invoice/receipt/challan/quotation PDF rendering** — same reason. Invoice
  and quotation *data* is real (Phase 3/4); rendering it to a stored PDF via
  Cloudinary is not implemented.
- **Audit Logs as a distinct, queryable feature** — individual modules write
  to `*_status_history` tables (order, customization, quotation) which serve
  as an audit trail for those specific entities, but there's no unified
  cross-entity audit log table/endpoint.
- **Dealer capacity threshold is a hardcoded constant**, not a `Settings`-
  backed configurable value — flagged above.

## Final review pass

Ran a full-tree syntax sanity sweep (no compiler available in this sandbox —
see README/limitations — so this was a bracket-balance check across every
`.ts` file, comments and string/template literals stripped first) rather than
skipping verification entirely.

- **Found and fixed a real, would-have-been-fatal bug**: `product.repository.ts`
  — used by catalog search, the low-stock dashboard widget, and admin
  analytics — had two missing opening `[` brackets (`where.OR = [...]` and
  `Promise.all([...])` had lost their opening bracket). Root cause: leftover
  collateral damage from a `sed` command earlier in this session that was
  meant to fix a different, narrower issue but also matched these two lines
  (both ended in `[` at end-of-line, which is exactly what that command
  stripped). This had been silently broken since Phase 1/2 of this session
  and would have failed `tsc` immediately. Both are now fixed and the file
  re-checked clean.
- No other files in the tree showed a genuine imbalance. `env.ts` triggers
  the same crude checker (single/double/backtick strings stripped in a fixed
  order can't perfectly handle a single-quoted string nested inside a
  template literal's `${...}` expression) but was manually read in full and
  is syntactically correct.
- **This is not a substitute for `tsc --noEmit`.** A bracket-balance sweep
  catches gross structural damage like the bug above; it cannot catch type
  errors, wrong Prisma field names that happen to be syntactically valid,
  or logic bugs. Every Prisma call across every service in this backend was
  manually cross-checked against the real `schema.prisma` field-by-field as
  it was written (documented throughout this changelog), which is a
  different and complementary kind of verification — but neither replaces
  actually running `npm install && npx prisma generate && npm run build`.
  Do this before deploying, and before trusting anything past this line.

The updated business requirements (dealer assignment, per-checkpoint
production tracking, priority/deadline dashboards) turned out to be **mostly
already supported** by the existing 138-table schema — `orders.priority`
(`OrderPriority`: critical/high/medium/normal), `orders.production_deadline`,
`orders.expected_delivery_date`, and the entire `quotation_requests` →
`dealer_quotations` → `dealer_quotation_items` → `accepted_quotations` chain
(Master Quotation → per-dealer quotation → school acceptance → Order) were
already there, confirming it's worth checking the schema before migrating,
per the standing instruction. Only one real gap:

