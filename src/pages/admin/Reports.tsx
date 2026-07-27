import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Wallet, ShoppingCart, FileText, Receipt, CreditCard, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { revenueOverview, categorySales, topPerformingSchools, analyticsSummary } from "@/data/analytics";
import { invoiceStats } from "@/data/invoices";
import { paymentStats } from "@/data/payments";
import { formatCurrency, formatCompactINR } from "@/lib/utils";

const businessOverview = revenueOverview.map((r, idx) => ({
  date: r.date,
  Revenue: r.revenue,
  Orders: 90 + idx * 8,
  Quotations: 60 + idx * 5,
}));

const POPULAR_REPORTS = [
  { title: "Sales Report", description: "Detailed sales and revenue report", icon: Wallet },
  { title: "Orders Report", description: "Summary of all customer orders", icon: ShoppingCart },
  { title: "Payments Report", description: "Payment collections and status", icon: CreditCard },
  { title: "School Report", description: "Performance report by schools", icon: FileText },
  { title: "Dealer Report", description: "Dealer performance and sales", icon: Receipt },
];

const RECENT_REPORTS = [
  { title: "Sales Report (20 May – 26 May 2024)", generated: "Generated on 26 May 2024, 10:30 AM" },
  { title: "Orders Report (20 May – 26 May 2024)", generated: "Generated on 26 May 2024, 10:15 AM" },
  { title: "Payments Report (20 May – 26 May 2024)", generated: "Generated on 26 May 2024, 10:00 AM" },
  { title: "School Performance Report (May 2024)", generated: "Generated on 25 May 2024, 06:45 PM" },
  { title: "Dealer Report (May 2024)", generated: "Generated on 25 May 2024, 06:30 PM" },
];

export default function Reports() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and analyze detailed reports of your business."
        actions={<Button className="gap-2">Generate Report</Button>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select defaultValue="week">
          <SelectTrigger className="w-56"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">20 May 2024 – 26 May 2024</SelectItem>
            <SelectItem value="month">May 2024</SelectItem>
            <SelectItem value="quarter">Q2 2024</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-schools">
          <SelectTrigger className="w-40"><SelectValue placeholder="Schools" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-schools">All Schools</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-dealers">
          <SelectTrigger className="w-40"><SelectValue placeholder="Dealers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-dealers">All Dealers</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-categories">
          <SelectTrigger className="w-44"><SelectValue placeholder="Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">All Categories</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Revenue" value={formatCompactINR(analyticsSummary.totalRevenue)} changePct={18.6} icon={Wallet} iconColorClass="bg-success/10 text-success" />
        <StatCard label="Total Orders" value={String(analyticsSummary.totalOrders)} changePct={12.4} icon={ShoppingCart} iconColorClass="bg-secondary/10 text-secondary" />
        <StatCard label="Total Quotations" value={String(analyticsSummary.totalQuotations)} changePct={8.7} icon={FileText} iconColorClass="bg-primary/10 text-primary" />
        <StatCard label="Total Invoices" value={String(invoiceStats.total)} changePct={14.2} icon={Receipt} iconColorClass="bg-accent/20 text-edu-gray" />
        <StatCard label="Total Payments" value={formatCompactINR(paymentStats.totalCollected)} changePct={16.3} icon={CreditCard} iconColorClass="bg-destructive/10 text-destructive" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Business Overview Report" description="This Week" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={businessOverview}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: number) => formatCompactINR(v)} width={56} />
              <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} fontSize={12} width={40} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Bar yAxisId="left" dataKey="Revenue" fill="#1976D2" radius={[6, 6, 0, 0]} barSize={28} />
              <Line yAxisId="right" type="monotone" dataKey="Orders" stroke="#4CAF50" strokeWidth={2.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="Quotations" stroke="#9C27B0" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="p-5">
          <p className="mb-4 font-display text-base font-semibold">Report Summary</p>
          <div className="space-y-3 text-sm">
            <SummaryRow label="Total Revenue" value={formatCurrency(analyticsSummary.totalRevenue)} />
            <SummaryRow label="Total Orders" value={String(analyticsSummary.totalOrders)} />
            <SummaryRow label="Total Quotations" value={String(analyticsSummary.totalQuotations)} />
            <SummaryRow label="Total Invoices" value={String(invoiceStats.total)} />
            <SummaryRow label="Total Payments" value={formatCurrency(paymentStats.totalCollected)} />
            <SummaryRow label="Outstanding Amount" value={formatCurrency(240000)} valueClassName="text-destructive" />
          </div>
          <Button variant="outline" size="sm" className="mt-5 w-full">
            View Detailed Summary
          </Button>

          <div className="mt-6 rounded-xl bg-primary/5 p-4">
            <p className="text-sm font-semibold">Scheduled Reports</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Automate your reports and get insights delivered to your email.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Schedule New Report
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Top Performing Schools Report">
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
                {topPerformingSchools.map((s, idx) => (
                  <tr key={s.school}>
                    <td className="py-2.5 text-muted-foreground">{idx + 1}</td>
                    <td className="py-2.5 font-medium">{s.school}</td>
                    <td className="py-2.5 text-muted-foreground">{s.orders}</td>
                    <td className="py-2.5 text-right font-semibold">{formatCurrency(s.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            View Full School Report
          </Button>
        </ChartCard>

        <ChartCard title="Revenue by Category Report">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categorySales} dataKey="value" nameKey="category" innerRadius={55} outerRadius={82} paddingAngle={2}>
                {categorySales.map((c) => (
                  <Cell key={c.category} fill={c.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            View Full Category Report
          </Button>
        </ChartCard>

        <ChartCard title="Popular Reports">
          <div className="space-y-1">
            {POPULAR_REPORTS.map(({ title, description, icon: Icon }) => (
              <button
                key={title}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Recent Generated Reports" className="mt-6">
        <div className="divide-y divide-border">
          {RECENT_REPORTS.map((r) => (
            <div key={r.title} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.generated}</p>
              </div>
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={`Download ${r.title}`}>
                <Download className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full">
          View All Reports
        </Button>
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
