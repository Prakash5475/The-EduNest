import { apiClient } from "./apiClient";
import type { ApiOrderDetail } from "./orderService";

export interface DealerCapacitySnapshot {
  dealerId: string;
  businessName: string;
  activeOrders: number;
  ordersInProduction: number;
  nearDeadlineOrders: number;
  overdueOrders: number;
  pendingDeliveries: number;
  completedOrders: number;
  averageProductionDays: number | null;
  capacityPercent: number;
  status: "available" | "moderate" | "overloaded";
  recommendation: string;
}

export interface DealerDashboardData {
  capacity: DealerCapacitySnapshot;
  recentOrders: ApiOrderDetail[];
  recentCheckpoints: Array<{
    id: string;
    stage: string;
    completionPercentage: number;
    createdAt: string;
    order: { id: string; orderNumber: string };
  }>;
}

export async function getDealerDashboard(): Promise<DealerDashboardData> {
  return apiClient.get<DealerDashboardData>("/dealer/dashboard");
}
