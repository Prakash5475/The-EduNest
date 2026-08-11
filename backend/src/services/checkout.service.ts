import { prisma } from '@/config/database';
import { cartService } from '@/services/cart.service';
import { cartRepository } from '@/repositories/cart.repository';
import { orderRepository } from '@/repositories/order.repository';
import { generateOrderNumber } from '@/helpers/orderNumber.helper';
import { notifyUsersWithRole } from '@/helpers/notification.helper';
import { ApiError } from '@/utils/ApiError';
import type { School } from '@prisma/client';

interface CheckoutInput {
  billingAddressId: bigint;
  shippingAddressId: bigint;
  shippingMethodId: bigint;
  couponCode?: string;
}

export class CheckoutService {
  /**
   * Builds the priced Order from the active cart. The order is created in
   * `pending` / `unpaid` — it only becomes `confirmed` once the 50% advance
   * payment succeeds (see PaymentService). Nothing here charges money.
   */
  async createOrderFromCart(school: School, input: CheckoutInput) {
    const cart = await cartService.getCart(school);
    if (cart.cartItems.length === 0) {
      throw ApiError.badRequest('Your cart is empty');
    }

    const [billingAddress, shippingAddress, shippingMethod] = await Promise.all([
      prisma.schoolAddress.findFirst({ where: { id: input.billingAddressId, schoolId: school.id } }),
      prisma.schoolAddress.findFirst({ where: { id: input.shippingAddressId, schoolId: school.id } }),
      prisma.shippingMethod.findFirst({ where: { id: input.shippingMethodId, isActive: true } }),
    ]);
    if (!billingAddress) throw ApiError.badRequest('Please select or add a billing address');
    if (!shippingAddress) throw ApiError.badRequest('Please select or add a shipping address');
    if (!shippingMethod) throw ApiError.badRequest('Please select a valid delivery method');

    // Per-line tax, computed from each product's assigned Tax rate (0 if none assigned) — never fabricated.
    const orderItems: Array<{
      itemType: 'product';
      productId?: bigint;
      variantId?: bigint;
      itemNameSnapshot: string;
      quantity: number;
      unitPrice: number;
      taxAmount: number;
      lineTotal: number;
    }> = [];

    let subtotal = 0;
    let taxAmount = 0;

    for (const item of cart.cartItems) {
      if (item.itemType !== 'product' || !item.productId || !item.product) {
        throw ApiError.badRequest('This cart contains an item type that cannot be checked out yet');
      }
      const lineSubtotal = item.quantity * Number(item.unitPriceSnapshot);
      let rate = 0;
      if (item.product.taxId) {
        const tax = await prisma.tax.findUnique({ where: { id: item.product.taxId } });
        if (tax?.isActive) rate = Number(tax.rate);
      }
      const lineTax = (lineSubtotal * rate) / 100;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      orderItems.push({
        itemType: 'product',
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        itemNameSnapshot: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPriceSnapshot),
        taxAmount: lineTax,
        lineTotal: lineSubtotal + lineTax,
      });
    }

    // Coupon discount — validated the same way as the cart preview, but only
    // applied for real once we have an orderId for CouponUsage to reference.
    let discountAmount = 0;
    let coupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>> = null;
    if (input.couponCode) {
      const preview = await cartService.previewCoupon(school, input.couponCode);
      discountAmount = preview.discount;
      coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode } });
    }

    const shippingAmount = Number(shippingMethod.rate);
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
    if (totalAmount <= 0) throw ApiError.badRequest('Order total must be greater than zero');

    // Deadline defaults — admin can override once the Admin Orders module
    // manages priority directly; this just gives every order a sane starting
    // point instead of leaving these required fields null.
    const now = new Date();
    const expectedDeliveryDate = new Date(now);
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + shippingMethod.estimatedDaysMax);
    const productionDeadline = new Date(now);
    productionDeadline.setDate(
      productionDeadline.getDate() + Math.max(1, shippingMethod.estimatedDaysMax - 2),
    );

    const orderNumber = await generateOrderNumber();

    const order = await orderRepository.createWithItems({
      orderNumber,
      schoolId: school.id,
      billingAddressId: billingAddress.id,
      shippingAddressId: shippingAddress.id,
      shippingMethodId: shippingMethod.id,
      subtotal,
      taxAmount,
      discountAmount,
      shippingAmount,
      totalAmount,
      productionDeadline,
      expectedDeliveryDate,
      priority: 'normal',
      items: orderItems,
    });

    if (coupon) {
      await prisma.couponUsage.create({
        data: { couponId: coupon.id, schoolId: school.id, orderId: order.id, discountApplied: discountAmount },
      });
    }

    await cartRepository.markConverted(cart.id);

    await notifyUsersWithRole(['super_admin', 'staff'], {
      type: 'order_placed',
      title: 'New order placed',
      message: `${school.schoolName} placed order ${order.orderNumber}`,
      referenceType: 'order',
      referenceId: order.id,
    });

    return order;
  }
}

export const checkoutService = new CheckoutService();
