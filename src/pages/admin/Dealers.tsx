import { useMemo, useState } from "react";
import { Plus, Mail, Phone, MapPin, MoreVertical, Star } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/usePagination";
import { dealers } from "@/data/dealers";
import { cn, formatCurrency } from "@/lib/utils";
import type { Dealer } from "@/types";

type FilterTab = "All Dealers" | "Active" | "Inactive";

const LOGO_COLORS = ["bg-secondary/10 text-secondary", "bg-success/10 text-success", "bg-primary/10 text-primary"];

export default function Dealers() {
  const [tab, setTab] = useState<FilterTab>("All Dealers");
  const [selected, setSelected] = useState<Dealer | null>(null);

  const filtered = useMemo(() => {
    if (tab === "Active") return dealers.filter((d) => d.status === "active");
    if (tab === "Inactive") return dealers.filter((d) => d.status === "inactive");
    return dealers;
  }, [tab]);

  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 6);

  return (
    <div>
      <PageHeader
        title="Dealers"
        description="View and manage all registered dealers."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Dealer
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList className="mb-5">
          {(["All Dealers", "Active", "Inactive"] as FilterTab[]).map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {pageItems.map((dealer, idx) => (
          <Card key={dealer.id} className="p-5">
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold",
                  LOGO_COLORS[idx % LOGO_COLORS.length]
                )}
              >
                {dealer.logo}
              </div>
              <button
                onClick={() => setSelected(dealer)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                aria-label={`View ${dealer.name} details`}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <p className="font-semibold">{dealer.name}</p>
              <StatusBadge status={dealer.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {dealer.city}, {dealer.state}
            </p>
            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {dealer.email}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {dealer.phone}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant="secondary">{dealer.type}</Badge>
              <span className="flex items-center gap-1 text-xs font-medium text-warning">
                <Star className="h-3.5 w-3.5 fill-current" /> {dealer.rating}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-base font-bold text-secondary">
                  {selected.logo}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <SheetTitle>{selected.name}</SheetTitle>
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selected.city}, {selected.state}
                  </p>
                </div>
              </div>
              <SheetHeader className="sr-only">
                <SheetTitle>{selected.name} details</SheetTitle>
              </SheetHeader>

              <div className="border-t border-border py-4">
                <p className="mb-3 text-sm font-semibold">Contact Information</p>
                <div className="space-y-2.5 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {selected.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {selected.phone}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {selected.address.line1}, {selected.city}, {selected.state} - {selected.address.pincode}
                  </p>
                </div>
              </div>

              <div className="border-t border-border py-4">
                <p className="mb-3 text-sm font-semibold">Business Information</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dealer Type</span>
                    <span className="font-medium">{selected.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST Number</span>
                    <span className="font-medium">{selected.gstNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Established Year</span>
                    <span className="font-medium">{selected.establishedYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Limit</span>
                    <span className="font-medium">{formatCurrency(selected.creditLimit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding Balance</span>
                    <span className="font-medium text-destructive">{formatCurrency(selected.outstandingBalance)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex gap-3 border-t border-border pt-5">
                <Button className="flex-1">Edit Dealer</Button>
                <Button variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5">
                  Delete Dealer
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
