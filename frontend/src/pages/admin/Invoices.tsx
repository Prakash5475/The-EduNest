import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, CheckCircle2, Clock, AlertTriangle, Send, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listAdminInvoices, getAdminInvoice, getInvoiceSummary, sendInvoice } from "@/services/adminInvoiceService";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Invoices() {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-invoices", page],
    queryFn: () => listAdminInvoices(page, 8),
    placeholderData: (prev) => prev,
  });
  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const { data: selected } = useQuery({
    queryKey: ["admin-invoice", selectedId],
    queryFn: () => getAdminInvoice(selectedId as string),
    enabled: !!selectedId,
  });

  const { data: summary } = useQuery({ queryKey: ["admin-invoices-summary"], queryFn: getInvoiceSummary });
  const byStatus = (status: string) => summary?.find((s) => s.status === status);

  const sendMutation = useMutation({
    mutationFn: (id: string) => sendInvoice(id),
    onSuccess: (res) => toast.success(`Invoice emailed to ${res.to}`),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't send invoice"),
  });

  function exportCsv() {
    const rows = [
      ["Invoice No.", "School", "Order", "Issued", "Amount", "Status"],
      ...items.map((i) => [i.invoiceNumber, i.school.schoolName, i.order.orderNumber, formatDate(i.issuedAt), i.totalAmount, i.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="View and manage all invoices. Invoices are generated automatically when a payment is recorded."
        actions={
          <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={items.length === 0}>
            <Download className="h-4 w-4" /> Export
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">{data?.meta?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground">Total Invoices</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">{byStatus("paid")?.count ?? 0}</p>
          <p className="text-xs text-muted-foreground">Paid — {formatCurrency(byStatus("paid")?.totalAmount ?? 0)}</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Clock className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">{byStatus("issued")?.count ?? 0}</p>
          <p className="text-xs text-muted-foreground">Unpaid — {formatCurrency(byStatus("issued")?.totalAmount ?? 0)}</p>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-xl font-semibold">{byStatus("overdue")?.count ?? 0}</p>
          <p className="text-xs text-muted-foreground">Overdue — {formatCurrency(byStatus("overdue")?.totalAmount ?? 0)}</p>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices yet" description="Invoices appear automatically once a payment is recorded against an order." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-primary">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.school.schoolName}</TableCell>
                  <TableCell>{inv.order.orderNumber}</TableCell>
                  <TableCell>{formatDate(inv.issuedAt)}</TableCell>
                  <TableCell>{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(inv.totalAmount))}</TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedId(inv.id)}>View</Button>
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

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent>
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>{selected.invoiceNumber}</SheetTitle>
                  <StatusBadge status={selected.status} />
                </div>
              </SheetHeader>

              <div className="space-y-2.5 border-y border-border py-4 text-sm">
                <Row label="Issued" value={formatDate(selected.issuedAt)} />
                <Row label="Due Date" value={selected.dueDate ? formatDate(selected.dueDate) : "—"} />
                <Row label="Type" value={selected.invoiceType === "advance_receipt" ? "Advance Receipt" : "Final Invoice"} />
                <Row label="Order" value={selected.order.orderNumber} />
              </div>

              <div className="space-y-1.5 py-2 text-sm">
                <p className="mb-1 font-semibold">School</p>
                <p className="text-muted-foreground">{selected.school.schoolName}{selected.school.gstin ? ` · GSTIN ${selected.school.gstin}` : ""}</p>
              </div>

              <div className="space-y-1.5 border-t border-border py-4 text-sm">
                <p className="mb-2 font-semibold">Items</p>
                {selected.invoiceItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span>{item.description} × {item.quantity}</span>
                    <span>{formatCurrency(Number(item.lineTotal))}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 border-t border-border pt-4 text-sm">
                <p className="mb-2 font-semibold">Invoice Summary</p>
                <Row label="Subtotal" value={formatCurrency(Number(selected.subtotal))} />
                <Row label="Tax (GST)" value={formatCurrency(Number(selected.taxAmount))} />
                <div className="flex justify-between pt-1 text-base font-semibold text-primary">
                  <span>Total Amount</span>
                  <span>{formatCurrency(Number(selected.totalAmount))}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-3 border-t border-border pt-5">
                {selected.downloadUrl ? (
                  <a href={selected.downloadUrl} target="_blank" rel="noreferrer" download className="flex-1">
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </a>
                ) : (
                  <Button className="flex-1 gap-2" disabled title="No PDF generated for this invoice yet">
                    <Download className="h-4 w-4" /> No PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={sendMutation.isPending}
                  onClick={() => sendMutation.mutate(selected.id)}
                >
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Invoice
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
