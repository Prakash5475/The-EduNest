import { useParams, Link, Navigate } from "react-router-dom";
import { ChevronLeft, CheckCheck, Download, MessageCircle, Circle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { paths } from "@/routes/paths";
import { orders } from "@/data/orders";
import { getDealerName } from "@/utils/lookups";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const ALL_STAGES: OrderStatus[] = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return <Navigate to={paths.portal.orders} replace />;
  }

  const completedStages = order.timeline.map((t) => t.status);
  const isCancelled = order.status === "Cancelled";

  return (
    <div>
      <Link to={paths.portal.orders} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <PageHeader
        title={order.id}
        description={`Placed on ${formatDate(order.orderDate)} with ${getDealerName(order.dealerId)}`}
        actions={
          <>
            <StatusBadge status={order.status} className="text-sm" />
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Invoice
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="mb-6 font-display text-lg font-semibold">Order Timeline</p>

          {isCancelled ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
              This order was cancelled. Contact Support Center for assistance.
            </p>
          ) : (
            <ol className="space-y-0">
              {ALL_STAGES.map((stage, idx) => {
                const done = completedStages.includes(stage);
                const eventDate = order.timeline.find((t) => t.status === stage)?.date;
                const isLast = idx === ALL_STAGES.length - 1;
                return (
                  <li key={stage} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          done ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? <CheckCheck className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                      </span>
                      {!isLast && <span className={`mt-1 h-12 w-px flex-1 ${done ? "bg-success/40" : "bg-border"}`} />}
                    </div>
                    <div className="pb-8">
                      <p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{stage}</p>
                      <p className="text-xs text-muted-foreground">{eventDate ? formatDate(eventDate) : "Pending"}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="mb-4 text-sm font-semibold">Order Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Items</span>
                <span>{order.itemsCount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Sub Total</span>
                <span>{formatCurrency(order.subTotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span>-{order.discountPct}%</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST</span>
                <span>{order.gstPct}%</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-primary">
                <span>Total Amount</span>
                <span>{formatCurrency(order.amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Amount Paid</span>
                <span className="text-success">{formatCurrency(order.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Amount Due</span>
                <span>{formatCurrency(order.amount - order.amountPaid)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="mb-2 text-sm font-semibold">Need help with this order?</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Our support team can help with delays, damages, or invoice queries.
            </p>
            <Button variant="outline" className="w-full gap-2" asChild>
              <Link to={paths.portal.support}>
                <MessageCircle className="h-4 w-4" /> Contact Support
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
