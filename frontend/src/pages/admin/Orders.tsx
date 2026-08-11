import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingCart, Clock, RefreshCw, CheckCircle2, XCircle, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportDownloadButtons } from "@/components/common/ReportDownloadButtons";
import { listAllOrders, assignOrderDealer, overrideOrderStatus } from "@/services/adminOrderService";
import { listDealers } from "@/services/dealerDirectoryService";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { ExportColumn } from "@/lib/exportFile";
import type { ApiOrderDetail } from "@/services/orderService";

const STATUS_FILTERS = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const OVERRIDE_STATUSES = ["confirmed", "processing", "shipped", "delivered", "completed", "cancelled"];

const ORDER_COLUMNS: ExportColumn[] = [
  { key: "orderNumber", label: "Order Number" },
  { key: "school", label: "School" },
  { key: "dealer", label: "Dealer" },
  { key: "date", label: "Order Date" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
];

export default function Orders() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ApiOrderDetail | null>(null);
  const [assignDealerId, setAssignDealerId] = useState<string>("");
  const [overrideStatus, setOverrideStatus] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter, page],
    queryFn: () => listAllOrders(page, 8, statusFilter),
    placeholderData: (prev) => prev,
  });
  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const activeOrder = selected ? items.find((o) => o.id === selected.id) ?? selected : null;

  const { data: dealerData } = useQuery({
    queryKey: ["dealers", "admin-orders-assign"],
    queryFn: () => listDealers(1, 100),
  });
  const dealers = dealerData?.items ?? [];

  const STAT_TILES = [
    { label: "Total Orders", value: data?.meta?.total ?? 0, icon: ShoppingCart, tone: "bg-secondary/10 text-secondary" },
    { label: "Pending", value: items.filter((o) => o.status === "pending").length, icon: Clock, tone: "bg-warning/15 text-warning" },
    { label: "Processing", value: items.filter((o) => o.status === "processing").length, icon: RefreshCw, tone: "bg-primary/10 text-primary" },
    { label: "Delivered", value: items.filter((o) => o.status === "delivered").length, icon: CheckCircle2, tone: "bg-success/10 text-success" },
    { label: "Cancelled", value: items.filter((o) => o.status === "cancelled").length, icon: XCircle, tone: "bg-destructive/10 text-destructive" },
  ];

  const assignMutation = useMutation({
    mutationFn: ({ id, dealerId }: { id: string; dealerId: string }) => assignOrderDealer(id, dealerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Dealer assigned");
      setAssignDealerId("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't assign dealer"),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason: string }) =>
      overrideOrderStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Order status updated");
      setOverrideStatus("");
      setOverrideReason("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update order status"),
  });

  const orderRows = items.map((o) => ({
    orderNumber: o.orderNumber,
    school: o.school?.schoolName ?? "—",
    dealer: o.dealer?.businessName ?? "—",
    date: formatDate(o.placedAt),
    status: o.status,
    amount: Number(o.totalAmount),
  }));

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Track and manage all customer orders."
        actions={<ReportDownloadButtons title="Orders" columns={ORDER_COLUMNS} rows={orderRows} filenamePrefix="admin-orders" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_TILES.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-4">
            <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-lg", tone)}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-semibold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.label}
            onClick={() => {
              setStatusFilter(s.value);
              setPage(1);
            }}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              statusFilter === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Dealer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-primary">{o.orderNumber}</TableCell>
                  <TableCell>{o.school?.schoolName ?? "—"}</TableCell>
                  <TableCell>{o.dealer?.businessName ?? "Unassigned"}</TableCell>
                  <TableCell>{formatDate(o.placedAt)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(o.totalAmount))}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(o)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-6">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Sheet open={!!activeOrder} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="max-w-lg">
          {activeOrder && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>{activeOrder.orderNumber}</SheetTitle>
                  <StatusBadge status={activeOrder.status} />
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">School</p>
                  <p className="font-medium">{activeOrder.school?.schoolName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dealer</p>
                  <p className="font-medium">{activeOrder.dealer?.businessName ?? "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(activeOrder.placedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected Delivery</p>
                  <p className="font-medium">{activeOrder.expectedDeliveryDate ? formatDate(activeOrder.expectedDeliveryDate) : "—"}</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold">Order Timeline</p>
                <ol className="space-y-4">
                  {activeOrder.orderStatusHistory.map((event, idx) => (
                    <li key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">
                          <CheckCheck className="h-3.5 w-3.5" />
                        </span>
                        {idx < activeOrder.orderStatusHistory.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-medium capitalize">{event.status}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items</span>
                  <span>{activeOrder.orderItems.length}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Sub Total</span>
                  <span>{formatCurrency(Number(activeOrder.subtotal))}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-primary">
                  <span>Total Amount</span>
                  <span>{formatCurrency(Number(activeOrder.totalAmount))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment Status</span>
                  <StatusBadge status={activeOrder.paymentStatus} />
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-semibold">Assign / Reassign Dealer</p>
                <div className="flex gap-2">
                  <Select value={assignDealerId} onValueChange={setAssignDealerId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select dealer" /></SelectTrigger>
                    <SelectContent>
                      {dealers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.businessName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    disabled={!assignDealerId || assignMutation.isPending}
                    onClick={() => assignMutation.mutate({ id: activeOrder.id, dealerId: assignDealerId })}
                  >
                    Assign
                  </Button>
                </div>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-semibold">Override Order Status</p>
                <p className="text-xs text-muted-foreground">
                  Use this if the dealer is unavailable — every override is recorded with a reason in the audit trail.
                </p>
                <Select value={overrideStatus} onValueChange={setOverrideStatus}>
                  <SelectTrigger><SelectValue placeholder="Select new status" /></SelectTrigger>
                  <SelectContent>
                    {OVERRIDE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1.5">
                  <Label className="text-xs">Reason (required)</Label>
                  <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="e.g. Dealer unreachable, confirmed via phone" />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!overrideStatus || !overrideReason.trim() || overrideMutation.isPending}
                  onClick={() => overrideMutation.mutate({ id: activeOrder.id, status: overrideStatus, reason: overrideReason })}
                >
                  Apply Override
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

