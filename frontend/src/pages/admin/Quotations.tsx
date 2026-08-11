import { useMemo, useState } from "react";
import { Plus, Download, Printer, Mail, Store } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DealerAssignmentCard } from "@/components/common/DealerAssignmentCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { usePagination } from "@/hooks/usePagination";
import { useDealerAssignment } from "@/hooks/useDealerAssignment";
import { quotations } from "@/data/quotations";
import { schools } from "@/data/schools";
import { dealers } from "@/data/dealers";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Quotation, QuotationStatus } from "@/types";

type FilterTab = "All" | QuotationStatus;
const TABS: FilterTab[] = ["All", "Draft", "Sent", "Accepted", "Rejected", "Expired"];

function schoolName(id: string) {
  return schools.find((s) => s.id === id)?.name ?? "—";
}
function dealerName(id: string) {
  return dealers.find((d) => d.id === id)?.name ?? "—";
}
function quoteTotals(q: Quotation) {
  const subTotal = q.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const discount = (subTotal * q.discountPct) / 100;
  const taxable = subTotal - discount;
  const gst = (taxable * q.gstPct) / 100;
  return { subTotal, discount, gst, total: taxable + gst };
}

export default function Quotations() {
  const [tab, setTab] = useState<FilterTab>("All");
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);
  const { workloads, assignments, assign } = useDealerAssignment();

  const filtered = useMemo(
    () => (tab === "All" ? quotations : quotations.filter((q) => q.status === tab)),
    [tab]
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 8);
  const totals = selected ? quoteTotals(selected) : null;

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Create, view and manage all quotations."
        actions={
          <>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Quotation
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)}>
        <TabsList className="mb-5 flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote ID</TableHead>
              <TableHead>Dealer</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Quote Date</TableHead>
              <TableHead>Valid Till</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-medium text-primary">{q.id}</TableCell>
                <TableCell>{dealerName(q.dealerId)}</TableCell>
                <TableCell>{schoolName(q.schoolId)}</TableCell>
                <TableCell>{formatDate(q.quoteDate)}</TableCell>
                <TableCell>{formatDate(q.validTill)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(q.amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={q.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(q)}>
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
        <SheetContent className="max-w-xl">
          {selected && totals && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>{selected.id}</SheetTitle>
                  <StatusBadge status={selected.status} />
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Dealer</p>
                  <p className="font-medium">{dealerName(selected.dealerId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">School</p>
                  <p className="font-medium">{schoolName(selected.schoolId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quote Date</p>
                  <p className="font-medium">{formatDate(selected.quoteDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valid Till</p>
                  <p className="font-medium">{formatDate(selected.validTill)}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold"># Products</p>
                <div className="space-y-3">
                  {selected.items.map((item, idx) => (
                    <div key={item.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {idx + 1}. {item.productName} × {item.qty}
                        </span>
                        <span className="font-medium">{formatCurrency(item.qty * item.unitPrice)}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Store className="h-3.5 w-3.5" />
                          {assignments[item.id]
                            ? `Assigned to ${dealers.find((d) => d.id === assignments[item.id])?.name ?? "—"}`
                            : "Not yet assigned to a dealer"}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssigningItemId(assigningItemId === item.id ? null : item.id)}
                        >
                          {assigningItemId === item.id ? "Close" : assignments[item.id] ? "Reassign" : "Assign Dealer"}
                        </Button>
                      </div>

                      {assigningItemId === item.id && (
                        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2">
                          {dealers
                            .filter((d) => d.status === "active")
                            .map((dealer) => {
                              const workload = workloads.find((w) => w.dealerId === dealer.id);
                              if (!workload) return null;
                              return (
                                <DealerAssignmentCard
                                  key={dealer.id}
                                  dealer={dealer}
                                  workload={workload}
                                  selected={assignments[item.id] === dealer.id}
                                  onAssign={() =>
                                    assign({ quotationId: selected.id, itemId: item.id, dealerId: dealer.id })
                                  }
                                />
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sub Total</span>
                  <span>{formatCurrency(totals.subTotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Discount ({selected.discountPct}%)</span>
                  <span>-{formatCurrency(totals.discount)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST ({selected.gstPct}%)</span>
                  <span>{formatCurrency(totals.gst)}</span>
                </div>
                <div className="flex justify-between text-base font-semibold text-primary">
                  <span>Total Amount</span>
                  <span>{formatCurrency(totals.total)}</span>
                </div>
              </div>

              <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">{selected.notes}</p>

              <div className="mt-auto flex gap-2 border-t border-border pt-5">
                <Button className="flex-1 gap-2">
                  <Download className="h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" size="icon" aria-label="Print">
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Email">
                  <Mail className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
