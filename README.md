# The EduNest — Frontend (Phase 1 + 2 + 3)

Premium B2B preschool & school procurement platform. This delivery covers the
**admin/procurement dashboard** (Phase 1), the **public marketing site +
commerce flow** (Phase 2), and the **school-facing client portal** (Phase 3),
built frontend-only on mock data.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · React Router v7 · Radix primitives
(Shadcn-style) · React Hook Form + Zod · TanStack Query (provider wired) ·
Recharts · Sonner · react-dropzone · lucide-react

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

- Public site: `/`
- School client portal: `/portal` (linked from the site header's account icon —
  defaults to a demo-logged-in school, Greenfield Academy, since there's no
  auth backend in this build)
- Admin console: `/admin` (linked from the site footer)

To type-check and build for production:

```bash
npm run build
```

> **Note:** this project was authored in a sandboxed environment without
> package-registry access, so `npm install` has not been run or verified here.
> If you hit a version-resolution issue, the most likely culprits are the
> `@radix-ui/*` packages — pin them to the latest `1.x`/`2.x` release for the
> corresponding primitive if npm complains.

## What's implemented

### Phase 1 — Admin console (`src/pages/admin/`, base path `/admin`)
Dashboard (catalog + product detail panel), Schools, Dealers, Products,
Quotations, Orders, Payments, Invoices, Analytics, Reports, Settings — 11
screens, matching the designer handoff mockups pixel-for-pixel in structure.

### Phase 2 — Public site & commerce (`src/pages/public/`, base path `/`)
- **Home** — hero, feature strip, featured products, testimonials, CTA.
- **About** — mission/approach/stats.
- **Shop** — category + price filters, paginated grid, empty state.
- **Categories** — visual category grid linking into Shop with a query filter.
- **Product Details** — image gallery, color/qty selection, accordion
  (description/specs/shipping/care), related products.
- **Cart** — line items with quantity steppers, GST-inclusive order summary,
  persisted to `localStorage` via `CartContext`.
- **Checkout** — React Hook Form + Zod validated address/contact/payment form,
  order review, confirmation screen.
- **Bulk Orders** — drag-and-drop CSV/Excel upload (`react-dropzone`) plus a
  manual multi-line order builder with live totals.
- **Request Quotation** — validated lead-gen form for dealer price comparison.

Shared additions: `CartContext` (global cart state), `PublicHeader` /
`PublicFooter` / `PublicLayout`, `ProductCard`, `QtyStepper`.

### Phase 3 — School client portal (`src/pages/portal/`, base path `/portal`)
- **Dashboard** — order/spend/rewards/wishlist stats, recent orders, reward
  progress bar, registered events.
- **My Orders** — filterable order history scoped to the logged-in school.
- **Order Tracking** — full-page delivery timeline for a single order.
- **Wishlist** — saved products, backed by the new `WishlistContext`.
- **Rewards** — points balance, tier progress, activity feed, redeemable perks.
- **Subscription Plans** — monthly/yearly toggle, plan comparison, switch flow.
- **Learning Resources** — filterable article/guide/video/worksheet library.
- **Events** — webinar/workshop cards with live register/cancel toggling.
- **Support Center** — FAQ accordion, ticket submission form, ticket history.
- **Notifications** — read/unread state, mark-all-read.
- **School Profile** — editable school details and address.

Shared additions: `WishlistContext` (localStorage-persisted, wired into
`ProductCard` and `ProductDetails`), `PortalSidebar` / `PortalTopbar` /
`PortalLayout`, `currentSchool` demo-session helper in `utils/lookups.ts`.

### Design system & shared kit
- Brand color tokens (`#F44336` / `#1976D2` / `#FFC107` / `#2C2C2C` /
  `#FAFAFA`), Fraunces + Plus Jakarta Sans type pairing, 20–24px radii, soft
  shadows — all as CSS variables in `src/styles/globals.css` and
  `tailwind.config.ts`.
- Shared UI kit (`src/components/ui`): Button, Card, Badge, Input, Label, Select,
  Checkbox, Switch, Tabs, Dialog, Sheet (slide-over), Dropdown Menu, Avatar,
  Accordion, Popover, Skeleton, Table.
- Lazy-loaded, code-split routing for every screen across all three layouts
  (`src/routes/AppRouter.tsx`).

## Not yet built (later phases)

Per the original brief's full 28-screen scope, still to come:

- **Extended solutions pages:** Complete Preschool Kits, Curriculum Solutions,
  Branding Solutions.
- **Marketplace:** Dealer Marketplace, Preschool Success Hub.

These will reuse the same design system, contexts, and `src/components/ui`
kit already in place.

## Folder structure

```
src/
  assets/           brand logos
  components/
    ui/             shared primitives (shadcn-style)
    layout/         AdminSidebar/Topbar/Layout, PublicHeader/Footer/Layout,
                     PortalSidebar/Topbar/Layout
    common/         PageHeader, StatusBadge, Pagination, EmptyState, QtyStepper
    cards/          StatCard, ProductCard
    charts/         ChartCard
  pages/
    admin/          the 11 admin screens
    public/         Home, About, Shop, Categories, ProductDetails, Cart,
                     Checkout, BulkOrders, RequestQuotation
    portal/         Dashboard, Orders, OrderTracking, Wishlist, Rewards,
                     Subscriptions, LearningResources, Events, Support,
                     Notifications, Profile
  context/          CartContext, WishlistContext (localStorage-persisted)
  data/             mock JSON-equivalent datasets (typed)
  types/            shared TypeScript interfaces
  hooks/            usePagination
  routes/           paths.ts, AppRouter.tsx
  lib/, utils/      cn(), formatters, cross-entity lookups, currentSchool
  styles/           globals.css (design tokens)
```
