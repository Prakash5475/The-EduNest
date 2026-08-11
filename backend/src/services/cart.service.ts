import { cartRepository } from '@/repositories/cart.repository';
import { productRepository } from '@/repositories/product.repository';
import { productService } from '@/services/product.service';
import { kitRepository, resolveKitUnitPrice } from '@/repositories/kit.repository';
import { prisma } from '@/config/database';
import { ApiError } from '@/utils/ApiError';
import type { School } from '@prisma/client';

function lineTotal(item: { quantity: number; unitPriceSnapshot: unknown }): number {
  return item.quantity * Number(item.unitPriceSnapshot);
}

function summarize(cart: { cartItems: Array<{ quantity: number; unitPriceSnapshot: unknown }> }) {
  const subtotal = cart.cartItems.reduce((sum, item) => sum + lineTotal(item), 0);
  const itemCount = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  return { subtotal, itemCount };
}

export class CartService {
  /** Every school has at most one `active` cart at a time — fetched or created lazily. */
  async getOrCreateActiveCart(school: School) {
    const existing = await cartRepository.findActiveBySchool(school.id);
    if (existing) return existing;
    return cartRepository.createActive(school.id);
  }

  async getCart(school: School) {
    const cart = await this.getOrCreateActiveCart(school);
    return { ...cart, ...summarize(cart) };
  }

  async addItem(
    school: School,
    input: { productId?: bigint; kitId?: bigint; variantId?: bigint; dealerId?: bigint; quantity: number },
  ) {
    if (input.kitId) return this.addKitItem(school, input.kitId, input.quantity);
    if (!input.productId) throw ApiError.badRequest('productId or kitId is required');

    // MOQ is enforced server-side regardless of what the frontend sends.
    const product = await productService.validateOrderQuantity(input.productId, input.quantity);
    if (product.status !== 'active') {
      throw ApiError.badRequest('This product is not currently available for purchase');
    }

    let unitPrice = Number(product.basePrice);
    if (input.variantId) {
      const variant = await productRepository.findVariantById(input.productId, input.variantId);
      if (!variant) throw ApiError.badRequest('Selected variant does not belong to this product');
      if (!variant.isActive) throw ApiError.badRequest('Selected variant is not currently available');
      unitPrice += Number(variant.priceDelta);
    }

    const cart = await this.getOrCreateActiveCart(school);

    const existingLine = await cartRepository.findExistingLine(
      cart.id,
      input.productId,
      input.variantId ?? null,
      input.dealerId ?? null,
    );

    if (existingLine) {
      const newQty = existingLine.quantity + input.quantity;
      await productService.validateOrderQuantity(input.productId, newQty);
      await cartRepository.incrementItemQuantity(existingLine.id, input.quantity);
    } else {
      await cartRepository.addItem({
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId,
        dealerId: input.dealerId,
        quantity: input.quantity,
        unitPriceSnapshot: unitPrice,
      });
    }

    return this.getCart(school);
  }

  private async addKitItem(school: School, kitId: bigint, quantity: number) {
    const kit = await kitRepository.findActiveById(kitId);
    if (!kit) throw ApiError.notFound('Kit not found or no longer available');

    const unitPrice = resolveKitUnitPrice(kit.kitPricing, quantity);
    if (unitPrice === null) {
      throw ApiError.badRequest(`No pricing available for a quantity of ${quantity} for this kit`);
    }

    const cart = await this.getOrCreateActiveCart(school);
    const existingLine = await cartRepository.findExistingKitLine(cart.id, kitId);

    if (existingLine) {
      const newQty = existingLine.quantity + quantity;
      const newUnitPrice = resolveKitUnitPrice(kit.kitPricing, newQty) ?? unitPrice;
      await cartRepository.updateKitLine(existingLine.id, newQty, newUnitPrice);
    } else {
      await cartRepository.addKitItem({ cartId: cart.id, kitId, quantity, unitPriceSnapshot: unitPrice });
    }

    return this.getCart(school);
  }

  async updateItemQuantity(school: School, itemId: bigint, quantity: number) {
    const cart = await this.getOrCreateActiveCart(school);
    const item = await cartRepository.findItem(cart.id, itemId);
    if (!item) throw ApiError.notFound('Cart item not found');
    if (item.productId) {
      await productService.validateOrderQuantity(item.productId, quantity);
    }
    await cartRepository.updateItemQuantity(itemId, quantity);
    return this.getCart(school);
  }

  async removeItem(school: School, itemId: bigint) {
    const cart = await this.getOrCreateActiveCart(school);
    const item = await cartRepository.findItem(cart.id, itemId);
    if (!item) throw ApiError.notFound('Cart item not found');
    await cartRepository.removeItem(itemId);
    return this.getCart(school);
  }

  async clear(school: School) {
    const cart = await this.getOrCreateActiveCart(school);
    await cartRepository.clearItems(cart.id);
    return this.getCart(school);
  }

  /**
   * Coupons attach to an Order at checkout (see CouponUsage — it requires an
   * orderId), not to the cart itself, so this only validates and previews the
   * discount for display; nothing is persisted until the order is created.
   */
  async previewCoupon(school: School, code: string) {
    const cart = await this.getOrCreateActiveCart(school);
    const { subtotal } = summarize(cart);

    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) throw ApiError.badRequest('Invalid or expired coupon code');

    const now = new Date();
    if (now < coupon.startsAt || now > coupon.endsAt) {
      throw ApiError.badRequest('Invalid or expired coupon code');
    }
    if (subtotal < Number(coupon.minOrderValue)) {
      throw ApiError.badRequest(`This coupon requires a minimum order value of ${coupon.minOrderValue}`);
    }
    if (coupon.usageLimitTotal !== null) {
      const totalUses = await prisma.couponUsage.count({ where: { couponId: coupon.id } });
      if (totalUses >= coupon.usageLimitTotal) throw ApiError.badRequest('This coupon has reached its usage limit');
    }
    const schoolUses = await prisma.couponUsage.count({ where: { couponId: coupon.id, schoolId: school.id } });
    if (schoolUses >= coupon.usageLimitPerSchool) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times');
    }

    let discount =
      coupon.discountType === 'percentage' ? (subtotal * Number(coupon.discountValue)) / 100 : Number(coupon.discountValue);
    if (coupon.maxDiscount !== null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.min(discount, subtotal);

    return {
      code: coupon.code,
      subtotal,
      discount,
      estimatedTotal: subtotal - discount,
    };
  }
}

export const cartService = new CartService();
