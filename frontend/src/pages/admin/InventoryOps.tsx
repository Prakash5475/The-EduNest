import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, Warehouse as WarehouseIcon, ClipboardList, Truck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import {
  listWarehouses,
  createWarehouse,
  setWarehouseActive,
  listQuantityChangeRequests,
  createQuantityChangeRequest,
  approveQuantityChangeRequest,
  rejectQuantityChangeRequest,
  listEwayBills,
  markEwayBillGenerated,
} from "@/services/adminInventoryOpsService";
import { listProducts } from "@/services/productService";

const QCR_STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

const EWAY_STATUS_VARIANT: Record<string, "secondary" | "success" | "destructive"> = {
  draft: "secondary",
  generated: "success",
  cancelled: "destructive",
  expired: "destructive",
};

function WarehousesTab() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", city: "", state: "", pincode: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin-warehouses"], queryFn: () => listWarehouses() });

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-warehouses"] });
      toast.success("Warehouse created");
      setAddOpen(false);
      setForm({ name: "", location: "", city: "", state: "", pincode: "" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create warehouse"),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setWarehouseActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-warehouses"] });
      toast.success("Warehouse updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update warehouse"),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Warehouse
        </Button>
      </div>
      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (data?.items ?? []).length === 0 ? (
        <Card className="flex h-32 items-center justify-center text-sm text-muted-foreground">No warehouses yet.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(data?.items ?? []).map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex items-start justify-between">
                <p className="font-semibold">{w.name}</p>
                <Badge variant={w.isActive ? "success" : "secondary"}>{w.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{[w.location, w.city, w.state, w.pincode].filter(Boolean).join(", ") || "No location set"}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                disabled={activeMutation.isPending}
                onClick={() => activeMutation.mutate({ id: w.id, isActive: !w.isActive })}
              >
                {w.isActive ? "Deactivate" : "Activate"}
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Warehouse</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }}>
            <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
              <div><Label>State</Label><Input value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></div>
              <div><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuantityChangeRequestsTab() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestForm, setRequestForm] = useState({ productId: "", warehouseId: "", requestedQuantity: "", reason: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin-qcr"], queryFn: () => listQuantityChangeRequests() });
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-inventory-products"],
    queryFn: () => listProducts({ page: 1, limit: 100 }),
  });
  const { data: warehousesData, isLoading: warehousesLoading } = useQuery({
    queryKey: ["admin-inventory-warehouses"],
    queryFn: () => listWarehouses({ isActive: true, page: 1 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createQuantityChangeRequest({
        productId: requestForm.productId,
        warehouseId: requestForm.warehouseId,
        requestedQuantity: Number(requestForm.requestedQuantity),
        reason: requestForm.reason.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-qcr"] });
      toast.success("Stock request submitted for approval");
      setRequestForm({ productId: "", warehouseId: "", requestedQuantity: "", reason: "" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to submit stock request"),
  });

  const approveMutation = useMutation({
    mutationFn: approveQuantityChangeRequest,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-qcr"] }); toast.success("Approved — stock updated"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectQuantityChangeRequest(id, reason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-qcr"] }); toast.success("Rejected"); setRejectingId(null); setRejectionReason(""); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reject"),
  });

  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">
        Stock quantity is only ever changed here, after approval — there is no endpoint that edits inventory quantity directly.
      </p>
      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Add initial stock</p>
            <p className="text-xs text-muted-foreground">Submit a quantity request for an active product and warehouse.</p>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="stock-product">Product</Label>
            <select
              id="stock-product"
              required
              value={requestForm.productId}
              onChange={(event) => setRequestForm((form) => ({ ...form, productId: event.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={productsLoading}
            >
              <option value="">Select product</option>
              {(productsData?.items ?? []).map((product) => (
                <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock-warehouse">Warehouse</Label>
            <select
              id="stock-warehouse"
              required
              value={requestForm.warehouseId}
              onChange={(event) => setRequestForm((form) => ({ ...form, warehouseId: event.target.value }))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={warehousesLoading}
            >
              <option value="">Select warehouse</option>
              {(warehousesData?.items ?? []).map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock-quantity">Requested quantity</Label>
            <Input
              id="stock-quantity"
              type="number"
              min="0"
              required
              value={requestForm.requestedQuantity}
              onChange={(event) => setRequestForm((form) => ({ ...form, requestedQuantity: event.target.value }))}
              placeholder="100"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock-reason">Reason</Label>
            <Input
              id="stock-reason"
              required
              value={requestForm.reason}
              onChange={(event) => setRequestForm((form) => ({ ...form, reason: event.target.value }))}
              placeholder="Initial stock receipt"
            />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={createMutation.isPending || productsLoading || warehousesLoading}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Stock Request"}
            </Button>
          </div>
        </form>
      </Card>
      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (data?.items ?? []).length === 0 ? (
        <Card className="flex h-32 items-center justify-center text-sm text-muted-foreground">No quantity-change requests.</Card>
      ) : (
        <div className="space-y-3">
          {(data?.items ?? []).map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{r.inventory.product.name} <span className="text-xs text-muted-foreground">({r.inventory.product.sku})</span></p>
                  {r.inventory.warehouse && <p className="text-xs text-muted-foreground">Warehouse: {r.inventory.warehouse.name}</p>}
                  <p className="mt-1 text-sm">
                    <span className="text-muted-foreground">Current:</span> {r.currentQuantity} → <span className="font-semibold">{r.requestedQuantity}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Requested by {r.requester.name} on {formatDate(r.requestedAt)}</p>
                  {r.status === "rejected" && r.rejectionReason && <p className="mt-1 text-xs text-destructive">Rejected: {r.rejectionReason}</p>}
                </div>
                <Badge variant={QCR_STATUS_VARIANT[r.status]}>{r.status}</Badge>
              </div>
              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate(r.id)}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectingId(r.id)}>Reject</Button>
                </div>
              )}
              {rejectingId === r.id && (
                <div className="mt-3 space-y-2 rounded-lg border border-border p-3">
                  <Input placeholder="Rejection reason" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" disabled={!rejectionReason.trim() || rejectMutation.isPending} onClick={() => rejectMutation.mutate({ id: r.id, reason: rejectionReason })}>
                      Confirm Reject
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EwayBillsTab() {
  const queryClient = useQueryClient();
  const [genId, setGenId] = useState<string | null>(null);
  const [genForm, setGenForm] = useState({ ewayBillNumber: "", validFrom: "", validUntil: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin-eway-bills"], queryFn: () => listEwayBills() });

  const markGeneratedMutation = useMutation({
    mutationFn: () => markEwayBillGenerated(genId!, genForm.ewayBillNumber, genForm.validFrom, genForm.validUntil),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-eway-bills"] });
      toast.success("E-way bill number recorded");
      setGenId(null);
      setGenForm({ ewayBillNumber: "", validFrom: "", validUntil: "" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to record e-way bill"),
  });

  return (
    <div>
      <p className="mb-4 text-xs text-muted-foreground">
        Record-keeping only — there is no government e-way bill portal integration. Generate the bill on the government portal yourself, then record the number here.
      </p>
      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (data?.items ?? []).length === 0 ? (
        <Card className="flex h-32 items-center justify-center text-sm text-muted-foreground">No e-way bill records yet. Create one from an order's detail view.</Card>
      ) : (
        <div className="space-y-3">
          {(data?.items ?? []).map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{b.order?.orderNumber ?? b.orderId}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.ewayBillNumber ? `E-way Bill #${b.ewayBillNumber}` : "No number recorded yet"} · {b.transportMode}
                    {b.vehicleNumber ? ` · ${b.vehicleNumber}` : ""}
                  </p>
                  {b.validUntil && <p className="text-xs text-muted-foreground">Valid until {formatDate(b.validUntil)}</p>}
                </div>
                <Badge variant={EWAY_STATUS_VARIANT[b.status]}>{b.status}</Badge>
              </div>
              {b.status === "draft" && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => setGenId(b.id)}>Record Generated Number</Button>
                </div>
              )}
              {genId === b.id && (
                <div className="mt-3 space-y-2 rounded-lg border border-border p-3">
                  <Input placeholder="E-way bill number (from government portal)" value={genForm.ewayBillNumber} onChange={(e) => setGenForm((f) => ({ ...f, ewayBillNumber: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="datetime-local" value={genForm.validFrom} onChange={(e) => setGenForm((f) => ({ ...f, validFrom: e.target.value }))} />
                    <Input type="datetime-local" value={genForm.validUntil} onChange={(e) => setGenForm((f) => ({ ...f, validUntil: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={!genForm.ewayBillNumber || !genForm.validFrom || !genForm.validUntil || markGeneratedMutation.isPending} onClick={() => markGeneratedMutation.mutate()}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setGenId(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InventoryOps() {
  return (
    <div>
      <PageHeader title="Inventory Operations" description="Warehouses, quantity-change approvals, and e-way bill records." />
      <Tabs defaultValue="warehouses">
        <TabsList>
          <TabsTrigger value="warehouses" className="gap-1.5"><WarehouseIcon className="h-3.5 w-3.5" /> Warehouses</TabsTrigger>
          <TabsTrigger value="qcr" className="gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Quantity Change Requests</TabsTrigger>
          <TabsTrigger value="eway" className="gap-1.5"><Truck className="h-3.5 w-3.5" /> E-way Bills</TabsTrigger>
        </TabsList>
        <TabsContent value="warehouses" className="mt-4"><WarehousesTab /></TabsContent>
        <TabsContent value="qcr" className="mt-4"><QuantityChangeRequestsTab /></TabsContent>
        <TabsContent value="eway" className="mt-4"><EwayBillsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
