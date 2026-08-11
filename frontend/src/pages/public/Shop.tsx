import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, PackageSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductCard } from "@/components/cards/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { listProducts, listCategoryNames, getCategorySlugMap } from "@/services/productService";

const PRICE_BANDS = [
  { label: "Under ₹100", min: undefined as number | undefined, max: 100 },
  { label: "₹100 - ₹500", min: 100, max: 500 },
  { label: "₹500 - ₹1000", min: 500, max: 1000 },
  { label: "Above ₹1000", min: 1000, max: undefined as number | undefined },
];

const PAGE_SIZE = 8;

export default function Shop() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "All";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [priceBand, setPriceBand] = useState<string | null>(null);
  const [page, setPage] = useState(1);

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

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", { activeCategory, priceBand, page }],
    queryFn: () =>
      listProducts({
        page,
        limit: PAGE_SIZE,
        categorySlug: activeCategory === "All" ? undefined : categorySlugMap[activeCategory],
        minPrice: selectedBand?.min,
        maxPrice: selectedBand?.max,
      }),
    placeholderData: (prev) => prev,
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? items.length;

  function resetFilters() {
    setActiveCategory("All");
    setPriceBand(null);
    setPage(1);
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
            {["All", ...categoryNames].map((cat) => (
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

          <Button variant="outline" size="sm" className="mt-6 w-full" onClick={resetFilters}>
            Reset Filters
          </Button>
        </Card>

        <div>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{total} products found</p>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Sort by
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              icon={PackageSearch}
              title="Couldn't load products"
              description="Something went wrong reaching the catalog. Please try again."
              actionLabel="Retry"
              onAction={resetFilters}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products match your filters"
              description="Try adjusting your category or price filters to see more results."
              actionLabel="Reset Filters"
              onAction={resetFilters}
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((p) => (
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

