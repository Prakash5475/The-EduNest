import { BaseRepository } from './base.repository';
import type { Prisma, QuantityChangeRequest, QuantityChangeRequestStatus } from '@prisma/client';

const include = {
  inventory: { include: { product: { select: { name: true, sku: true } }, productVariant: true, warehouse: true } },
  requester: { select: { id: true, email: true } },
  decider: { select: { id: true, email: true } },
} satisfies Prisma.QuantityChangeRequestInclude;

export class QuantityChangeRequestRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.quantityChangeRequest.findUnique({ where: { id }, include });
  }

  create(data: Prisma.QuantityChangeRequestCreateInput): Promise<QuantityChangeRequest> {
    return this.db.quantityChangeRequest.create({ data });
  }

  async list(filters: { status?: QuantityChangeRequestStatus; skip: number; take: number }) {
    const where: Prisma.QuantityChangeRequestWhereInput = filters.status ? { status: filters.status } : {};
    const [items, total] = await Promise.all([
      this.db.quantityChangeRequest.findMany({ where, include, orderBy: { requestedAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.quantityChangeRequest.count({ where }),
    ]);
    return { items, total };
  }

  hasPendingForInventory(inventoryId: bigint) {
    return this.db.quantityChangeRequest.findFirst({ where: { inventoryId, status: 'pending' } });
  }
}

export const quantityChangeRequestRepository = new QuantityChangeRequestRepository();
