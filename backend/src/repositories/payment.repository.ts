import type { Prisma, PaymentPaymentType, PaymentStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

const include = {
  paymentTransactions: { orderBy: { createdAt: 'asc' as const } },
  paymentMethod: true,
} satisfies Prisma.PaymentInclude;

const adminInclude = {
  paymentTransactions: { orderBy: { createdAt: 'asc' as const } },
  paymentMethod: true,
  school: { select: { id: true, schoolName: true } },
  order: { select: { id: true, orderNumber: true } },
} satisfies Prisma.PaymentInclude;

export class PaymentRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.payment.findUnique({ where: { id }, include });
  }

  findByGatewayReference(gatewayReference: string) {
    return this.db.payment.findFirst({ where: { gatewayReference }, include });
  }

  async listBySchool(schoolId: bigint, skip: number, take: number) {
    const where: Prisma.PaymentWhereInput = { schoolId };
    const [items, total] = await Promise.all([
      this.db.payment.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.payment.count({ where }),
    ]);
    return { items, total };
  }

  create(data: {
    orderId: bigint;
    schoolId: bigint;
    amount: number;
    paymentType: PaymentPaymentType;
    gateway: string;
    gatewayReference?: string;
  }) {
    return this.db.payment.create({
      data: { ...data, currency: 'INR', status: 'initiated' },
      include,
    });
  }

  updateStatus(id: bigint, data: Partial<{ status: 'initiated' | 'pending' | 'success' | 'failed' | 'refunded'; gatewayReference: string }>) {
    return this.db.payment.update({ where: { id }, data, include });
  }

  addTransaction(data: {
    paymentId: bigint;
    transactionType: 'authorization' | 'capture' | 'refund' | 'chargeback';
    amount: number;
    status: 'success' | 'failed' | 'pending';
    gatewayResponse?: Prisma.InputJsonValue;
  }) {
    return this.db.paymentTransaction.create({ data });
  }

  /** Admin Payments — list, filterable by status/type and order-number/school-name search, paginated. */
  async listForAdmin(filters: {
    status?: PaymentStatus;
    paymentType?: PaymentPaymentType;
    search?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.PaymentWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.paymentType ? { paymentType: filters.paymentType } : {}),
      ...(filters.search
        ? {
            OR: [
              { gatewayReference: { contains: filters.search } },
              { order: { orderNumber: { contains: filters.search } } },
              { school: { schoolName: { contains: filters.search } } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.db.payment.findMany({ where, include: adminInclude, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.payment.count({ where }),
    ]);
    return { items, total };
  }

  findByIdForAdmin(id: bigint) {
    return this.db.payment.findUnique({ where: { id }, include: adminInclude });
  }

  /** Admin Payments — flat refund history across all payments, paginated. */
  async listRefundHistory(skip: number, take: number) {
    const where: Prisma.PaymentTransactionWhereInput = { transactionType: 'refund' };
    const [items, total] = await Promise.all([
      this.db.paymentTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { payment: { include: adminInclude } },
      }),
      this.db.paymentTransaction.count({ where }),
    ]);
    return { items, total };
  }

  /** Admin Payments dashboard summary — totals by status, refund total. */
  async getAdminSummary() {
    const [byStatus, refundTotal] = await Promise.all([
      this.db.payment.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true } }),
      this.db.paymentTransaction.aggregate({ where: { transactionType: 'refund', status: 'success' }, _sum: { amount: true } }),
    ]);
    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all, totalAmount: Number(s._sum.amount ?? 0) })),
      totalRefunded: Number(refundTotal._sum.amount ?? 0),
    };
  }
}

export const paymentRepository = new PaymentRepository();
