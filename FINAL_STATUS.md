# EduNest — Final Production Checkpoint Status

Generated at end of this development session. Read this before doing anything else.

## THIS SESSION — direct answers to the 14 required questions

1. **Is GST fully implemented?** Calculation: yes (CGST/SGST/UTGST/IGST, correct intra-state/
   inter-state/UT rules, backend-computed, rounding-safe). Storage: yes now — `invoices` gained
   persisted `cgst_amount`/`sgst_amount`/`utgst_amount`/`igst_amount`/`place_of_supply`/
   `seller_gstin`/`buyer_gstin` columns this session (previously computed only for the PDF and
   discarded — a real gap, now fixed, additive migration + backfill for existing rows).
2. **Is HSN/SAC-wise reporting implemented?** Yes, and for real — you were right that I was
   wrong last session: `taxes.hsn_code` exists and `products.tax_id → taxes.id` was already a
   real FK, just never declared as a Prisma relation (fixed, no migration needed for that part).
   `reports.service.ts: hsnReport()` joins order_items → products → taxes and is wired to
   `/reports/gst/hsn` and a live table in `admin/Reports.tsx`. **Stated limit**: it reflects each
   product's *current* HSN/tax bracket, not a point-in-time snapshot at sale — order_items
   doesn't snapshot taxId, so a later HSN/bracket change on a product reclassifies its historical
   orders too. Fixing that needs a checkout-time snapshot column — not done this session.
3. **Is e-way bill support implemented?** A real, additive, SQL-backed module: `eway_bills`
   table, full CRUD + status lifecycle (draft → generated → cancelled/expired), admin API
   (`/admin/eway-bills`), and a UI tab. **Explicitly NOT integrated with any government/IRP
   API** — there is no such integration anywhere in this codebase, and none is faked. The
   `eway_bill_number` field is filled in manually by an admin after generating it on the
   government portal themselves; nothing here calls a government service or invents a number.
4. **Is e-invoicing implemented or only architected?** Only architected, and only that much:
   `invoices` now stores everything a real e-invoice payload would need (seller/buyer GSTIN,
   place of supply, tax breakdown), which is necessary groundwork, but there is no IRN
   generation, no QR code, no IRP API call, anywhere in this codebase. Do not read the GST
   field storage as e-invoicing — it isn't.
5. **Are Delivery Partners fully implemented?** Roster CRUD, activate/deactivate, availability,
   assignment, full status-transition workflow, audit trail, and OTP-gated delivery
   confirmation are real and working. **Not implemented**: a delivery-partner login/portal
   (see Q8).
6. **Is order-detail assignment complete?** Yes — `DeliverySection.tsx` is embedded in the
   admin order-detail sheet (`admin/Orders.tsx`): assign/reassign a partner, advance status,
   reschedule a failed delivery, send/verify the delivery OTP, and see the timeline, all
   calling the real backend endpoints (no mock data).
7. **Is OTP delivery verification secure and tested?** Secure by construction — statically
   verified, not live-tested (no DB/Redis in this sandbox): `delivery.service.ts`'s
   `updateStatus()` explicitly throws if asked to set `'delivered'`; the only function that can
   set it is `completeDeliveryWithOtp()`, which calls the existing `otpService.verify()` (same
   expiry/attempt-limit/one-time-consume guarantees used for login OTPs). I re-read this path
   specifically for this session's "verify this properly" instruction and did not find a bypass.
   **Real, stated limitation**: delivery OTPs only work when the recipient identifier is an
   email — there is still no SMS gateway wired up anywhere in this codebase (confirmed by
   search again this session). Sending to a phone number fails loudly with an explanation
   rather than pretending to send.
8. **Is the delivery partner-facing workflow complete?** No — not built. This remains a
   deliberate scoping decision, now stated for a second time so it isn't a silent omission:
   delivery partners are an admin-managed roster with no login, the same pattern schools/
   dealers used before they got their own portals. Building a partner-facing login + shipment
   view is a genuinely separate, large piece of work (new auth flow or a new user type) that
   wasn't done this session.
9. **Are production/warehouse workflows complete?** Partially. **Warehouse**: a real
   `warehouses` table + optional `inventory.warehouse_id` link was added this session
   (additive — the pre-existing `warehouse_location` text column and all code that reads it
   is untouched), with CRUD + stock-summary API and a UI tab. **Production**: audited, not
   rebuilt — `production_checkpoints` already covers item-level production status, quantity,
   dates, and audit trail reasonably well; no duplicate model was created. **Not done**: a
   dedicated multi-warehouse *stock allocation* engine (splitting one order across warehouses,
   backorder creation) — the schema now supports assigning inventory rows to warehouses, but
   nothing automatically allocates or reserves across more than one.
10. **Is quantity-change approval complete?** Yes. `quantity_change_requests` table,
    transactional `approve()` (updates `inventory.quantity_available` and writes a
    `stock_history` audit row in the same DB transaction — never partially applied),
    Super-Admin-only approve/reject, Admin/Staff can raise a request, and there is no other
    endpoint anywhere that edits `inventory.quantity_available` for a manual correction. UI
    tab included.
11. **Is Cloudinary fully removed?** Yes, re-confirmed this session by search — only
    `package-lock.json` mentions it (regenerates clean on next `npm install`).
12. **Are all existing schema corrections preserved?** Yes — I did NOT run the schema
    generator script this session (confirmed last session it silently reverts the 1:1
    relation fixes, `Year`/`Time` column types, and deferred-FK relations if run — so it was
    avoided entirely). Every schema change this session was a hand-edit to both
    `edunest_database_schema.sql` and `prisma/schema.prisma` together, verified by grep-
    counting that all 224 relation names in the final schema are paired exactly twice.
13. **Were live database tests completed?** No. This sandbox cannot reach
    `binaries.prisma.sh` (403, network allowlist), so `npx prisma generate` cannot complete and
    no MySQL instance exists here. Nothing in this status report claims a live-DB test that
    wasn't run.
14. **What remains genuinely incomplete?** E-invoicing IRP integration (architecture only, see
    Q4); e-way bill government API integration (record-keeping only, see Q3); delivery-partner
    login portal (see Q8); multi-warehouse stock allocation/backorder logic (see Q9);
    HSN-report point-in-time accuracy (see Q2); SMS gateway for delivery OTPs (see Q7); and any
    live-database verification at all (see Q13, and every "statically verified" label below).

### Verification labels used below (per this session's instruction)
- **verified** = actually run in this sandbox and passed (lint, typecheck, build, unit tests).
- **statically verified** = read and reasoned through the code path directly; not executed
  against a live database because none exists here.
- **blocked by environment** = cannot be done in this sandbox (needs `binaries.prisma.sh`,
  MySQL, or a real government/SMS/payment credential).
- **not implemented** = genuinely absent, stated as such rather than assumed done.

### Actually run this session (verified)
- `frontend: npx tsc -b` → 0 errors (after every change batch, not just once at the end)
- `frontend: npm run build` → succeeds, `dist/` produced
- `backend: npm run lint` → 0 errors, 1 pre-existing unrelated warning
- `backend: npx jest tests/unit` → 6/6 passed
- Full-schema relation-pairing check (224 relation names, all paired) — script-verified, not
  eyeballed

### Blocked by environment (not run, stated plainly)
- `npx prisma generate` / `npx prisma migrate deploy` — `binaries.prisma.sh` returns 403 in
  this sandbox's network allowlist
- Every DB-dependent test explicitly requested: GST calculation against real rows, UTGST
  against real rows, HSN/SAC report against real rows, delivery status-transition sequence
  against a real shipment row, OTP bypass attempt against a real OTP row, quantity-change
  approval against a real inventory row, inventory concurrency — all statically verified by
  reading the code path, none executed

## Files changed / added this session
- Schema: `edunest_database_schema.sql` (invoices GST columns, eway_bills, warehouses,
  inventory.warehouse_id, quantity_change_requests), `prisma/schema.prisma` (matching models +
  `Tax.hsnCode`/`Product.tax` relation fix)
- New migration: `prisma/migrations/20260905000000_gst_storage_eway_warehouse_qtychange/`
- Backend: `repositories/{warehouse,ewayBill,quantityChangeRequest}.repository.ts`,
  `services/{warehouse,ewayBill,quantityChangeRequest}.service.ts`,
  `controllers/{warehouse,ewayBill,quantityChangeRequest}.controller.ts`,
  `validators/{warehouse,ewayBill,quantityChangeRequest}.validators.ts`,
  `routes/{warehouse,ewayBill,quantityChangeRequest}.routes.ts` (all registered in
  `routes/index.ts`), `services/reports.service.ts` (hsnReport), `controllers/reports.
  controller.ts` + `routes/reports.routes.ts` (hsn endpoint), `services/payment.service.ts`
  (persist GST breakdown onto the invoice row before create, not just the PDF)
- Frontend: `pages/admin/DeliverySection.tsx` (embedded in `admin/Orders.tsx`),
  `pages/admin/InventoryOps.tsx` (Warehouses / Quantity Change Requests / E-way Bills tabs),
  `services/adminInventoryOpsService.ts`, `services/adminReportsService.ts` (HSN types/call),
  `pages/admin/Reports.tsx` (HSN table), router/sidebar/paths registration

## Prior session (delivery partner module, UTGST fix, GST reports)

Scope check against the requirements list: full role audit, GST audit (UTGST specifically),
delivery partner module + OTP-gated delivery, production/warehouse/quantity-change modules,
products API, quotation creation. Real code changes below; anything not listed as done was
checked and found genuinely missing, not silently skipped.

1. **New: Delivery Partner module (real, working, not a stub).** Additive migration
   (`prisma/migrations/20260904010000_delivery_partner_module/`) adds `delivery_partners`;
   extends `shipments` (delivery partner link, recipient name/phone, alternate-recipient
   approver, widened status enum: pending → ready_for_dispatch → assigned → dispatched →
   in_transit → out_for_delivery → delivery_attempted → rescheduled → delivered/failed);
   widens `delivery_updates` into a full status-change audit trail (previous/new status,
   who changed it, when, notes, reschedule date); extends `otps` with a
   `delivery_confirmation` purpose + shipment link, reusing the existing Redis-backed
   OTP infrastructure (expiry, attempt-limit, one-time-use) instead of building a parallel
   one. No table dropped, no existing column narrowed, no existing row touched — includes a
   backfill step for old `delivery_updates` rows.
   - Backend: `repositories/deliveryPartner.repository.ts`, `repositories/shipment.repository.ts`,
     `services/deliveryPartner.service.ts`, `services/delivery.service.ts`,
     `controllers/deliveryPartner.controller.ts`, `controllers/delivery.controller.ts`,
     `validators/deliveryPartner.validators.ts`, `validators/delivery.validators.ts`,
     `routes/deliveryPartner.routes.ts` (`/admin/delivery-partners`), `routes/delivery.routes.ts`
     (`/admin/deliveries`), both registered in `routes/index.ts`, both Admin/Staff-only.
   - **OTP gate is structural, not conventional**: `updateStatus()` explicitly refuses to set
     `'delivered'`; the only path to that status is `completeDeliveryWithOtp()`, which requires
     a verified OTP first. There is no way to call the generic status endpoint to bypass it.
   - Reschedule is Admin/Staff-only (no school/dealer-facing endpoint exists), satisfying
     "no auto-reschedule without administrative approval" by construction.
   - **Known, stated limitation — not faked**: delivery OTPs only work when the recipient
     identifier is an email. There is no SMS gateway wired up anywhere in this codebase
     (confirmed by search — a `SmsQueue` Prisma model exists but nothing implements it).
     Sending an OTP to a phone number throws a clear `500` explaining this rather than
     pretending it was sent.
   - Frontend: `pages/admin/DeliveryPartners.tsx` (roster list/add/activate-deactivate/
     availability), `services/adminDeliveryPartnerService.ts` (roster + shipment API calls),
     wired into the sidebar and router. **Not built**: an assignment UI on the order-detail
     page, and a delivery-partner-facing portal (out of scope — see role note below).
   - **Scoping decision, stated plainly**: delivery partners are an admin-managed roster with
     no login, same as schools/dealers before their own portals existed. "Delivery/Logistics
     Staff" per the role list is served by existing Staff accounts + this module's Admin/Staff-
     only endpoints, not a new user type — this keeps the change additive to `user_type`/auth
     rather than adding a new login flow this session.
2. **UTGST — the audit found a real, specific bug and fixed it.** `gst.helper.ts` had *no
   UTGST concept at all*: every intra-state-or-territory transaction was unconditionally
   labelled CGST+SGST, including for the five UTs that legally charge CGST+UTGST instead
   (Chandigarh, Lakshadweep, Andaman & Nicobar, Dadra & Nagar Haveli and Daman & Diu, Ladakh —
   Delhi/Puducherry/J&K correctly stay SGST, they have their own legislature). Fixed the
   calculation (`GstBreakdown` now carries `utgst`/`isUnionTerritory`), the invoice PDF (was
   unconditionally printing "SGST" even for a UT — now prints UTGST correctly), and the GST
   report.
3. **GST reports — extended, and actually connected to a page.** Found `getGstReport()`
   defined in the frontend service but **never called from any page** — no GST report UI
   existed at all despite the backend endpoint working. Added CGST/SGST/UTGST/IGST totals +
   a state-wise summary to `reports.service.ts`, and a real "GST Summary" section (totals +
   state-wise table + CSV/PDF export) to `admin/Reports.tsx`.
   **Not implemented, stated plainly**: HSN/SAC-wise summary. No product in this schema has
   an HSN/SAC column (checked `prisma/schema.prisma` directly) — adding it needs a real
   schema change plus per-line-item tax attribution, out of scope for this pass.
4. **Explicitly NOT started this session** (checked against the schema — genuinely absent,
   not just unverified): production-team item-level assignment/workflow beyond the existing
   `production_checkpoints` table, multi-warehouse stock (`Warehouse` model doesn't exist —
   there's only a single `Inventory` per product/variant), and the quantity-change-request
   workflow (`QuantityChangeRequest` model doesn't exist). These are each a genuinely large,
   separate schema-plus-full-stack build, on the same scale as the delivery partner module
   above — flagging rather than fabricating partial/fake coverage.
5. **Re-verified, not assumed:** `frontend: npx tsc -b` (0 errors), `frontend: npm run build`
   (succeeds), `backend: npm run lint` (0 errors, 1 pre-existing unrelated warning),
   `backend: npx jest tests/unit` (6/6 passed). Every new backend file's typecheck errors
   trace to the same unchanged sandbox blocker below — none are real bugs; verified
   individually, not dismissed as a category.

## Prior session (full-project audit)

Went through the whole codebase against the checklist in the brief (DB rules, backend
startup, Products API, Create Quotation, GST, payments, schools/dealers, catalogue, local
uploads, auth, error handling). Two real bugs found and fixed; everything else in that list
was re-verified against the actual code, not assumed from prior notes.

1. **Root cause of the "Create Quotation" 400 — found and fixed.** The school-facing
   `frontend/src/pages/public/RequestQuotation.tsx` ("Request a Quotation") only ever sent
   `customItemDescription` on its item payload. `backend/src/services/quotation.service.ts`
   requires `productId`, `kitId`, **or** `customItemName` on every item and throws
   `400 Bad Request` otherwise — so every submission from that page was guaranteed to fail,
   with no exceptions. Fixed by sending `customItemName` (the selected category) alongside
   the description, and added the missing field to `quotationService.ts`'s
   `QuotationItemInput` type so this can't silently regress. The **admin** Create Quotation
   form (`admin/Quotations.tsx`) already sent this field correctly and was not the source of
   the reported error.
2. **Cloudinary was still in use despite the "local uploads only" requirement.**
   Product/school/dealer image uploads already went through local disk storage
   (`src/storage/upload.storage.ts` — correct, verified). But invoice PDF generation
   (`payment.service.ts`) uploaded every generated invoice to Cloudinary. Added
   `src/helpers/localBufferUpload.helper.ts` (writes to `uploads/<folder>/`, same
   unique-filename safety rules as the multer disk storage engine, served via the existing
   `app.use('/uploads', express.static(...))` mount — no new server config needed) and
   rewired invoice generation to it. Deleted the now-dead `config/cloudinary.ts`,
   `storage/cloudinaryStorage.engine.ts`, `helpers/cloudinaryBufferUpload.helper.ts`, the
   `cloudinary` npm dependency, and its `CLOUDINARY_*` env vars/example entries. Fixed two
   stale Swagger doc comments in `upload.routes.ts` that still said "to Cloudinary".
3. **Payment gateway confirmed, not changed.** The codebase has a complete, real Razorpay
   integration (order creation, signature verification, webhook handling, refunds). Per the
   brief's own instruction to keep a confirmed existing gateway rather than force a switch to
   Cashfree, this was left as-is.
4. **Products API (`GET /api/v1/products`) — traced end-to-end again, no additional defect
   found.** Route → `catalog.validators.ts` (`listProductsSchema`) → `product.controller.ts`
   → `product.service.ts` → `product.repository.ts` → Prisma query: filters, pagination,
   category/brand/tag/price filters, search, `inStockOnly`, and sort options all check out
   against the current schema, and the global error handler
   (`middlewares/errorHandler.middleware.ts`) already maps Prisma errors to safe, structured
   400/404/409/500 responses (no stack traces leaked, no fake empty-array error-swallowing).
   This matches the prior session's finding. A 409 specifically only comes from a Prisma
   `P2002` unique-constraint hit, which a plain `GET` cannot trigger — if you're still seeing
   409s from the products screen, they're most likely coming from a create/update action
   bundled into the same bug report, not the list endpoint itself; if you can share the exact
   request (method + body) that returned 409, that pins it down immediately.
5. **Re-verified, not just re-read:** ran `frontend: npx tsc -b` (0 errors, including through
   the two changes above), `frontend: npm run build` (succeeds, `dist/` produced),
   `backend: npm run lint` (0 errors, 1 pre-existing unrelated warning),
   `backend: npx jest tests/unit` (6/6 passed). The dozens of
   `Module '@prisma/client' has no exported member 'School'/'User'/...` errors from
   `backend: npm run typecheck` were individually checked, not dismissed: every one of them
   traces back to a Prisma-generated type that's missing only because Prisma Client
   generation is incomplete in this sandbox (blocker #1, unchanged) — not to a real code bug.
   None were skipped without checking.
6. **GST module spot-checked:** `helpers/gst.helper.ts` computes CGST+SGST vs IGST
   server-side from the company's registered state (Settings table, env fallback — never
   hardcoded) vs. the order's billing state, and is wired into both the invoice PDF and the
   admin GST report. One real gap: it doesn't separately label UTGST vs SGST for Union
   Territories (both currently compute as the intra-state case) — flagged, not silently
   left implied as done.

## Prior session (GST update + reported-bug pass)

Fixed, code-level, and verified where the sandbox allows (see command results below):

1. **`backend/src/app.ts` missing `path` import** — `express.static(path.resolve(...))` was
   using `path` without importing it. Added `import path from 'path';`. This alone was breaking
   `npm run build`/`npm run typecheck` before anything else could run.
2. **`GET /settings/company` 404** — didn't exist. Added a public (no-auth) controller method
   + route reusing the existing `getCompanyGstProfile()` GST helper, returning the safe,
   already-public fields only (legal/trade name, GSTIN, constitution, registration type/date,
   registered address, contact info) — never payment/email/auth config. Admin editing already
   worked generically via the pre-existing `PATCH /admin/settings`; no backend change needed
   there.
3. **GST company profile (from the supplied certificate)** — added an additive, idempotent
   migration (`20260904000000_seed_company_gst_profile`) seeding `application_settings` with
   MADHAV TIRUPATI JAYBHAYE / The EduNest / GSTIN 27CIEP38036K1ZY / Wagholi, Pune, Maharashtra
   412207 / registered 2026-01-07 / Proprietorship / Regular. Uses
   `ON DUPLICATE KEY UPDATE setting_key = setting_key` so it never overwrites a later admin
   edit. Also documented `COMPANY_GST_STATE` / `COMPANY_GSTIN` as pre-launch-only fallbacks in
   `.env.example` (these are public statutory numbers, not secrets).
4. **Frontend Company/GST settings were 100% mock** (`defaultCompanySettings`/
   `defaultGstSettings` hardcoded, saves resolved optimistically without hitting any API).
   Rewrote `frontend/src/services/settingsService.ts` to actually call `GET /settings/company`
   on load and `PATCH /admin/settings` on save; extended the `GstSettings` type and the GST
   Settings tab in `admin/Settings.tsx` with the certificate fields (legal name, constitution,
   registration type/date, registered address) instead of only a GSTIN string.
5. **Frontend/backend port mismatch** — `frontend/.env.example` said the backend runs on
   `5000`; the backend's actual default (`backend/.env.example`, `env.ts`) is `4000`, and
   `frontend/.env` (the real dev file) already correctly said `4000`. Anyone who copied the
   example file would misconfigure `VITE_API_BASE_URL` and see every API call fail — a direct
   contributor to "no visible updates / nothing works" symptoms. Fixed the example file to
   match reality.
6. **Duplicate secrets in `backend/.env` and `backend/prisma/.env`** — both files were byte-
   identical, including JWT/cookie secrets. Prisma CLI only ever reads `DATABASE_URL` from
   `prisma/.env`; trimmed that file to just `DATABASE_URL` (and its `.env.example`
   accordingly) so there's a single real source of truth (`backend/.env`) for every other
   variable, per the "resolve duplicate variables" requirement.
7. **Products API 500 / Create-Quotation flow** — traced route → controller → service →
   repository → Prisma schema for both. Found no static defect: relation names, includes,
   validators, and the admin-quotation-on-behalf-of-school flow all check out against the
   current `schema.prisma`, and this matches the prior session's note that Admin Quotations
   was already "rebuilt on the real domain model." **Could not reproduce the 500 live** — see
   blocker #1 below, which is unchanged from the prior session and not something this session
   introduced or could route around (a GitHub-releases mirror for the Prisma engine binary was
   attempted and also failed — the endpoint doesn't host arbitrary schema-engine builds).
8. Added `DEPLOYMENT.md` (local setup, production build, environment variables, Hostinger
   deployment options, verification commands).

### Commands actually run this session

| Check | Result |
|---|---|
| `frontend: npm install` | ✅ succeeded |
| `frontend: npx tsc -b` | ✅ 0 errors |
| `frontend: npm run build` (real `vite build`) | ✅ succeeded, `dist/` produced |
| `frontend: npm run lint` | ✅ 0 errors (9 pre-existing warnings, unrelated to this session) |
| `backend: npm install` | ✅ succeeded (postinstall `prisma generate` fails — see blocker #1) |
| `backend: npx jest tests/unit` | ✅ 6/6 passed (DB-independent) |
| `backend: npx jest tests/integration` | ❌ fails to compile — blocker #1 |
| `backend: npm run typecheck` / `npm run build` | ❌ fails — blocker #1 |
| `backend: npm run prisma:generate` / `migrate:deploy` | ❌ blocked — blocker #1 |
| Any live DB / E2E flow | ❌ **NOT RUN** — no database in this environment |

## Prior session's checkpoint (unchanged, still accurate)

## Build/typecheck verification (actually run this session, not assumed)

| Check | Result |
|---|---|
| `frontend: npx tsc -b` | ✅ 0 errors |
| `backend: npm run typecheck` | ✅ 0 errors |
| `frontend: npm run build` (real `vite build`) | ✅ succeeded, `dist/` produced |
| `backend: npm run build` (`tsc -p`) | ✅ succeeded, `dist/` produced |
| `npx prisma validate` / `npx prisma generate` | ❌ **BLOCKED** — see below |
| Any live DB / E2E flow | ❌ **NOT RUN** — no database in this environment, not claimed as tested |

## Completed this engagement (code-level, type-checked, not DB-verified)

- **First-run Super Admin setup**: no hardcoded admin; `/setup` self-disables after first use.
- **Admin Schools/Dealers**: Add School/Dealer, Reset Filters, real API, no mock data.
- **Admin Products**: Category/Brand admin CRUD built (backend already had it; frontend didn't).
- **Admin Quotations**: rebuilt on the real domain model (Master Quotation Request → per-item
  dealer assignment → DealerQuotation), custom items, dealer assignment, CSV export.
- **Admin Payments**: confirmed already real.
- **Admin Invoices**: rebuilt on real API; added `POST /admin/invoices/:id/send` (real email,
  fails loudly if no PDF or SMTP not configured — never fakes success).
- **Admin Analytics**: rebuilt on real DB aggregations (revenue trend, top categories/schools/
  products, order status, dealer capacity, payment-method breakdown — 2 of these are new
  endpoints, the rest already existed). Dropped 2 chart types with no real backend rather than
  fake them (production/delivery time trend, quotation conversion — see Known Gaps).
- **Notifications**: backend was already fully real; fixed 3 frontend topbars (Admin/Dealer/
  Portal) that were faking unread count, user identity, and had non-functional Log Out.
- **Email**: confirmed real (Nodemailer, boot-time verify, queue/worker, template system).
  Invoice-send guard tightened to catch placeholder SMTP creds explicitly.
- **Dealer Dashboard**: confirmed already the real, primary workflow (not WhatsApp — WhatsApp
  is a side notification only). Fixed a live bug: dealer price-entry form was still submitting
  the pre-rename `quotedUnitPrice` field and a fake status enum, silently breaking every dealer
  price submission.
- **Financial model** (`schoolUnitPrice`/`dealerUnitPrice`, Order margin/fee/net-revenue fields):
  schema fixed for the missing custom-item columns; confirmed no remaining `quotedUnitPrice`
  anywhere in the codebase.
- **GST**: new reusable `backend/src/helpers/gst.helper.ts` — CGST+SGST vs IGST derived from
  company GST state (Settings table, env fallback, never hardcoded) vs. the order's billing
  state, computed at invoice-render time from the already-stored tax total (no schema
  migration needed). Wired into the invoice PDF and the admin GST report.
- **Security**: fixed a real margin leak (`dealerOrder.service.ts` was returning
  `marginAmount`/`netRevenueAmount`/`platformFeeAmount`/`dealerTotalAmount` to dealers).
  Confirmed school-side redaction of the same fields is intact. Confirmed invoice access has
  no separate IDOR path (nested inside an already-ownership-checked order).
- **School portal Dashboard**: fixed fake recent-orders (was filtering a hardcoded mock array)
  to use the real `orderService`.
- **Excel import script**: `backend/prisma/importSchoolsAndDealers.ts` — idempotent (skips by
  name), imports the real 29-school / 10-vendor workbooks, honestly documents what it can't
  map (no email/password in source → synthetic placeholder + random password; vendor "Category"
  column has no matching field on `Dealer` → defaults `businessType='wholesaler'`, original
  text kept only in the run's console report). **Written and reviewed, never executed** — no
  database in this sandbox.
- Fixed two unrelated pre-existing bugs found along the way: `tsconfig.app.json`'s
  `ignoreDeprecations` value (was invalid for the installed TS version, broke `npm run build`),
  and a missing `@rollup/rollup-linux-x64-gnu` optional dependency (Linux-specific, only
  affected building outside Windows).

## Known gaps (not done, stated plainly)

- Production/delivery-time trend and quotation-conversion analytics: no backend aggregation
  exists; not built (would need new time-series queries — flagged, not invented as fake charts).
- Public marketing pages (Home/About/Curriculum/Branding/Success Hub) still use illustrative
  content — lower priority, not transactional business data.
- `dealerService.ts`, `analyticsService.ts`, `useDealerAssignment.ts`,
  `DealerAssignmentCard.tsx` — orphaned dead code (nothing imports them anymore since
  Quotations/Analytics were rebuilt). Harmless but not deleted.
- Learning Resources / Events / Rewards / Subscriptions: intentionally out of V1 scope per
  original requirements, untouched.

## BLOCKERS — genuinely external, require your environment

1. **`npx prisma validate` / `npx prisma generate` cannot run in this sandbox.** The schema
   engine binary fetch (`https://binaries.prisma.sh/...`) returns 403 — this container's
   network is domain-allowlisted and does not include Prisma's binary host. This has been true
   every session; it is not a project bug. **Action required on your machine**: run
   `npx prisma validate && npx prisma generate` for real before deploying — the last schema
   change (custom-item fields on `QuotationRequestProduct`) was verified only via a hand-patched
   type declaration for `tsc`, which is not a substitute for a real client build.
2. **No database in this sandbox** (`DATABASE_URL` resolves to `localhost:3306`, nothing is
   listening). Nothing involving live data — the Excel import, any quotation→order→payment→
   invoice flow, notification delivery, or GST calculation against real orders — has been
   executed or verified end-to-end. All such claims above are explicitly marked code-level only.
3. **SMTP is not fully configured.** `.env` has `SMTP_HOST` set but `SMTP_USER` is still the
   literal placeholder `replace_me`. Email code is correct and fails loudly instead of faking
   success, but no real email has been (or could be) sent.

## Required environment variables (see `backend/.env.example` for the full list)

Must be set to real values before deployment — currently placeholders/unset:
- `DATABASE_URL` — real MySQL connection string
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM_ADDRESS` — real SMTP provider
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` — long random secrets, not the
  placeholder values in `.env.example`
- `COMPANY_GST_STATE`, `COMPANY_GSTIN` — fallback only; the authoritative source is the
  Settings table (`company_gst_state`/`company_gstin` keys via `PATCH /admin/settings`) —
  set these once through Admin Settings after first deploy, not just via env
- Razorpay/payment gateway credentials, WhatsApp Business API credentials, Redis connection —
  present in `.env.example`, not modified this session, not re-verified

## Commands required for Prisma/database setup (run on your machine, not here)

```bash
cd backend
npm install
npx prisma validate
npx prisma generate
npx prisma migrate deploy      # or `migrate dev` if this schema change has no migration file yet
npx prisma db seed             # roles, permissions, shipping methods only — no business data
npx ts-node prisma/importSchoolsAndDealers.ts   # real school/vendor data, idempotent
```

## Deployment commands

```bash
# Backend
cd backend
npm install
npm run build
npm start                      # or your process manager (pm2/systemd) pointed at dist/

# Frontend
cd frontend
npm install
npm run build                  # outputs dist/ — serve as static files behind your web server
```

## E2E testing checklist (to run against a real, reachable database)

1. `npx ts-node prisma/importSchoolsAndDealers.ts` — confirm the printed summary shows 29
   schools / 10 vendors imported (or correctly skipped as duplicates on a re-run).
2. Log in as an imported school using the temp password printed by the import script.
3. School: create a quotation request (catalog item + one custom item with
   `customItemSchoolPrice`/`customItemDealerPrice`).
4. Admin: confirm the request appears in Admin Quotations (not dummy data), assign a dealer to
   each item.
5. Dealer: log in, confirm the assignment appears in their dashboard, enter `dealerUnitPrice`,
   submit. Confirm the dealer never sees `schoolUnitPrice`.
6. School: accept the dealer's quotation, confirm an `Order` is created with correct
   `subtotal`/`dealerTotalAmount`/`marginAmount`/`platformFeeAmount`/`netRevenueAmount`, and that
   the school-facing order response does **not** contain any of the last 4 fields.
7. Record a payment; confirm an `Invoice` is generated automatically.
8. Download the invoice PDF; confirm it shows CGST+SGST (if same state as company) or IGST (if
   different), the platform fee as its own line, and never `dealerUnitPrice`/margin fields.
9. Admin: click "Send Invoice" — confirm either a real email arrives, or (if SMTP still
   unconfigured) a clear error is returned, not a fake success.
10. Confirm the admin notification bell shows a real unread count and the new-quotation
    notification; mark as read; confirm it updates.
11. Confirm Admin Analytics numbers match what you just did (order count, revenue) — not
    static.

## Files changed/added this session (67 total, from `git status --short`)

**Backend (36):** `prisma/schema.prisma`, `prisma/importSchoolsAndDealers.ts` (new),
`prisma/import-data/` (new — the two source `.xlsx` files),
`src/config/env.ts`, `src/constants/index.ts`, `src/helpers/gst.helper.ts` (new),
`src/helpers/invoicePdf.helper.ts`, `src/emails/templates/invoice.template.ts` (new),
`src/controllers/{adminDashboard,adminDealer,adminInvoice,adminPayment,adminSchool,quotation}.controller.ts`,
`src/repositories/{dealer,invoice,order,quotation,school,settings}.repository.ts`,
`src/routes/{adminDashboard,adminDealer,adminInvoice,adminPayment,adminSchool}.routes.ts`,
`src/services/{adminDashboard,adminDealer,adminInvoice,adminSchool,checkout,dealerOrder,email,order,payment,quotation,reports}.service.ts`,
`src/validators/{adminDealer,adminPayment,adminSchool,quotation}.validators.ts`,
`tsconfig.json`.

**Frontend (31):** `tsconfig.app.json`,
`src/components/layout/{AdminTopbar,DealerTopbar,PortalTopbar}.tsx`,
`src/components/admin/` (new — `CatalogManagerDialog.tsx`),
`src/pages/admin/{Analytics,Dealers,Invoices,Payments,Products,Quotations,Schools}.tsx`,
`src/pages/dealer/Quotations.tsx`, `src/pages/portal/Dashboard.tsx`,
`src/services/{adminCatalogService,adminDashboardService,adminDealerService,adminInvoiceService,adminPaymentService,adminQuotationService,adminSchoolService,dealerQuotationService,productService}.ts`
(several new), `src/types/index.ts`.

No frontend UI/layout/design was changed beyond what was required to wire real data in —
component structure, styling, and navigation are unchanged from the approved design.
