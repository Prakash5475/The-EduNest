import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Download, Store, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listAdminQuotations,
  getAdminQuotation,
  createAdminQuotation,
  assignDealersToQuotation,
  type ApiQuotationRequest,
  type QuotationRequestStatus,
} from "@/services/adminQuotationService";
import { listAdminSchools } from "@/services/adminSchoolService";
import { listAdminDealers } from "@/services/adminDealerService";
import { formatCurrency, formatDate } from "@/lib/utils";

type FilterTab = "all" | QuotationRequestStatus;
const TABS: { label: string; value: FilterTab }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Review", value: "in_review" },
  { label: "Quoted", value: "quoted" },
  { label: "Closed", value: "closed" },
  { label: "Expired", value: "expired" },
];

interface ItemFormValue {
  kind: "custom";
  customItemName: string;
  customItemSchoolPrice: number;
  customItemDealerPrice: number;
  quantity: number;
}
interface CreateFormValues {
  schoolId: string;
  title: string;
  items: ItemFormValue[];
}

function CreateQuotationSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data: schools } = useQuery({
    queryKey: ["admin-schools", "picker"],
    queryFn: () => listAdminSchools({ page: 1 }),
    enabled: open,
  });
  const { register, control, handleSubmit, reset } = useForm<CreateFormValues>({
    defaultValues: { schoolId: "", title: "", items: [{ kind: "custom", customItemName: "", customItemSchoolPrice: 0, customItemDealerPrice: 0, quantity: 1 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const createMutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
      createAdminQuotation({
        schoolId: values.schoolId,
        title: values.title || undefined,
        items: values.items.map((i) => ({
          customItemName: i.customItemName,
          customItemSchoolPrice: Number(i.customItemSchoolPrice),
          customItemDealerPrice: Number(i.customItemDealerPrice),
          quantity: Number(i.quantity),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quotations"] });
      toast.success("Quotation request created");
      reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't create quotation"),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-xl">
        <SheetHeader>
          <SheetTitle>Create Quotation</SheetTitle>
        </SheetHeader>
        <form className="space-y-4" onSubmit={handleSubmit((v) => createMutation.mutate(v))}>
          <div className="space-y-1.5">
            <Label>School</Label>
            <Select onValueChange={(v) => register("schoolId").onChange({ target: { value: v, name: "schoolId" } })}>
              <SelectTrigger><SelectValue placeholder="Select school" /></SelectTrigger>
              <SelectContent>
                {(schools?.items ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("schoolId", { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Title (optional)</Label>
            <Input {...register("title")} placeholder="e.g. Summer uniform order" />
          </div>

          <div className="space-y-3 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ kind: "custom", customItemName: "", customItemSchoolPrice: 0, customItemDealerPrice: 0, quantity: 1 })}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add item
              </Button>
            </div>
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 rounded-lg border border-border p-3">
                <div className="col-span-5">
                  <Label className="text-xs">Item name</Label>
                  <Input {...register(`items.${idx}.customItemName`, { required: true })} placeholder="Item name" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min={1} {...register(`items.${idx}.quantity`, { valueAsNumber: true, required: true })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">School ₹</Label>
                  <Input type="number" step="0.01" {...register(`items.${idx}.customItemSchoolPrice`, { valueAsNumber: true, required: true })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Dealer ₹</Label>
                  <Input type="number" step="0.01" {...register(`items.${idx}.customItemDealerPrice`, { valueAsNumber: true })} />
                </div>
                <div className="col-span-1 flex items-end justify-end">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Quotation
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AssignDealerPanel({ request, itemIds, onDone }: { request: ApiQuotationRequest; itemIds: string[]; onDone: () => void }) {
  const queryClient = useQueryClient();
  const { data: dealers } = useQuery({ queryKey: ["admin-dealers", "picker"], queryFn: () => listAdminDealers({ page: 1 }) });
  const [dealerId, setDealerId] = useState("");
  const [validityDays, setValidityDays] = useState(7);

  const assignMutation = useMutation({
    mutationFn: () => assignDealersToQuotation(request.id, [{ dealerId, itemIds, validityDays }]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quotation", request.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-quotations"] });
      toast.success("Dealer assigned");
      onDone();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't assign dealer"),
  });

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-3">
      <Select value={dealerId} onValueChange={setDealerId}>
        <SelectTrigger><SelectValue placeholder="Select dealer" /></SelectTrigger>
        <SelectContent>
          {(dealers?.items ?? []).map((d) => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input type="number" min={1} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} placeholder="Validity (days)" />
      <Button disabled={!dealerId || assignMutation.isPending} onClick={() => assignMutation.mutate()}>
        {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Assign
      </Button>
    </div>
  );
}

export default function Quotations() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);

  const statusFilter = tab === "all" ? undefined : tab;
  const { data, isLoading } = useQuery({
    queryKey: ["admin-quotations", statusFilter, page],
    queryFn: () => listAdminQuotations(page, 8, statusFilter),
    placeholderData: (prev) => prev,
  });
  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const { data: selected } = useQuery({
    queryKey: ["admin-quotation", selectedId],
    queryFn: () => getAdminQuotation(selectedId as string),
    enabled: !!selectedId,
  });

  const assignedItemIds = new Set(
    (selected?.dealerQuotations ?? []).flatMap((dq) => dq.dealerQuotationItems.map((i) => i.quotationRequestProductId))
  );

  function exportCsv() {
    const rows = [
      ["Request #", "School", "Status", "Created", "Items"],
      ...items.map((q) => [q.requestNumber, q.school?.schoolName ?? "", q.status, formatDate(q.createdAt), String(q.quotationRequestProducts.length)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quotations-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Quotations"
        description="Create, view and manage all quotation requests."
        actions={
          <>
            <Button variant="outline" className="gap-2" onClick={exportCsv} disabled={items.length === 0}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create Quotation
            </Button>
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => { setTab(v as FilterTab); setPage(1); }}>
        <TabsList className="mb-5 flex-wrap">
          {TABS.map((t) => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Plus} title="No quotations found" description="Create the first quotation request." actionLabel="Create Quotation" onAction={() => setCreateOpen(true)} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request #</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium text-primary">{q.requestNumber}</TableCell>
                  <TableCell>{q.school?.schoolName ?? "—"}</TableCell>
                  <TableCell>{formatDate(q.createdAt)}</TableCell>
                  <TableCell>{q.quotationRequestProducts.length}</TableCell>
                  <TableCell><StatusBadge status={q.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedId(q.id)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-6"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>

      <CreateQuotationSheet open={createOpen} onOpenChange={setCreateOpen} />

      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  <SheetTitle>{selected.requestNumber}</SheetTitle>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="text-sm text-muted-foreground">{selected.school?.schoolName}</p>
              </SheetHeader>

              <div>
                <p className="mb-2 text-sm font-semibold">Items</p>
                <div className="space-y-3">
                  {selected.quotationRequestProducts.map((item) => {
                    const isAssigned = assignedItemIds.has(item.id);
                    const name = item.product?.name ?? item.kit?.name ?? item.customItemName ?? "Item";
                    return (
                      <div key={item.id} className="rounded-xl border border-border p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{name} × {item.quantity}</span>
                          {item.customItemSchoolPrice && (
                            <span className="font-medium">{formatCurrency(Number(item.customItemSchoolPrice) * item.quantity)}</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Store className="h-3.5 w-3.5" />
                            {isAssigned ? "Assigned to a dealer" : "Not yet assigned"}
                          </p>
                          {!isAssigned && (
                            <Button variant="outline" size="sm" onClick={() => setAssigningItemId(assigningItemId === item.id ? null : item.id)}>
                              {assigningItemId === item.id ? "Close" : "Assign Dealer"}
                            </Button>
                          )}
                        </div>
                        {assigningItemId === item.id && (
                          <AssignDealerPanel request={selected} itemIds={[item.id]} onDone={() => setAssigningItemId(null)} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selected.dealerQuotations.length > 0 && (
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-sm font-semibold">Dealer Quotations</p>
                  <div className="space-y-2">
                    {selected.dealerQuotations.map((dq) => (
                      <div key={dq.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                        <div>
                          <p className="font-medium">{dq.dealer?.businessName ?? "Dealer"}</p>
                          <p className="text-xs text-muted-foreground">{dq.dealerQuotationItems.length} item(s) · valid {dq.validityDays}d</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(Number(dq.totalAmount))}</span>
                          <StatusBadge status={dq.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
