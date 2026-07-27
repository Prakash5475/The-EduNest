import { useState } from "react";
import { Plus, Download, FileText, CheckCircle2, Clock, AlertTriangle, Send } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePagination } from "@/hooks/usePagination";
import { invoices, invoiceStats } from "@/data/invoices";
import { schools } from "@/data/schools";
import { dealers } from "@/data/dealers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Invoice } from "@/types";

function schoolName(id: string) {
  return schools.find((s) => s.id === id)?.name ?? "—";
}
function dealerName(id: string) {
  return dealers.find((d) => d.id === id)?.name ?? "—";
}

export default function Invoices() {
  const [selected, setSelected] = useState<Invoice | null>(null);
  const { page, setPage, totalPages, pageItems } = usePagination(invoices, 8);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="View and manage all invoices."
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Invoice
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">{invoiceStats.total}</p>
          <p className="text-xs text-muted-foreground">Total Invoices</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">{invoiceStats.paid}</p>
          <p className="text-xs text-muted-foreground">Paid — {formatCurrency(invoiceStats.paidAmount)}</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">{invoiceStats.unpaid}</p>
          <p className="text-xs text-muted-foreground">Unpaid — {formatCurrency(invoiceStats.unpaidAmount)}</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">{invoiceStats.overdue}</p>
          <p className="text-xs text-muted-foreground">Overdue — {formatCurrency(invoiceStats.overdueAmount)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Dealer</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium text-primary">{inv.id}</TableCell>
                <TableCell>{schoolName(inv.schoolId)}</TableCell>
                <TableCell>{dealerName(inv.dealerId)}</TableCell>
                <TableCell>{inv.orderId}</TableCell>
                <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                <TableCell>{formatDate(inv.dueDate)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(inv.amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={inv.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(inv)}>
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
                <Row label="Invoice Date" value={formatDate(selected.invoiceDate)} />
                <Row label="Due Date" value={formatDate(selected.dueDate)} />
                <Row label="Payment Method" value={selected.paymentMethod} />
                {selected.transactionId && <Row label="Transaction ID" value={selected.transactionId} />}
              </div>

              <div className="space-y-1.5 py-2 text-sm">
                <p className="mb-1 font-semibold">School</p>
                <p className="text-muted-foreground">{schoolName(selected.schoolId)}</p>
              </div>
              <div className="space-y-1.5 border-t border-border py-4 text-sm">
                <p className="mb-1 font-semibold">Dealer</p>
                <p className="text-muted-foreground">{dealerName(selected.dealerId)}</p>
              </div>

              <div className="space-y-1.5 border-t border-border pt-4 text-sm">
                <p className="mb-2 font-semibold">Invoice Summary</p>
                <Row label="Subtotal" value={formatCurrency(selected.subTotal)} />
                <Row label={`Discount (${selected.discountPct}%)`} value={`-${formatCurrency((selected.subTotal * selected.discountPct) / 100)}`} />
                <Row label={`GST (${selected.gstPct}%)`} value={formatCurrency((selected.subTotal * selected.gstPct) / 100)} />
                <div className="flex justify-between pt-1 text-base font-semibold text-primary">
                  <span>Total Amount</span>
                  <span>{formatCurrency(selected.amount)}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-3 border-t border-border pt-5">
                <Button className="flex-1 gap-2">
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Send className="h-4 w-4" /> Send Invoice
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
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
