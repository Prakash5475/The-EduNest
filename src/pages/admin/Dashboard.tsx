import { useMemo, useState } from "react";
import { ShoppingCart, Heart, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/usePagination";
import { products, categories } from "@/data/products";
import { cn, formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

const PRICE_BANDS = [
  { label: "₹0 - ₹250", test: (p: number) => p <= 250 },
  { label: "₹250 - ₹500", test: (p: number) => p > 250 && p <= 500 },
  { label: "₹500 - ₹1000", test: (p: number) => p > 500 && p <= 1000 },
  { label: "₹1000 - ₹2000", test: (p: number) => p > 1000 && p <= 2000 },
  { label: "Above ₹2000", test: (p: number) => p > 2000 },
];

const TABS = ["New Arrival", "Trending", "Popular", "Recommend"] as const;

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("New Arrival");
  const [priceBands, setPriceBands] = useState<string[]>([]);
  const [selected, setSelected] = useState<Product>(products[2]);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesTag = p.tag === activeTab;
      const matchesPrice =
        priceBands.length === 0 ||
        priceBands.some((label) => PRICE_BANDS.find((b) => b.label === label)?.test(p.price));
      return matchesCategory && matchesTag && matchesPrice;
    });
  }, [activeCategory, activeTab, priceBands]);

  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 6);

  function togglePriceBand(label: string) {
    setPriceBands((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  }

  function openProduct(p: Product) {
    setSelected(p);
    setActiveImage(0);
    setQty(1);
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Browse and manage the full EduNest product catalog." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_360px]">
        {/* Category & filters */}
        <Card className="h-fit p-5">
          <p className="mb-3 text-sm font-semibold text-foreground">Category</p>
          <div className="space-y-1">
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
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
                <Checkbox checked={priceBands.includes(band.label)} onCheckedChange={() => togglePriceBand(band.label)} />
                {band.label}
              </label>
            ))}
          </div>

          <Button className="mt-6 w-full" size="sm" onClick={() => setPage(1)}>
            Apply
          </Button>
          <Button
            variant="outline"
            className="mt-2 w-full"
            size="sm"
            onClick={() => {
              setActiveCategory("All");
              setPriceBands([]);
            }}
          >
            Reset
          </Button>
        </Card>

        {/* Product grid */}
        <div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                {TABS.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button variant="outline" size="sm" className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Sort by
              </Button>
            </div>

            <TabsContent value={activeTab}>
              <p className="mb-1 font-display text-lg font-semibold">{activeTab}</p>
              <p className="mb-5 text-sm text-muted-foreground">Latest school essentials added to the store!</p>

              {pageItems.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                  No products match the selected filters.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {pageItems.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => openProduct(p)}
                      className={cn(
                        "flex flex-col items-start rounded-2xl border p-3 text-left transition-all hover:shadow-card",
                        selected.id === p.id ? "border-primary ring-1 ring-primary" : "border-border"
                      )}
                    >
                      <img src={p.images[0]} alt={p.name} className="mb-3 h-28 w-full rounded-xl object-cover" />
                      <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.subCategory}</p>
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Product detail panel */}
        <Card className="h-fit p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">Product Details</p>
          <img
            src={selected.images[activeImage]}
            alt={selected.name}
            className="mb-3 h-56 w-full rounded-2xl object-cover"
          />
          <div className="mb-4 flex gap-2">
            {selected.images.map((img, idx) => (
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

          <p className="font-display text-base font-semibold">{selected.name}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{selected.description.split(".")[0]}.</p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xl font-semibold text-primary">{formatCurrency(selected.price)}</span>
            <span className="text-xs font-medium text-success">
              {selected.stockStatus === "in-stock" ? "In Stock" : selected.stockStatus === "low-stock" ? "Low Stock" : "Out of Stock"}
            </span>
          </div>

          {selected.colors && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Color:</p>
              <div className="flex gap-2">
                {selected.colors.map((c) => (
                  <span key={c} className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Quantity:</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <Button className="flex-1 gap-2">
              <ShoppingCart className="h-4 w-4" /> Add to Cart
            </Button>
            <Button variant="outline" size="icon" aria-label="Add to wishlist">
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
            <DetailRow label="SKU" value={selected.sku} />
            <DetailRow label="Brand" value={selected.brand} />
            <DetailRow label="Category" value={selected.category} />
            <DetailRow label="Min. Order Qty" value={`${selected.minOrderQty} ${selected.unit}`} />
          </div>
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
