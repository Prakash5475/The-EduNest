import { apiClient } from "./apiClient";
import type { Product, StockStatus } from "@/types";

// ---------------------------------------------------------------------------
// Raw backend shapes (subset of fields we actually use — the API returns more).
// ---------------------------------------------------------------------------
interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  _count?: { products: number };
}

interface ApiBrand {
  id: string;
  name: string;
  slug: string;
}

interface ApiProductImage {
  id: string;
  isPrimary: boolean;
  uploadedFile?: { filePath: string; fileName: string } | null;
}

interface ApiInventoryRow {
  quantityAvailable: number;
  quantityReserved: number;
  reorderLevel: number;
}

interface ApiProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  brandId: string | null;
  shortDescription: string | null;
  description: string | null;
  basePrice: string;
  mrp: string | null;
  minOrderQty: number;
  status: "draft" | "active" | "inactive" | "discontinued";
  isFeatured: boolean;
  isCustomizable: boolean;
  avgRating: string;
  createdAt: string;
  category?: ApiCategory;
  brand?: ApiBrand | null;
  productImages?: ApiProductImage[];
  inventory?: ApiInventoryRow[];
  availability?: { quantityAvailable: number; inStock: boolean };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isCustomizable?: boolean;
  inStockOnly?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "bestseller" | "rating";
}

function deriveStockStatus(product: ApiProduct): StockStatus {
  const totalAvailable =
    product.availability?.quantityAvailable ??
    (product.inventory ?? []).reduce((sum, i) => sum + Math.max(0, i.quantityAvailable - i.quantityReserved), 0);
  const reorderLevel = (product.inventory ?? [])[0]?.reorderLevel ?? 0;
  if (totalAvailable <= 0) return "out-of-stock";
  if (reorderLevel > 0 && totalAvailable <= reorderLevel) return "low-stock";
  return "in-stock";
}

function deriveTag(product: ApiProduct): Product["tag"] {
  const ageInDays = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays <= 30) return "New Arrival";
  if (product.isFeatured) return "Recommend";
  if (Number(product.avgRating) >= 4.5) return "Popular";
  return undefined;
}

export function adaptProduct(p: ApiProduct): Product {
  const images = (p.productImages ?? [])
    .map((img) => img.uploadedFile?.filePath)
    .filter((url): url is string => Boolean(url));

  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    brand: p.brand?.name ?? "EduNest",
    category: p.category?.name ?? "General",
    subCategory: "",
    price: Number(p.basePrice),
    images: images.length > 0 ? images : ["/placeholder-product.png"],
    status: p.status === "active" ? "active" : "inactive",
    stockStatus: deriveStockStatus(p),
    stockQuantity: p.availability?.quantityAvailable ?? 0,
    minOrderQty: p.minOrderQty,
    unit: "pcs",
    hsnCode: "",
    description: p.description ?? p.shortDescription ?? "",
    tag: deriveTag(p),
  };
}

export async function listProducts(filters: ProductFilters = {}) {
  const { data, meta } = await apiClient.withMeta<ApiProduct[]>("/products", {
    query: filters as Record<string, string | number | boolean | undefined>,
    anonymous: true,
  });
  const items = data ?? [];
  return { items: items.map(adaptProduct), meta };
}

export async function getProductBySlug(slug: string): Promise<Product> {
  const data = await apiClient.get<{ product: ApiProduct }>(`/products/slug/${encodeURIComponent(slug)}`, {
    anonymous: true,
  });
  return adaptProduct(data.product);
}

export async function getProductById(id: string): Promise<Product> {
  const data = await apiClient.get<{ product: ApiProduct }>(`/products/${id}`, { anonymous: true });
  return adaptProduct(data.product);
}

export async function getRelatedProducts(id: string): Promise<Product[]> {
  const data = await apiClient.get<{ products: ApiProduct[] }>(`/products/${id}/related`, { anonymous: true });
  return (data.products ?? []).map(adaptProduct);
}

export interface CategoryNode {
  name: string;
  slug: string;
  children: CategoryNode[];
}

export async function listCategoryNames(): Promise<string[]> {
  const { data } = await apiClient.withMeta<ApiCategory[]>("/categories", {
    query: { isActive: true, limit: 100 },
    anonymous: true,
  });
  return (data ?? []).filter((c) => !c.parentId).map((c) => c.name);
}

export interface CategoryWithCount {
  name: string;
  slug: string;
  productCount: number;
}

export async function listTopCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const { data } = await apiClient.withMeta<ApiCategory[]>("/categories", {
    query: { isActive: true, limit: 100 },
    anonymous: true,
  });
  return (data ?? [])
    .filter((c) => !c.parentId)
    .map((c) => ({ name: c.name, slug: c.slug, productCount: c._count?.products ?? 0 }));
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export async function listCategoriesForForm(): Promise<CategoryOption[]> {
  const { data } = await apiClient.withMeta<ApiCategory[]>("/categories", { query: { limit: 100 }, anonymous: true });
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
}

export interface BrandOption {
  id: string;
  name: string;
}

export async function listBrandsForForm(): Promise<BrandOption[]> {
  const { data } = await apiClient.withMeta<BrandOption[]>("/brands", { query: { limit: 100 }, anonymous: true });
  return data ?? [];
}

export interface AdminProductInput {
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  brandId?: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  mrp?: number;
  minOrderQty: number;
  status: "draft" | "active" | "inactive" | "discontinued";
  isFeatured?: boolean;
  isCustomizable?: boolean;
  quantityAvailable?: number;
  reorderLevel?: number;
  images?: Array<{ fileId: string; isPrimary?: boolean; displayOrder?: number }>;
}

export async function createAdminProduct(input: AdminProductInput) {
  const data = await apiClient.post<{ product: ApiProduct }>("/products", input);
  return adaptProduct(data.product);
}

export async function updateAdminProduct(id: string, input: Partial<AdminProductInput>) {
  const data = await apiClient.patch<{ product: ApiProduct }>(`/products/${id}`, input);
  return adaptProduct(data.product);
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export async function getCategorySlugMap(): Promise<Record<string, string>> {
  const { data } = await apiClient.withMeta<ApiCategory[]>("/categories", {
    query: { limit: 100 },
    anonymous: true,
  });
  const map: Record<string, string> = {};
  for (const c of data ?? []) map[c.name] = c.slug;
  return map;
}
