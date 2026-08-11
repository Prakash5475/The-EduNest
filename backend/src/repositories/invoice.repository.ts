import type { Prisma, InvoiceStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

const adminInclude = {
  invoiceItems: true,
  uploadedFile: { select: { filePath: true } },
  school: { select: { id: true, schoolName: true, gstin: true } },
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      payments: { orderBy: { createdAt: 'asc' as const } },
    },
  },
} satisfies Prisma.InvoiceInclude;

export class InvoiceRepository extends BaseRepository {
  /** Admin Invoice Management — list, filterable by status/school/date range and invoice-number/order-number/school-name search, paginated. */
  async listForAdmin(filters: {
    status?: InvoiceStatus;
    schoolId?: bigint;
    from?: Date;
    to?: Date;
    search?: string;
    skip: number;
    take: number;
  }) {
    const where: Prisma.InvoiceWhereInput = {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.schoolId ? { schoolId: filters.schoolId } : {}),
      ...(filters.from || filters.to
        ? { issuedAt: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { invoiceNumber: { contains: filters.search } },
              { order: { orderNumber: { contains: filters.search } } },
              { school: { schoolName: { contains: filters.search } } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.db.invoice.findMany({ where, include: adminInclude, orderBy: { issuedAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.invoice.count({ where }),
    ]);
    return { items, total };
  }

  findByIdForAdmin(id: bigint) {
    return this.db.invoice.findUnique({ where: { id }, include: adminInclude });
  }

  /** Admin Invoice dashboard summary — totals by status. */
  async getAdminSummary() {
    const byStatus = await this.db.invoice.groupBy({ by: ['status'], _count: { _all: true }, _sum: { totalAmount: true } });
    return byStatus.map((s) => ({ status: s.status, count: s._count._all, totalAmount: Number(s._sum.totalAmount ?? 0) }));
  }
}

export const invoiceRepository = new InvoiceRepository();
