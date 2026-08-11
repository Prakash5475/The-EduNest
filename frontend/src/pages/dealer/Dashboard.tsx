import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Wallet, Boxes, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { listMyDealerQuotations } from "@/services/dealerQuotationService";
import { getDealerDashboard } from "@/services/dealerDashboardService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { paths } from "@/routes/paths";

export default function DealerDashboard() {
  const { user } = useAuth();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dealer-dashboard"],
    queryFn: getDealerDashboard,
  });
  const { data: quotationData } = useQuery({
    queryKey: ["dealer-quotations", "dashboard"],
    queryFn: () => listMyDealerQuotations(1, 5),
  });

  if (isLoading || !dashboard) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const { capacity, recentOrders, recentCheckpoints } = dashboard;
  const inProduction = recentOrders.filter((o) => o.status === "processing");
  const revenue = recentOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const quotations = quotationData?.items ?? [];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.fullName ?? "Dealer"}`}
        description="Here's what's happening with your assigned orders today."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Active Orders" value={String(capacity.activeOrders)} icon={ShoppingCart} iconColorClass="bg-secondary/10 text-secondary" />
        <StatCard label="In Production" value={String(capacity.ordersInProduction)} icon={Boxes} iconColorClass="bg-primary/10 text-primary" />
        <StatCard label="Recent Revenue" value={formatCurrency(revenue)} icon={Wallet} iconColorClass="bg-success/10 text-success" />
        <StatCard label="Near Deadline" value={String(capacity.nearDeadlineOrders)} icon={AlertTriangle} iconColorClass="bg-destructive/10 text-destructive" />
      </div>

      <Card className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-base font-semibold">Your Capacity</p>
            <p className="text-xs text-muted-foreground">
              {capacity.activeOrders} active orders
              {capacity.averageProductionDays !== null && ` · ~${capacity.averageProductionDays}d avg. production time`}
            </p>
          </div>
          <Badge
            className={
              capacity.status === "overloaded"
                ? "border-transparent bg-destructive/10 text-destructive capitalize"
                : capacity.status === "moderate"
                  ? "border-transparent bg-warning/15 text-warning capitalize"
                  : "border-transparent bg-success/10 text-success capitalize"
            }
          >
            {capacity.status}
          </Badge>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${capacity.status === "overloaded" ? "bg-destructive" : capacity.status === "moderate" ? "bg-warning" : "bg-success"}`}
            style={{ width: `${Math.min(100, capacity.capacityPercent)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{capacity.recommendation}</p>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Orders in Production" className="lg:col-span-2">
          <div className="space-y-3">
            {inProduction.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders currently in production.</p>
            ) : (
              inProduction.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-border p-4">
                  <div>
                    <p className="text-sm font-semibold">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{o.school?.schoolName ?? "—"}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))
            )}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
            <Link to={paths.dealer.productionQueue}>View Production Queue</Link>
          </Button>
        </ChartCard>

        <ChartCard title="Recent Quotations">
          <div className="space-y-3">
            {quotations.slice(0, 5).map((q) => (
              <div key={q.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">#{q.id}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(q.submittedAt)}</p>
                </div>
                <StatusBadge status={q.status} />
              </div>
            ))}
            {quotations.length === 0 && <p className="text-sm text-muted-foreground">No quotations yet.</p>}
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full" asChild>
            <Link to={paths.dealer.quotations}>View All Quotations</Link>
          </Button>
        </ChartCard>
      </div>

      <ChartCard title="Recently Assigned Orders" className="mt-6">
        <div className="divide-y divide-border">
          {recentOrders.slice(0, 5).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {o.status === "delivered" || o.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <p className="font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{o.school?.schoolName ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCurrency(Number(o.totalAmount))}</span>
                <StatusBadge status={o.status} />
              </div>
            </div>
          ))}
          {recentOrders.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No orders assigned yet.</p>}
        </div>
      </ChartCard>

      {recentCheckpoints.length > 0 && (
        <ChartCard title="Recent Production Activity" className="mt-6">
          <div className="divide-y divide-border">
            {recentCheckpoints.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium capitalize">{c.stage.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{c.order.orderNumber}</p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}

