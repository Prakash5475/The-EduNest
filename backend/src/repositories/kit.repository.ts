import type { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

const publicInclude = {
  kitCategory: { select: { id: true, name: true, slug: true } },
  kitImages: { orderBy: { displayOrder: 'asc' as const }, include: { uploadedFile: { select: { filePath: true } } } },
  kitProducts: { include: { product: { select: { id: true, name: true, basePrice: true } } } },
  kitPricing: { orderBy: { minQuantity: 'asc' as const } },
} satisfies Prisma.KitInclude;

export class KitRepository extends BaseRepository {
  async listActive(skip: number, take: number, kitCategorySlug?: string) {
    const where: Prisma.KitWhereInput = {
      status: 'active',
      deletedAt: null,
      ...(kitCategorySlug ? { kitCategory: { slug: kitCategorySlug } } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.kit.findMany({ where, include: publicInclude, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.kit.count({ where }),
    ]);
    return { items, total };
  }

  findActiveById(id: bigint) {
    return this.db.kit.findFirst({ where: { id, status: 'active', deletedAt: null }, include: publicInclude });
  }

  findActiveBySlug(slug: string) {
    return this.db.kit.findFirst({ where: { slug, status: 'active', deletedAt: null }, include: publicInclude });
  }
}

export const kitRepository = new KitRepository();

/** Resolves the applicable price-per-unit for a given order quantity, honoring effective date windows. */
export function resolveKitUnitPrice(
  pricingTiers: Array<{ minQuantity: number; pricePerUnit: unknown; effectiveFrom: Date; effectiveTo: Date | null }>,
  quantity: number,
): number | null {
  const now = new Date();
  const applicable = pricingTiers
    .filter((t) => t.minQuantity <= quantity && t.effectiveFrom <= now && (!t.effectiveTo || t.effectiveTo >= now))
    .sort((a, b) => b.minQuantity - a.minQuantity);
  return applicable[0] ? Number(applicable[0].pricePerUnit) : null;
}
