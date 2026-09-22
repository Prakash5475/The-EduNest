import type { Prisma, DealerAddress } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class DealerAddressRepository extends BaseRepository {
  listByDealer(dealerId: bigint): Promise<DealerAddress[]> {
    return this.db.dealerAddress.findMany({ where: { dealerId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  findById(id: bigint): Promise<DealerAddress | null> {
    return this.db.dealerAddress.findUnique({ where: { id } });
  }

  create(data: Prisma.DealerAddressCreateInput): Promise<DealerAddress> {
    return this.db.dealerAddress.create({ data });
  }

  update(id: bigint, data: Prisma.DealerAddressUpdateInput): Promise<DealerAddress> {
    return this.db.dealerAddress.update({ where: { id }, data });
  }

  delete(id: bigint): Promise<DealerAddress> {
    return this.db.dealerAddress.delete({ where: { id } });
  }

  clearDefaultsExcept(dealerId: bigint, exceptId: bigint): Promise<Prisma.BatchPayload> {
    return this.db.dealerAddress.updateMany({ where: { dealerId, id: { not: exceptId } }, data: { isDefault: false } });
  }
}

export const dealerAddressRepository = new DealerAddressRepository();
