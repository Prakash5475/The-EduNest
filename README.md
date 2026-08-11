# EduNest — School Procurement Platform

## 1. Project Overview

EduNest is a B2B procurement platform connecting **schools** with **dealers** (manufacturers/
distributors/wholesalers/retailers) for bulk purchase of school supplies — uniforms, stationery,
books, sports goods, preschool kits, and custom-branded items. Schools browse a catalog, request
bulk quotations, place orders, track production and delivery, and pay via Razorpay. Admin staff
run the whole operation: approving accounts, assigning dealers, managing production checkpoints,
reviewing quotations, and monitoring the business through SQL-backed dashboards and reports.

As of this checkpoint, **v1.0 architecture decision**: dealers do not use a logged-in portal.
Dealer interaction happens through the **WhatsApp Business API** (see §5). The previously built
Dealer Portal frontend still exists in the repo and is fully wired to a working backend — it's
kept for potential v2 reuse but is no longer the primary dealer workflow.

## 2. Current Completion

### Fully wired to real backend (zero mock data)
- **Authentication & RBAC** — JWT access + httpOnly refresh cookie, role/permission middleware
- **Public website** — Home, Shop, Categories, ProductDetails, Cart, Checkout (+ Razorpay),
  BulkOrders (CSV import), RequestQuotation, DealerMarketplace, PreschoolKits (Kits module)
- **School Portal** — Dashboard, Orders, OrderTracking (incl. production timeline), Wishlist,
  Profile (+ address book), Support (tickets + FAQ), Notifications (Socket.IO live)
- **Dealer Portal** — built and fully functional (Dashboard, Orders, Production Queue,
  Tracking, Quotations, Profile, Reports, Notifications, Analytics), but **deprecated for
  v1.0** per the confirmed business decision in §9: dealers have no login/frontend in v1.0 and
  interact exclusively via WhatsApp/phone (see §5). The code is left intact and unextended in
  the repo for possible v2 reuse.
- **Admin Portal** — Dashboard (real SQL summary/top-products/top-categories/revenue-trend),
  Products (full CRUD + Cloudinary image upload), Orders (list/detail, dealer assignment,
  status override with mandatory audit-trail reason, production dashboard + assignment with
  capacity validation), **Schools management** (list/detail/approve-block-activate-deactivate),
  **Dealers management** (same), **Payments** (list/detail/refund history/summary — read-only,
  reuses existing refund logic), **Invoices** (list/detail/summary — reuses existing PDF
  pipeline, does not regenerate), **Users/Roles/Permissions** (list/detail/status toggle,
  role-permission mapping with a system-role edit guard), **Settings** (list/bulk-upsert over
  the existing `ApplicationSetting` table), Reports (real SQL report endpoints, CSV/Excel/PDF
  export on all 8 report types), Support (ticket management, assign/status/priority), Audit Log
  (central `audit_logs` table, generic capture middleware for all mutating requests, filterable
  admin endpoint).
- **Cart & Wishlist** — real backend for authenticated schools, localStorage for guest browsing,
  automatic merge-on-login
- **Checkout & Payments** — real address book, shipping methods, Razorpay order-create →
  checkout-widget → signature-verify flow, admin-initiated refunds. **Not implemented**: any
  fee-preserving pricing calculation — the Razorpay integration only does order-create/verify/
  refund/fetch, no commission or gateway-fee math exists anywhere in the codebase.
- **Quotation RFQ workflow** — school request → admin assigns dealers → dealer submits/revises
  pricing → school accepts/rejects → converts to order. Every dealer's quotation for a request
  is already returned together in one call (`GET` request detail nests all `dealerQuotations`),
  so the raw data for a multi-dealer comparison view exists — but no comparison-specific logic
  (lowest-price flagging, ranking) has been built on top of it yet. Quotation and delivery
  challan PDFs are generated on demand (not persisted — no `fileId`-equivalent column exists for
  either).
- **Production tracking** — 12-stage checkpoint system (added `order_received` as an explicit
  first stage), dealer- and admin-driven, with an **immutable audit trail** (`updatedByType`,
  `updatedById`, `overrideReason`, proof images), sequential-stage enforcement (dealers can't
  skip backward; "completed" requires "delivered" first), dealer assignment with capacity
  validation, and a staff production dashboard.
- **Notifications** — Database (system of record) + Socket.IO (live, incl. a dedicated
  unread-count event) + BullMQ-queued **WhatsApp Business API** channel (provider-abstracted,
  see §5). Triggers now cover orders (placed/cancelled), payments (success/failed/refunded),
  quotations, production, support tickets, dealer/school status changes, and customization
  requests.
- **File uploads** — generic Cloudinary upload endpoint producing real `UploadedFile` rows, plus
  generated-buffer uploads (invoice PDFs) via a separate raw-buffer helper. Used by product
  images, invoice PDFs.

### Explicitly postponed to Phase 2 (do not build yet)
Learning Resources, Events, Rewards, Subscriptions — schema models exist, no backend/frontend.

### Explicitly not implemented — verified, not just undocumented
- **Razorpay fee-preserving pricing calculation** — no such logic exists anywhere.
- **External supplier/manufacturer link fields** — no such column exists on `Product`, `Kit`, or
  `QuotationRequestProduct`; would require a schema migration.
- **Bulk-pricing tiers table** — open product/pricing design decision, not implemented, not
  started pending that decision.

## 3. Architecture

```
Frontend (React + Vite + TS)
        │  fetch (JWT bearer + httpOnly refresh cookie)
        ▼
Backend (Express + TS)
        │
        ├─ Controllers  (HTTP boundary, validation via Zod)
        ├─ Services     (business logic, orchestration)
        ├─ Repositories (Prisma queries only, one per model/domain)
        ▼
Prisma ORM ──▶ MySQL
        │
        ├─ BullMQ queues (email / notification / whatsapp) ──▶ Redis
        │        └─ Workers process jobs, update delivery ledgers
        ├─ Socket.IO (JWT-authenticated, per-user rooms) — live notifications & order tracking
        ├─ Cloudinary (via multer storage engine) — image/document storage → UploadedFile rows
        └─ WhatsApp Business API (provider-abstracted; Meta Cloud API implemented, swappable)
```

Backend layering is strict: **route → controller → service → repository → Prisma**. Business
logic never talks to Prisma, BullMQ, Cloudinary, or WhatsApp directly from a controller.

## 4. Folder Structure

```
backend/
  prisma/schema.prisma       Source of truth for the DB (145 models)
  src/
    routes/                  One file per resource, mounted in routes/index.ts
    controllers/              HTTP boundary — parses req, calls service, shapes response
    services/                 Business logic
    repositories/             Prisma queries, one class per domain
    validators/                Zod schemas per resource
    middlewares/               auth, rbac, validate, error handler
    helpers/                   Cross-cutting helpers (notification, pagination, context guards)
    queues/ , jobs/             BullMQ queues + workers (email, notification, whatsapp)
    services/whatsapp/         Provider interface + Meta Cloud implementation + template registry
    storage/                   Multer + Cloudinary storage engine
    websocket/                 Socket.IO server setup

frontend/
  src/
    pages/{public,portal,dealer,admin}/   One folder per portal
    services/                              One file per backend resource — all API calls live here
    context/                               Auth, Cart, Wishlist providers
    components/{ui,common,cards,layout}/   ui = shadcn primitives, common = shared app components
    hooks/                                 Reusable React Query wrappers
    lib/                                   Utilities (formatting, exportFile.ts for CSV/Excel/PDF)
```

## 5. WhatsApp Business API Integration

**v1.0 business decision**: dealers have no login portal or frontend. Dealers communicate
exclusively via WhatsApp and phone calls; admin staff enter negotiated quotation/production/
payment data into the system after those conversations. The previously-built Dealer Portal
backend remains in the repo, intact and untouched, for possible future (v2) reuse — it is not
extended or used as the primary dealer workflow.

**Outbound**: every business event that calls `notifyUser()` can optionally include a
`whatsapp: { eventType, data }` payload. The pipeline is: **Notification saved to DB →
Socket.IO emit → WhatsApp job queued (BullMQ) → worker calls the active provider → delivery
status written to `WhatsappMessageLog`** (queued/processing/sent/delivered/read/failed, retry
count, provider message id/response, timestamps). This checkpoint wires `whatsapp` payloads
into the dealer-facing triggers that actually matter now that WhatsApp is a dealer's only
channel: RFQ assignment, work-order assignment, production-milestone updates, dispatch
requests, and delivery-confirmation requests.

- `WhatsappProvider` interface (`src/services/whatsapp/whatsapp.types.ts`) — the only contract
  business logic depends on.
- `NoneProvider` (default, `WHATSAPP_PROVIDER=none`) — honestly records "not configured" rather
  than faking delivery.
- `MetaCloudProvider` (`WHATSAPP_PROVIDER=meta_cloud`) — real, working Meta Graph API template-
  message call. Needs `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` to go live.
- Template registry (`whatsapp.templates.ts`) maps event types → template name + deep link +
  whether the event is "critical" (bypasses per-user channel preferences).
- Per-user channel preferences live in `NotificationSetting` (channel `whatsapp` now included).

**Inbound** (`GET/POST /webhooks/whatsapp`, unauthenticated, HMAC-SHA256 signature-verified per
the official Meta Graph API webhooks spec):
- Meta's GET verification handshake (`hub.mode`/`hub.verify_token`/`hub.challenge`) and POST
  signature validation (`X-Hub-Signature-256`, `crypto.timingSafeEqual`) via
  `whatsappWebhook.service.ts`. Reuses the same `req.rawBody` capture already established for
  the Razorpay webhook — no new body-parsing setup.
- Every inbound message is persisted idempotently (`WhatsappInboundMessage`, unique on
  `providerMessageId` — Meta redelivers on retry) and queued to a dedicated BullMQ queue/worker
  (`whatsappInbound.queue.ts` / `whatsappInbound.worker.ts`) rather than processed inline.
- **Conversation state machine** (`WhatsappConversation`, one row per dealer — a dealer's only
  "session" now that there's no login): `idle` / `awaiting_quotation_price` /
  `awaiting_quotation_confirmation` / `awaiting_work_order_ack` / `awaiting_dispatch_details` /
  `awaiting_delivery_confirmation`. Outbound triggers call `markAwaitingReply()` right before
  sending a message that expects a specific kind of response.
- **Dealer replies are never auto-applied** to `DealerQuotation`/`Order`/`Payment` — every
  inbound message notifies admin/staff instead, so a human enters the negotiated terms after
  the WhatsApp/phone discussion, per the explicit v1.0 business rule. The state machine exists
  to give whoever reviews the reply full conversational context, not to automate data entry.
- Delivery-status callbacks (sent/delivered/read/failed on messages *we* sent) update the
  existing `WhatsappMessageLog` — a full round-trip that didn't exist before this checkpoint.
- Admin surface: `GET /admin/whatsapp/delivery-logs`, `GET /admin/whatsapp/conversations`,
  `GET /admin/whatsapp/conversations/:id/messages`, `POST /admin/whatsapp/broadcast`.

**Not yet built / not code**: registering real templates with Meta Business Manager (a business/
verification process, not something to implement); ranking/comparison logic on top of the
already-available multi-dealer quotation data (see §8). **Not testable in this checkpoint's
sandbox**: the webhook code is written strictly to the official Meta spec but has never been
exercised against a live Meta delivery (no network access to Meta's Graph API here) — treat it
as spec-compliant, not field-verified, until tested against real Meta traffic.

## 6. Environment Setup

```bash
# Backend
cd backend
cp .env.example .env        # fill in DATABASE_URL, REDIS_URL, JWT secrets, Razorpay, Cloudinary
npm install
npx prisma generate         # requires network access to binaries.prisma.sh
npx prisma migrate deploy   # or `prisma db push` against a fresh MySQL database
npm run dev                 # API server
npm run worker              # separate process: email + notification + whatsapp queues, cron

# Frontend
cd frontend
cp .env.example .env        # set VITE_API_BASE_URL to the backend's /api/v1
npm install
npm run dev
```

### Database setup
- **MySQL**: `edunest_database_schema.sql` is the canonical SQL schema; `prisma/schema.prisma`
  is derived from it and is the source of truth for the ORM layer. Run migrations with
  `prisma migrate deploy` against a real database.
- **Redis**: required for BullMQ queues and Socket.IO adapter (if scaled horizontally).
- **Prisma**: this checkpoint's sandbox could not reach `binaries.prisma.sh`, so `prisma generate`
  was never run here — do this first in your environment before `npm run build`/`npm run dev`.

## 7. Verification Performed Before This Checkpoint

- `npm run build` (frontend, Vite production build) — ✅ succeeds
- `npx tsc --noEmit -p tsconfig.app.json` (frontend) — ✅ 0 errors
- `npm run lint` (frontend, ESLint) — ✅ 0 errors, 9 pre-existing style warnings (fast-refresh /
  exhaustive-deps), non-blocking
- Backend static schema/field audit (custom script cross-checking all 247+ `prisma.*` calls
  against `schema.prisma`'s 145 models) — ✅ 0 mismatches
- Backend import-resolution audit — ✅ 0 broken imports
- `npx tsc --noEmit` (backend) — 265 errors as of this checkpoint (was 226; grew as the Admin
  Portal/Audit Log/Production/PDF-export modules below were added), **all attributable to the
  un-generated Prisma client stub** (`Module '@prisma/client' has no exported member 'X'` and its
  cascading `any`-type consequences). Every new file's errors were individually triaged against
  this same signature across every session in this checkpoint's history; zero were independent
  code bugs. **Action needed**: run `npx prisma generate` in an environment with network access,
  then re-run `npx tsc --noEmit` — expect it to drop to 0.
- `npx eslint` targeted at every file added/changed since the previous checkpoint (repositories,
  admin services/controllers/validators/routes, audit middleware, PDF/export helpers) — ✅ 0
  errors, 0 warnings (no dead code, no unused imports).
- Final production-readiness pass this checkpoint found and fixed two real issues: an audit-log
  write failure was being silently swallowed with no logging (`audit.service.ts`), and the new
  admin role-permissions endpoint had no guard against clearing a system role's (e.g.
  `super_admin`) permissions, which could self-lock every `requirePermission()`-gated route for
  that role (`adminRbac.service.ts`). Both fixed; no other genuine security/RBAC/validation/
  transaction/error-handling/performance issues were found in the reviewed surface (see
  `IMPLEMENTATION_STATUS.md` for exactly what was and wasn't reviewed — this was a targeted pass
  over this checkpoint's new code, not a full external security audit).

## 8. Remaining Work

### Admin Portal
| Task | Priority | Status |
|---|---|---|
| Schools management (CRUD, approval workflow) | High | **Done** — `GET/PATCH /admin/schools[...]` |
| Dealers management (Dealer Master CRUD, not login portal) | High | **Done** — `GET/PATCH /admin/dealers[...]` |
| Payments (transactions, refund history view) | Medium | **Done** — `GET /admin/payments[...]`, read-only, reuses existing refund logic |
| Invoices (list/detail, PDF generation) | Medium | **Done** — list/detail/summary; PDF generation itself pre-dates this (payment.service.ts), not duplicated |
| Analytics (deeper drill-downs beyond Dashboard/Reports) | Medium | Not started |
| Users, Roles, Permissions management | Medium | **Done** — `GET/PATCH /admin/users[...]`, `/admin/roles[...]`, `GET /admin/permissions`; system-role permission edits are guarded |
| Settings / System configuration | Medium | **Done** — `GET/PATCH /admin/settings`, reuses existing `ApplicationSetting` table |
| WhatsApp delivery-log viewer (admin-facing) | Medium | Repository exists, needs controller+route+page |
| Conversation log viewer | Low | Blocked on webhook/state machine below |
| Audit log viewer (checkpoint overrides) | Low | Backend done — central `audit_logs` table + generic capture middleware + `GET /audit-logs`; needs a frontend page |

### WhatsApp (dealer-facing workflow)
| Task | Priority | Status |
|---|---|---|
| Meta webhook endpoint (inbound message receiver) | High | **Done** — `GET/POST /webhooks/whatsapp`, HMAC-verified |
| Conversation state machine (track what a reply is contextually responding to) | High | **Done** — `WhatsappConversation`, 6 states |
| Dealer reply capture (price quotes, "Accepted", courier/tracking, etc.) | High | **Done, by design not auto-parsed** — every reply is persisted + flagged to admin for manual entry, never auto-applied to quotation/production/payment records (explicit v1.0 business rule) |
| Dispatch flow via WhatsApp (courier name, tracking number capture) | Medium | **Partial** — dealer is prompted (`awaiting_dispatch_details`) and their reply is captured/flagged; admin still enters the actual courier/tracking fields into the order |
| Delivery confirmation flow | Medium | **Partial** — same pattern: dealer is prompted (`awaiting_delivery_confirmation`), reply captured/flagged, admin confirms in-system |
| Admin broadcast messages | Low | **Done** — `POST /admin/whatsapp/broadcast` |
| Admin delivery-log / conversation viewer | Low | **Done** — `GET /admin/whatsapp/delivery-logs`, `/conversations`, `/conversations/:id/messages` |
| Register real templates with Meta Business Manager | High | Not started — business/verification process, not code |
| End-to-end test against live Meta webhook traffic | High | Not started — no network access to Meta's Graph API in the dev sandbox this was built in |

### Procurement / Quotation enhancements
| Task | Priority | Status |
|---|---|---|
| Multi-dealer quotation comparison UI (admin) | High | Partial — every dealer's quotation for a request is already returned together in one API call; no comparison-specific logic (ranking/lowest-price flagging) built yet |
| Procurement cost vs. selling price vs. platform margin breakdown | High | Not started |
| Razorpay-fee-preserving pricing calculation | Medium | Not started — verified no fee/commission logic exists anywhere in `razorpay.service.ts` or elsewhere |
| Custom quotation-only products (name, image, external supplier links, MOQ, cost/selling price) | Medium | Partial — `customItemDescription` (free text) exists on `QuotationRequestProduct`; no image/external-link/MOQ/cost fields |
| External product link fields (IndiaMART/Alibaba/Amazon/manufacturer) | Low | Not started — no such column exists on `Product`, `Kit`, or `QuotationRequestProduct`; needs a schema migration |

### Testing
| Task | Priority | Status |
|---|---|---|
| Frontend QA pass (click-through every button/form/modal) | High | Partial — done incrementally per page during wiring |
| Backend QA (endpoint-by-endpoint against a real DB) | High | Not started — no live DB in dev sandbox |
| RBAC testing (every role boundary) | Medium | Partial — every new admin route verified to require `authenticate` + `requireRole(super_admin, staff)`; no live-DB integration test run |
| API testing (integration/contract tests) | Medium | Not started |
| Payment testing (Razorpay test mode, webhook signature verification) | High | Not started |
| WhatsApp testing (once webhook/state machine exist) | High | Not started |

### Deployment
| Task | Priority | Status |
|---|---|---|
| AWS deployment (or chosen host) | High | Not started |
| Production environment configuration | High | Not started |
| Monitoring / alerting | Medium | Not started |
| Backup strategy | Medium | Not started |
| Security review | High | Partial — this checkpoint's review covered RBAC coverage on new routes, an audit-log silent-failure fix, and a system-role permission-edit guard; no full external security audit performed |

### SEO (explicitly sequenced after Admin Portal completion)
| Task | Priority | Status |
|---|---|---|
| react-helmet-async integration | Medium | Not started |
| Dynamic meta tags / titles / canonical URLs | Medium | Not started |
| OpenGraph + Twitter Cards | Medium | Not started |
| Structured data (Product, Organization, FAQ, Breadcrumb schema.org) | Medium | Not started |
| sitemap.xml / robots.txt | Medium | Not started |
| SEO fields on Products/Categories/Brands/Collections | Medium | Not started |
| Prerendering for public pages | Low | Not started |

### Future (NOT v1.0 — do not implement yet)
Learning Resources, Events, Rewards, Subscriptions.

## 9. Business Decisions (locked in for this checkpoint)

- **Dealer Portal is not part of v1.0 — confirmed.** Dealers have no login and no frontend;
  they interact exclusively via the official WhatsApp Business API and phone calls. The Dealer
  Portal backend remains in the repo, intact and unextended, for possible future (v2) reuse.
  (An earlier draft of this document was flagged mid-checkpoint as contradicting the live,
  actively-extended Dealer Portal code at the time — this has since been explicitly confirmed
  by the project owner as the correct, final v1.0 decision, and the portal work has been frozen
  accordingly.)
- **Admin staff manually enter negotiated terms.** After a WhatsApp/phone conversation with a
  dealer, admin staff enter the negotiated quotation price, production status, or payment
  details into the system themselves. Inbound WhatsApp replies are captured and surfaced to
  admin for review but are never auto-applied to `DealerQuotation`/`Order`/`Payment` records.
- **Admin has complete control**: can assign/reassign dealers, override any production
  checkpoint (with mandatory reason, immutably logged), update order status directly, and
  manage quotations/procurement/payments.
- **Schools** continue exclusively through the EduNest web portal — no change.
- **Critical notifications** (order confirmed, dispatched, payment received, RFQ received, etc.)
  always send via WhatsApp regardless of the recipient's stated channel preferences; everything
  also always gets a database notification + Socket.IO event.
- **Production checkpoints are immutable** — every update is a new row, never an overwrite, and
  always records `updatedByType` (dealer/admin/system), `updatedById`, a timestamp, and — for
  admin overrides — a mandatory `overrideReason`.

## 10. How to Continue From This Checkpoint

Read §8 (Remaining Work) and pick up any unstarted or partial item — they're independent of
each other except where noted (e.g. conversation-log viewer depends on the webhook existing
first). The codebase follows consistent conventions throughout (route → controller → service →
repository → Prisma on the backend; one `services/*.ts` file per backend resource on the
frontend, React Query for all data fetching) — match those patterns for anything new. Do not
regenerate or redesign anything listed as complete in §2.
