import { brandRepository } from '@/repositories/brand.repository';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { Brand } from '@prisma/client';

export class BrandService {
  async list(query: { isActive?: boolean; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(query.page, query.limit);
    const { items, total } = await brandRepository.list({
      isActive: query.isActive,
      search: query.search,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: bigint): Promise<Brand> {
    const brand = await brandRepository.findById(id);
    if (!brand) throw ApiError.notFound('Brand not found');
    return brand;
  }

  async create(data: { name: string; slug: string; logoFileId?: bigint; isActive: boolean }): Promise<Brand> {
    const existing = await brandRepository.findBySlug(data.slug);
    if (existing) throw ApiError.conflict('A brand with this slug already exists');
    return brandRepository.create(data);
  }

  async update(
    id: bigint,
    data: Partial<{ name: string; slug: string; logoFileId: bigint | null; isActive: boolean }>,
  ): Promise<Brand> {
    await this.getById(id);
    if (data.slug) {
      const existing = await brandRepository.findBySlug(data.slug);
      if (existing && existing.id !== id) throw ApiError.conflict('A brand with this slug already exists');
    }
    return brandRepository.update(id, data);
  }

  async delete(id: bigint): Promise<void> {
    await this.getById(id);
    const hasProducts = await brandRepository.hasProducts(id);
    if (hasProducts) throw ApiError.conflict('Cannot delete a brand that has products assigned to it');
    await brandRepository.delete(id);
  }
}

export const brandService = new BrandService();
