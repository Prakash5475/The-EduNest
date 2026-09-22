import type { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

const wishlistInclude = {
  wishlistItems: {
    include: {
      product: {
        include: {
          productImages: { orderBy: { displayOrder: 'asc' as const }, take: 1, include: { uploadedFile: { select: { filePath: true } } } },
          inventory: true,
        },
      },
    },
    orderBy: { addedAt: 'desc' as const },
  },
} satisfies Prisma.WishlistInclude;

const DEFAULT_WISHLIST_NAME = 'Default';

export class WishlistRepository extends BaseRepository {
  findDefaultBySchool(schoolId: bigint) {
    return this.db.wishlist.findFirst({
      where: { schoolId, name: DEFAULT_WISHLIST_NAME },
      include: wishlistInclude,
    });
  }

  createDefault(schoolId: bigint) {
    return this.db.wishlist.create({
      data: { schoolId, name: DEFAULT_WISHLIST_NAME },
      include: wishlistInclude,
    });
  }

  findItem(wishlistId: bigint, itemId: bigint) {
    return this.db.wishlistItem.findFirst({ where: { id: itemId, wishlistId } });
  }

  findByProduct(wishlistId: bigint, productId: bigint) {
    return this.db.wishlistItem.findFirst({ where: { wishlistId, productId } });
  }

  addItem(wishlistId: bigint, productId: bigint) {
    return this.db.wishlistItem.create({ data: { wishlistId, productId } });
  }

  removeItem(itemId: bigint) {
    return this.db.wishlistItem.delete({ where: { id: itemId } });
  }
}

export const wishlistRepository = new WishlistRepository();
