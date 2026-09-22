import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Download, Wallet, CheckCircle2, XCircle, Undo2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listAdminPayments,
  getPaymentSummary,
  recordManualPayment,
  refundPayment,
  type ApiPayment,
} from "@/services/adminPaymentService";
import { formatCurrency, formatDate } from "@/lib/utils";

function exportCsv(rows: ApiPayment[]) {
  const header = ["Payment ID", "School", "Order", "Amount", "Type", "Status", "Date"];
  const lines = rows.map((p) =>
    [p.id, p.school?.schoolName ?? "", p.order?.orderNumber ?? "", p.amount, p.paymentType, p.status, formatDate(p.createdAt)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payments-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface RecordFormValues {
  orderId: string;
  amount: number;
  paymentType: "advance" | "balance" | "full";
  reference: string;
  notes: string;
}

export default function Payments() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ApiPayment | null>(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", page],
    queryFn: () => listAdminPayments(page, 8),
    placeholderData: (prev) => prev,
  });
  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const { data: summary } = useQuery({ queryKey: ["admin-payments-summary"], queryFn: getPaymentSummary });
  const stats = [
    { label: "Successful", value: summary?.byStatus.find((s) => s.status === "success")?.totalAmount ?? 0, icon: CheckCircle2, tone: "bg-success/10 text-success" },
    { label: "Pending", value: summary?.byStatus.find((s) => s.status === "pending" || s.status === "initiated")?.totalAmount ?? 0, icon: Wallet, tone: "bg-warning/15 text-warning" },
    { label: "Failed", value: summary?.byStatus.find((s) => s.status === "failed")?.totalAmount ?? 0, icon: XCircle, tone: "bg-destructive/10 text-destructive" },
    { label: "Refunded", value: summary?.totalRefunded ?? 0, icon: Undo2, tone: "bg-secondary/10 text-secondary" },
  ];

  const { register, handleSubmit, reset, watch, setValue } = useForm<RecordFormValues>({
    defaultValues: { orderId: "", amount: 0, paymentType: "advance", reference: "", notes: "" },
  });

  const recordMutation = useMutation({
    mutationFn: (v: RecordFormValues) =>
      recordManualPayment(v.orderId, { amount: Number(v.amount), paymentType: v.paymentType, reference: v.reference || undefined, notes: v.notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payments-summary"] });
      toast.success("Payment recorded");
      setRecordOpen(false);
      reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't record payment"),
  });

  async function handleRefund() {
    if (!selected) return;
    setRefunding(true);
    try {
      await refundPayment(selected.id);
      toast.success(`Refund requested for payment ${selected.id}`);
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't request refund");
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Track and manage all payments and advance collections."
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={() => exportCsv(items)} disabled={items.length === 0}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="gap-2" onClick={() => setRecordOpen(true)}>
              <Plus className="h-4 w-4" /> Record Payment
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-xl font-semibold">{formatCurrency(value)}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Wallet} title="No payments yet" description="Payments will appear here once orders are paid." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-primary">{p.id}</TableCell>
                  <TableCell>{p.school?.schoolName ?? "—"}</TableCell>
                  <TableCell>{p.order?.orderNumber ?? "—"}</TableCell>
                  <TableCell>{formatDate(p.createdAt)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{p.paymentType}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-6"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>

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
                <Row label="Date" value={formatDate(selected.createdAt)} />
                <Row label="Type" value={selected.paymentType} />
                <Row label="Amount" value={formatCurrency(Number(selected.amount))} />
                <Row label="Gateway" value={selected.gateway ?? "—"} />
                <Row label="Reference" value={selected.gatewayReference ?? "—"} />
                <Row label="School" value={selected.school?.schoolName ?? "—"} />
                <Row label="Order" value={selected.order?.orderNumber ?? "—"} />
              </div>

              {selected.paymentTransactions.length > 0 && (
                <div className="space-y-1.5 py-2 text-sm">
                  <p className="mb-1 font-semibold">Transactions</p>
                  {selected.paymentTransactions.map((t) => (
                    <div key={t.id} className="flex justify-between text-muted-foreground">
                      <span className="capitalize">{t.transactionType} · {t.status}</span>
                      <span>{formatCurrency(Number(t.amount))}</span>
                    </div>
                  ))}
                </div>
              )}

              {selected.status === "success" && (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                  disabled={refunding}
                  onClick={handleRefund}
                >
                  {refunding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                  Request Refund
                </Button>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={recordOpen} onOpenChange={setRecordOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Record Payment</SheetTitle></SheetHeader>
          <form className="space-y-4" onSubmit={handleSubmit((v) => recordMutation.mutate(v))}>
            <div className="space-y-1.5">
              <Label>Order ID</Label>
              <Input {...register("orderId", { required: true })} placeholder="Numeric order ID" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" step="0.01" {...register("amount", { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Type</Label>
              <Select value={watch("paymentType")} onValueChange={(v) => setValue("paymentType", v as RecordFormValues["paymentType"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference (cheque/UTR no.)</Label>
              <Input {...register("reference")} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input {...register("notes")} />
            </div>
            <Button type="submit" className="w-full" disabled={recordMutation.isPending}>
              {recordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </form>
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
