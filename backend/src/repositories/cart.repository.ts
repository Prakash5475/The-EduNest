import type { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

const cartInclude = {
  cartItems: {
    include: {
      product: {
        include: { productImages: { orderBy: { displayOrder: 'asc' as const }, take: 1, include: { uploadedFile: { select: { filePath: true } } } } },
      },
      kit: {
        include: { kitImages: { orderBy: { displayOrder: 'asc' as const }, take: 1, include: { uploadedFile: { select: { filePath: true } } } } },
      },
      productVariant: true,
      dealer: { select: { id: true, businessName: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.ShoppingCartInclude;

export class CartRepository extends BaseRepository {
  findActiveBySchool(schoolId: bigint) {
    return this.db.shoppingCart.findFirst({
      where: { schoolId, status: 'active' },
      include: cartInclude,
    });
  }

  createActive(schoolId: bigint) {
    return this.db.shoppingCart.create({ data: { schoolId, status: 'active' }, include: cartInclude });
  }

  findByIdWithItems(cartId: bigint) {
    return this.db.shoppingCart.findUnique({ where: { id: cartId }, include: cartInclude });
  }

  findItem(cartId: bigint, itemId: bigint) {
    return this.db.cartItem.findFirst({ where: { id: itemId, cartId } });
  }

  findExistingLine(cartId: bigint, productId: bigint, variantId: bigint | null, dealerId: bigint | null) {
    return this.db.cartItem.findFirst({
      where: { cartId, itemType: 'product', productId, variantId, dealerId },
    });
  }

  findExistingKitLine(cartId: bigint, kitId: bigint) {
    return this.db.cartItem.findFirst({ where: { cartId, itemType: 'kit', kitId } });
  }

  addItem(data: {
    cartId: bigint;
    productId: bigint;
    variantId?: bigint;
    dealerId?: bigint;
    quantity: number;
    unitPriceSnapshot: number;
  }) {
    return this.db.cartItem.create({
      data: { ...data, itemType: 'product' },
    });
  }

  addKitItem(data: { cartId: bigint; kitId: bigint; quantity: number; unitPriceSnapshot: number }) {
    return this.db.cartItem.create({ data: { ...data, itemType: 'kit' } });
  }

  incrementItemQuantity(itemId: bigint, byQty: number) {
    return this.db.cartItem.update({ where: { id: itemId }, data: { quantity: { increment: byQty } } });
  }

  updateItemQuantity(itemId: bigint, quantity: number) {
    return this.db.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }

  updateKitLine(itemId: bigint, quantity: number, unitPriceSnapshot: number) {
    return this.db.cartItem.update({ where: { id: itemId }, data: { quantity, unitPriceSnapshot } });
  }

  removeItem(itemId: bigint) {
    return this.db.cartItem.delete({ where: { id: itemId } });
  }

  clearItems(cartId: bigint) {
    return this.db.cartItem.deleteMany({ where: { cartId } });
  }

  markConverted(cartId: bigint) {
    return this.db.shoppingCart.update({ where: { id: cartId }, data: { status: 'converted' } });
  }
}

export const cartRepository = new CartRepository();
