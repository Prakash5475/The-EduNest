import { orderRepository } from '@/repositories/order.repository';
import { productionRepository } from '@/repositories/production.repository';
import { dealerRepository } from '@/repositories/dealer.repository';
import { schoolRepository } from '@/repositories/school.repository';
import { notifyUser } from '@/helpers/notification.helper';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiError } from '@/utils/ApiError';
import type { OrderStatus, OrderPriority } from '@prisma/client';
import type { AuthenticatedUser } from '@/types';

export class AdminOrderService {
  async list(filters: { status?: OrderStatus; priority?: OrderPriority; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await orderRepository.list({ status: filters.status, priority: filters.priority, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: bigint) {
    const order = await orderRepository.findById(id);
    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  async assignDealer(id: bigint, dealerId: bigint) {
    const order = await this.getById(id);
    const dealer = await dealerRepository.findById(dealerId);
    if (!dealer) throw ApiError.notFound('Dealer not found');

await orderRepository.update(id, {
  dealerId,
});    await orderRepository.addStatusHistory(id, order.status, undefined, `Dealer assigned: ${dealer.businessName}`);

    await notifyUser({
      userId: dealer.userId,
      type: 'order_assigned',
      title: 'New order assigned',
      message: `Order ${order.orderNumber} has been assigned to you`,
      referenceType: 'order',
      referenceId: id,
    });

    const school = await schoolRepository.findById(order.schoolId);
    if (school) {
      await notifyUser({
        userId: school.userId,
        type: 'dealer_assigned',
        title: 'Dealer assigned to your order',
        message: `${dealer.businessName} will be fulfilling order ${order.orderNumber}`,
        referenceType: 'order',
        referenceId: id,
        whatsapp: {
          eventType: 'dealer_assigned',
          data: { orderNumber: order.orderNumber, dealerName: dealer.businessName, orderId: id.toString() },
        },
      });
    }

    return this.getById(id);
  }

  /** Admin override: manually move an order/production stage forward when the dealer is unavailable. Requires a reason for the audit trail. */
  async overrideStatus(id: bigint, adminUser: AuthenticatedUser, nextStatus: OrderStatus, reason: string, note?: string) {
    if (!reason?.trim()) throw ApiError.badRequest('An override reason is required');
    const order = await this.getById(id);

    await orderRepository.update(id, { status: nextStatus });
    await orderRepository.addStatusHistory(id, nextStatus, undefined, note ?? `Admin override: ${reason}`);

    if (nextStatus === 'processing') {
      await productionRepository.addCheckpoint({
        orderId: id,
        stage: 'order_received',
        completionPercentage: 5,
        notes: note ?? 'Manually moved into production by admin',
        updatedBy: BigInt(adminUser.id),
        updatedByType: 'admin',
        overrideReason: reason,
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
          eventType: 'order_status_updated',
          data: { orderNumber: order.orderNumber, status: nextStatus, orderId: id.toString() },
        },
      });
    }

    return this.getById(id);
  }
}

export const adminOrderService = new AdminOrderService();
