import { BaseRepository } from './base.repository';
import type { Prisma, DeliveryPartner, DeliveryPartnerStatus, DeliveryPartnerAvailabilityStatus } from '@prisma/client';

export interface DeliveryPartnerListFilters {
  status?: DeliveryPartnerStatus;
  availabilityStatus?: DeliveryPartnerAvailabilityStatus;
  search?: string;
  skip: number;
  take: number;
}

export class DeliveryPartnerRepository extends BaseRepository {
  findById(id: bigint): Promise<DeliveryPartner | null> {
    return this.db.deliveryPartner.findFirst({ where: { id, deletedAt: null } });
  }

  findByMobile(mobile: string): Promise<DeliveryPartner | null> {
    return this.db.deliveryPartner.findFirst({ where: { mobile, deletedAt: null } });
  }

  create(data: Prisma.DeliveryPartnerCreateInput): Promise<DeliveryPartner> {
    return this.db.deliveryPartner.create({ data });
  }

  update(id: bigint, data: Prisma.DeliveryPartnerUpdateInput): Promise<DeliveryPartner> {
    return this.db.deliveryPartner.update({ where: { id }, data });
  }

  /** Soft-delete only — never hard-delete a partner with assignment history. */
  softDelete(id: bigint): Promise<DeliveryPartner> {
    return this.db.deliveryPartner.update({ where: { id }, data: { deletedAt: new Date(), status: 'inactive' } });
  }

  async list(filters: DeliveryPartnerListFilters) {
    const where: Prisma.DeliveryPartnerWhereInput = {
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.availabilityStatus ? { availabilityStatus: filters.availabilityStatus } : {}),
      ...(filters.search
        ? { OR: [{ fullName: { contains: filters.search } }, { mobile: { contains: filters.search } }, { vehicleNumber: { contains: filters.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.db.deliveryPartner.findMany({ where, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.deliveryPartner.count({ where }),
    ]);
    return { items, total };
  }

  /** Currently assigned, undelivered shipment count — used for basic load-balancing/visibility, not a hard capacity cap. */
  countActiveAssignments(deliveryPartnerId: bigint) {
    return this.db.shipment.count({
      where: { deliveryPartnerId, status: { notIn: ['delivered', 'failed'] } },
    });
  }
}

export const deliveryPartnerRepository = new DeliveryPartnerRepository();
