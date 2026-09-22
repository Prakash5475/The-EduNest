# The EduNest — Backend

Production backend for The EduNest B2B school-procurement platform: authentication/RBAC,
Catalog, Cart & Wishlist, Product Customization, Checkout & Payments (Razorpay, 50% advance
rule enforced server-side), Orders, Production Tracking, Quotation & Dealer Assignment,
Dealer Capacity, Settings, Support, and Admin/Dealer Dashboard analytics — all built on real
database queries, no mock data. See `CHANGELOG.md` for exactly what was built, in what order,
and what's explicitly not done yet (PDF/Excel/CSV export chief among them).

**Before deploying**: this was built in a sandboxed environment with no network access, so
`npm install`, `npx prisma generate`, and `npm run build` were never actually run against this
code. Every Prisma call was manually cross-checked against `schema.prisma` field-by-field, and
a full-tree syntax sanity sweep caught and fixed one real bug (see CHANGELOG "Final review
pass") — but that is not a substitute for the real compiler. Run the three commands above and
fix whatever they surface before trusting this in production.

## Stack

Node.js 22 · Express · TypeScript · Prisma (MySQL) · Redis · JWT + refresh tokens · bcrypt ·
Helmet · Zod · Nodemailer · BullMQ · Socket.io · Cloudinary · Multer · Razorpay · Swagger · Jest.

## Architecture

Clean Architecture with a Repository Pattern:

```
src/
  config/        env, logger, database, redis, cloudinary, mailer, swagger
  controllers/   thin HTTP layer — parses req, calls a service, shapes the response
  services/      business logic (auth, tokens, otp, email, users, catalog, cart, checkout,
                 payments, orders, production, quotations, dashboards, reports, ...)
  repositories/  Prisma data access, one per aggregate/table family
  middlewares/   auth, rbac, validation, error handling, logging, rate limiting
  validators/    Zod schemas

  routes/        Express routers, mounted under /api/v1
  helpers/       jwt, password, otp, pagination, date, file, request-context
  utils/         ApiError, ApiResponse, serializers
  emails/        Nodemailer templates
  storage/       Multer + Cloudinary upload config
  jobs/          BullMQ workers + node-cron jobs (separate process)
  queues/        BullMQ queue definitions
  events/        in-process domain event bus
  websocket/     Socket.io server + JWT auth
  types/         shared TypeScript types
  constants/     shared constants
prisma/
  schema.prisma  derived from edunest_database_schema.sql (see below)
  seed.ts        system roles + foundation permissions
```

## Database

The production schema (`edunest_database_schema.sql`, at the repo root, 144 tables / ~204
foreign keys) is the single source of truth and is **not redesigned here**. Originally 138
tables / 197 FKs verified against a live MySQL 8 instance; 6 tables were added across Phases
2-4 (Product Customization, Checkout, Production Tracking — see CHANGELOG.md) — same
conventions, but not yet re-run against a live server, so run `npx prisma migrate deploy`
(or load the SQL directly) and confirm before relying on it in production.

`prisma/schema.prisma` was generated from that SQL file by `scripts/sql_to_prisma.py`
rather than hand-written, because the sandbox this was built in couldn't reach
`binaries.prisma.sh` to run `prisma db pull` directly. The script was validated by loading
the original 138-table SQL into a live MySQL 8 instance (confirmed 138 tables / 197 FKs match
the docs) and by a structural self-check (every relation pair, every `fields`/`references`
column, resolves correctly). The Phase 2 additions passed the same structural self-check but
have not yet been executed against a live database. If the SQL ever changes, re-run:

```bash
python3 scripts/sql_to_prisma.py
```

**Before running the app, generate the Prisma client** (needs normal internet access):

```bash
npm install
npx prisma generate
```

## Getting started

```bash
cp .env.example .env        # fill in real secrets
npm install
npx prisma generate
npx prisma migrate deploy   # or: mysql -u ... edunest < edunest_database_schema.sql
npx prisma db seed          # seeds system roles + foundation permissions
npm run dev                 # API on http://localhost:4000
npm run dev:worker          # BullMQ workers (separate process)
```

Or with Docker:

```bash
docker compose up --build
```

API docs (Swagger UI): `http://localhost:4000/docs`

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the API with hot reload |
| `npm run dev:worker` | Start the BullMQ worker process with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled API |
| `npm run start:worker` | Run the compiled worker process |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest + Supertest |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:seed` | Run the seed script directly |
| `npm run prisma:studio` | Prisma Studio |

## Auth model

- Access tokens: short-lived JWT (default 15m), sent as `Authorization: Bearer <token>`.
- Refresh tokens: longer-lived JWT (default 30d), tied 1:1 to a row in `sessions`
  (hash stored, not the raw token) so any session can be revoked server-side. Rotated on
  every refresh; reuse of an already-rotated token revokes the session defensively.
- RBAC: `roles` ⇄ `role_permissions` ⇄ `permissions`, joined through `user_roles`. Access
  tokens embed the resolved role slugs + permission names at issue time.
- OTP: generated + hashed, stored in Redis with a TTL (source of truth for verification),
  with a durable audit row in the `otps` table.
- Email verification / password reset: single-use random tokens (SHA-256 hashed before
  storage), 24h / 30m TTL respectively.

## What's NOT in Phase 1 (by design)

Product, Order, Dealer, and School APIs. This phase only ships what every one of those
modules will depend on: auth, RBAC, validation, logging, error handling, queues, storage,
email, and realtime infrastructure.
