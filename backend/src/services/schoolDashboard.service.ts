import { prisma } from '@/config/database';
import { orderRepository } from '@/repositories/order.repository';

export class SchoolDashboardService {
  /** Own dashboard — order stats, pending actions, recent activity. Scoped strictly to this school. */
  async getDashboard(schoolId: bigint, userId: bigint) {
    const activeFilter = { schoolId, deletedAt: null } as const;

    const [
      totalOrders,
      byStatus,
      pendingPayment,
      pendingQuotations,
      pendingCustomizationRequests,
      recentOrders,
      unreadNotifications,
      recentNotifications,
    ] = await Promise.all([
      prisma.order.count({ where: activeFilter }),
      prisma.order.groupBy({ by: ['status'], where: activeFilter, _count: { _all: true } }),
      prisma.order.count({ where: { ...activeFilter, paymentStatus: { in: ['unpaid', 'partially_paid'] } } }),
      prisma.quotationRequest.count({ where: { schoolId, status: { in: ['open', 'in_review'] } } }),
      prisma.customizationRequest.count({ where: { schoolId, status: 'pending_review' } }),
      orderRepository.list({ schoolId, skip: 0, take: 5 }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return {
      totalOrders,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      pendingActions: {
        ordersAwaitingPayment: pendingPayment,
        pendingQuotations,
        pendingCustomizationRequests,
      },
      recentOrders: recentOrders.items,
      unreadNotifications,
      recentActivity: recentNotifications,
    };
  }
}

export const schoolDashboardService = new SchoolDashboardService();
