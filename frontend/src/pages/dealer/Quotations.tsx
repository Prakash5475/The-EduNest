import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { listMyDealerQuotations, updateDealerQuotation, type ApiDealerQuotation } from "@/services/dealerQuotationService";
import { formatCurrency, formatDate } from "@/lib/utils";

function itemLabel(item: ApiDealerQuotation["dealerQuotationItems"][number]) {
  const req = item.quotationRequestProduct;
  return req.product?.name ?? req.kit?.name ?? req.customItemDescription ?? "Item";
}

function QuoteEditor({ quotation, onClose }: { quotation: ApiDealerQuotation; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm<Record<string, string>>({
    defaultValues: Object.fromEntries(quotation.dealerQuotationItems.map((i) => [i.id, i.quotedUnitPrice])),
  });

  const mutation = useMutation({
    mutationFn: (values: Record<string, string>) =>
      updateDealerQuotation(quotation.id, {
        items: quotation.dealerQuotationItems.map((i) => ({
          itemId: i.id,
          quotedUnitPrice: Number(values[i.id]),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealer-quotations"] });
      toast.success("Quotation revised");
      onClose();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update quotation"),
  });

  const canEdit = quotation.status === "pending" || quotation.status === "submitted" || quotation.status === "revised";

  return (
    <form className="space-y-3" onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      {quotation.dealerQuotationItems.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex-1 text-muted-foreground">
            {itemLabel(item)} × {item.quotedQuantity}
          </span>
          <Input
            type="number"
            step="0.01"
            className="w-28"
            disabled={!canEdit}
            {...register(item.id)}
          />
        </div>
      ))}
      {canEdit && (
        <Button type="submit" size="sm" className="mt-2 w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save Revised Pricing"}
        </Button>
      )}
    </form>
  );
}

export default function DealerQuotations() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ApiDealerQuotation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dealer-quotations", page],
    queryFn: () => listMyDealerQuotations(page, 8),
    placeholderData: (prev) => prev,
  });
  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const activeQuotation = selected ? items.find((q) => q.id === selected.id) ?? selected : null;

  return (
    <div>
      <PageHeader title="Quotations" description="Quotations you're associated with for this school network." />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Valid For</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium text-primary">#{q.id}</TableCell>
                  <TableCell>{q.quotationRequest?.title ?? q.quotationRequest?.requestNumber ?? "—"}</TableCell>
                  <TableCell>{formatDate(q.submittedAt)}</TableCell>
                  <TableCell>{q.validityDays} days</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(q.totalAmount))}</TableCell>
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
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No quotations yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-6">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Sheet open={!!activeQuotation} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {activeQuotation && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>Quotation #{activeQuotation.id}</SheetTitle>
                  <StatusBadge status={activeQuotation.status} />
                </div>
              </SheetHeader>
              <div className="space-y-2.5 border-y border-border py-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request</span>
                  <span className="font-medium">
                    {activeQuotation.quotationRequest?.title ?? activeQuotation.quotationRequest?.requestNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium">{formatDate(activeQuotation.submittedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid For</span>
                  <span className="font-medium">{activeQuotation.validityDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">{formatCurrency(Number(activeQuotation.totalAmount))}</span>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Items & Pricing</p>
                <QuoteEditor quotation={activeQuotation} onClose={() => setSelected(null)} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

