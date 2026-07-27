import { useMemo, useState } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePagination } from "@/hooks/usePagination";
import { products, categories } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

type FilterTab = "All Products" | "Active" | "Inactive";

export default function Products() {
  const [tab, setTab] = useState<FilterTab>("All Products");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [selected, setSelected] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (tab === "Active") list = list.filter((p) => p.status === "active");
    if (tab === "Inactive") list = list.filter((p) => p.status === "inactive");
    if (categoryFilter !== "All Categories") list = list.filter((p) => p.category === categoryFilter);
    return list;
  }, [tab, categoryFilter]);

  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 8);

  return (
    <div>
      <PageHeader
        title="Products"
        description="View and manage all products in your inventory."
        actions={
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-5">
          <p className="mb-3 text-sm font-semibold">Filter Products</p>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</p>
          <div className="space-y-1">
            {["All Categories", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  categoryFilter === cat ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Card>

        <div>
          <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
            <TabsList className="mb-5">
              {(["All Products", "Active", "Inactive"] as FilterTab[]).map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <img src={product.images[0]} alt={product.name} className="h-32 w-full object-cover" />
                <div className="p-3.5">
                  <p className="line-clamp-1 text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-semibold text-primary">{formatCurrency(product.price)}</span>
                    <button
                      onClick={() => setSelected(product)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                      aria-label={`View ${product.name} details`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={product.stockStatus} />
                    <span className="text-[11px] text-muted-foreground">SKU: {product.sku}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selected && (
            <>
              <img src={selected.images[0]} alt={selected.name} className="mb-4 h-48 w-full rounded-2xl object-cover" />
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">{selected.category}</p>
              </SheetHeader>

              <div className="flex items-center justify-between border-t border-border py-4">
                <span className="text-xl font-semibold text-primary">{formatCurrency(selected.price)}</span>
                <StatusBadge status={selected.stockStatus} />
              </div>

              <div className="space-y-2.5 border-t border-border py-4 text-sm">
                <Row label="SKU" value={selected.sku} />
                <Row label="Brand" value={selected.brand} />
                <Row label="Sub Category" value={selected.subCategory} />
                <Row label="HSN Code" value={selected.hsnCode} />
                <Row label="Unit" value={selected.unit} />
                <Row label="Minimum Order Qty" value={String(selected.minOrderQty)} />
                <Row label="Stock Quantity" value={String(selected.stockQuantity)} />
              </div>

              <div className="border-t border-border py-4">
                <p className="mb-2 text-sm font-semibold">Description</p>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>

              <div className="mt-auto flex gap-3 border-t border-border pt-5">
                <Button className="flex-1">Edit Product</Button>
                <Button variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5">
                  Delete Product
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
