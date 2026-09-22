import { apiClient } from "./apiClient";

export interface ApiQuotationRequestProduct {
  id: string;
  quantity: number;
  customItemDescription: string | null;
  product?: { id: string; name: string } | null;
  kit?: { id: string; name: string } | null;
}

export interface ApiDealerQuotationItem {
  id: string;
  dealerUnitPrice: string;
  quotedQuantity: number;
  quotationRequestProduct: ApiQuotationRequestProduct;
}

export interface ApiDealerQuotation {
  id: string;
  totalAmount: string;
  validityDays: number;
  notes: string | null;
  status: "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn";
  submittedAt: string;
  expectedCompletionDate: string | null;
  dealer?: { id: string; businessName: string };
  dealerQuotationItems: ApiDealerQuotationItem[];
  quotationRequest?: { id: string; requestNumber: string; title: string | null };
}

export async function listMyDealerQuotations(page = 1, limit = 20) {
  const { data, meta } = await apiClient.withMeta<ApiDealerQuotation[]>("/quotation-requests/dealer/mine", {
    query: { page, limit },
  });
  return { items: data ?? [], meta };
}

export async function getDealerQuotation(id: string): Promise<ApiDealerQuotation> {
  const data = await apiClient.get<{ dealerQuotation: ApiDealerQuotation }>(`/quotation-requests/dealer/${id}`);
  return data.dealerQuotation;
}

export async function updateDealerQuotation(
  id: string,
  input: {
    items?: Array<{ itemId: string; dealerUnitPrice?: number; quotedQuantity?: number }>;
    validityDays?: number;
    notes?: string;
    expectedCompletionDate?: string;
  },
): Promise<ApiDealerQuotation> {
  const data = await apiClient.patch<{ dealerQuotation: ApiDealerQuotation }>(`/quotation-requests/dealer/${id}`, input);
  return data.dealerQuotation;
}
