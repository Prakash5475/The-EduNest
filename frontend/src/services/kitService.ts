import { apiClient } from "./apiClient";

export interface ApiKitImage {
  uploadedFile?: { filePath: string } | null;
}

export interface ApiKit {
  id: string;
  name: string;
  slug: string;
  ageGroup: string | null;
  description: string | null;
  kitCategory?: { name: string };
  kitImages?: ApiKitImage[];
  kitProducts: Array<{ quantity: number; isOptional: boolean; product: { id: string; name: string } }>;
  price: number | null;
  referencePrice: number;
}

export async function listKits(page = 1, limit = 20) {
  const { data, meta } = await apiClient.withMeta<ApiKit[]>("/kits", { query: { page, limit }, anonymous: true });
  return { items: data ?? [], meta };
}
