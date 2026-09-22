import { BaseRepository } from './base.repository';
import type { Prisma, Shipment, ShipmentStatus } from '@prisma/client';

const shipmentInclude = {
  order: { select: { id: true, orderNumber: true, schoolId: true } },
  deliveryPartner: true,
  deliveryUpdates: { orderBy: { createdAt: 'asc' as const } },
  tracking: { orderBy: { recordedAt: 'asc' as const } },
} satisfies Prisma.ShipmentInclude;

export interface ShipmentListFilters {
  deliveryPartnerId?: bigint;
  status?: ShipmentStatus;
  skip: number;
  take: number;
}

export class ShipmentRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.shipment.findUnique({ where: { id }, include: shipmentInclude });
  }

  findByOrderId(orderId: bigint) {
    return this.db.shipment.findFirst({ where: { orderId }, include: shipmentInclude, orderBy: { createdAt: 'desc' } });
  }

  create(data: Prisma.ShipmentCreateInput): Promise<Shipment> {
    return this.db.shipment.create({ data });
  }

  update(id: bigint, data: Prisma.ShipmentUpdateInput): Promise<Shipment> {
    return this.db.shipment.update({ where: { id }, data });
  }

  async list(filters: ShipmentListFilters) {
    const where: Prisma.ShipmentWhereInput = {
      ...(filters.deliveryPartnerId ? { deliveryPartnerId: filters.deliveryPartnerId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.shipment.findMany({ where, include: shipmentInclude, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.shipment.count({ where }),
    ]);
    return { items, total };
  }

  /** Append-only audit row — every status change goes through here, never a bare shipment.update alone. */
  addStatusHistory(data: {
    shipmentId: bigint;
    orderId: bigint;
    updateType: 'note' | 'reschedule' | 'failed_attempt' | 'delivered';
    previousStatus?: string | null;
    newStatus?: string | null;
    updatedBy?: bigint;
    updatedByType: 'admin' | 'staff' | 'delivery_partner' | 'system';
    newDeliveryDate?: Date;
    message?: string;
  }) {
    return this.db.deliveryUpdate.create({
      data: {
        shipment: { connect: { id: data.shipmentId } },
        order: { connect: { id: data.orderId } },
        updateType: data.updateType,
        previousStatus: data.previousStatus ?? undefined,
        newStatus: data.newStatus ?? undefined,
        updatedByType: data.updatedByType,
        newDeliveryDate: data.newDeliveryDate,
        message: data.message,
        ...(data.updatedBy ? { updatedByUser: { connect: { id: data.updatedBy } } } : {}),
      },
    });
  }

  historyForOrder(orderId: bigint) {
    return this.db.deliveryUpdate.findMany({ where: { orderId }, orderBy: { createdAt: 'asc' } });
  }
}

export const shipmentRepository = new ShipmentRepository();
