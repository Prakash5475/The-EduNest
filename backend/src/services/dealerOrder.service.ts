import { orderRepository } from '@/repositories/order.repository';
import { productionRepository } from '@/repositories/production.repository';
import { notifyUser } from '@/helpers/notification.helper';
import { schoolRepository } from '@/repositories/school.repository';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiError } from '@/utils/ApiError';
import type { Dealer, OrderStatus } from '@prisma/client';

/** Status transitions a dealer is allowed to make themselves — everything else (delivered,
 * returned, cancellation) is driven by the school, admin, or the shipping/production flow. */
const DEALER_ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['confirmed'],
  confirmed: ['processing'],
  processing: ['shipped'],
};

export class DealerOrderService {
  async list(dealer: Dealer, filters: { status?: OrderStatus; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await orderRepository.list({ dealerId: dealer.id, status: filters.status, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(dealer: Dealer, id: bigint) {
    const order = await orderRepository.findById(id);
    if (!order || order.dealerId !== dealer.id) throw ApiError.notFound('Order not found');
    return order;
  }

  async updateStatus(dealer: Dealer, id: bigint, nextStatus: OrderStatus, note?: string) {
    const order = await this.getById(dealer, id);
    const allowed = DEALER_ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw ApiError.badRequest(`Cannot move an order from "${order.status}" to "${nextStatus}"`);
    }

    await orderRepository.update(id, { status: nextStatus });
    await orderRepository.addStatusHistory(id, nextStatus, undefined, note);

    // First production checkpoint is implicit once a dealer starts processing.
    if (nextStatus === 'processing') {
      await productionRepository.addCheckpoint({
        orderId: id,
        stage: 'order_received',
        completionPercentage: 5,
        notes: 'Order accepted and moved into production',
        updatedBy: dealer.userId,
        updatedByType: 'dealer',
        imageFileIds: [],
      });
    }

    const school = await schoolRepository.findById(order.schoolId);
    if (school) {
      await notifyUser({
        userId: school.userId,
        type: 'order_status_updated',
        title: 'Order update',
        message: `Order ${order.orderNumber} is now "${nextStatus}"`,
        referenceType: 'order',
        referenceId: id,
        whatsapp: {
          eventType: nextStatus === 'confirmed' ? 'order_confirmed' : 'order_status_updated',
          data: { orderNumber: order.orderNumber, status: nextStatus, orderId: id.toString() },
        },
      });
    }

    return this.getById(dealer, id);
  }
}

export const dealerOrderService = new DealerOrderService();
