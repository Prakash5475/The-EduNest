import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { DealerLayout } from "@/components/layout/DealerLayout";
import { paths } from "@/routes/paths";
import { Skeleton } from "@/components/ui/skeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));

// Admin console
const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Schools = lazy(() => import("@/pages/admin/Schools"));
const Dealers = lazy(() => import("@/pages/admin/Dealers"));
const AdminProducts = lazy(() => import("@/pages/admin/Products"));
const Quotations = lazy(() => import("@/pages/admin/Quotations"));
const Orders = lazy(() => import("@/pages/admin/Orders"));
const Payments = lazy(() => import("@/pages/admin/Payments"));
const Invoices = lazy(() => import("@/pages/admin/Invoices"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const Reports = lazy(() => import("@/pages/admin/Reports"));
const AdminSupport = lazy(() => import("@/pages/admin/Support"));
const Settings = lazy(() => import("@/pages/admin/Settings"));

// Public site
const Home = lazy(() => import("@/pages/public/Home"));
const About = lazy(() => import("@/pages/public/About"));
const Shop = lazy(() => import("@/pages/public/Shop"));
const Categories = lazy(() => import("@/pages/public/Categories"));
const ProductDetails = lazy(() => import("@/pages/public/ProductDetails"));
const Cart = lazy(() => import("@/pages/public/Cart"));
const Checkout = lazy(() => import("@/pages/public/Checkout"));
const BulkOrders = lazy(() => import("@/pages/public/BulkOrders"));
const RequestQuotation = lazy(() => import("@/pages/public/RequestQuotation"));
const CurriculumSolutions = lazy(() => import("@/pages/public/CurriculumSolutions"));
const BrandingSolutions = lazy(() => import("@/pages/public/BrandingSolutions"));
const PreschoolKits = lazy(() => import("@/pages/public/PreschoolKits"));
const DealerMarketplace = lazy(() => import("@/pages/public/DealerMarketplace"));
const PreschoolSuccessHub = lazy(() => import("@/pages/public/PreschoolSuccessHub"));

// School client portal
const PortalDashboard = lazy(() => import("@/pages/portal/Dashboard"));
const PortalOrders = lazy(() => import("@/pages/portal/Orders"));
const OrderTracking = lazy(() => import("@/pages/portal/OrderTracking"));
const Wishlist = lazy(() => import("@/pages/portal/Wishlist"));
const Rewards = lazy(() => import("@/pages/portal/Rewards"));
const Subscriptions = lazy(() => import("@/pages/portal/Subscriptions"));
const LearningResources = lazy(() => import("@/pages/portal/LearningResources"));
const Events = lazy(() => import("@/pages/portal/Events"));
const Support = lazy(() => import("@/pages/portal/Support"));
const Notifications = lazy(() => import("@/pages/portal/Notifications"));
const Profile = lazy(() => import("@/pages/portal/Profile"));

// Dealer portal
const DealerDashboard = lazy(() => import("@/pages/dealer/Dashboard"));
const DealerOrders = lazy(() => import("@/pages/dealer/Orders"));
const DealerProductionQueue = lazy(() => import("@/pages/dealer/ProductionQueue"));
const DealerQuotations = lazy(() => import("@/pages/dealer/Quotations"));
const DealerNotifications = lazy(() => import("@/pages/dealer/Notifications"));
const DealerTracking = lazy(() => import("@/pages/dealer/Tracking"));
const DealerProfile = lazy(() => import("@/pages/dealer/Profile"));
const DealerReports = lazy(() => import("@/pages/dealer/Reports"));

function PageFallback() {
  return (
    <div className="container space-y-4 py-10">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function withSuspense(Component: React.LazyExoticComponent<() => React.ReactElement>) {
  return (
    <Suspense fallback={<PageFallback />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(Home) },
      { path: "about", element: withSuspense(About) },
      { path: "shop", element: withSuspense(Shop) },
      { path: "shop/:id", element: withSuspense(ProductDetails) },
      { path: "categories", element: withSuspense(Categories) },
      { path: "cart", element: withSuspense(Cart) },
      { path: "checkout", element: withSuspense(Checkout) },
      { path: "bulk-orders", element: withSuspense(BulkOrders) },
      { path: "request-quotation", element: withSuspense(RequestQuotation) },
      { path: "solutions/curriculum", element: withSuspense(CurriculumSolutions) },
      { path: "solutions/branding", element: withSuspense(BrandingSolutions) },
      { path: "solutions/preschool-kits", element: withSuspense(PreschoolKits) },
      { path: "dealer-marketplace", element: withSuspense(DealerMarketplace) },
      { path: "preschool-success-hub", element: withSuspense(PreschoolSuccessHub) },
    ],
  },
  {
    path: "/login",
    element: <PublicLayout />,
    children: [{ index: true, element: withSuspense(Login) }],
  },
  {
    path: "/register",
    element: <PublicLayout />,
    children: [{ index: true, element: withSuspense(Register) }],
  },
  {
    path: paths.portal.dashboard,
    element: (
      <ProtectedRoute allow={["school"]}>
        <PortalLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(PortalDashboard) },
      { path: "orders", element: withSuspense(PortalOrders) },
      { path: "orders/:id", element: withSuspense(OrderTracking) },
      { path: "wishlist", element: withSuspense(Wishlist) },
      { path: "rewards", element: withSuspense(Rewards) },
      { path: "subscriptions", element: withSuspense(Subscriptions) },
      { path: "resources", element: withSuspense(LearningResources) },
      { path: "events", element: withSuspense(Events) },
      { path: "support", element: withSuspense(Support) },
      { path: "notifications", element: withSuspense(Notifications) },
      { path: "profile", element: withSuspense(Profile) },
    ],
  },
  {
    path: paths.admin.dashboard,
    element: (
      <ProtectedRoute allow={["admin", "staff"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(Dashboard) },
      { path: "schools", element: withSuspense(Schools) },
      { path: "dealers", element: withSuspense(Dealers) },
      { path: "products", element: withSuspense(AdminProducts) },
      { path: "quotations", element: withSuspense(Quotations) },
      { path: "orders", element: withSuspense(Orders) },
      { path: "payments", element: withSuspense(Payments) },
      { path: "invoices", element: withSuspense(Invoices) },
      { path: "analytics", element: withSuspense(Analytics) },
      { path: "reports", element: withSuspense(Reports) },
      { path: "support", element: withSuspense(AdminSupport) },
      { path: "settings", element: withSuspense(Settings) },
    ],
  },
  {
    path: paths.dealer.dashboard,
    element: (
      <ProtectedRoute allow={["dealer"]}>
        <DealerLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withSuspense(DealerDashboard) },
      { path: "orders", element: withSuspense(DealerOrders) },
      { path: "production-queue", element: withSuspense(DealerProductionQueue) },
      { path: "quotations", element: withSuspense(DealerQuotations) },
      { path: "notifications", element: withSuspense(DealerNotifications) },
      { path: "tracking/:id", element: withSuspense(DealerTracking) },
      { path: "profile", element: withSuspense(DealerProfile) },
      { path: "reports", element: withSuspense(DealerReports) },
    ],
  },
  {
    path: "*",
    element: <Navigate to={paths.home} replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
