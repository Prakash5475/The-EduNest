import { apiClient } from "./apiClient";

export interface ApiAddress {
  id: string;
  addressType: "registered" | "billing" | "shipping" | "branch";
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
}

export interface AddressInput {
  addressType: "registered" | "billing" | "shipping" | "branch";
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
}

export async function listAddresses(): Promise<ApiAddress[]> {
  const data = await apiClient.get<{ addresses: ApiAddress[] }>("/addresses");
  return data.addresses;
}

export async function createAddress(input: AddressInput): Promise<ApiAddress> {
  const data = await apiClient.post<{ address: ApiAddress }>("/addresses", input);
  return data.address;
}

export interface ApiShippingMethod {
  id: string;
  name: string;
  rate: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export async function listShippingMethods(): Promise<ApiShippingMethod[]> {
  const data = await apiClient.get<{ shippingMethods: ApiShippingMethod[] }>("/shipping-methods");
  return data.shippingMethods;
}

export interface ApiOrder {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  paymentStatus: string;
}

export async function submitCheckout(input: {
  billingAddressId: string;
  shippingAddressId: string;
  shippingMethodId: string;
  couponCode?: string;
}): Promise<ApiOrder> {
  const data = await apiClient.post<{ order: ApiOrder }>("/checkout", input);
  return data.order;
}
