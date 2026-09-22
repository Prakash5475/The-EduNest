import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  listAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  type AdminCategory,
  type AdminBrand,
} from "@/services/adminCatalogService";

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface FormValues {
  name: string;
}

interface CatalogManagerDialogProps {
  kind: "category" | "brand";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Minimal CRUD for Categories/Brands — exists purely so Admin Products has real dropdown data to pick from. */
export function CatalogManagerDialog({ kind, open, onOpenChange }: CatalogManagerDialogProps) {
  const queryClient = useQueryClient();
  const isCategory = kind === "category";
  const label = isCategory ? "Category" : "Brand";

  const { data: items = [], isLoading } = useQuery({
    queryKey: [isCategory ? "categories" : "brands", "manage"],
    queryFn: () => (isCategory ? listAdminCategories() : listAdminBrands()),
    enabled: open,
  });

  const { register, handleSubmit, reset } = useForm<FormValues>({ defaultValues: { name: "" } });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["brands"] });
  }

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      isCategory ? createCategory({ name, slug: slugify(name) }) : createBrand({ name, slug: slugify(name) }),
    onSuccess: () => {
      invalidate();
      toast.success(`${label} created`);
      reset({ name: "" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : `Couldn't create ${label.toLowerCase()}`),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isCategory ? updateCategory(id, { isActive }) : updateBrand(id, { isActive }),
    onSuccess: invalidate,
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => (isCategory ? deleteCategory(id) : deleteBrand(id)),
    onSuccess: () => {
      invalidate();
      toast.success(`${label} deleted`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : `Couldn't delete ${label.toLowerCase()}`),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage {label}s</DialogTitle>
        </DialogHeader>

        <form
          className="flex items-end gap-2"
          onSubmit={handleSubmit((v) => v.name.trim() && createMutation.mutate(v.name.trim()))}
        >
          <div className="flex-1 space-y-1.5">
            <Label>New {label} Name</Label>
            <Input {...register("name", { required: true })} placeholder={`e.g. ${isCategory ? "Uniforms" : "EduWear"}`} />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add
          </Button>
        </form>

        <div className="mt-2 space-y-1 border-t border-border pt-3">
          {isLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No {label.toLowerCase()}s yet. Add one above.
            </p>
          ) : (
            (items as (AdminCategory | AdminBrand)[]).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-muted">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={item.isActive}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: item.id, isActive: checked })}
                  />
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
