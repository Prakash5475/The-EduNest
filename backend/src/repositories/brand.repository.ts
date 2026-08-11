import type { Prisma, Brand } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class BrandRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.brand.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.db.brand.findFirst({ where: { slug } });
  }

  async list(params: { isActive?: boolean; search?: string; skip: number; take: number }) {
    const where: Prisma.BrandWhereInput = {
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.search ? { name: { contains: params.search } } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.brand.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: params.skip,
        take: params.take,
        include: { _count: { select: { products: true } } },
      }),
      this.db.brand.count({ where }),
    ]);

    return { items, total };
  }

  create(data: Prisma.BrandCreateInput): Promise<Brand> {
    return this.db.brand.create({ data });
  }

  update(id: bigint, data: Prisma.BrandUpdateInput): Promise<Brand> {
    return this.db.brand.update({ where: { id }, data });
  }

  async hasProducts(id: bigint): Promise<boolean> {
    const count = await this.db.product.count({ where: { brandId: id, deletedAt: null } });
    return count > 0;
  }

  delete(id: bigint): Promise<Brand> {
    return this.db.brand.delete({ where: { id } });
  }
}

export const brandRepository = new BrandRepository();
