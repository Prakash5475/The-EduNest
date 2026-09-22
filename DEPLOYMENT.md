# EduNest — Local Setup, Production Configuration & Hostinger Deployment

## 1. Prerequisites

- Node.js 22+
- MySQL 8+ (or MariaDB 10.6+)
- npm 10+

## 2. Local setup

### Backend

```bash
cd backend
cp .env.example .env
cp prisma/.env.example prisma/.env
# Edit both — at minimum set a real DATABASE_URL in both files, and real values for
# JWT_ACCESS_SECRET / JWT_REFRESH_SECRET / COOKIE_SECRET (long random strings — never reuse
# the placeholders). prisma/.env only needs DATABASE_URL; the app itself reads backend/.env.

npm install
npm run prisma:generate
npm run prisma:migrate:deploy   # additive only — never migrate reset / db push --force-reset
npm run prisma:seed             # optional: demo data
npm run dev                     # http://localhost:4000 by default (PORT in .env)
```

### Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL must point at the backend's PORT + API_PREFIX, e.g.
# http://localhost:4000/api/v1 for the default backend config above.

npm install
npm run dev                     # http://localhost:5173
```

If the frontend shows no data / every request fails, it is almost always one of:
- `VITE_API_BASE_URL` port doesn't match the backend's `PORT`
- backend `CORS_ALLOWED_ORIGINS` doesn't include the frontend's origin
- the backend process wasn't restarted after a `.env` change
- the browser is loading a stale `frontend/dist` build instead of the dev server —
  run `npm run dev`, not `npm run build && npm run preview`, while developing

## 3. Production build

```bash
# Backend
cd backend
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build          # emits backend/dist
npm start               # node dist/server.js

# Frontend
cd frontend
npm ci
npm run build           # emits frontend/dist (static files)
```

Serve `frontend/dist` as static files behind a reverse proxy (Nginx/Apache) that also
proxies `/api` (and `/uploads`, `/health`, `/docs` if Swagger is left enabled) to the backend
Node process. Keep the frontend and backend on the same origin in production (or set CORS
accordingly) so cookies (the refresh token) work.

## 4. Environment variables

See `backend/.env.example` for the full list. Required real values before production:
- `DATABASE_URL` — real MySQL connection string (both `backend/.env` and `backend/prisma/.env`
  need `DATABASE_URL`; `prisma/.env` needs nothing else — see the comment in
  `backend/prisma/.env.example`)
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` — long random secrets
- `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM_ADDRESS` — real SMTP provider
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`
- `CORS_ALLOWED_ORIGINS` — your real frontend origin(s)
- `COMPANY_GST_STATE` / `COMPANY_GSTIN` — pre-launch fallback only; the authoritative source
  is Admin Settings → GST Settings (backed by `application_settings`, seeded with the company's
  real GST-certificate profile by migration `20260904000000_seed_company_gst_profile`)

Never commit real `.env` files. Only `.env.example` files (placeholders) are included in this
package.

## 5. Database migrations

Only additive migrations are used in this project (see `backend/prisma/migrations`). To apply:

```bash
npm run prisma:migrate:deploy
```

Never run `prisma migrate reset`, `prisma db push --force-reset`, `DROP DATABASE`, or
`TRUNCATE` against a real database — none of these are used anywhere in this project's scripts.

## 6. Hostinger deployment

Hostinger's **shared/Business hosting** plans do not run a persistent Node.js process or give
you a MySQL server you can point arbitrary connection strings at in the way this app needs —
use one of:

- **Hostinger VPS** (recommended): install Node 22, MySQL, and a process manager (`pm2`);
  point Nginx at the frontend `dist/` folder and reverse-proxy `/api` to the Node process on
  its internal port (see `backend/Dockerfile` / `docker-compose.yml` for a container-based
  alternative — `docker compose up -d` after setting real env vars).
- **Hostinger's Node.js App hosting** (if your plan includes it): deploy `backend/` as the Node
  app (`npm run build && npm start`), and deploy `frontend/dist` (after `npm run build`) as a
  static site, or serve it from the same Node app via a static file middleware.
- Hostinger's managed MySQL (available on both shared and VPS plans) can serve as
  `DATABASE_URL` either way.

In all cases: run `npm run prisma:migrate:deploy` once against the production database before
starting the app, and set every environment variable in §4 to real, non-placeholder values.

## 7. Verification commands

```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run typecheck
npm run build
npm test -- --runInBand

# Frontend
cd frontend
npm install
npm run build
npm run lint
```

`npm run prisma:generate` and everything after it that touches Prisma requires network access
to `binaries.prisma.sh` (to fetch the query/schema engine) and a reachable MySQL server at
`DATABASE_URL`. Run these on your own machine/CI, not in a network-restricted sandbox.
