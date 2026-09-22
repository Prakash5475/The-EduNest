import { apiClient } from "./apiClient";

export interface ApiWishlistItem {
  id: string;
  productId: string | null;
  product?: {
    id: string;
    name: string;
    basePrice: string;
    productImages?: Array<{ uploadedFile?: { filePath: string } | null }>;
  } | null;
}

export interface ApiWishlist {
  id: string;
  wishlistItems: ApiWishlistItem[];
}

export async function getWishlist(): Promise<ApiWishlist> {
  const data = await apiClient.get<{ wishlist: ApiWishlist }>("/wishlist");
  return data.wishlist;
}

export async function addToWishlist(productId: string): Promise<ApiWishlist> {
  const data = await apiClient.post<{ wishlist: ApiWishlist }>("/wishlist/items", { productId });
  return data.wishlist;
}

export async function removeFromWishlist(itemId: string): Promise<ApiWishlist> {
  const data = await apiClient.delete<{ wishlist: ApiWishlist }>(`/wishlist/items/${itemId}`);
  return data.wishlist;
}

export async function moveWishlistItemToCart(itemId: string, quantity?: number): Promise<ApiWishlist> {
  const data = await apiClient.post<{ wishlist: ApiWishlist }>(`/wishlist/items/${itemId}/move-to-cart`, { quantity });
  return data.wishlist;
}
