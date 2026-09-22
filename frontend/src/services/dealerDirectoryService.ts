import { apiClient } from "./apiClient";

export interface ApiDealerListing {
  id: string;
  businessName: string;
  businessType: "manufacturer" | "distributor" | "wholesaler" | "retailer";
  averageRating: string;
  logoFile?: { filePath: string } | null;
  dealerAddresses?: Array<{ city: string; state: string }>;
}

export async function listDealers(page = 1, limit = 20, businessType?: string) {
  const { data, meta } = await apiClient.withMeta<ApiDealerListing[]>("/dealers", {
    query: { page, limit, businessType },
    anonymous: true,
  });
  return { items: data ?? [], meta };
}
