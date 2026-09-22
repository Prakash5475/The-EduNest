import { BaseRepository } from './base.repository';
import type { Prisma, EwayBill } from '@prisma/client';

const include = {
  order: { select: { id: true, orderNumber: true } },
  invoice: { select: { id: true, invoiceNumber: true } },
} satisfies Prisma.EwayBillInclude;

export class EwayBillRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.ewayBill.findUnique({ where: { id }, include });
  }

  findByOrderId(orderId: bigint) {
    return this.db.ewayBill.findFirst({ where: { orderId }, include, orderBy: { createdAt: 'desc' } });
  }

  create(data: Prisma.EwayBillCreateInput): Promise<EwayBill> {
    return this.db.ewayBill.create({ data });
  }

  update(id: bigint, data: Prisma.EwayBillUpdateInput): Promise<EwayBill> {
    return this.db.ewayBill.update({ where: { id }, data });
  }

  async list(filters: { status?: string; skip: number; take: number }) {
    const where: Prisma.EwayBillWhereInput = filters.status ? { status: filters.status as never } : {};
    const [items, total] = await Promise.all([
      this.db.ewayBill.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.ewayBill.count({ where }),
    ]);
    return { items, total };
  }
}

export const ewayBillRepository = new EwayBillRepository();
