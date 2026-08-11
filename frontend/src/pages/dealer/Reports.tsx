import { useQuery } from "@tanstack/react-query";
import { Wallet, ShoppingCart, Boxes, FileText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { ReportDownloadButtons } from "@/components/common/ReportDownloadButtons";
import { Skeleton } from "@/components/ui/skeleton";
import { listDealerOrders } from "@/services/dealerOrderService";
import { listMyDealerQuotations } from "@/services/dealerQuotationService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExportColumn } from "@/lib/exportFile";

const ORDER_COLUMNS: ExportColumn[] = [
  { key: "orderNumber", label: "Order Number" },
  { key: "school", label: "School" },
  { key: "date", label: "Order Date" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
];

const QUOTATION_COLUMNS: ExportColumn[] = [
  { key: "id", label: "Quotation ID" },
  { key: "request", label: "Request" },
  { key: "submitted", label: "Submitted" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
];

export default function DealerReports() {
  const { data: orderData, isLoading: ordersLoading } = useQuery({
    queryKey: ["dealer-orders", "reports"],
    queryFn: () => listDealerOrders(1, 200),
  });
  const { data: quotationData, isLoading: quotationsLoading } = useQuery({
    queryKey: ["dealer-quotations", "reports"],
    queryFn: () => listMyDealerQuotations(1, 200),
  });

  const orders = orderData?.items ?? [];
  const quotations = quotationData?.items ?? [];
  const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const inProduction = orders.filter((o) => o.status === "processing").length;

  const orderRows = orders.map((o) => ({
    orderNumber: o.orderNumber,
    school: o.school?.schoolName ?? "—",
    date: formatDate(o.placedAt),
    status: o.status,
    amount: Number(o.totalAmount),
  }));

  const quotationRows = quotations.map((q) => ({
    id: `#${q.id}`,
    request: q.quotationRequest?.title ?? q.quotationRequest?.requestNumber ?? "—",
    submitted: formatDate(q.submittedAt),
    status: q.status,
    amount: Number(q.totalAmount),
  }));

  if (ordersLoading || quotationsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" description="Download reports for your assigned orders and quotations." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(revenue)} icon={Wallet} iconColorClass="bg-success/10 text-success" />
        <StatCard label="Assigned Orders" value={String(orders.length)} icon={ShoppingCart} iconColorClass="bg-secondary/10 text-secondary" />
        <StatCard label="In Production" value={String(inProduction)} icon={Boxes} iconColorClass="bg-primary/10 text-primary" />
        <StatCard label="Quotations" value={String(quotations.length)} icon={FileText} iconColorClass="bg-accent/20 text-edu-gray" />
      </div>

      <ChartCard title="Available Reports" className="mt-6">
        <div className="divide-y divide-border">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-medium">My Orders Report</p>
              <p className="text-xs text-muted-foreground">All orders assigned to you</p>
            </div>
            <ReportDownloadButtons title="My Orders Report" columns={ORDER_COLUMNS} rows={orderRows} filenamePrefix="dealer-orders" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-medium">My Quotations Report</p>
              <p className="text-xs text-muted-foreground">Quotations you're associated with</p>
            </div>
            <ReportDownloadButtons title="My Quotations Report" columns={QUOTATION_COLUMNS} rows={quotationRows} filenamePrefix="dealer-quotations" />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

