import { apiClient } from "./apiClient";

export const PRODUCTION_STAGE_ORDER = [
  "order_received",
  "cutting",
  "stitching",
  "logo",
  "printing",
  "color_matching",
  "quality_check",
  "ready",
  "packed",
  "dispatched",
  "delivered",
  "completed",
] as const;

export interface ApiProductionCheckpoint {
  id: string;
  stage: (typeof PRODUCTION_STAGE_ORDER)[number];
  completionPercentage: number;
  notes: string | null;
  createdAt: string;
}

export async function getProductionHistory(orderId: string): Promise<ApiProductionCheckpoint[]> {
  const data = await apiClient.get<{ history: ApiProductionCheckpoint[] }>(`/orders/${orderId}/production`);
  return data.history;
}

export async function addProductionCheckpoint(
  orderId: string,
  input: { stage: (typeof PRODUCTION_STAGE_ORDER)[number]; completionPercentage: number; notes?: string },
): Promise<ApiProductionCheckpoint> {
  const data = await apiClient.post<{ checkpoint: ApiProductionCheckpoint }>(`/orders/${orderId}/production`, {
    ...input,
    imageFileIds: [],
  });
  return data.checkpoint;
}
