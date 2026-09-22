import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ShoppingCart, FileText, Building2, Store, Download, Gauge, Package } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { Button } from "@/components/ui/button";
import {
  getAdminDashboardSummary,
  getTopCategories,
  getTopSchools,
  getRevenueTrend,
  getPaymentMethodBreakdown,
  getDealerCapacity,
} from "@/services/adminDashboardService";
import { getTopProducts } from "@/services/adminDashboardService";
import { formatCurrency, formatCompactINR } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  delivered: "#4CAF50",
  completed: "#4CAF50",
  processing: "#1976D2",
  pending: "#FFC107",
  cancelled: "#F44336",
};
const CATEGORY_COLORS = ["#F44336", "#1976D2", "#4CAF50", "#FFC107", "#9C27B0", "#00BCD4"];

export default function Analytics() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["admin-analytics-summary"],
    queryFn: getAdminDashboardSummary,
  });
  const { data: revenueTrend = [] } = useQuery({ queryKey: ["admin-analytics-revenue-trend"], queryFn: () => getRevenueTrend(6) });
  const { data: topCategories = [] } = useQuery({ queryKey: ["admin-analytics-top-categories"], queryFn: () => getTopCategories(6) });
  const { data: topSchools = [] } = useQuery({ queryKey: ["admin-analytics-top-schools"], queryFn: () => getTopSchools(5) });
  const { data: topProducts = [] } = useQuery({ queryKey: ["admin-analytics-top-products"], queryFn: () => getTopProducts(5) });
  const { data: paymentMethods = [] } = useQuery({ queryKey: ["admin-analytics-payment-methods"], queryFn: getPaymentMethodBreakdown });
  const { data: dealerCapacity = [] } = useQuery({ queryKey: ["admin-analytics-dealer-capacity"], queryFn: getDealerCapacity });

  const orderStatusData = Object.entries(summary?.orders.byStatus ?? {}).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] ?? "#9E9E9E",
  }));

  const categoryTotal = topCategories.reduce((s, c) => s + c.revenue, 0) || 1;

  function exportReport() {
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue (all time)", String(summary?.revenue.allTime ?? 0)],
      ["Revenue this month", String(summary?.revenue.thisMonth ?? 0)],
      ["Total Orders", String(summary?.totals.orders ?? 0)],
      ["Total Quotations", String(summary?.totals.quotations ?? 0)],
      ["Total Schools", String(summary?.totals.schools ?? 0)],
      ["Total Dealers", String(summary?.totals.dealers ?? 0)],
      ["Outstanding Balance", String(summary?.payments.outstandingBalance ?? 0)],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Analytics Overview"
        description="Real-time insights and performance summary of your business."
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportReport}>
            <Download className="h-3.5 w-3.5" /> Export Report
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Revenue"
          value={loadingSummary ? "…" : formatCompactINR(summary?.revenue.allTime ?? 0)}
          icon={Wallet}
          iconColorClass="bg-success/10 text-success"
        />
        <StatCard
          label="Total Orders"
          value={loadingSummary ? "…" : String(summary?.totals.orders ?? 0)}
          icon={ShoppingCart}
          iconColorClass="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Total Quotations"
          value={loadingSummary ? "…" : String(summary?.totals.quotations ?? 0)}
          icon={FileText}
          iconColorClass="bg-primary/10 text-primary"
        />
        <StatCard
          label="Total Schools"
          value={loadingSummary ? "…" : String(summary?.totals.schools ?? 0)}
          icon={Building2}
          iconColorClass="bg-accent/20 text-edu-gray"
        />
        <StatCard
          label="Total Dealers"
          value={loadingSummary ? "…" : String(summary?.totals.dealers ?? 0)}
          icon={Store}
          iconColorClass="bg-destructive/10 text-destructive"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Revenue Trend" description="Last 6 months" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F44336" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: number) => formatCompactINR(v)} width={56} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="revenue" stroke="#F44336" strokeWidth={2.5} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales by Category" description="By revenue">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={topCategories} dataKey="revenue" nameKey="category" innerRadius={62} outerRadius={92} paddingAngle={2}>
                {topCategories.map((entry, i) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {topCategories.map((c, i) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  {c.category}
                </span>
                <span className="font-medium">{Math.round((c.revenue / categoryTotal) * 100)}%</span>
              </div>
            ))}
            {topCategories.length === 0 && <p className="text-xs text-muted-foreground">No category sales yet.</p>}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Top Performing Schools" description="By real paid revenue">
          <div className="space-y-3">
            {topSchools.map((s) => (
              <div key={s.schoolId} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.schoolName}</span>
                <span className="font-semibold">{formatCurrency(s.revenue)}</span>
              </div>
            ))}
            {topSchools.length === 0 && <p className="text-sm text-muted-foreground">No paid orders yet.</p>}
          </div>
        </ChartCard>

        <ChartCard title="Orders Status">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={orderStatusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                {orderStatusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Methods" description="Real collections by gateway">
          <div className="space-y-3">
            {paymentMethods.map((p) => (
              <div key={p.method} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{p.method}</span>
                <span className="font-semibold">{formatCurrency(p.amount)} <span className="text-xs font-normal text-muted-foreground">({p.count})</span></span>
              </div>
            ))}
            {paymentMethods.length === 0 && <p className="text-sm text-muted-foreground">No successful payments yet.</p>}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top Products" description="By units sold">
          <div className="space-y-3">
            {topProducts.map((p) => (
              <div key={p.product?.id ?? p.product?.sku ?? Math.random()} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Package className="h-3.5 w-3.5" /> {p.product?.name ?? "Unknown product"}
                </span>
                <span className="text-right">
                  <span className="block font-semibold">{formatCurrency(p.revenue)}</span>
                  <span className="block text-xs text-muted-foreground">{p.unitsSold.toLocaleString("en-IN")} units</span>
                </span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-muted-foreground">No product sales yet.</p>}
          </div>
        </ChartCard>

        <ChartCard title="Dealer Capacity" description="Live workload across active dealers">
          <div className="space-y-3">
            {dealerCapacity.map((d) => (
              <div key={d.businessName} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Gauge className="h-3.5 w-3.5" /> {d.businessName}
                  </span>
                  <span className="font-medium">{d.activeOrders} active · {d.capacityPercent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.capacityPercent}%`,
                      backgroundColor: d.status === "overloaded" ? "#F44336" : d.status === "moderate" ? "#FFC107" : "#4CAF50",
                    }}
                  />
                </div>
              </div>
            ))}
            {dealerCapacity.length === 0 && <p className="text-sm text-muted-foreground">No active dealers yet.</p>}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6">
        <ChartCard title="Category Revenue Comparison">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topCategories}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: number) => formatCompactINR(v)} width={56} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="revenue" name="Revenue" fill="#F44336" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
