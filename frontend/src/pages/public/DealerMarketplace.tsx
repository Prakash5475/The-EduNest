import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, MapPin, Store, ArrowRight, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { paths } from "@/routes/paths";
import { listDealers, type ApiDealerListing } from "@/services/dealerDirectoryService";
import { cn } from "@/lib/utils";

const TYPE_FILTERS: { label: string; value?: ApiDealerListing["businessType"] }[] = [
  { label: "All" },
  { label: "Manufacturer", value: "manufacturer" },
  { label: "Distributor", value: "distributor" },
  { label: "Wholesaler", value: "wholesaler" },
  { label: "Retailer", value: "retailer" },
];

export default function DealerMarketplace() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ApiDealerListing["businessType"] | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dealers", typeFilter],
    queryFn: () => listDealers(1, 60, typeFilter),
  });

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    if (search.trim() === "") return items;
    const q = search.toLowerCase();
    return items.filter((d) => {
      const address = d.dealerAddresses?.[0];
      return d.businessName.toLowerCase().includes(q) || address?.city.toLowerCase().includes(q);
    });
  }, [data, search]);

  return (
    <div className="container py-10">
      <div className="mb-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Store className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary">Dealer Marketplace</p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Our vetted dealer network</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Every dealer on EduNest is vetted for quality, pricing, and delivery reliability. Browse by
          specialty or request a quotation and we'll match you automatically.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by dealer name or city..."
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.label}
              onClick={() => setTypeFilter(t.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                typeFilter === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={Store}
          title="Couldn't load dealers"
          description="Something went wrong reaching the dealer directory. Please try again."
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No dealers match your search"
          description="Try a different search term or filter."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch("");
            setTypeFilter(undefined);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dealer) => {
            const address = dealer.dealerAddresses?.[0];
            return (
              <Card key={dealer.id} className="p-6">
                <div className="flex items-start justify-between">
                  {dealer.logoFile ? (
                    <img
                      src={dealer.logoFile.filePath}
                      alt={dealer.businessName}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 font-display text-sm font-semibold text-secondary">
                      {dealer.businessName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <Badge variant="outline" className="capitalize">{dealer.businessType}</Badge>
                </div>
                <p className="mt-4 font-display text-lg font-semibold">{dealer.businessName}</p>
                {address && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {address.city}, {address.state}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {Number(dealer.averageRating).toFixed(1)} rating
                </div>
                <Button variant="outline" size="sm" className="mt-5 w-full gap-1.5" asChild>
                  <Link to={paths.requestQuotation}>
                    Request Quote <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

