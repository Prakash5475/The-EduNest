import type { Prisma } from '@prisma/client';
import { prisma } from '@/config/database';
import { orderRepository } from '@/repositories/order.repository';
import { getCompanyGstState, splitGst } from '@/helpers/gst.helper';

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
      select: {
        id: true,
        taxAmount: true,
        subtotal: true,
        totalAmount: true,
        orderNumber: true,
        placedAt: true,
        schoolAddress: { select: { state: true } },
      },
    });
    const companyGstState = await getCompanyGstState();
    const withGstSplit = orders.map((o) => {
      const gst = splitGst(Number(o.taxAmount), companyGstState, o.schoolAddress?.state ?? '');
      return {
        ...o,
        cgst: gst.cgst,
        sgst: gst.sgst,
        utgst: gst.utgst,
        igst: gst.igst,
        isInterState: gst.isInterState,
        supplyState: o.schoolAddress?.state ?? 'Unknown',
      };
    });

    const byState = new Map<string, { state: string; taxableValue: number; cgst: number; sgst: number; utgst: number; igst: number; orderCount: number }>();
    for (const o of withGstSplit) {
      const key = o.supplyState;
      const entry = byState.get(key) ?? { state: key, taxableValue: 0, cgst: 0, sgst: 0, utgst: 0, igst: 0, orderCount: 0 };
      entry.taxableValue += Number(o.subtotal);
      entry.cgst += o.cgst;
      entry.sgst += o.sgst;
      entry.utgst += o.utgst;
      entry.igst += o.igst;
      entry.orderCount += 1;
      byState.set(key, entry);
    }

    return {
      totalTaxCollected: orders.reduce((sum, o) => sum + Number(o.taxAmount), 0),
      totalTaxableValue: orders.reduce((sum, o) => sum + Number(o.subtotal), 0),
      totalCgst: withGstSplit.reduce((sum, o) => sum + o.cgst, 0),
      totalSgst: withGstSplit.reduce((sum, o) => sum + o.sgst, 0),
      totalUtgst: withGstSplit.reduce((sum, o) => sum + o.utgst, 0),
      totalIgst: withGstSplit.reduce((sum, o) => sum + o.igst, 0),
      companyGstState,
      stateWiseSummary: Array.from(byState.values()),
      orders: withGstSplit,
    };
  }

  /**
   * HSN/SAC-wise GST report — real, SQL-backed data via order_items → products → taxes
   * (products.tax_id → taxes.id, taxes.hsn_code — this FK already existed in
   * edunest_database_schema.sql/schema.prisma's deferred-FK block; it just hadn't been
   * declared as a Prisma relation on Product/Tax yet, which is now fixed, no migration
   * needed for that part). Each order_item's own taxAmount (not a re-derived estimate) is
   * split into CGST/SGST/UTGST/IGST using the same splitGst() used everywhere else, keyed
   * off that item's order's supply state — so this report can never disagree with the
   * invoice/order-level totals for the same data.
   *
   * Known accuracy limit, stated plainly: order_items does not snapshot which tax
   * bracket/HSN code applied *at the time of sale* — this report reflects the HSN code the
   * product is *currently* assigned to. If a product's HSN/tax bracket is ever changed
   * after historical orders exist, older orders will be grouped under the product's new
   * code, not the one actually charged at checkout. Fixing that requires snapshotting
   * taxId/hsnCode onto order_items at checkout time (a real schema+checkout change) —
   * out of scope for this pass, flagged rather than silently assumed correct.
   */
  async hsnReport(range: DateRangeFilter) {
    const companyGstState = await getCompanyGstState();
    const items = await prisma.orderItem.findMany({
      where: {
        order: { deletedAt: null, ...dateWhere('placedAt', range) },
      },
      select: {
        quantity: true,
        unitPrice: true,
        taxAmount: true,
        lineTotal: true,
        product: { select: { name: true, tax: { select: { hsnCode: true, name: true } } } },
        order: { select: { id: true, schoolAddress: { select: { state: true } } } },
      },
    });

    const byHsn = new Map<
      string,
      { hsnCode: string; description: string; quantity: number; taxableValue: number; cgst: number; sgst: number; utgst: number; igst: number; totalTax: number; lineItemCount: number; orderIds: Set<bigint> }
    >();

    for (const item of items) {
      const hsnCode = item.product?.tax?.hsnCode?.trim() || 'Not assigned';
      const description = item.product?.tax?.name ?? item.product?.name ?? 'Unclassified';
      const supplyState = item.order.schoolAddress?.state ?? '';
      const gst = splitGst(Number(item.taxAmount), companyGstState, supplyState);
      const taxableValue = Number(item.lineTotal) - Number(item.taxAmount);

      const entry = byHsn.get(hsnCode) ?? {
        hsnCode,
        description,
        quantity: 0,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        utgst: 0,
        igst: 0,
        totalTax: 0,
        lineItemCount: 0,
        orderIds: new Set<bigint>(),
      };
      entry.quantity += item.quantity;
      entry.taxableValue += taxableValue;
      entry.cgst += gst.cgst;
      entry.sgst += gst.sgst;
      entry.utgst += gst.utgst;
      entry.igst += gst.igst;
      entry.totalTax += gst.totalTax;
      entry.lineItemCount += 1;
      entry.orderIds.add(item.order.id);
      byHsn.set(hsnCode, entry);
    }

    return {
      companyGstState,
      rows: Array.from(byHsn.values()).map((r) => ({
        hsnCode: r.hsnCode,
        description: r.description,
        quantity: r.quantity,
        taxableValue: Math.round(r.taxableValue * 100) / 100,
        cgst: r.cgst,
        sgst: r.sgst,
        utgst: r.utgst,
        igst: r.igst,
        totalTax: r.totalTax,
        invoiceCount: r.orderIds.size,
      })),
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
