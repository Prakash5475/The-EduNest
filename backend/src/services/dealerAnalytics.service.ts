import { prisma } from '@/config/database';
import { dealerRepository } from '@/repositories/dealer.repository';
import { ApiError } from '@/utils/ApiError';

export interface DealerDateRangeFilter {
  from?: Date;
  to?: Date;
}

function dateWhere(range: DealerDateRangeFilter): Record<string, unknown> {
  if (!range.from && !range.to) return {};
  return {
    placedAt: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  };
}

export class DealerAnalyticsService {
  /** Own performance summary — scoped strictly to this dealer's orders. */
  async getPerformance(dealerId: bigint, range: DealerDateRangeFilter) {
    const dealer = await dealerRepository.findById(dealerId);
    if (!dealer) throw ApiError.notFound('Dealer not found');

    const where = { dealerId, deletedAt: null, ...dateWhere(range) };
    const [totalOrders, completedOrders, cancelledOrders, lateOrders, revenueOrders, monthlyRevenue] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'completed' } }),
      prisma.order.count({ where: { ...where, status: 'cancelled' } }),
      prisma.order.count({
        where: { ...where, productionDeadline: { lt: new Date() }, status: { notIn: ['delivered', 'completed', 'cancelled', 'returned'] } },
      }),
      prisma.order.findMany({ where, select: { totalAmount: true } }),
      prisma.$queryRaw<{ month: string; total: string }[]>`
        SELECT DATE_FORMAT(placed_at, '%Y-%m') AS month, SUM(total_amount) AS total
        FROM orders
        WHERE dealer_id = ${dealerId} AND deleted_at IS NULL
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `,
    ]);

    return {
      businessName: dealer.businessName,
      averageRating: Number(dealer.averageRating),
      totalOrders,
      completedOrders,
      cancelledOrders,
      lateOrders,
      totalRevenue: revenueOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      monthlyRevenue: monthlyRevenue.map((m) => ({ month: m.month, total: Number(m.total) })).reverse(),
    };
  }

  /** Own orders, flattened for CSV/Excel/PDF export. */
  async getExportRows(dealerId: bigint, range: DealerDateRangeFilter) {
    const orders = await prisma.order.findMany({
      where: { dealerId, deletedAt: null, ...dateWhere(range) },
      select: { orderNumber: true, status: true, priority: true, totalAmount: true, paymentStatus: true, placedAt: true },
      orderBy: { placedAt: 'desc' },
    });
    return orders.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      priority: o.priority,
      paymentStatus: o.paymentStatus,
      totalAmount: Number(o.totalAmount),
      placedAt: o.placedAt?.toISOString() ?? '',
    }));
  }
}

export const dealerAnalyticsService = new DealerAnalyticsService();
