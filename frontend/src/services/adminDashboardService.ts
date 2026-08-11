import { apiClient } from "./apiClient";
import type { ApiOrderDetail } from "./orderService";

export interface AdminDashboardSummary {
  revenue: { today: number; thisMonth: number; allTime: number };
  orders: { byStatus: Record<string, number>; byPriority: Record<string, number>; late: number; nearDeadline: number };
  payments: { outstandingBalance: number };
  production: { inProgress: number };
  dealers: { byStatus: Record<string, number> };
  quotations: { pendingReview: number; pendingAssignment: number };
  inventory: { lowStockCount: number };
  recentOrders: ApiOrderDetail[];
  unreadAdminNotifications: number;
}

export interface TopProductRow {
  product: { id: string; name: string; sku: string } | null;
  unitsSold: number;
  revenue: number;
}

export interface TopCategoryRow {
  category: string;
  unitsSold: number;
  revenue: number;
}

export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  return apiClient.get<AdminDashboardSummary>("/admin/dashboard/summary");
}

export async function getTopProducts(limit = 10): Promise<TopProductRow[]> {
  const data = await apiClient.get<{ items: TopProductRow[] }>("/admin/dashboard/top-products", { query: { limit } });
  return data.items;
}

export async function getTopCategories(limit = 10): Promise<TopCategoryRow[]> {
  const data = await apiClient.get<{ items: TopCategoryRow[] }>("/admin/dashboard/top-categories", { query: { limit } });
  return data.items;
}

export async function getRevenueTrend(months = 6): Promise<RevenueTrendPoint[]> {
  const data = await apiClient.get<{ trend: RevenueTrendPoint[] }>("/admin/dashboard/revenue-trend", { query: { months } });
  return data.trend;
}
