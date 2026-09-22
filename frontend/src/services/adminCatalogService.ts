import { apiClient } from "./apiClient";

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface CategoryInput {
  name: string;
  slug: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface BrandInput {
  name: string;
  slug: string;
  isActive?: boolean;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const { data } = await apiClient.withMeta<AdminCategory[]>("/categories", { query: { limit: 100 } });
  return data ?? [];
}

export async function createCategory(input: CategoryInput): Promise<AdminCategory> {
  const data = await apiClient.post<{ category: AdminCategory }>("/categories", input);
  return data.category;
}

export async function updateCategory(id: string, input: Partial<CategoryInput>): Promise<AdminCategory> {
  const data = await apiClient.patch<{ category: AdminCategory }>(`/categories/${id}`, input);
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}

export async function listAdminBrands(): Promise<AdminBrand[]> {
  const { data } = await apiClient.withMeta<AdminBrand[]>("/brands", { query: { limit: 100 } });
  return data ?? [];
}

export async function createBrand(input: BrandInput): Promise<AdminBrand> {
  const data = await apiClient.post<{ brand: AdminBrand }>("/brands", input);
  return data.brand;
}

export async function updateBrand(id: string, input: Partial<BrandInput>): Promise<AdminBrand> {
  const data = await apiClient.patch<{ brand: AdminBrand }>(`/brands/${id}`, input);
  return data.brand;
}

export async function deleteBrand(id: string): Promise<void> {
  await apiClient.delete(`/brands/${id}`);
}
