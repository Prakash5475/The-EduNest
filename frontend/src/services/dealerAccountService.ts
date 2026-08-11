import { apiClient } from "./apiClient";

export interface ApiDealerAddress {
  id: string;
  addressType: "registered" | "warehouse" | "billing";
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
}

export interface ApiDealerAccount {
  id: string;
  businessName: string;
  dealerCode: string;
  businessType: string;
  gstin: string | null;
  panNumber: string | null;
  status: string;
  averageRating: string;
  logoFile?: { filePath: string } | null;
  addresses: ApiDealerAddress[];
}

export async function getMyDealerAccount(): Promise<ApiDealerAccount> {
  const data = await apiClient.get<{ dealer: ApiDealerAccount }>("/dealer/me");
  return data.dealer;
}

export async function updateMyDealerAccount(input: {
  businessName?: string;
  gstin?: string;
  panNumber?: string;
}): Promise<ApiDealerAccount> {
  const data = await apiClient.patch<{ dealer: ApiDealerAccount }>("/dealer/me", input);
  return data.dealer;
}

export async function addDealerAddress(input: {
  addressType: "registered" | "warehouse" | "billing";
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}): Promise<ApiDealerAddress> {
  const data = await apiClient.post<{ address: ApiDealerAddress }>("/dealer/addresses", input);
  return data.address;
}
