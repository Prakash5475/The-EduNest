import { BaseRepository } from './base.repository';

const recentlyViewedInclude = {
  product: {
    include: { productImages: { orderBy: { displayOrder: 'asc' as const }, take: 1 }, category: true, brand: true },
  },
};

export class RecentlyViewedRepository extends BaseRepository {
  /** Upserts the view timestamp — @@unique([schoolId, productId]) keeps one row per product. */
  recordView(schoolId: bigint, productId: bigint) {
    return this.db.recentlyViewed.upsert({
      where: { schoolId_productId: { schoolId, productId } },
      create: { schoolId, productId },
      update: { viewedAt: new Date() },
    });
  }

  listRecent(schoolId: bigint, limit: number) {
    return this.db.recentlyViewed.findMany({
      where: { schoolId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: recentlyViewedInclude,
    });
  }
}

export const recentlyViewedRepository = new RecentlyViewedRepository();
