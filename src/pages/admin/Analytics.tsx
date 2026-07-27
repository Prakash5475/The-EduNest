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
} from "recharts";
import { Wallet, ShoppingCart, FileText, Building2, Store, Download, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orderStats } from "@/data/orders";
import { revenueOverview, categorySales, monthlySalesComparison, topPerformingSchools, analyticsSummary } from "@/data/analytics";
import { activityFeed } from "@/data/notifications";
import { formatCurrency, formatCompactINR } from "@/lib/utils";
import {
  BarChart,
  Bar,
} from "recharts";

const ORDER_STATUS_DATA = [
  { name: "Delivered", value: orderStats.delivered, color: "#4CAF50" },
  { name: "Processing", value: orderStats.processing, color: "#1976D2" },
  { name: "Pending", value: orderStats.pending, color: "#FFC107" },
  { name: "Cancelled", value: orderStats.cancelled, color: "#F44336" },
];

export default function Analytics() {
  return (
    <div>
      <PageHeader
        title="Analytics Overview"
        description="Real-time insights and performance summary of your business."
        actions={
          <>
            <Button variant="outline" size="sm">
              20 May 2024 – 26 May 2024
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" /> Export Report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Revenue"
          value={formatCompactINR(analyticsSummary.totalRevenue)}
          changePct={analyticsSummary.revenueChangePct}
          icon={Wallet}
          iconColorClass="bg-success/10 text-success"
        />
        <StatCard
          label="Total Orders"
          value={String(analyticsSummary.totalOrders)}
          changePct={analyticsSummary.ordersChangePct}
          icon={ShoppingCart}
          iconColorClass="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Total Quotations"
          value={String(analyticsSummary.totalQuotations)}
          changePct={analyticsSummary.quotationsChangePct}
          icon={FileText}
          iconColorClass="bg-primary/10 text-primary"
        />
        <StatCard
          label="Total Schools"
          value={String(analyticsSummary.totalSchools)}
          changePct={analyticsSummary.schoolsChangePct}
          icon={Building2}
          iconColorClass="bg-accent/20 text-edu-gray"
        />
        <StatCard
          label="Total Dealers"
          value={String(analyticsSummary.totalDealers)}
          changePct={analyticsSummary.dealersChangePct}
          icon={Store}
          iconColorClass="bg-destructive/10 text-destructive"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Revenue Overview" description="This Week" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueOverview}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F44336" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#F44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickFormatter={(v: number) => formatCompactINR(v)}
                width={56}
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#F44336" strokeWidth={2.5} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sales by Category" description="This Week">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categorySales} dataKey="value" nameKey="category" innerRadius={62} outerRadius={92} paddingAngle={2}>
                {categorySales.map((entry) => (
                  <Cell key={entry.category} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {categorySales.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.category}
                </span>
                <span className="font-medium">{c.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Top Performing Schools">
          <div className="space-y-3">
            {topPerformingSchools.map((s) => (
              <div key={s.school} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.school}</span>
                <span className="font-semibold">{formatCurrency(s.revenue)}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            View All Schools
          </Button>
        </ChartCard>

        <ChartCard title="Orders Status">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ORDER_STATUS_DATA} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                {ORDER_STATUS_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <Button variant="outline" size="sm" className="mt-2 w-full">
            View All Orders
          </Button>
        </ChartCard>

        <ChartCard title="Recent Activity">
          <div className="space-y-4">
            {activityFeed.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                <span className="text-muted-foreground">{item.text}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{item.timestamp}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            View All Activity
          </Button>
        </ChartCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <ChartCard title="Monthly Sales Comparison" description="May 2024">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlySalesComparison}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: number) => formatCompactINR(v)} width={56} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar dataKey="thisMonth" name="This Month" fill="#F44336" radius={[6, 6, 0, 0]} />
              <Bar dataKey="lastMonth" name="Last Month" fill="#E0E0E0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="flex flex-col justify-center gap-3 bg-primary/5 p-6">
          <Lightbulb className="h-6 w-6 text-primary" />
          <p className="text-sm text-foreground">
            You've earned <span className="font-semibold text-primary">{analyticsSummary.revenueChangePct}% more revenue</span> this week
            compared to last week. Keep it up!
          </p>
        </Card>
      </div>

    </div>
  );
}
