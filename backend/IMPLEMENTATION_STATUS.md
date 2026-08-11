# Current Status
Overall Progress: v1.0 backend feature-complete: Orders/Payments/Reports/School(self-service)/Notifications/Audit Log/Production/Quotation+Challan PDF/Admin Portal (Schools/Dealers/Payments/Invoices/Users/Roles/Permissions/Settings)/WhatsApp Business Workflow. Dealer Portal built but deprecated for v1.0 (WhatsApp-only, confirmed business decision).
Current Module: none — preparing final v1.0 source checkpoint package
Last Updated: This session (final checkpoint packaging)

## Modules Completed
- Infrastructure, Authentication, Orders, Payments, Reports, School Workflow (self-service),
  Notifications, Audit Log, Production Workflow, Quotation+Challan PDF, Admin Portal (Schools/
  Dealers/Payments/Invoices/Users/Roles/Permissions/Settings) — all pre-date this session, see
  git history / prior notes for detail; not re-verified this session per standing instructions.
- Dealer Workflow (self-service portal) — **deprecated for v1.0 per explicit business decision**:
  dealers have no login/frontend in v1.0, communicate only via WhatsApp/phone; admin enters
  negotiated quotation/production/payment data after those conversations. The portal backend
  code remains in the repo, untouched, for possible future reuse — not extended this session.
- **WhatsApp Business Workflow** (this session):
  - Schema: `WhatsappConversation` (per-dealer state machine row) + `WhatsappInboundMessage`
    (raw inbound log, idempotent on `providerMessageId`), `Dealer` back-relation. One migration:
    `prisma/migrations/20260807000000_add_whatsapp_conversations/migration.sql`.
  - Env: `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` (`env.ts` + `.env.example`).
  - `GET/POST /webhooks/whatsapp` — Meta handshake verification + HMAC-SHA256 signature
    validation (`timingSafeEqual`) on every POST, per the official Graph API webhooks spec.
    Reuses the exact `req.rawBody` capture mechanism already established for the Razorpay
    webhook (`app.ts`'s `express.json({ verify })`) — same pattern, no new body-parsing setup.
  - Inbound messages: persisted idempotently, queued (`whatsappInboundQueue`, new
    `WHATSAPP_INBOUND` queue name) to a dedicated `whatsappInbound.worker.ts` (registered in
    `jobs/worker.ts`), processed by `whatsappConversation.service.ts`.
  - Inbound delivery-status callbacks (sent/delivered/read/failed for messages we sent) update
    the existing `WhatsappMessageLog` directly — full round-trip on the pre-existing outbound
    ledger that previously had no way to receive Meta's status updates.
  - **Conversation state machine**: `WhatsappConversation.state` (idle /
    awaiting_quotation_price / awaiting_quotation_confirmation / awaiting_work_order_ack /
    awaiting_dispatch_details / awaiting_delivery_confirmation). `markAwaitingReply()` is called
    by outbound business triggers right before sending a message that expects a specific reply;
    inbound processing resets to `idle` and stores the raw reply in `contextData` for admin
    review.
  - **Explicit design decision, not a shortcut**: inbound dealer replies are NEVER auto-applied
    to `DealerQuotation`/`Order`/`Payment` records — every inbound message triggers a
    `notifyUsersWithRole(['super_admin','staff'], ...)` alert instead, so a human enters the
    negotiated terms, matching the stated business rule exactly ("Admin users are responsible
    for entering negotiated quotations and updating production/payment data into the system
    after phone discussions"). This was a deliberate choice to avoid unsafe auto-parsing of
    free-text replies into financial/production records.
  - **Outbound wiring into existing business flows** (the templates existed since before this
    checkpoint but were never actually triggered — found and fixed):
    - RFQ assignment (`quotation.service.ts`) → `rfq_received` template + `awaiting_quotation_price`
    - Dealer work-order assignment (`production.service.ts assignDealer`) → new
      `dealer_work_order` template + `awaiting_work_order_ack`
    - Checkpoint "packed" → new `dispatch_request_dealer` template + `awaiting_dispatch_details`
    - Checkpoint "dispatched" → new `delivery_confirmation_request_dealer` template +
      `awaiting_delivery_confirmation`
    - All other checkpoint stages → new `production_milestone_dealer` template (FYI, no state
      change)
    - Four new entries added to `whatsapp.templates.ts`'s registry (reused the existing
      registry/interface — no new template mechanism)
  - **Admin surface**: `GET /admin/whatsapp/delivery-logs` (status filter, pagination — the
    README's flagged "repository exists, needs controller+route+page" gap, now closed),
    `GET /admin/whatsapp/conversations` (every dealer's current state, paginated),
    `GET /admin/whatsapp/conversations/:id/messages` (full inbound history — the "conversation
    log viewer" backend, previously blocked on the webhook, now unblocked and built),
    `POST /admin/whatsapp/broadcast` (send a registered template to N dealers at once, reuses
    the existing per-user send pipeline — no new send path).
  - Typecheck: 274 total repo errors (was 265 before this module) — the +9 are all the
    identical pre-existing stub-noise signature (`no exported member` on the never-regenerated
    Prisma client), now also covering the brand-new `WhatsappConversation`/
    `WhatsappConversationState`/`WhatsappMessageStatus` types that can't exist in the stub until
    `npx prisma generate` runs for real. `adminWhatsapp.controller/routes/validators.ts`: zero
    errors (no repository dependency needing regenerated types).

## Modules In Progress
- WhatsApp — core is production-ready per the official Meta spec (signature verification,
  idempotent inbound handling, retry via BullMQ backoff), but see Remaining TODO for what's
  left within this module specifically.

## Remaining Modules
- Bulk-pricing tiers table (open design decision, not implemented)
- Razorpay fee-preserving pricing — confirmed missing, not started
- Multi-dealer quotation comparison — confirmed partially implemented (data exists, no
  ranking/comparison logic built)
- External supplier/manufacturer links — confirmed missing, needs schema migration + go-ahead

## Current Working Files
None — no file mid-edit.

## Next Immediate Task
Register real WhatsApp message templates with Meta Business Manager (an external/business
process, not code) is a prerequisite for any of this to actually send in production — flagging
per the README's own "requires business verification" note, not something to build further here.
For code: the delivery-confirmation and quotation-confirmation inbound states are tracked but
nothing yet *reads* `WhatsappConversation.state` on the admin side to prompt "this dealer owes
you a reply" — a small admin-UI/API nicety, not a functional gap.

## Remaining TODO
1. Register real message templates with Meta Business Manager (business process, not code)
2. Multi-dealer quotation comparison ranking logic (data already available, see above)
3. Razorpay fee-preserving pricing (missing entirely)
4. External supplier/manufacturer links (needs schema migration + explicit go-ahead)
5. Bulk-pricing tiers — **blocked**, needs user design decision

## Notes
- Sandbox cannot run `npx prisma generate` (no network) — Prisma client is an untyped stub;
  every typecheck shows pre-existing errors unrelated to any session's changes, now including
  the newly-added WhatsApp model types for the same reason. Confirmed the error count only grew
  by exactly the expected new-type references, nothing unexplained.
- SMTP intentionally left broken per earlier explicit instruction — do not fix unless asked.
- Dealer Portal is explicitly deprecated for v1.0 (business decision, confirmed by user this
  session) — do not extend it; it remains in the repo unused, per instruction.
- WhatsApp webhook code cannot be exercised end-to-end in this sandbox (no network to Meta's
  Graph API) — written strictly to the official spec, not tested against a live Meta delivery.
