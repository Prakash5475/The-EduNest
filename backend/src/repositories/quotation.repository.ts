import type { Prisma, QuotationRequestStatus, DealerQuotationStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

const requestInclude = {
  quotationRequestProducts: { include: { product: true, kit: true } },
  dealerQuotations: {
    include: {
      dealer: { select: { id: true, businessName: true } },
      dealerQuotationItems: { include: { quotationRequestProduct: true } },
      quotationStatusHistory: { orderBy: { createdAt: 'asc' as const } },
    },
  },
} satisfies Prisma.QuotationRequestInclude;

const dealerQuotationInclude = {
  dealer: { select: { id: true, businessName: true } },
  dealerQuotationItems: { include: { quotationRequestProduct: { include: { product: true, kit: true } } } },
  quotationRequest: true,
  quotationStatusHistory: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.DealerQuotationInclude;

export class QuotationRepository extends BaseRepository {
  findRequestById(id: bigint) {
    return this.db.quotationRequest.findUnique({ where: { id }, include: requestInclude });
  }

  findRequestByNumber(requestNumber: string) {
    return this.db.quotationRequest.findFirst({ where: { requestNumber } });
  }

  async listRequests(filters: { schoolId?: bigint; status?: QuotationRequestStatus; skip: number; take: number }) {
    const where: Prisma.QuotationRequestWhereInput = {
      ...(filters.schoolId ? { schoolId: filters.schoolId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.quotationRequest.findMany({ where, include: requestInclude, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.quotationRequest.count({ where }),
    ]);
    return { items, total };
  }

  createRequest(data: {
    requestNumber: string;
    schoolId: bigint;
    title?: string;
    notes?: string;
    items: Array<{ productId?: bigint; kitId?: bigint; customItemDescription?: string; quantity: number }>;
  }) {
    return this.db.quotationRequest.create({
      data: {
        requestNumber: data.requestNumber,
        schoolId: data.schoolId,
        title: data.title,
        notes: data.notes,
        status: 'open',
        quotationRequestProducts: { createMany: { data: data.items } },
      },
      include: requestInclude,
    });
  }

  updateRequestStatus(id: bigint, status: QuotationRequestStatus) {
    return this.db.quotationRequest.update({ where: { id }, data: { status } });
  }

  findDealerQuotationById(id: bigint) {
    return this.db.dealerQuotation.findUnique({ where: { id }, include: dealerQuotationInclude });
  }

  async listDealerQuotationsForDealer(dealerId: bigint, skip: number, take: number) {
    const where: Prisma.DealerQuotationWhereInput = { dealerId };
    const [items, total] = await Promise.all([
      this.db.dealerQuotation.findMany({ where, include: dealerQuotationInclude, orderBy: { submittedAt: 'desc' }, skip, take }),
      this.db.dealerQuotation.count({ where }),
    ]);
    return { items, total };
  }

  createDealerQuotation(data: {
    quotationRequestId: bigint;
    dealerId: bigint;
    assignedBy: bigint;
    expectedCompletionDate?: Date;
    validityDays: number;
    notes?: string;
    items: Array<{ quotationRequestProductId: bigint; quotedUnitPrice: number; quotedQuantity: number }>;
  }) {
    const totalAmount = data.items.reduce((sum, item) => sum + item.quotedUnitPrice * item.quotedQuantity, 0);
    return this.db.dealerQuotation.create({
      data: {
        quotationRequestId: data.quotationRequestId,
        dealerId: data.dealerId,
        assignedBy: data.assignedBy,
        assignedAt: new Date(),
        expectedCompletionDate: data.expectedCompletionDate,
        validityDays: data.validityDays,
        notes: data.notes,
        totalAmount,
        status: 'submitted',
        dealerQuotationItems: { createMany: { data: data.items } },
        quotationStatusHistory: { create: { status: 'submitted', changedBy: data.assignedBy } },
      },
      include: dealerQuotationInclude,
    });
  }

  updateDealerQuotation(
    id: bigint,
    data: { totalAmount?: number; validityDays?: number; notes?: string; expectedCompletionDate?: Date },
  ) {
    return this.db.dealerQuotation.update({ where: { id }, data, include: dealerQuotationInclude });
  }

  updateDealerQuotationItem(id: bigint, data: { quotedUnitPrice?: number; quotedQuantity?: number }) {
    return this.db.dealerQuotationItem.update({ where: { id }, data });
  }

  updateDealerQuotationStatus(id: bigint, status: DealerQuotationStatus, changedBy?: bigint) {
    return this.db.$transaction([
      this.db.dealerQuotation.update({ where: { id }, data: { status } }),
      this.db.quotationStatusHistory.create({ data: { dealerQuotationId: id, status, changedBy } }),
    ]);
  }
}

export const quotationRepository = new QuotationRepository();
