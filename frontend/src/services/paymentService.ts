import { apiClient } from "./apiClient";

export interface InitiatePaymentResult {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  paymentType: "advance" | "balance" | "full";
}

export async function initiatePayment(
  orderId: string,
  amountType: "advance" | "full" | "balance",
): Promise<InitiatePaymentResult> {
  return apiClient.post<InitiatePaymentResult>("/payments/initiate", { orderId, amountType });
}

export async function verifyPayment(
  paymentId: string,
  payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
) {
  return apiClient.post(`/payments/${paymentId}/verify`, payload);
}

export async function requestRefund(paymentId: string, amount?: number, reason?: string) {
  return apiClient.post<{ requested: boolean; razorpayRefundId: string; amount: number }>(
    `/payments/${paymentId}/refund`,
    { amount, reason },
  );
}

export interface PaymentHistoryRow {
  id: string;
  orderId: string;
  amount: string;
  paymentType: string;
  status: string;
  gateway: string;
  createdAt: string;
}

export async function listPaymentHistory(page = 1, limit = 20) {
  const { data, meta } = await apiClient.withMeta<PaymentHistoryRow[]>("/payments/history", {
    query: { page, limit },
  });
  return { items: data ?? [], meta };
}
