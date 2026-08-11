import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, CheckCheck, Circle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProductionTimeline } from "@/components/common/ProductionTimeline";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { paths } from "@/routes/paths";
import { getDealerOrder } from "@/services/dealerOrderService";
import { getProductionHistory, PRODUCTION_STAGE_ORDER } from "@/services/productionService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProductionStageEvent } from "@/types";

const ALL_STAGES = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const SHOWS_PRODUCTION_TIMELINE = ["processing", "shipped", "delivered"];

const STAGE_LABELS: Record<string, ProductionStageEvent["stage"]> = {
  order_received: "Order Received",
  cutting: "Cutting",
  stitching: "Stitching",
  logo: "Logo",
  printing: "Printing",
  color_matching: "Color Matching",
  quality_check: "Quality Check",
  ready: "Ready",
  packed: "Packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
};

export default function DealerTracking() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["dealer-order", id],
    queryFn: () => getDealerOrder(id as string),
    enabled: Boolean(id),
    retry: false,
  });

  const { data: productionHistory = [] } = useQuery({
    queryKey: ["order", id, "production"],
    queryFn: () => getProductionHistory(id as string),
    enabled: Boolean(id) && Boolean(order) && SHOWS_PRODUCTION_TIMELINE.includes(order?.status ?? ""),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        icon={ChevronLeft}
        title="Order not found"
        description="This order doesn't exist or isn't assigned to you."
        actionLabel="Back to Orders"
        onAction={() => (window.location.href = paths.dealer.orders)}
      />
    );
  }

  const completedStages = order.orderStatusHistory.map((t) => t.status);
  const isCancelled = order.status === "cancelled";
  const showsProduction = SHOWS_PRODUCTION_TIMELINE.includes(order.status);

  const productionStages = (Object.keys(STAGE_LABELS) as Array<keyof typeof STAGE_LABELS>).map((stage) => {
    const idx = PRODUCTION_STAGE_ORDER.indexOf(stage as (typeof PRODUCTION_STAGE_ORDER)[number]);
    const matching = productionHistory.find((h) => h.stage === stage);
    const latestReached = [...productionHistory].sort(
      (a, b) => PRODUCTION_STAGE_ORDER.indexOf(b.stage) - PRODUCTION_STAGE_ORDER.indexOf(a.stage),
    )[0];
    const reachedIdx = latestReached ? PRODUCTION_STAGE_ORDER.indexOf(latestReached.stage) : -1;
    return { stage: STAGE_LABELS[stage], completed: idx <= reachedIdx, date: matching?.createdAt };
  });

  return (
    <div>
      <Link to={paths.dealer.orders} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to Assigned Orders
      </Link>

      <PageHeader
        title={order.orderNumber}
        description={`Placed on ${formatDate(order.placedAt)} for ${order.school?.schoolName ?? "—"}`}
        actions={<StatusBadge status={order.status} className="text-sm" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="mb-6 font-display text-lg font-semibold">Order Timeline</p>

          {isCancelled ? (
            <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">This order was cancelled.</p>
          ) : (
            <ol className="space-y-0">
              {ALL_STAGES.map((stage, idx) => {
                const done = completedStages.includes(stage) || order.status === stage;
                const eventDate = order.orderStatusHistory.find((t) => t.status === stage)?.createdAt;
                const isLast = idx === ALL_STAGES.length - 1;
                const isProductionStage = stage === "processing" && showsProduction;
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
                    <div className="w-full pb-8">
                      <p className={`text-sm font-semibold capitalize ${done ? "text-foreground" : "text-muted-foreground"}`}>{stage}</p>
                      <p className="text-xs text-muted-foreground">{eventDate ? formatDate(eventDate) : "Pending"}</p>

                      {isProductionStage && (
                        <div className="mt-4 rounded-xl bg-muted/40 p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Production Progress
                          </p>
                          <ProductionTimeline stages={productionStages} />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card className="h-fit p-6">
          <p className="mb-4 text-sm font-semibold">Order Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Items</span>
              <span>{order.orderItems.length}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Sub Total</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold text-primary">
              <span>Total Amount</span>
              <span>{formatCurrency(Number(order.totalAmount))}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Payment Status</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

