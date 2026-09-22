import { apiClient } from "./apiClient";
import type { ApiOrderDetail } from "./orderService";

export async function listAllOrders(page = 1, limit = 8, status?: string) {
  const { data, meta } = await apiClient.withMeta<ApiOrderDetail[]>("/admin/orders", {
    query: { page, limit, status },
  });
  return { items: data ?? [], meta };
}

export async function getAdminOrder(id: string): Promise<ApiOrderDetail> {
  const data = await apiClient.get<{ order: ApiOrderDetail }>(`/admin/orders/${id}`);
  return data.order;
}

export async function assignOrderDealer(id: string, dealerId: string): Promise<ApiOrderDetail> {
  const data = await apiClient.post<{ order: ApiOrderDetail }>(`/admin/orders/${id}/assign-dealer`, { dealerId });
  return data.order;
}

export async function overrideOrderStatus(
  id: string,
  status: string,
  reason: string,
  note?: string,
): Promise<ApiOrderDetail> {
  const data = await apiClient.post<{ order: ApiOrderDetail }>(`/admin/orders/${id}/override-status`, {
    status,
    reason,
    note,
  });
  return data.order;
}
