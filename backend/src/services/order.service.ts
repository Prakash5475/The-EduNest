import { orderRepository } from '@/repositories/order.repository';
import { cartService } from '@/services/cart.service';
import { productService } from '@/services/product.service';
import { productionService } from '@/services/production.service';
import { notifyUsersWithRole } from '@/helpers/notification.helper';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { School, OrderStatus } from '@prisma/client';
import type { AuthenticatedUser } from '@/types';

/** Stages up to (not including) "processing" — matches the handbook's Cancel Order eligibility rule. */
const CANCELLABLE_STATUSES: OrderStatus[] = ['pending', 'confirmed'];

export class OrderService {
  async list(school: School, filters: { status?: OrderStatus; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await orderRepository.list({ schoolId: school.id, status: filters.status, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(school: School, id: bigint) {
    const order = await orderRepository.findById(id);
    if (!order || order.schoolId !== school.id) throw ApiError.notFound('Order not found');
    return order;
  }

  /** Access-scoped fetch for challan (delivery note) download — admin/staff, the assigned dealer, or the owning school. */
  async getForChallan(user: AuthenticatedUser, id: bigint) {
    return productionService.assertCanAccessOrder(user, id);
  }

  /** Remaining days until the production deadline — always computed live, never stored (goes stale otherwise). */
  remainingDays(order: { productionDeadline: Date | null }): number | null {
    if (!order.productionDeadline) return null;
    const diffMs = order.productionDeadline.getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  async cancel(school: School, id: bigint, reason?: string) {
    const order = await this.getById(school, id);
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw ApiError.badRequest('This order can no longer be cancelled — production has already started');
    }
    await orderRepository.update(id, { status: 'cancelled' });
    await orderRepository.addStatusHistory(id, 'cancelled', undefined, reason ?? 'Cancelled by school');
    await notifyUsersWithRole(['super_admin', 'staff'], {
      type: 'order_cancelled',
      title: 'Order cancelled',
      message: `${school.schoolName} cancelled order ${order.orderNumber}`,
      referenceType: 'order',
      referenceId: id,
    });
    return this.getById(school, id);
  }

  /** Adds every line item from a past order back into the active cart, respecting current MOQ/availability. */
  async reorder(school: School, id: bigint) {
    const order = await this.getById(school, id);
    for (const item of order.orderItems) {
      if (item.itemType !== 'product' || !item.productId) continue;
      try {
        await productService.validateOrderQuantity(item.productId, item.quantity);
        await cartService.addItem(school, {
          productId: item.productId,
          variantId: item.variantId ?? undefined,
          quantity: item.quantity,
        });
      } catch {
        // Skip items that are no longer orderable (discontinued, below current MOQ, etc.)
        // rather than failing the whole reorder — matches "add what's still available".
        continue;
      }
    }
    return cartService.getCart(school);
  }
}

export const orderService = new OrderService();
