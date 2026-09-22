import { apiClient } from "./apiClient";

export type PaymentStatus = "initiated" | "pending" | "success" | "failed" | "refunded";
export type PaymentType = "advance" | "balance" | "full" | "refund";

export interface ApiPayment {
  id: string;
  amount: string;
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  gateway: string | null;
  gatewayReference: string | null;
  createdAt: string;
  school?: { id: string; schoolName: string };
  order?: { id: string; orderNumber: string } | null;
  paymentTransactions: Array<{ id: string; transactionType: string; amount: string; status: string; createdAt: string }>;
}

export interface PaymentSummary {
  byStatus: Array<{ status: PaymentStatus; count: number; totalAmount: number }>;
  totalRefunded: number;
}

export async function listAdminPayments(page = 1, limit = 8, status?: PaymentStatus, search?: string) {
  const { data, meta } = await apiClient.withMeta<ApiPayment[]>("/admin/payments", {
    query: { page, limit, status, search },
  });
  return { items: data ?? [], meta };
}

export async function getAdminPayment(id: string): Promise<ApiPayment> {
  const data = await apiClient.get<{ payment: ApiPayment }>(`/admin/payments/${id}`);
  return data.payment;
}

export async function getPaymentSummary(): Promise<PaymentSummary> {
  return apiClient.get<PaymentSummary>("/admin/payments/summary");
}

export async function recordManualPayment(
  orderId: string,
  input: { amount: number; paymentType: "advance" | "balance" | "full"; reference?: string; notes?: string }
) {
  return apiClient.post(`/admin/payments/orders/${orderId}/record`, input);
}

export async function refundPayment(paymentId: string, amount?: number, reason?: string) {
  return apiClient.post(`/payments/${paymentId}/refund`, { amount, reason });
}
