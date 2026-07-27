import { useState } from "react";
import { Plus, Download, Wallet, Clock, AlertTriangle, CalendarCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePagination } from "@/hooks/usePagination";
import { payments, paymentStats } from "@/data/payments";
import { orders } from "@/data/orders";
import { schools } from "@/data/schools";
import { dealers } from "@/data/dealers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types";

function schoolName(id: string) {
  return schools.find((s) => s.id === id)?.name ?? "—";
}
function dealerName(id: string) {
  return dealers.find((d) => d.id === id)?.name ?? "—";
}
function orderAmount(id: string) {
  return orders.find((o) => o.id === id)?.amount ?? 0;
}

const STATS = [
  { label: "Total Collected", value: paymentStats.totalCollected, icon: Wallet, tone: "bg-success/10 text-success" },
  { label: "Pending Payments", value: paymentStats.pending, icon: Clock, tone: "bg-warning/15 text-warning" },
  { label: "Overdue Payments", value: paymentStats.overdue, icon: AlertTriangle, tone: "bg-destructive/10 text-destructive" },
  { label: "This Month Collection", value: paymentStats.thisMonth, icon: CalendarCheck, tone: "bg-secondary/10 text-secondary" },
];

export default function Payments() {
  const [selected, setSelected] = useState<Payment | null>(null);
  const { page, setPage, totalPages, pageItems } = usePagination(payments, 8);
  const due = selected ? orderAmount(selected.orderId) - selected.amount : 0;

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track and manage all payments and advance collections."
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Record Payment
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-semibold">{formatCurrency(value)}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>From (Dealer)</TableHead>
              <TableHead>For (School)</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium text-primary">{p.id}</TableCell>
                <TableCell>{dealerName(p.dealerId)}</TableCell>
                <TableCell>{schoolName(p.schoolId)}</TableCell>
                <TableCell>{p.orderId}</TableCell>
                <TableCell>{formatDate(p.date)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{p.type}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>
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
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>{selected.id}</SheetTitle>
                  <StatusBadge status={selected.status} />
                </div>
              </SheetHeader>

              <div className="space-y-2.5 border-y border-border py-4 text-sm">
                <Row label="Payment Date" value={formatDate(selected.date)} />
                <Row label="Payment Type" value={selected.type} />
                <Row label="Amount" value={formatCurrency(selected.amount)} />
                <Row label="Payment Mode" value={selected.mode} />
                <Row label="Transaction ID" value={selected.transactionId} />
              </div>

              <div className="space-y-1.5 py-2 text-sm">
                <p className="mb-1 font-semibold">From (Dealer)</p>
                <p className="text-muted-foreground">{dealerName(selected.dealerId)}</p>
              </div>
              <div className="space-y-1.5 border-t border-border py-4 text-sm">
                <p className="mb-1 font-semibold">For (School)</p>
                <p className="text-muted-foreground">{schoolName(selected.schoolId)}</p>
              </div>

              <div className="space-y-1.5 border-t border-border pt-4 text-sm">
                <p className="mb-2 font-semibold">Related Order</p>
                <Row label="Order ID" value={selected.orderId} />
                <Row label="Order Amount" value={formatCurrency(orderAmount(selected.orderId))} />
                <Row label="Due Amount" value={formatCurrency(Math.max(0, due))} />
              </div>

              <Button variant="outline" className="mt-auto w-full gap-2">
                <Download className="h-4 w-4" /> Download Receipt
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
