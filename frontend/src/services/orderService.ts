import { apiClient } from "./apiClient";

export interface ApiOrderItem {
  id: string;
  itemType: "product" | "kit";
  itemNameSnapshot: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface ApiOrderStatusEvent {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

export interface ApiOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  priority: string;
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  shippingAmount: string;
  totalAmount: string;
  currency: string;
  placedAt: string;
  expectedDeliveryDate: string | null;
  remainingDays: number | null;
  orderItems: ApiOrderItem[];
  orderStatusHistory: ApiOrderStatusEvent[];
  dealer?: { id: string; businessName: string } | null;
  school?: { id: string; schoolName: string } | null;
  invoices?: Array<{ id: string; invoiceNumber: string; uploadedFile?: { filePath: string } | null }>;
}

export async function listOrders(page = 1, limit = 10, status?: string) {
  const { data, meta } = await apiClient.withMeta<ApiOrderDetail[]>("/orders", {
    query: { page, limit, status },
  });
  return { items: data ?? [], meta };
}

export async function getOrder(id: string): Promise<ApiOrderDetail> {
  const data = await apiClient.get<{ order: ApiOrderDetail }>(`/orders/${id}`);
  return data.order;
}

export async function cancelOrder(id: string, reason?: string): Promise<ApiOrderDetail> {
  const data = await apiClient.post<{ order: ApiOrderDetail }>(`/orders/${id}/cancel`, { reason });
  return data.order;
}

export async function reorder(id: string) {
  return apiClient.post(`/orders/${id}/reorder`, {});
}
