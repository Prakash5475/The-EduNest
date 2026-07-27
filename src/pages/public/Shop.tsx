import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, PackageSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductCard } from "@/components/cards/ProductCard";
import { usePagination } from "@/hooks/usePagination";
import { products, categories } from "@/data/products";

const PRICE_BANDS = [
  { label: "Under ₹100", test: (p: number) => p < 100 },
  { label: "₹100 - ₹500", test: (p: number) => p >= 100 && p <= 500 },
  { label: "₹500 - ₹1000", test: (p: number) => p > 500 && p <= 1000 },
  { label: "Above ₹1000", test: (p: number) => p > 1000 },
];

export default function Shop() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "All";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [priceBands, setPriceBands] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      const matchesPrice =
        priceBands.length === 0 ||
        priceBands.some((label) => PRICE_BANDS.find((b) => b.label === label)?.test(p.price));
      return matchesCategory && matchesPrice;
    });
  }, [activeCategory, priceBands]);

  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 8);

  function togglePriceBand(label: string) {
    setPriceBands((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Shop</p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
          Everything your school needs, in one place
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Books, stationery, uniforms, bags, sports goods, and more — sourced from trusted brands
          and priced for bulk school procurement.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit p-5 lg:sticky lg:top-24">
          <p className="mb-3 text-sm font-semibold">Category</p>
          <div className="space-y-1">
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setPage(1);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeCategory === cat
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <p className="mb-3 mt-6 text-sm font-semibold">Price</p>
          <div className="space-y-2.5">
            {PRICE_BANDS.map((band) => (
              <label key={band.label} className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
                <Checkbox checked={priceBands.includes(band.label)} onCheckedChange={() => togglePriceBand(band.label)} />
                {band.label}
              </label>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-6 w-full"
            onClick={() => {
              setActiveCategory("All");
              setPriceBands([]);
            }}
          >
            Reset Filters
          </Button>
        </Card>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filtered.length} products found</p>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Sort by
            </Button>
          </div>

          {pageItems.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products match your filters"
              description="Try adjusting your category or price filters to see more results."
              actionLabel="Reset Filters"
              onAction={() => {
                setActiveCategory("All");
                setPriceBands([]);
              }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </div>
  );
}
