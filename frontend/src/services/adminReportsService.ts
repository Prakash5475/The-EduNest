import { apiClient } from "./apiClient";

export interface DateRange {
  from?: string;
  to?: string;
}

export interface OrdersReport {
  totalOrders: number;
  totalValue: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: string;
    placedAt: string;
    school?: { id: string; schoolName: string } | null;
  }>;
}

export interface PaymentsReport {
  totalCollected: number;
  byType: Record<string, { amount: number; count: number }>;
  byStatus: Record<string, number>;
  payments: Array<{ id: string; amount: string; status: string; paymentType: string; createdAt: string }>;
}

export interface GstReport {
  totalTaxCollected: number;
  totalTaxableValue: number;
  orders: Array<{ id: string; orderNumber: string; taxAmount: string; subtotal: string; totalAmount: string; placedAt: string }>;
}

export interface InvoicesReport {
  totalInvoices: number;
  totalAmount: number;
  byType: { advanceReceipts: number; finalInvoices: number };
  invoices: Array<{ id: string; invoiceNumber: string; totalAmount: string; issuedAt: string; invoiceType: string }>;
}

export interface DealerPerformanceRow {
  dealerId: string;
  businessName: string;
  averageRating: number;
  completedOrders: number;
  cancelledOrders: number;
  lateOrders: number;
}

export interface QuotationsReport {
  total: number;
  byStatus: Record<string, number>;
  conversionRate: number;
}

export async function getOrdersReport(range: DateRange = {}): Promise<OrdersReport> {
  return apiClient.get<OrdersReport>("/reports/orders", { query: range as Record<string, string> });
}
export async function getPaymentsReport(range: DateRange = {}): Promise<PaymentsReport> {
  return apiClient.get<PaymentsReport>("/reports/payments", { query: range as Record<string, string> });
}
export async function getGstReport(range: DateRange = {}): Promise<GstReport> {
  return apiClient.get<GstReport>("/reports/gst", { query: range as Record<string, string> });
}
export async function getInvoicesReport(range: DateRange = {}): Promise<InvoicesReport> {
  return apiClient.get<InvoicesReport>("/reports/invoices", { query: range as Record<string, string> });
}
export async function getDealerPerformanceReport(): Promise<{ dealers: DealerPerformanceRow[] }> {
  return apiClient.get<{ dealers: DealerPerformanceRow[] }>("/reports/dealer-performance");
}
export async function getQuotationsReport(range: DateRange = {}): Promise<QuotationsReport> {
  return apiClient.get<QuotationsReport>("/reports/quotations", { query: range as Record<string, string> });
}
