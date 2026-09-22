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
  totals: { schools: number; dealers: number; orders: number; quotations: number };
}

export interface TopSchoolRow {
  schoolId: string;
  schoolName: string;
  revenue: number;
  orderCount: number;
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

export async function getTopSchools(limit = 10): Promise<TopSchoolRow[]> {
  const data = await apiClient.get<{ items: TopSchoolRow[] }>("/admin/dashboard/top-schools", { query: { limit } });
  return data.items;
}

export interface PaymentMethodRow {
  method: string;
  amount: number;
  count: number;
}

export async function getPaymentMethodBreakdown(): Promise<PaymentMethodRow[]> {
  const data = await apiClient.get<{ items: PaymentMethodRow[] }>("/admin/dashboard/payment-methods");
  return data.items;
}

export interface DealerCapacityRow {
  businessName: string;
  activeOrders: number;
  capacityPercent: number;
  status: "available" | "moderate" | "overloaded";
}

export async function getDealerCapacity(): Promise<DealerCapacityRow[]> {
  const data = await apiClient.get<{ dealers: DealerCapacityRow[] }>("/admin/dashboard/dealer-capacity");
  return data.dealers;
}

export async function getRevenueTrend(months = 6): Promise<RevenueTrendPoint[]> {
  const data = await apiClient.get<{ trend: RevenueTrendPoint[] }>("/admin/dashboard/revenue-trend", { query: { months } });
  return data.trend;
}
