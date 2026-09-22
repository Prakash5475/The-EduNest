import { BaseRepository } from './base.repository';
import type { Prisma, Warehouse } from '@prisma/client';

export class WarehouseRepository extends BaseRepository {
  findById(id: bigint): Promise<Warehouse | null> {
    return this.db.warehouse.findUnique({ where: { id } });
  }

  findByName(name: string): Promise<Warehouse | null> {
    return this.db.warehouse.findUnique({ where: { name } });
  }

  create(data: Prisma.WarehouseCreateInput): Promise<Warehouse> {
    return this.db.warehouse.create({ data });
  }

  update(id: bigint, data: Prisma.WarehouseUpdateInput): Promise<Warehouse> {
    return this.db.warehouse.update({ where: { id }, data });
  }

  async list(filters: { isActive?: boolean; skip: number; take: number }) {
    const where: Prisma.WarehouseWhereInput = filters.isActive === undefined ? {} : { isActive: filters.isActive };
    const [items, total] = await Promise.all([
      this.db.warehouse.findMany({ where, orderBy: { name: 'asc' }, skip: filters.skip, take: filters.take }),
      this.db.warehouse.count({ where }),
    ]);
    return { items, total };
  }

  countInventoryRows(warehouseId: bigint) {
    return this.db.inventory.count({ where: { warehouseId } });
  }

  /** Stock summary for one warehouse — sum of available/reserved across every inventory row assigned to it. */
  async stockSummary(warehouseId: bigint) {
    const agg = await this.db.inventory.aggregate({
      where: { warehouseId },
      _sum: { quantityAvailable: true, quantityReserved: true },
      _count: { _all: true },
    });
    return {
      totalAvailable: agg._sum.quantityAvailable ?? 0,
      totalReserved: agg._sum.quantityReserved ?? 0,
      productLines: agg._count._all,
    };
  }
}

export const warehouseRepository = new WarehouseRepository();
