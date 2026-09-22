# The EduNest — Implementation Status

## Current baseline

This checkpoint preserves the existing frontend and application architecture. The approved dealer workflow is the **Dealer Portal/Dashboard**; WhatsApp is not a required business workflow.

## Changes applied in this checkpoint

- Preserved the existing frontend/UI and frontend business flows.
- Removed obsolete WhatsApp workflow code from the backend and routes.
- Removed the unapplied WhatsApp Prisma migration so new deployments do not create obsolete WhatsApp tables.
- Kept the real in-app notification + WebSocket/queue path.
- Added custom quotation-item fields:
  - name
  - description
  - school price
  - dealer price
  - image file
  - external URL
  - notes
- Added separate school/dealer pricing to dealer quotation items while preserving legacy `quoted_unit_price` for migration safety.
- Added order-level dealer total, margin, platform fee, and net revenue fields.
- Added dealer unit price to order items.
- Added immutable production checkpoint `updatedByType` audit field.
- Corrected 1:1 Prisma relations where the database has unique foreign keys.
- Corrected school profile relation/type and `establishedYear` type.
- Corrected dealer availability time fields to MySQL `TIME`.
- Added existing event attendance timestamps to Prisma.
- Added an acceptance guard so missing historical school pricing cannot silently become ₹0.
- Updated the database schema documentation to include the new fields.

## Database migration required

The code/schema changes are prepared, but the migration must be executed against the real EduNest MySQL database on the deployment machine.

Migration:

`prisma/migrations/20260815000000_sync_production_schema/migration.sql`

The migration:

- preserves legacy `quoted_unit_price`
- backfills `dealer_unit_price` from the legacy quoted price
- derives `school_unit_price` only when a deterministic product/custom-item price exists
- leaves historical school price NULL when it cannot be safely derived
- adds order financial fields with safe defaults
- backfills historical order dealer prices conservatively from recorded unit prices
- adds production actor-type auditing
- adds custom quotation fields

Do not invent historical pricing data.

## Verification required on the local machine

After backing up the database:

```powershell
cd backend
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run typecheck
npm run build
```

Then run the application's real end-to-end tests against the local database:

1. School login
2. Create quotation/custom item
3. Admin assigns dealer
4. Dealer logs in through the Dealer Portal
5. Dealer submits quotation price
6. School accepts quotation
7. Order is created
8. Advance payment flow is verified
9. Invoice is generated
10. CGST/SGST vs IGST is verified
11. Notifications appear in the correct portal
12. Email delivery is verified with real SMTP credentials

## Important

No frontend redesign is part of this checkpoint. Working business logic should not be replaced merely to remove compiler errors. Database changes must be applied through the migration and verified against real data before being considered production-ready.
