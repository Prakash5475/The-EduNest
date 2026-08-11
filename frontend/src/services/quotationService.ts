import { apiClient } from "./apiClient";

export interface QuotationItemInput {
  productId?: string;
  kitId?: string;
  customItemDescription?: string;
  quantity: number;
}

export interface QuotationRequestInput {
  title?: string;
  notes?: string;
  items: QuotationItemInput[];
}

export interface ApiQuotationRequest {
  id: string;
  requestNumber: string;
  status: string;
  createdAt: string;
}

export async function createQuotationRequest(input: QuotationRequestInput): Promise<ApiQuotationRequest> {
  const data = await apiClient.post<{ request: ApiQuotationRequest }>("/quotation-requests", input);
  return data.request;
}

export async function listMyQuotationRequests(page = 1, limit = 20) {
  const { data, meta } = await apiClient.withMeta<ApiQuotationRequest[]>("/quotation-requests", {
    query: { page, limit },
  });
  return { items: data ?? [], meta };
}
