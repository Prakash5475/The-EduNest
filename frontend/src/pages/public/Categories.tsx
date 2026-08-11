import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, PackageSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { paths } from "@/routes/paths";
import { listTopCategoriesWithCounts } from "@/services/productService";

export default function Categories() {
  const { data: categories = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["categories", "withCounts"],
    queryFn: listTopCategoriesWithCounts,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="container py-10">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Browse</p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Shop by Category</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Every essential your school needs, organized for fast bulk ordering.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={PackageSearch}
          title="Couldn't load categories"
          description="Something went wrong reaching the catalog. Please try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link key={cat.slug} to={`${paths.shop}?category=${encodeURIComponent(cat.name)}`}>
              <Card className="group overflow-hidden transition-shadow hover:shadow-elevated">
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={`https://picsum.photos/seed/cat-${cat.slug}/500/400`}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-4 font-display text-lg font-semibold text-white">{cat.name}</p>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-muted-foreground">{cat.productCount} products</span>
                  <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

