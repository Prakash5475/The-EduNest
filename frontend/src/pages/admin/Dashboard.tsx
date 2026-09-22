import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Pencil, SlidersHorizontal, Wallet, PackageCheck, Gauge, AlertTriangle, Boxes, Store, Bell, FileText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatCard } from "@/components/cards/StatCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { listProducts, listCategoryNames, getCategorySlugMap } from "@/services/productService";
import { getAdminDashboardSummary } from "@/services/adminDashboardService";
import { paths } from "@/routes/paths";
import { cn, formatCurrency, formatCompactINR } from "@/lib/utils";
import type { Product } from "@/types";

const PRICE_BANDS = [
  { label: "₹0 - ₹250", min: undefined as number | undefined, max: 250 },
  { label: "₹250 - ₹500", min: 250, max: 500 },
  { label: "₹500 - ₹1000", min: 500, max: 1000 },
  { label: "₹1000 - ₹2000", min: 1000, max: 2000 },
  { label: "Above ₹2000", min: 2000, max: undefined as number | undefined },
];

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [priceBand, setPriceBand] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["admin-dashboard", "summary"],
    queryFn: getAdminDashboardSummary,
  });

  const { data: categoryNames = [] } = useQuery({
    queryKey: ["categories", "names"],
    queryFn: listCategoryNames,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categorySlugMap = {} } = useQuery({
    queryKey: ["categories", "slugMap"],
    queryFn: getCategorySlugMap,
    staleTime: 5 * 60 * 1000,
  });

  const selectedBand = PRICE_BANDS.find((b) => b.label === priceBand);

  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", "admin-dashboard", activeCategory, priceBand, page],
    queryFn: () =>
      listProducts({
        page,
        limit: 6,
        categorySlug: activeCategory === "All" ? undefined : categorySlugMap[activeCategory],
        minPrice: selectedBand?.min,
        maxPrice: selectedBand?.max,
      }),
    placeholderData: (prev) => prev,
  });

  const items = productData?.items ?? [];
  const totalPages = productData?.meta?.totalPages ?? 1;

  const activeProduct = useMemo(() => selected ?? items[0] ?? null, [selected, items]);

  const widgets = summary
    ? [
        { label: "Revenue (This Month)", value: formatCompactINR(summary.revenue.thisMonth), icon: Wallet, tone: "bg-success/10 text-success" },
        { label: "Active Orders", value: String((summary.orders.byStatus.pending ?? 0) + (summary.orders.byStatus.processing ?? 0)), icon: ShoppingCart, tone: "bg-secondary/10 text-secondary" },
        { label: "In Production", value: String(summary.production.inProgress), icon: Boxes, tone: "bg-primary/10 text-primary" },
        { label: "Priority — Near Deadline", value: String(summary.orders.nearDeadline), icon: AlertTriangle, tone: "bg-destructive/10 text-destructive" },
        { label: "Low / Out of Stock", value: String(summary.inventory.lowStockCount), icon: PackageCheck, tone: "bg-warning/15 text-warning" },
        { label: "Active Dealers", value: String(summary.dealers.byStatus.active ?? 0), icon: Store, tone: "bg-secondary/10 text-secondary" },
        { label: "Payments Collected", value: formatCompactINR(summary.revenue.allTime), icon: Gauge, tone: "bg-success/10 text-success" },
        { label: "Unread Notifications", value: String(summary.unreadAdminNotifications), icon: Bell, tone: "bg-primary/10 text-primary" },
        { label: "Open Quotations", value: String(summary.quotations.pendingReview), icon: FileText, tone: "bg-accent/20 text-edu-gray" },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Dashboard" description="Browse and manage the full EduNest product catalog." />

      {summaryLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {widgets.map(({ label, value, icon, tone }) => (
            <StatCard key={label} label={label} value={value} icon={icon} iconColorClass={tone} />
          ))}
        </div>
      )}

      <Card className="mb-6 p-5">
        <p className="mb-4 font-display text-base font-semibold">Recent Orders</p>
        <div className="space-y-3">
          {(summary?.recentOrders ?? []).slice(0, 6).map((o) => (
            <div key={o.id} className="flex items-start justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                Order <span className="font-medium text-foreground">{o.orderNumber}</span> — {o.status}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatCurrency(Number(o.totalAmount))}</span>
            </div>
          ))}
          {summary && summary.recentOrders.length === 0 && (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_360px]">
        {/* Category & filters */}
        <Card className="h-fit p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Category</p>
          <div className="space-y-1">
            {["All", ...categoryNames].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setPage(1);
                }}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  activeCategory === cat
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <p className="mb-3 mt-6 text-sm font-semibold text-foreground">Filter by Price</p>
          <div className="space-y-2.5">
            {PRICE_BANDS.map((band) => (
              <label key={band.label} className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
                <Checkbox
                  checked={priceBand === band.label}
                  onCheckedChange={() => {
                    setPriceBand((prev) => (prev === band.label ? null : band.label));
                    setPage(1);
                  }}
                />
                {band.label}
              </label>
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-6 w-full"
            size="sm"
            onClick={() => {
              setActiveCategory("All");
              setPriceBand(null);
              setPage(1);
            }}
          >
            Reset
          </Button>
        </Card>

        {/* Product grid */}
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 font-display text-lg font-semibold">Product Catalog</p>
              <p className="text-sm text-muted-foreground">Live view of everything currently sellable on EduNest.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link to={paths.admin.products}>
                <SlidersHorizontal className="h-3.5 w-3.5" /> Manage Products
              </Link>
            </Button>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-2xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No products match the selected filters.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelected(p);
                    setActiveImage(0);
                  }}
                  className={cn(
                    "flex flex-col items-start rounded-2xl border p-3 text-left transition-all hover:shadow-card",
                    activeProduct?.id === p.id ? "border-primary ring-1 ring-primary" : "border-border"
                  )}
                >
                  <img src={p.images[0]} alt={p.name} className="mb-3 h-28 w-full rounded-xl object-cover" />
                  <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.category}</p>
                  <div className="mt-2 flex w-full items-center justify-between">
                    <span className="font-semibold text-primary">{formatCurrency(p.price)}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/30 text-primary">
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>

        {/* Product detail panel */}
        <Card className="h-fit p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">Product Details</p>
          {!activeProduct ? (
            <p className="text-sm text-muted-foreground">Select a product to preview it here.</p>
          ) : (
            <>
              <img
                src={activeProduct.images[activeImage]}
                alt={activeProduct.name}
                className="mb-3 h-56 w-full rounded-2xl object-cover"
              />
              <div className="mb-4 flex gap-2">
                {activeProduct.images.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      "h-14 w-14 overflow-hidden rounded-xl border-2",
                      idx === activeImage ? "border-primary" : "border-border"
                    )}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>

              <p className="font-display text-base font-semibold">{activeProduct.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{activeProduct.description.split(".")[0]}.</p>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xl font-semibold text-primary">{formatCurrency(activeProduct.price)}</span>
                <span className="text-xs font-medium text-success">
                  {activeProduct.stockStatus === "in-stock" ? "In Stock" : activeProduct.stockStatus === "low-stock" ? "Low Stock" : "Out of Stock"}
                </span>
              </div>

              <div className="mt-5">
                <Button className="w-full gap-2" asChild>
                  <Link to={`${paths.admin.products}?edit=${activeProduct.id}`}>
                    <Pencil className="h-4 w-4" /> Edit Product
                  </Link>
                </Button>
              </div>

              <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <DetailRow label="SKU" value={activeProduct.sku} />
                <DetailRow label="Brand" value={activeProduct.brand} />
                <DetailRow label="Category" value={activeProduct.category} />
                <DetailRow label="Min. Order Qty" value={`${activeProduct.minOrderQty} ${activeProduct.unit}`} />
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
