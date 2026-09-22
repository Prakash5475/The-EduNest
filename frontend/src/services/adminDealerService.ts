import { apiClient } from "./apiClient";
import type { Dealer, DealerType } from "@/types";

export interface ApiAdminDealer {
  id: string;
  uuid: string;
  businessName: string;
  dealerCode: string;
  businessType: string;
  gstin: string | null;
  panNumber: string | null;
  status: "active" | "inactive" | "pending_approval" | "blocked";
  creditLimit: string | number;
  outstandingBalance: string | number;
  averageRating: string | number;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
  dealerAddresses?: Array<{
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
  }>;
}

export function adaptAdminDealer(d: ApiAdminDealer): Dealer {
  const address = d.dealerAddresses?.[0];
  let type: DealerType = "Distributor";
  if (d.businessType === "wholesaler") type = "Wholesaler";
  if (d.businessType === "retailer") type = "Retailer";

  return {
    id: d.id,
    name: d.businessName,
    logo: d.businessName.substring(0, 2).toUpperCase(),
    city: address?.city ?? "Mumbai",
    state: address?.state ?? "Maharashtra",
    status: d.status === "active" ? "active" : "inactive",
    type,
    email: d.user?.email ?? "N/A",
    phone: d.user?.phone ?? "N/A",
    address: {
      line1: address?.addressLine1 ?? "Industrial Estate",
      city: address?.city ?? "Mumbai",
      state: address?.state ?? "Maharashtra",
      pincode: address?.pincode ?? "400001",
    },
    gstNumber: d.gstin ?? "N/A",
    establishedYear: 2018,
    creditLimit: Number(d.creditLimit ?? 100000),
    outstandingBalance: Number(d.outstandingBalance ?? 0),
    rating: Number(d.averageRating ?? 4.5),
  };
}

export async function listAdminDealers(filters?: { status?: string; search?: string; page?: number }) {
  const { data, meta } = await apiClient.withMeta<ApiAdminDealer[]>("/admin/dealers", {
    query: filters as Record<string, string | number | undefined>,
  });
  return {
    items: (data ?? []).map(adaptAdminDealer),
    meta: meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export interface CreateAdminDealerInput {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  businessName: string;
  dealerCode?: string;
  businessType?: string;
  gstin?: string;
  panNumber?: string;
  creditLimit?: number;
  status?: string;
}

export async function createAdminDealer(input: CreateAdminDealerInput) {
  const data = await apiClient.post<{ dealer: ApiAdminDealer }>("/admin/dealers", input);
  return adaptAdminDealer(data.dealer);
}

export async function updateAdminDealerStatus(id: string, status: string, reason?: string) {
  const data = await apiClient.patch<{ dealer: ApiAdminDealer }>(`/admin/dealers/${id}/status`, { status, reason });
  return adaptAdminDealer(data.dealer);
}

export async function updateAdminDealer(id: string, input: Partial<CreateAdminDealerInput>) {
  const { creditLimit: _creditLimit, password: _password, status: _status, dealerCode: _dealerCode, ...editableFields } = input;
  const data = await apiClient.patch<{ dealer: ApiAdminDealer }>(`/admin/dealers/${id}`, editableFields);
  return adaptAdminDealer(data.dealer);
}
