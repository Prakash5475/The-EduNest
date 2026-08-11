import type { Prisma, Category } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class CategoryRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.category.findFirst({ where: { id, deletedAt: null } });
  }

  findBySlug(slug: string) {
    return this.db.category.findFirst({ where: { slug, deletedAt: null } });
  }

  async list(params: {
    parentId?: bigint;
    isActive?: boolean;
    search?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.CategoryWhereInput = {
      deletedAt: null,
      ...(params.parentId !== undefined ? { parentId: params.parentId } : {}),
      ...(params.isActive !== undefined ? { isActive: params.isActive } : {}),
      ...(params.search ? { name: { contains: params.search } } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.category.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: params.skip,
        take: params.take,
        include: { _count: { select: { products: true, categories: true } } },
      }),
      this.db.category.count({ where }),
    ]);

    return { items, total };
  }

  /** Full active tree, used for nav/menu rendering. */
  async tree() {
    return this.db.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  create(data: Prisma.CategoryCreateInput): Promise<Category> {
    return this.db.category.create({ data });
  }

  update(id: bigint, data: Prisma.CategoryUpdateInput): Promise<Category> {
    return this.db.category.update({ where: { id }, data });
  }

  async hasChildren(id: bigint): Promise<boolean> {
    const count = await this.db.category.count({ where: { parentId: id, deletedAt: null } });
    return count > 0;
  }

  async hasProducts(id: bigint): Promise<boolean> {
    const count = await this.db.product.count({ where: { categoryId: id, deletedAt: null } });
    return count > 0;
  }

  softDelete(id: bigint): Promise<Category> {
    return this.db.category.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }
}

export const categoryRepository = new CategoryRepository();
