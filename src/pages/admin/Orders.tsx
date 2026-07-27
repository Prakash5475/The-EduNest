import { useMemo, useState } from "react";
import { Plus, Download, ShoppingCart, Clock, RefreshCw, CheckCircle2, XCircle, MapPin, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePagination } from "@/hooks/usePagination";
import { orders, orderStats } from "@/data/orders";
import { schools } from "@/data/schools";
import { dealers } from "@/data/dealers";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

function schoolName(id: string) {
  return schools.find((s) => s.id === id)?.name ?? "—";
}
function dealerName(id: string) {
  return dealers.find((d) => d.id === id)?.name ?? "—";
}

const STAT_TILES: { label: string; value: number; icon: typeof ShoppingCart; tone: string }[] = [
  { label: "Total Orders", value: orderStats.total, icon: ShoppingCart, tone: "bg-secondary/10 text-secondary" },
  { label: "Pending", value: orderStats.pending, icon: Clock, tone: "bg-warning/15 text-warning" },
  { label: "Processing", value: orderStats.processing, icon: RefreshCw, tone: "bg-primary/10 text-primary" },
  { label: "Delivered", value: orderStats.delivered, icon: CheckCircle2, tone: "bg-success/10 text-success" },
  { label: "Cancelled", value: orderStats.cancelled, icon: XCircle, tone: "bg-destructive/10 text-destructive" },
];

const STATUS_FILTERS: ("All" | OrderStatus)[] = [
  "All",
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(
    () => (statusFilter === "All" ? orders : orders.filter((o) => o.status === statusFilter)),
    [statusFilter]
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 8);

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Track and manage all customer orders."
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Order
            </Button>
          </>
        }
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
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              statusFilter === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {s}
          </button>
        ))}
      </div>

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
            {pageItems.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium text-primary">{o.id}</TableCell>
                <TableCell>{schoolName(o.schoolId)}</TableCell>
                <TableCell>{dealerName(o.dealerId)}</TableCell>
                <TableCell>{formatDate(o.orderDate)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(o.amount)}</TableCell>
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

      <div className="mt-6">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>{selected.id}</SheetTitle>
                  <StatusBadge status={selected.status} />
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">School</p>
                  <p className="font-medium">{schoolName(selected.schoolId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dealer</p>
                  <p className="font-medium">{dealerName(selected.dealerId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(selected.orderDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery Date</p>
                  <p className="font-medium">{selected.deliveryDate ? formatDate(selected.deliveryDate) : "—"}</p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-semibold">Order Timeline</p>
                <ol className="space-y-4">
                  {selected.timeline.map((event, idx) => (
                    <li key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">
                          <CheckCheck className="h-3.5 w-3.5" />
                        </span>
                        {idx < selected.timeline.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-medium">{event.status}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Items</span>
                  <span>{selected.itemsCount}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Sub Total</span>
                  <span>{formatCurrency(selected.subTotal)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-primary">
                  <span>Total Amount</span>
                  <span>{formatCurrency(selected.amount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount Paid</span>
                  <span className="text-success">{formatCurrency(selected.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount Due</span>
                  <span>{formatCurrency(selected.amount - selected.amountPaid)}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-3 border-t border-border pt-5">
                <Button className="flex-1">View Invoice</Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <MapPin className="h-4 w-4" /> Track Delivery
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
