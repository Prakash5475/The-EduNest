import { apiClient } from "./apiClient";

export type InvoiceStatus = "issued" | "paid" | "overdue" | "void";
export type InvoiceType = "advance_receipt" | "final_invoice";

export interface ApiInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  taxRate: string;
  lineTotal: string;
}

export interface ApiInvoice {
  id: string;
  uuid: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string | null;
  downloadUrl: string | null;
  invoiceItems: ApiInvoiceItem[];
  school: { id: string; schoolName: string; gstin: string | null };
  order: { id: string; orderNumber: string; status: string; payments: Array<{ id: string; method: string; status: string; transactionId: string | null }> };
}

export async function listAdminInvoices(page = 1, limit = 8, status?: InvoiceStatus, search?: string) {
  const { data, meta } = await apiClient.withMeta<ApiInvoice[]>("/admin/invoices", {
    query: { page, limit, status, search },
  });
  return { items: data ?? [], meta };
}

export async function getAdminInvoice(id: string): Promise<ApiInvoice> {
  const data = await apiClient.get<{ invoice: ApiInvoice }>(`/admin/invoices/${id}`);
  return data.invoice;
}

export interface InvoiceSummaryRow {
  status: InvoiceStatus;
  count: number;
  totalAmount: number;
}

export async function getInvoiceSummary(): Promise<InvoiceSummaryRow[]> {
  const data = await apiClient.get<{ byStatus: InvoiceSummaryRow[] }>("/admin/invoices/summary");
  return data.byStatus;
}

export async function sendInvoice(id: string): Promise<{ sent: boolean; to: string }> {
  return apiClient.post<{ sent: boolean; to: string }>(`/admin/invoices/${id}/send`);
}
