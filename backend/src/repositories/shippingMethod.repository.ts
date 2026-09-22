import type { ShippingMethod } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ShippingMethodRepository extends BaseRepository {
  listActive(): Promise<ShippingMethod[]> {
    return this.db.shippingMethod.findMany({ where: { isActive: true }, orderBy: { rate: 'asc' } });
  }

  findById(id: bigint): Promise<ShippingMethod | null> {
    return this.db.shippingMethod.findUnique({ where: { id } });
  }
}

export const shippingMethodRepository = new ShippingMethodRepository();
