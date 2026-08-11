import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, MoreVertical, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploadField } from "@/components/common/ImageUploadField";
import type { UploadedFileResult } from "@/services/uploadService";
import {
  listProducts,
  listCategoriesForForm,
  listBrandsForForm,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "@/services/productService";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

type FilterTab = "all" | "active" | "inactive";

interface ProductFormValues {
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  brandId: string;
  basePrice: number;
  minOrderQty: number;
  status: "draft" | "active" | "inactive" | "discontinued";
  description: string;
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function Products() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FilterTab>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedFileResult[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "form"],
    queryFn: listCategoriesForForm,
    staleTime: 5 * 60 * 1000,
  });
  const { data: brands = [] } = useQuery({
    queryKey: ["brands", "form"],
    queryFn: listBrandsForForm,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", tab, categoryFilter, page],
    queryFn: () =>
      listProducts({
        page,
        limit: 8,
        categorySlug: categoryFilter,
        isFeatured: undefined,
      }).then((res) => ({
        ...res,
        items: tab === "all" ? res.items : res.items.filter((p) => p.status === tab),
      })),
    placeholderData: (prev) => prev,
  });

  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const { register, handleSubmit, reset, setValue, watch } = useForm<ProductFormValues>({
    defaultValues: { status: "draft", minOrderQty: 1 },
  });
  const nameValue = watch("name");

  useEffect(() => {
    if (!editingId && nameValue) {
      setValue("slug", slugify(nameValue));
    }
  }, [nameValue, editingId, setValue]);

  function openCreateForm() {
    setEditingId(null);
    setImages([]);
    reset({ status: "draft", minOrderQty: 1, sku: "", name: "", slug: "", categoryId: "", brandId: "", basePrice: 0, description: "" });
    setFormOpen(true);
  }

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      createAdminProduct({
        ...values,
        brandId: values.brandId || undefined,
        images: images.map((img, idx) => ({ fileId: img.id, isPrimary: idx === 0, displayOrder: idx })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product created");
      setFormOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't create product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ProductFormValues> }) =>
      updateAdminProduct(id, {
        ...values,
        brandId: values.brandId || undefined,
        ...(images.length > 0 ? { images: images.map((img, idx) => ({ fileId: img.id, isPrimary: idx === 0, displayOrder: idx })) } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product updated");
      setFormOpen(false);
      setSelected(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
      setDeleteTarget(null);
      setSelected(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't delete product"),
  });

  function onSubmit(values: ProductFormValues) {
    if (editingId) {
      updateMutation.mutate({ id: editingId, values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description="View and manage all products in your inventory."
        actions={
          <Button className="gap-2" onClick={openCreateForm}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="h-fit p-5">
          <p className="mb-3 text-sm font-semibold">Filter Products</p>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Category</p>
          <div className="space-y-1">
            <button
              onClick={() => {
                setCategoryFilter(undefined);
                setPage(1);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                !categoryFilter ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(cat.slug);
                  setPage(1);
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                  categoryFilter === cat.slug ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </Card>

        <div>
          <Tabs value={tab} onValueChange={(v) => { setTab(v as FilterTab); setPage(1); }}>
            <TabsList className="mb-5">
              <TabsTrigger value="all">All Products</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Plus} title="No products found" description="Try adjusting your filters or add a new product." actionLabel="Add Product" onAction={openCreateForm} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((product) => (
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
          )}

          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>

      {/* Detail sheet */}
      <Sheet open={!!selected && !formOpen} onOpenChange={(open) => !open && setSelected(null)}>
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
                <Row label="Category" value={selected.category} />
                <Row label="Minimum Order Qty" value={String(selected.minOrderQty)} />
                <Row label="Stock Quantity" value={String(selected.stockQuantity)} />
              </div>

              <div className="border-t border-border py-4">
                <p className="mb-2 text-sm font-semibold">Description</p>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>

              <div className="mt-auto flex gap-3 border-t border-border pt-5">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setEditingId(selected.id);
                    setImages([]);
                    reset({
                      sku: selected.sku,
                      name: selected.name,
                      slug: slugify(selected.name),
                      categoryId: categories.find((c) => c.name === selected.category)?.id ?? "",
                      brandId: brands.find((b) => b.name === selected.brand)?.id ?? "",
                      basePrice: selected.price,
                      minOrderQty: selected.minOrderQty,
                      status: selected.status === "active" ? "active" : "inactive",
                      description: selected.description,
                    });
                    setFormOpen(true);
                  }}
                >
                  Edit Product
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5"
                  onClick={() => setDeleteTarget(selected)}
                >
                  Delete Product
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit form */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit Product" : "Add Product"}</SheetTitle>
          </SheetHeader>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Product Name</Label>
                <Input {...register("name", { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>SKU</Label>
                <Input {...register("sku", { required: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input {...register("slug", { required: true })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={watch("categoryId")} onValueChange={(v) => setValue("categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Select value={watch("brandId")} onValueChange={(v) => setValue("brandId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select brand (optional)" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Base Price (₹)</Label>
                <Input type="number" step="0.01" {...register("basePrice", { required: true, valueAsNumber: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Min. Order Qty</Label>
                <Input type="number" {...register("minOrderQty", { required: true, valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ProductFormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                {...register("description")}
                rows={3}
                className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Product Images</Label>
              <ImageUploadField images={images} onChange={setImages} />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Product"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{deleteTarget?.name}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove the product from the catalog. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

