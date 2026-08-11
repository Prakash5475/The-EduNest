import { prisma } from '@/config/database';
import { orderRepository } from '@/repositories/order.repository';
import { productRepository } from '@/repositories/product.repository';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export class AdminDashboardService {
  async getSummary() {
    const adminStaffUserIds = await prisma.user
      .findMany({
        where: { userRoles: { some: { role: { slug: { in: ['super_admin', 'staff'] } } } }, deletedAt: null },
        select: { id: true },
      })
      .then((users) => users.map((u) => u.id));

    const [
      revenueToday,
      revenueMonth,
      revenueAllTime,
      ordersByStatus,
      ordersByPriority,
      productionInProgress,
      dealersByStatus,
      pendingQuotations,
      pendingAssignments,
      lowStockItems,
      lateOrders,
      nearDeadlineOrders,
      recentOrders,
      unreadAdminNotifications,
    ] = await Promise.all([
      prisma.payment.aggregate({ where: { status: 'success', createdAt: { gte: startOfToday() } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'success', createdAt: { gte: startOfMonth() } }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: 'success' }, _sum: { amount: true } }),
      prisma.order.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.order.groupBy({
        by: ['priority'],
        where: { deletedAt: null, status: { notIn: ['delivered', 'completed', 'cancelled'] } },
        _count: { _all: true },
      }),
      prisma.order.count({ where: { deletedAt: null, status: 'processing' } }),
      prisma.dealer.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.quotationRequest.count({ where: { status: { in: ['open', 'in_review'] } } }),
      prisma.quotationRequest.count({ where: { status: 'open' } }),
      productRepository.lowStock(),
      orderRepository.findLate(),
      orderRepository.findNearDeadline(3),
      prisma.order.findMany({ where: { deletedAt: null }, orderBy: { placedAt: 'desc' }, take: 10 }),
      prisma.notification.count({ where: { isRead: false, userId: { in: adminStaffUserIds } } }),
    ]);

    // Outstanding balance is computed per order from real payment records, not a flat sum
    // of totals — an order that's already partially paid must have that amount subtracted.
    const partiallyPaidOrders = await prisma.order.findMany({
      where: { deletedAt: null, paymentStatus: { in: ['unpaid', 'partially_paid'] } },
      select: { id: true, totalAmount: true },
    });
    let outstandingBalance = 0;
    for (const o of partiallyPaidOrders) {
      const paid = await orderRepository.sumSuccessfulPayments(o.id);
      outstandingBalance += Number(o.totalAmount) - paid;
    }

    return {
      revenue: {
        today: Number(revenueToday._sum.amount ?? 0),
        thisMonth: Number(revenueMonth._sum.amount ?? 0),
        allTime: Number(revenueAllTime._sum.amount ?? 0),
      },
      orders: {
        byStatus: Object.fromEntries(ordersByStatus.map((o) => [o.status, o._count._all])),
        byPriority: Object.fromEntries(ordersByPriority.map((o) => [o.priority, o._count._all])),
        late: lateOrders.length,
        nearDeadline: nearDeadlineOrders.length,
      },
      payments: {
        outstandingBalance: Math.max(0, Math.round(outstandingBalance * 100) / 100),
      },
      production: {
        inProgress: productionInProgress,
      },
      dealers: {
        byStatus: Object.fromEntries(dealersByStatus.map((d) => [d.status, d._count._all])),
      },
      quotations: {
        pendingReview: pendingQuotations,
        pendingAssignment: pendingAssignments,
      },
      inventory: {
        lowStockCount: lowStockItems.length,
      },
      recentOrders,
      unreadAdminNotifications,
    };
  }

  /** Top products by units sold, from real OrderItem data. */
  async getTopProducts(limit = 10) {
    const sales = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { productId: { not: null } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });
    const productIds = sales.map((s) => s.productId).filter((id): id is bigint => id !== null);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, sku: true } });
    const byId = new Map(products.map((p) => [p.id.toString(), p]));

    return sales.map((s) => ({
      product: s.productId ? byId.get(s.productId.toString()) : null,
      unitsSold: s._sum.quantity ?? 0,
      revenue: Number(s._sum.lineTotal ?? 0),
    }));
  }

  async getTopCategories(limit = 10) {
    const sales = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { productId: { not: null } },
      _sum: { quantity: true, lineTotal: true },
    });
    const productIds = sales.map((s) => s.productId).filter((id): id is bigint => id !== null);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, categoryId: true, category: { select: { name: true } } },
    });
    const categoryByProduct = new Map(products.map((p) => [p.id.toString(), p.category.name]));

    const totals = new Map<string, { unitsSold: number; revenue: number }>();
    for (const s of sales) {
      const categoryName = s.productId ? categoryByProduct.get(s.productId.toString()) : undefined;
      if (!categoryName) continue;
      const current = totals.get(categoryName) ?? { unitsSold: 0, revenue: 0 };
      current.unitsSold += s._sum.quantity ?? 0;
      current.revenue += Number(s._sum.lineTotal ?? 0);
      totals.set(categoryName, current);
    }

    return [...totals.entries()]
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  /** Monthly revenue for the last N months, via real SQL date-truncation (MySQL DATE_FORMAT). */
  async getRevenueTrend(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw<Array<{ month: string; total: string | null }>>`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(amount) AS total
      FROM payments
      WHERE status = 'success' AND created_at >= ${since}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;

    return rows.map((r) => ({ month: r.month, revenue: Number(r.total ?? 0) }));
  }
}

export const adminDashboardService = new AdminDashboardService();
