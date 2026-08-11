import type { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { orderRepository } from '@/repositories/order.repository';

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

function dateWhere(field: string, range: DateRangeFilter): Record<string, unknown> {
  if (!range.from && !range.to) return {};
  return {
    [field]: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  };
}

export class ReportsService {
  async ordersReport(range: DateRangeFilter) {
    const where = { deletedAt: null, ...dateWhere('placedAt', range) } as Prisma.OrderWhereInput;
    const [orders, byStatus, byPriority] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { orderItems: true, school: { select: { id: true, schoolName: true } } },
        orderBy: { placedAt: 'desc' },
      }),
      prisma.order.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.order.groupBy({ by: ['priority'], where, _count: { _all: true } }),
    ]);
    return {
      totalOrders: orders.length,
      totalValue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      byPriority: Object.fromEntries(byPriority.map((s) => [s.priority, s._count._all])),
      orders,
    };
  }

  async paymentsReport(range: DateRangeFilter) {
    const where = { ...dateWhere('createdAt', range) } as Prisma.PaymentWhereInput;
    const [payments, byType, byStatus] = await Promise.all([
      prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' } }),
      prisma.payment.groupBy({ by: ['paymentType'], where, _sum: { amount: true }, _count: { _all: true } }),
      prisma.payment.groupBy({ by: ['status'], where, _count: { _all: true } }),
    ]);
    return {
      totalCollected: payments.filter((p) => p.status === 'success').reduce((sum, p) => sum + Number(p.amount), 0),
      byType: Object.fromEntries(byType.map((t) => [t.paymentType, { amount: Number(t._sum.amount ?? 0), count: t._count._all }])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      payments,
    };
  }

  /** GST summary — real aggregation of Order.taxAmount over the range. */
  async gstReport(range: DateRangeFilter) {
    const where = { deletedAt: null, ...dateWhere('placedAt', range) } as Prisma.OrderWhereInput;
    const orders = await prisma.order.findMany({
      where,
      select: { id: true, taxAmount: true, subtotal: true, totalAmount: true, orderNumber: true, placedAt: true },
    });
    return {
      totalTaxCollected: orders.reduce((sum, o) => sum + Number(o.taxAmount), 0),
      totalTaxableValue: orders.reduce((sum, o) => sum + Number(o.subtotal), 0),
      orders,
    };
  }

  async invoicesReport(range: DateRangeFilter) {
    const where = { ...dateWhere('issuedAt', range) } as Prisma.InvoiceWhereInput;
    const invoices = await prisma.invoice.findMany({ where, include: { invoiceItems: true }, orderBy: { issuedAt: 'desc' } });
    return {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0),
      byType: {
        advanceReceipts: invoices.filter((i) => i.invoiceType === 'advance_receipt').length,
        finalInvoices: invoices.filter((i) => i.invoiceType === 'final_invoice').length,
      },
      invoices,
    };
  }

  async dealerPerformanceReport() {
    const dealers = await prisma.dealer.findMany({ where: { status: 'active' } });
    return Promise.all(
      dealers.map(async (dealer) => {
        const [completed, cancelled, late] = await Promise.all([
          prisma.order.count({ where: { dealerId: dealer.id, status: 'completed', deletedAt: null } }),
          prisma.order.count({ where: { dealerId: dealer.id, status: 'cancelled', deletedAt: null } }),
          prisma.order.count({
            where: {
              dealerId: dealer.id,
              deletedAt: null,
              productionDeadline: { lt: new Date() },
              status: { notIn: ['delivered', 'completed', 'cancelled', 'returned'] },
            },
          }),
        ]);
        return {
          dealerId: dealer.id.toString(),
          businessName: dealer.businessName,
          averageRating: Number(dealer.averageRating),
          completedOrders: completed,
          cancelledOrders: cancelled,
          lateOrders: late,
        };
      }),
    );
  }

  async productionReport(range: DateRangeFilter) {
    const where = dateWhere('createdAt', range) as Prisma.ProductionCheckpointWhereInput;
    const checkpoints = await prisma.productionCheckpoint.groupBy({ by: ['stage'], where, _count: { _all: true } });
    return { byStage: Object.fromEntries(checkpoints.map((c) => [c.stage, c._count._all])) };
  }

  async priorityOrdersReport() {
    const activeFilter = {
      deletedAt: null,
      status: { notIn: ['delivered', 'completed', 'cancelled'] },
    } as Prisma.OrderWhereInput;
    const [critical, high, medium, normal, late, nearDeadline] = await Promise.all([
      prisma.order.count({ where: { ...activeFilter, priority: 'critical' } }),
      prisma.order.count({ where: { ...activeFilter, priority: 'high' } }),
      prisma.order.count({ where: { ...activeFilter, priority: 'medium' } }),
      prisma.order.count({ where: { ...activeFilter, priority: 'normal' } }),
      orderRepository.findLate(),
      orderRepository.findNearDeadline(3),
    ]);
    return { critical, high, medium, normal, lateOrders: late, nearDeadlineOrders: nearDeadline };
  }

  async quotationsReport(range: DateRangeFilter) {
    const where = dateWhere('createdAt', range) as Prisma.QuotationRequestWhereInput;
    const [byStatus, total, accepted] = await Promise.all([
      prisma.quotationRequest.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.quotationRequest.count({ where }),
      prisma.quotationRequest.count({ where: { ...where, status: 'closed' } }),
    ]);
    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      conversionRate: total > 0 ? Math.round((accepted / total) * 10000) / 100 : 0,
    };
  }
}

export const reportsService = new ReportsService();
