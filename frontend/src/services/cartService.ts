import { apiClient } from "./apiClient";

export interface ApiCartItem {
  id: string;
  quantity: number;
  unitPriceSnapshot: string;
  productId: string | null;
  variantId: string | null;
  dealerId: string | null;
  product?: {
    id: string;
    name: string;
    minOrderQty: number;
    productImages?: Array<{ uploadedFile?: { filePath: string } | null }>;
  } | null;
  productVariant?: { attributeSummary: string | null } | null;
  dealer?: { id: string; businessName: string } | null;
}

export interface ApiCart {
  id: string;
  status: string;
  cartItems: ApiCartItem[];
  subtotal: number;
  itemCount: number;
}

export async function getCart(): Promise<ApiCart> {
  const data = await apiClient.get<{ cart: ApiCart }>("/cart");
  return data.cart;
}

export async function addCartItem(input: { productId?: string; kitId?: string; variantId?: string; dealerId?: string; quantity: number }): Promise<ApiCart> {
  const data = await apiClient.post<{ cart: ApiCart }>("/cart/items", input);
  return data.cart;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<ApiCart> {
  const data = await apiClient.patch<{ cart: ApiCart }>(`/cart/items/${itemId}`, { quantity });
  return data.cart;
}

export async function removeCartItem(itemId: string): Promise<ApiCart> {
  const data = await apiClient.delete<{ cart: ApiCart }>(`/cart/items/${itemId}`);
  return data.cart;
}

export async function clearCartApi(): Promise<ApiCart> {
  const data = await apiClient.delete<{ cart: ApiCart }>("/cart");
  return data.cart;
}

export async function previewCoupon(code: string): Promise<{ discount: number; message: string }> {
  return apiClient.post("/cart/coupon-preview", { code });
}
