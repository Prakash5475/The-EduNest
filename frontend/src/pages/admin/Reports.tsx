import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Wallet, ShoppingCart, FileText, Receipt, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { ReportDownloadButtons } from "@/components/common/ReportDownloadButtons";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getOrdersReport,
  getPaymentsReport,
  getQuotationsReport,
  getInvoicesReport,
} from "@/services/adminReportsService";
import { formatCurrency, formatCompactINR, formatDate } from "@/lib/utils";
import type { ExportColumn } from "@/lib/exportFile";

const CHART_COLORS = ["#1976D2", "#4CAF50", "#9C27B0", "#FF9800", "#F44336", "#00BCD4"];

const RANGE_OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "all" },
];

function rangeToDates(days: string): { from?: string } {
  if (days === "all") return {};
  const from = new Date();
  from.setDate(from.getDate() - Number(days));
  return { from: from.toISOString() };
}

const ORDER_COLUMNS: ExportColumn[] = [
  { key: "orderNumber", label: "Order Number" },
  { key: "school", label: "School" },
  { key: "date", label: "Order Date" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
];

export default function Reports() {
  const [rangeDays, setRangeDays] = useState("30");
  const range = useMemo(() => rangeToDates(rangeDays), [rangeDays]);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["reports", "orders", range],
    queryFn: () => getOrdersReport(range),
  });
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["reports", "payments", range],
    queryFn: () => getPaymentsReport(range),
  });
  const { data: quotations, isLoading: quotationsLoading } = useQuery({
    queryKey: ["reports", "quotations", range],
    queryFn: () => getQuotationsReport(range),
  });
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["reports", "invoices", range],
    queryFn: () => getInvoicesReport(range),
  });

  const isLoading = ordersLoading || paymentsLoading || quotationsLoading || invoicesLoading;

  const statusChartData = useMemo(
    () => Object.entries(orders?.byStatus ?? {}).map(([status, count]) => ({ status, Orders: count })),
    [orders],
  );

  const paymentTypeChartData = useMemo(
    () =>
      Object.entries(payments?.byType ?? {}).map(([type, v]) => ({
        type: type.replace(/_/g, " "),
        value: v.amount,
      })),
    [payments],
  );

  const topSchools = useMemo(() => {
    const totals = new Map<string, { name: string; orders: number; revenue: number }>();
    for (const o of orders?.orders ?? []) {
      const key = o.school?.id ?? "unknown";
      const existing = totals.get(key) ?? { name: o.school?.schoolName ?? "Unknown", orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += Number(o.totalAmount);
      totals.set(key, existing);
    }
    return [...totals.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  const orderRows = (orders?.orders ?? []).map((o) => ({
    orderNumber: o.orderNumber,
    school: o.school?.schoolName ?? "—",
    date: formatDate(o.placedAt),
    status: o.status,
    amount: Number(o.totalAmount),
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" description="Generate and analyze detailed reports of your business." />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={rangeDays} onValueChange={setRangeDays}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Revenue" value={formatCompactINR(orders?.totalValue ?? 0)} icon={Wallet} iconColorClass="bg-success/10 text-success" />
        <StatCard label="Total Orders" value={String(orders?.totalOrders ?? 0)} icon={ShoppingCart} iconColorClass="bg-secondary/10 text-secondary" />
        <StatCard label="Total Quotations" value={String(quotations?.total ?? 0)} icon={FileText} iconColorClass="bg-primary/10 text-primary" />
        <StatCard label="Total Invoices" value={String(invoices?.totalInvoices ?? 0)} icon={Receipt} iconColorClass="bg-accent/20 text-edu-gray" />
        <StatCard label="Total Payments" value={formatCompactINR(payments?.totalCollected ?? 0)} icon={CreditCard} iconColorClass="bg-destructive/10 text-destructive" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Orders by Status" description="Real-time order pipeline breakdown" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusChartData}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} className="capitalize" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="Orders" fill="#1976D2" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="p-5">
          <p className="mb-4 font-display text-base font-semibold">Report Summary</p>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Total Revenue" value={formatCurrency(orders?.totalValue ?? 0)} />
            <SummaryRow label="Total Orders" value={String(orders?.totalOrders ?? 0)} />
            <SummaryRow label="Total Quotations" value={String(quotations?.total ?? 0)} />
            <SummaryRow label="Quotation Conversion" value={`${quotations?.conversionRate ?? 0}%`} />
            <SummaryRow label="Total Invoices" value={String(invoices?.totalInvoices ?? 0)} />
            <SummaryRow label="Total Payments" value={formatCurrency(payments?.totalCollected ?? 0)} />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Top Performing Schools" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2">#</th>
                  <th className="pb-2">School</th>
                  <th className="pb-2">Orders</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topSchools.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">No orders in this range.</td>
                  </tr>
                ) : (
                  topSchools.map((s, idx) => (
                    <tr key={s.name}>
                      <td className="py-2.5 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2.5 font-medium">{s.name}</td>
                      <td className="py-2.5 text-muted-foreground">{s.orders}</td>
                      <td className="py-2.5 text-right font-semibold">{formatCurrency(s.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ChartCard>

        <ChartCard title="Payments by Type">
          {paymentTypeChartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No payments in this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentTypeChartData} dataKey="value" nameKey="type" innerRadius={55} outerRadius={82} paddingAngle={2}>
                  {paymentTypeChartData.map((entry, idx) => (
                    <Cell key={entry.type} fill={CHART_COLORS[idx % CHART_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Download Reports" className="mt-6">
        <div className="divide-y divide-border">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="text-sm font-medium">Orders Report</p>
              <p className="text-xs text-muted-foreground">Full order list for the selected range</p>
            </div>
            <ReportDownloadButtons title="Orders Report" columns={ORDER_COLUMNS} rows={orderRows} filenamePrefix="orders-report" />
          </div>
        </div>
      </ChartCard>
    </div>
  );
}

function SummaryRow({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${valueClassName ?? ""}`}>{value}</span>
    </div>
  );
}

