import { PRODUCTION_STAGES, type Order, type ProductionStageEvent } from "@/types";

/**
 * Returns the production stage list for an order. Uses explicit
 * `productionStages` data when present (see src/data/orders.ts); otherwise
 * derives a reasonable approximation from the order's high-level status so
 * every order can render the same timeline UI while the backend's
 * stage-by-stage production feed is still being built.
 */
export function getProductionStages(order: Order): ProductionStageEvent[] {
  if (order.productionStages) return order.productionStages;

  const statusToCompletedCount: Record<string, number> = {
    Pending: 0,
    Confirmed: 1,
    Processing: 4,
    Shipped: 9,
    Delivered: 11,
    Cancelled: 0,
  };

  const completedCount = statusToCompletedCount[order.status] ?? 0;

  return PRODUCTION_STAGES.map((stage, idx) => ({
    stage,
    completed: idx < completedCount,
  }));
}
