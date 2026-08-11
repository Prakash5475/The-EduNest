import { categoryRepository } from '@/repositories/category.repository';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { Category } from '@prisma/client';

export interface CategoryListQuery {
  parentId?: bigint;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class CategoryService {
  async list(query: CategoryListQuery) {
    const { page, limit, skip, take } = normalizePagination(query.page, query.limit);
    const { items, total } = await categoryRepository.list({
      parentId: query.parentId,
      isActive: query.isActive,
      search: query.search,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async tree() {
    const flat = await categoryRepository.tree();
    const byId = new Map(flat.map((c) => [c.id.toString(), { ...c, children: [] as typeof flat }]));
    const roots: typeof flat = [];
    for (const cat of flat) {
      const node = byId.get(cat.id.toString())!;
      if (cat.parentId && byId.has(cat.parentId.toString())) {
        byId.get(cat.parentId.toString())!.children.push(node as unknown as (typeof flat)[number]);
      } else {
        roots.push(node as unknown as (typeof flat)[number]);
      }
    }
    return roots;
  }

  async getById(id: bigint): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  async getBySlug(slug: string): Promise<Category> {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  }

  async create(data: {
    name: string;
    slug: string;
    parentId?: bigint;
    iconFileId?: bigint;
    displayOrder: number;
    isActive: boolean;
  }): Promise<Category> {
    const existing = await categoryRepository.findBySlug(data.slug);
    if (existing) throw ApiError.conflict('A category with this slug already exists');
    if (data.parentId) {
      const parent = await categoryRepository.findById(data.parentId);
      if (!parent) throw ApiError.badRequest('Parent category not found');
    }
    return categoryRepository.create({
      name: data.name,
      slug: data.slug,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      ...(data.parentId ? { category: { connect: { id: data.parentId } } } : {}),
    });
  }

  async update(
    id: bigint,
    data: Partial<{
      name: string;
      slug: string;
      parentId: bigint | null;
      iconFileId: bigint | null;
      displayOrder: number;
      isActive: boolean;
    }>,
  ): Promise<Category> {
    await this.getById(id);
    if (data.slug) {
      const existing = await categoryRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) throw ApiError.conflict('A category with this slug already exists');
    }
    if (data.parentId === id) throw ApiError.badRequest('A category cannot be its own parent');

    const { parentId, ...rest } = data;
    return categoryRepository.update(id, {
      ...rest,
      ...(parentId !== undefined
        ? parentId === null
          ? { category: { disconnect: true } }
          : { category: { connect: { id: parentId } } }
        : {}),
    });
  }

  async delete(id: bigint): Promise<void> {
    await this.getById(id);
    const [hasChildren, hasProducts] = await Promise.all([
      categoryRepository.hasChildren(id),
      categoryRepository.hasProducts(id),
    ]);
    if (hasChildren) throw ApiError.conflict('Cannot delete a category that has subcategories');
    if (hasProducts) throw ApiError.conflict('Cannot delete a category that has products assigned to it');
    await categoryRepository.softDelete(id);
  }
}

export const categoryService = new CategoryService();
