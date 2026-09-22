import { apiClient } from "./apiClient";
import type { ApiOrderDetail } from "./orderService";

export async function listDealerOrders(page = 1, limit = 10, status?: string) {
  const { data, meta } = await apiClient.withMeta<ApiOrderDetail[]>("/dealer/orders", {
    query: { page, limit, status },
  });
  return { items: data ?? [], meta };
}

export async function getDealerOrder(id: string): Promise<ApiOrderDetail> {
  const data = await apiClient.get<{ order: ApiOrderDetail }>(`/dealer/orders/${id}`);
  return data.order;
}

export async function updateDealerOrderStatus(
  id: string,
  status: "confirmed" | "processing" | "shipped",
  note?: string,
): Promise<ApiOrderDetail> {
  const data = await apiClient.patch<{ order: ApiOrderDetail }>(`/dealer/orders/${id}/status`, { status, note });
  return data.order;
}
