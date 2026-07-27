import { Link } from "react-router-dom";
import { ShoppingBag, Gift, Heart, Wallet, ArrowRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/cards/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { paths } from "@/routes/paths";
import { orders } from "@/data/orders";
import { rewardsSummary } from "@/data/rewards";
import { events } from "@/data/events";
import { useWishlist } from "@/context/WishlistContext";
import { currentSchool, getDealerName } from "@/utils/lookups";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PortalDashboard() {
  const { ids: wishlistIds } = useWishlist();
  const schoolOrders = orders.filter((o) => o.schoolId === currentSchool.id);
  const recentOrders = [...schoolOrders].sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1)).slice(0, 4);
  const totalSpend = schoolOrders.reduce((sum, o) => sum + o.amount, 0);
  const upcomingEvents = events.filter((e) => e.registered).slice(0, 2);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${currentSchool.name}`}
        description="Here's what's happening with your account."
        actions={
          <Button asChild className="gap-2">
            <Link to={paths.shop}>
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={String(schoolOrders.length)} icon={ShoppingBag} iconColorClass="bg-secondary/10 text-secondary" />
        <StatCard label="Total Spend" value={formatCurrency(totalSpend)} icon={Wallet} iconColorClass="bg-success/10 text-success" />
        <StatCard label="Reward Points" value={rewardsSummary.currentPoints.toLocaleString("en-IN")} icon={Gift} iconColorClass="bg-accent/20 text-edu-gray" />
        <StatCard label="Wishlist Items" value={String(wishlistIds.length)} icon={Heart} iconColorClass="bg-primary/10 text-primary" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Recent Orders</p>
            <Button variant="outline" size="sm" asChild>
              <Link to={paths.portal.orders}>View All</Link>
            </Button>
          </div>
          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No orders placed yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={paths.portal.orderTracking(order.id)}
                  className="flex items-center justify-between gap-3 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-primary">{order.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {getDealerName(order.dealerId)} · {formatDate(order.orderDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-semibold">{formatCurrency(order.amount)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Reward Status</p>
            <Gift className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-display font-semibold text-primary">{rewardsSummary.currentPoints.toLocaleString("en-IN")}</p>
          <p className="text-sm text-muted-foreground">{rewardsSummary.tier}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{
                width: `${Math.min(
                  100,
                  (rewardsSummary.currentPoints / (rewardsSummary.currentPoints + rewardsSummary.pointsToNextTier)) * 100
                )}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {rewardsSummary.pointsToNextTier.toLocaleString("en-IN")} points to {rewardsSummary.nextTier}
          </p>
          <Button variant="outline" size="sm" className="mt-5 w-full" asChild>
            <Link to={paths.portal.rewards}>View Rewards</Link>
          </Button>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Upcoming Events You've Registered For</p>
            <Button variant="outline" size="sm" asChild>
              <Link to={paths.portal.events}>View All</Link>
            </Button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events registered.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarDays className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(e.date)} · {e.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex flex-col justify-center gap-3 bg-primary/5 p-6">
          <p className="text-sm font-semibold">Need something urgently?</p>
          <p className="text-xs text-muted-foreground">
            Request a quotation and our team will source the best dealer pricing within 24 hours.
          </p>
          <Button size="sm" asChild className="mt-1">
            <Link to={paths.requestQuotation}>Request Quotation</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
