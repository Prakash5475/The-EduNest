import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Boxes, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ProductionTimeline } from "@/components/common/ProductionTimeline";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { listDealerOrders, updateDealerOrderStatus } from "@/services/dealerOrderService";
import { getProductionHistory, addProductionCheckpoint, PRODUCTION_STAGE_ORDER } from "@/services/productionService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ProductionStageEvent } from "@/types";

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
const ADVANCEABLE_STAGES = Object.keys(STAGE_LABELS) as Array<keyof typeof STAGE_LABELS>;

function QueueCard({ order }: { order: { id: string; orderNumber: string; status: string; school?: { schoolName: string } | null; placedAt: string; totalAmount: string } }) {
  const queryClient = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ["order", order.id, "production"],
    queryFn: () => getProductionHistory(order.id),
  });

  const latestStage = [...history].sort(
    (a, b) => PRODUCTION_STAGE_ORDER.indexOf(b.stage) - PRODUCTION_STAGE_ORDER.indexOf(a.stage),
  )[0]?.stage;
  const currentIdx = latestStage ? ADVANCEABLE_STAGES.indexOf(latestStage as never) : -1;
  const nextStage = ADVANCEABLE_STAGES[currentIdx + 1];

  const advanceMutation = useMutation({
    mutationFn: () =>
      addProductionCheckpoint(order.id, {
        stage: nextStage as (typeof PRODUCTION_STAGE_ORDER)[number],
        completionPercentage: Math.round(((currentIdx + 2) / ADVANCEABLE_STAGES.length) * 100),
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["order", order.id, "production"] });
      // Once dispatched, also flip the order status itself to "shipped".
      if (nextStage === "dispatched" && order.status === "processing") {
        await updateDealerOrderStatus(order.id, "shipped");
        queryClient.invalidateQueries({ queryKey: ["dealer-orders"] });
      }
      toast.success(`Marked as ${STAGE_LABELS[nextStage]}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update production status"),
  });

  const stages = ADVANCEABLE_STAGES.map((stage, idx) => ({
    stage: STAGE_LABELS[stage],
    completed: idx <= currentIdx,
    date: history.find((h) => h.stage === stage)?.createdAt,
  }));

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold">{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {order.school?.schoolName ?? "—"} · Ordered {formatDate(order.placedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{formatCurrency(Number(order.totalAmount))}</span>
          <StatusBadge status={order.status} />
        </div>
      </div>
      <ProductionTimeline stages={stages} />
      {nextStage && (
        <div className="mt-5 flex justify-end">
          <Button size="sm" className="gap-1.5" onClick={() => advanceMutation.mutate()} disabled={advanceMutation.isPending}>
            Mark as {STAGE_LABELS[nextStage]} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function DealerProductionQueue() {
  const { data, isLoading } = useQuery({
    queryKey: ["dealer-orders", "production-queue"],
    queryFn: () => listDealerOrders(1, 50),
  });

  const queue = (data?.items ?? []).filter((o) => o.status === "processing" || o.status === "confirmed");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Production Queue" description="Track every stage of production for your assigned orders." />

      {queue.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Nothing in production right now"
          description="Orders will appear here once they move into production."
        />
      ) : (
        <div className="space-y-6">
          {queue.map((o) => (
            <QueueCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}

