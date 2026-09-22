import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Mail, Phone, MapPin, MoreVertical, Star, Loader2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listAdminDealers, createAdminDealer, updateAdminDealer, updateAdminDealerStatus, type CreateAdminDealerInput } from "@/services/adminDealerService";
import { cn, formatCurrency } from "@/lib/utils";
import type { Dealer } from "@/types";

type FilterTab = "All Dealers" | "Active" | "Inactive";

const LOGO_COLORS = ["bg-secondary/10 text-secondary", "bg-success/10 text-success", "bg-primary/10 text-primary"];

export default function Dealers() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FilterTab>("All Dealers");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Dealer | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);

  const [formData, setFormData] = useState<CreateAdminDealerInput>({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "distributor",
    gstin: "",
    panNumber: "",
    creditLimit: 100000,
    status: "active",
  });

  const statusParam = tab === "Active" ? "active" : tab === "Inactive" ? "inactive" : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dealers", statusParam, page],
    queryFn: () => listAdminDealers({ status: statusParam, page }),
  });

  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const createMutation = useMutation({
    mutationFn: createAdminDealer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dealers"] });
      toast.success("Dealer created successfully");
      setAddModalOpen(false);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        businessName: "",
        businessType: "distributor",
        gstin: "",
        panNumber: "",
        creditLimit: 100000,
        status: "active",
      });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create dealer");
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateAdminDealerInput> }) => updateAdminDealer(id, input),
    onSuccess: (dealer) => {
      queryClient.invalidateQueries({ queryKey: ["admin-dealers"] });
      setSelected(dealer);
      setEditingDealer(null);
      toast.success("Dealer updated successfully");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update dealer"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => updateAdminDealerStatus(id, status),
    onSuccess: (dealer) => {
      queryClient.invalidateQueries({ queryKey: ["admin-dealers"] });
      setSelected(dealer);
      toast.success(`Dealer marked ${dealer.status}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update status"),
  });

  return (
    <div>
      <PageHeader
        title="Dealers"
        description="View and manage all registered dealers."
        actions={
          <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Dealer
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v as FilterTab); setPage(1); }}>
        <TabsList className="mb-5">
          {(["All Dealers", "Active", "Inactive"] as FilterTab[]).map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-medium">No dealers found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your status filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((dealer, idx) => (
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
      )}

      <div className="mt-6">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Add Dealer Dialog */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Dealer</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>Business Name *</Label>
              <Input
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Apex Uniform Supplies"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact Person *</Label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Manager / Owner"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="dealer@company.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
                <p className="text-xs text-muted-foreground">Used as the dealer's initial login password.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Business Type</Label>
                <Select
                  value={formData.businessType}
                  onValueChange={(val) => setFormData({ ...formData, businessType: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                  placeholder="GST Number"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Credit Limit (₹)</Label>
                <Input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Dealer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDealer} onOpenChange={(open) => !open && setEditingDealer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Dealer</DialogTitle></DialogHeader>
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (editingDealer) editMutation.mutate({ id: editingDealer.id, input: formData });
            }}
          >
            <div className="space-y-1.5"><Label>Business Name *</Label><Input required value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Contact Person *</Label><Input required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email *</Label><Input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Phone *</Label><Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Business Type</Label><Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="distributor">Distributor</SelectItem><SelectItem value="manufacturer">Manufacturer</SelectItem><SelectItem value="wholesaler">Wholesaler</SelectItem><SelectItem value="retailer">Retailer</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>GSTIN</Label><Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Credit Limit (₹)</Label><Input type="number" value={formData.creditLimit} onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setEditingDealer(null)}>Cancel</Button><Button type="submit" disabled={editMutation.isPending}>{editMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Details Sheet */}
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

              <div className="border-t border-border pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="gap-2" onClick={() => {
                    setFormData({ fullName: selected.name, email: selected.email === "N/A" ? "" : selected.email, phone: selected.phone === "N/A" ? "" : selected.phone, businessName: selected.name, businessType: selected.type.toLowerCase(), gstin: selected.gstNumber === "N/A" ? "" : selected.gstNumber, creditLimit: selected.creditLimit });
                    setEditingDealer(selected);
                  }}><Pencil className="h-4 w-4" /> Edit</Button>
                  <Button variant={selected.status === "active" ? "destructive" : "default"} disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: selected.id, status: selected.status === "active" ? "inactive" : "active" })}>
                    {selected.status === "active" ? "Set Inactive" : "Set Active"}
                  </Button>
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
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
