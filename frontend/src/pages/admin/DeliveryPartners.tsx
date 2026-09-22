import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, Phone, Mail, Truck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartnerStatus,
  updateDeliveryPartnerAvailability,
  type ApiDeliveryPartner,
  type CreateDeliveryPartnerInput,
} from "@/services/adminDeliveryPartnerService";

type FilterTab = "All" | "Active" | "Inactive";

const EMPTY_FORM: CreateDeliveryPartnerInput = {
  fullName: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  vehicleType: "",
  vehicleNumber: "",
  notes: "",
};

const AVAILABILITY_BADGE: Record<ApiDeliveryPartner["availabilityStatus"], "success" | "warning" | "secondary"> = {
  available: "success",
  busy: "warning",
  offline: "secondary",
};

export default function DeliveryPartners() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FilterTab>("All");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDeliveryPartnerInput>(EMPTY_FORM);

  const statusParam = tab === "Active" ? "active" : tab === "Inactive" ? "inactive" : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-delivery-partners", statusParam, search, page],
    queryFn: () => listDeliveryPartners({ status: statusParam, search: search || undefined, page }),
  });

  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const createMutation = useMutation({
    mutationFn: createDeliveryPartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-partners"] });
      toast.success("Delivery partner added");
      setAddModalOpen(false);
      setFormData(EMPTY_FORM);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to add delivery partner"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => updateDeliveryPartnerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-partners"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update status"),
  });

  const availabilityMutation = useMutation({
    mutationFn: ({ id, availabilityStatus }: { id: string; availabilityStatus: "available" | "busy" | "offline" }) =>
      updateDeliveryPartnerAvailability(id, availabilityStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-partners"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update availability"),
  });

  return (
    <div>
      <PageHeader
        title="Delivery Partners"
        description="Manage the roster of delivery partners assigned to fulfil orders."
        actions={
          <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Delivery Partner
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as FilterTab); setPage(1); }}>
          <TabsList>
            {(["All", "Active", "Inactive"] as FilterTab[]).map((t) => (
              <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search by name, mobile, vehicle number…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-72"
        />
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center p-6 text-center">
          <p className="text-sm font-medium">No delivery partners found</p>
          <p className="mt-1 text-xs text-muted-foreground">Add one to start assigning deliveries.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((partner) => (
            <Card key={partner.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Truck className="h-5 w-5" />
                </div>
                <StatusBadge status={partner.status} />
              </div>
              <p className="mt-3 font-semibold">{partner.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {[partner.city, partner.state].filter(Boolean).join(", ") || "Location not set"}
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {partner.mobile}</p>
                {partner.email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {partner.email}</p>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {partner.vehicleType && <Badge variant="secondary">{partner.vehicleType}{partner.vehicleNumber ? ` · ${partner.vehicleNumber}` : ""}</Badge>}
                {typeof partner.activeAssignments === "number" && (
                  <Badge variant="outline">{partner.activeAssignments} active</Badge>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                <Select
                  value={partner.availabilityStatus}
                  onValueChange={(v) => availabilityMutation.mutate({ id: partner.id, availabilityStatus: v as "available" | "busy" | "offline" })}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant={AVAILABILITY_BADGE[partner.availabilityStatus]}>{partner.availabilityStatus}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => statusMutation.mutate({ id: partner.id, status: partner.status === "active" ? "inactive" : "active" })}
                >
                  {partner.status === "active" ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Delivery Partner</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(formData);
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Full Name</Label>
                <Input required value={formData.fullName} onChange={(e) => setFormData((f) => ({ ...f, fullName: e.target.value }))} />
              </div>
              <div>
                <Label>Mobile</Label>
                <Input required value={formData.mobile} onChange={(e) => setFormData((f) => ({ ...f, mobile: e.target.value }))} />
              </div>
              <div>
                <Label>Email (optional)</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <Label>City</Label>
                <Input value={formData.city} onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={formData.state} onChange={(e) => setFormData((f) => ({ ...f, state: e.target.value }))} />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input value={formData.pincode} onChange={(e) => setFormData((f) => ({ ...f, pincode: e.target.value }))} />
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Input placeholder="Bike, Van…" value={formData.vehicleType} onChange={(e) => setFormData((f) => ({ ...f, vehicleType: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Vehicle Number</Label>
                <Input value={formData.vehicleNumber} onChange={(e) => setFormData((f) => ({ ...f, vehicleNumber: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Delivery Partner"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
