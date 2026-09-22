import { apiClient } from "./apiClient";

export type QuotationRequestStatus = "open" | "in_review" | "quoted" | "closed" | "expired";
export type DealerQuotationStatus = "submitted" | "shortlisted" | "accepted" | "rejected" | "withdrawn";

export interface ApiQuotationRequestProduct {
  id: string;
  productId: string | null;
  kitId: string | null;
  customItemName: string | null;
  customItemDescription: string | null;
  customItemSchoolPrice: string | null;
  customItemDealerPrice: string | null;
  quantity: number;
  product?: { id: string; name: string } | null;
  kit?: { id: string; name: string } | null;
}

export interface ApiDealerQuotationItem {
  id: string;
  quotationRequestProductId: string;
  dealerUnitPrice: string;
  quotedQuantity: number;
  quotationRequestProduct?: ApiQuotationRequestProduct;
}

export interface ApiDealerQuotation {
  id: string;
  dealerId: string;
  dealer?: { id: string; businessName: string };
  totalAmount: string;
  validityDays: number;
  notes: string | null;
  status: DealerQuotationStatus;
  submittedAt: string;
  expectedCompletionDate: string | null;
  dealerQuotationItems: ApiDealerQuotationItem[];
}

export interface ApiQuotationRequest {
  id: string;
  uuid: string;
  requestNumber: string;
  title: string | null;
  notes: string | null;
  status: QuotationRequestStatus;
  createdAt: string;
  school?: { id: string; schoolName: string; schoolCode: string };
  quotationRequestProducts: ApiQuotationRequestProduct[];
  dealerQuotations: ApiDealerQuotation[];
}

export interface CreateQuotationItemInput {
  productId?: string;
  kitId?: string;
  customItemName?: string;
  customItemDescription?: string;
  customItemSchoolPrice?: number;
  customItemDealerPrice?: number;
  quantity: number;
}

export interface CreateQuotationPayload {
  title?: string;
  notes?: string;
  items: CreateQuotationItemInput[];
  /** Admin-only: create the request on behalf of this school. */
  schoolId?: string;
}

export interface AssignDealerInput {
  dealerId: string;
  itemIds: string[];
  validityDays?: number;
  notes?: string;
}

export async function listAdminQuotations(
  page = 1,
  limit = 8,
  status?: QuotationRequestStatus,
  schoolId?: string
) {
  const { data, meta } = await apiClient.withMeta<ApiQuotationRequest[]>("/quotation-requests/admin", {
    query: { page, limit, status, schoolId },
  });
  return { items: data ?? [], meta };
}

export async function getAdminQuotation(id: string): Promise<ApiQuotationRequest> {
  const data = await apiClient.get<{ request: ApiQuotationRequest }>(`/quotation-requests/${id}`);
  return data.request;
}

export async function createAdminQuotation(payload: CreateQuotationPayload): Promise<ApiQuotationRequest> {
  const data = await apiClient.post<{ request: ApiQuotationRequest }>("/quotation-requests", payload);
  return data.request;
}

export async function assignDealersToQuotation(
  requestId: string,
  assignments: AssignDealerInput[]
): Promise<ApiDealerQuotation[]> {
  const data = await apiClient.post<{ dealerQuotations: ApiDealerQuotation[] }>(
    `/quotation-requests/${requestId}/assign`,
    { assignments }
  );
  return data.dealerQuotations;
}
