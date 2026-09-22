# EduNest GST Company Profile

The platform GST profile is stored in the SQL `application_settings` table and is seeded by `prisma/seed.ts`. The values are used by GST calculations and invoice PDF rendering.

- Legal name: MADHAV TIRUPATI JAYBHAYE
- Trade name: The EduNest
- GSTIN: 27CIEP38036K1ZY
- Constitution: Proprietorship
- Registration type: Regular
- Registration date: 2026-01-07
- Principal place: Floor No: Office No 101, Guru Krupa Sewa Aashram Road, Momin Apartments, Wagholi Awhadi Road, Wagholi, Pune, Maharashtra 412207

Run the normal non-destructive seed command after deployment to insert/update these settings:

```bash
npx prisma db seed
```
