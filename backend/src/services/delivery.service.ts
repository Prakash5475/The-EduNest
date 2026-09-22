import { shipmentRepository } from '@/repositories/shipment.repository';
import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { orderRepository } from '@/repositories/order.repository';
import { otpService } from '@/services/otp.service';
import { notifyUser } from '@/helpers/notification.helper';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiError } from '@/utils/ApiError';
import { prisma } from '@/config/database';
import type { ShipmentStatus } from '@prisma/client';

/**
 * Allowed forward transitions. Deliberately conservative — a shipment can only move
 * along this graph, and 'delivered' is reachable ONLY through completeDeliveryWithOtp
 * (never via setStatus), so "no delivery without OTP verification" can't be bypassed by
 * calling the generic status-update endpoint (Section 6: "Prevent... direct API bypass").
 */
const ALLOWED_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['ready_for_dispatch', 'assigned'],
  ready_for_dispatch: ['assigned', 'dispatched'],
  assigned: ['dispatched', 'ready_for_dispatch'],
  dispatched: ['in_transit', 'out_for_delivery'],
  in_transit: ['out_for_delivery'],
  out_for_delivery: ['delivery_attempted'],
  delivery_attempted: ['rescheduled', 'failed'],
  rescheduled: ['out_for_delivery'],
  picked_up: ['in_transit', 'out_for_delivery'], // legacy value, kept for pre-existing rows
  delivered: [],
  failed: ['rescheduled'],
};

export class DeliveryService {
  async createForOrder(orderId: bigint, input: { carrierName?: string; recipientName?: string; recipientPhone?: string }) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    const existing = await shipmentRepository.findByOrderId(orderId);
    if (existing) throw ApiError.conflict('A shipment already exists for this order');

    return shipmentRepository.create({
      order: { connect: { id: orderId } },
      carrierName: input.carrierName,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      status: 'ready_for_dispatch',
    });
  }

  async getByOrderId(orderId: bigint) {
    const shipment = await shipmentRepository.findByOrderId(orderId);
    if (!shipment) throw ApiError.notFound('No shipment exists for this order yet');
    return shipment;
  }

  async getById(id: bigint) {
    const shipment = await shipmentRepository.findById(id);
    if (!shipment) throw ApiError.notFound('Shipment not found');
    return shipment;
  }

  async list(filters: { deliveryPartnerId?: bigint; status?: ShipmentStatus; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await shipmentRepository.list({
      deliveryPartnerId: filters.deliveryPartnerId,
      status: filters.status,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  /** Assign or reassign a shipment to a delivery partner. Reassignment is just calling this again. */
  async assign(shipmentId: bigint, deliveryPartnerId: bigint, adminUserId: bigint) {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) throw ApiError.notFound('Shipment not found');
    const partner = await deliveryPartnerRepository.findById(deliveryPartnerId);
    if (!partner) throw ApiError.notFound('Delivery partner not found');
    if (partner.status !== 'active') throw ApiError.badRequest('This delivery partner is inactive');

    const previousStatus = shipment.status;
    const newStatus: ShipmentStatus = 'assigned';
    const updated = await shipmentRepository.update(shipmentId, {
      deliveryPartner: { connect: { id: deliveryPartnerId } },
      status: newStatus,
    });

    await shipmentRepository.addStatusHistory({
      shipmentId,
      orderId: shipment.orderId,
      updateType: 'note',
      previousStatus,
      newStatus,
      updatedBy: adminUserId,
      updatedByType: 'admin',
      message: shipment.deliveryPartnerId ? `Reassigned from partner ${shipment.deliveryPartnerId} to ${deliveryPartnerId}` : `Assigned to partner ${deliveryPartnerId}`,
    });

    return updated;
  }

  /** Generic status update — every transition validated against ALLOWED_TRANSITIONS and logged. Cannot reach 'delivered'. */
  async updateStatus(shipmentId: bigint, newStatus: ShipmentStatus, actor: { userId: bigint; type: 'admin' | 'staff' }, notes?: string) {
    if (newStatus === 'delivered') {
      throw ApiError.badRequest('A shipment can only be marked Delivered through OTP verification (POST /deliveries/:id/otp/verify)');
    }
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) throw ApiError.notFound('Shipment not found');

    const allowed = ALLOWED_TRANSITIONS[shipment.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(`Cannot move a shipment from '${shipment.status}' to '${newStatus}'`);
    }

    const previousStatus = shipment.status;
    const updated = await shipmentRepository.update(shipmentId, {
      status: newStatus,
      ...(newStatus === 'dispatched' ? { shippedAt: new Date() } : {}),
    });

    await shipmentRepository.addStatusHistory({
      shipmentId,
      orderId: shipment.orderId,
      updateType: newStatus === 'delivery_attempted' ? 'failed_attempt' : 'note',
      previousStatus,
      newStatus,
      updatedBy: actor.userId,
      updatedByType: actor.type,
      message: notes,
    });

    return updated;
  }

  /**
   * Failed delivery → reschedule. Requires Super Admin/staff approval by virtue of this
   * endpoint being staff-only (Section 7: "Do not automatically reschedule... bypassing
   * administrative approval" — there is no school- or dealer-facing reschedule endpoint).
   */
  async reschedule(shipmentId: bigint, newDeliveryDate: Date, reason: string, actor: { userId: bigint; type: 'admin' | 'staff' }) {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) throw ApiError.notFound('Shipment not found');
    if (shipment.status !== 'delivery_attempted' && shipment.status !== 'failed') {
      throw ApiError.badRequest('Only a failed/attempted delivery can be rescheduled');
    }

    const previousStatus = shipment.status;
    const updated = await shipmentRepository.update(shipmentId, { status: 'rescheduled' });

    await shipmentRepository.addStatusHistory({
      shipmentId,
      orderId: shipment.orderId,
      updateType: 'reschedule',
      previousStatus,
      newStatus: 'rescheduled',
      updatedBy: actor.userId,
      updatedByType: actor.type,
      newDeliveryDate,
      message: reason,
    });

    const order = await orderRepository.findById(shipment.orderId);
    if (order) {
      const school = await prisma.school.findUnique({ where: { id: order.schoolId } });
      if (school) {
        await notifyUser({
          userId: school.userId,
          type: 'delivery_rescheduled',
          title: 'Delivery rescheduled',
          message: `Delivery for order ${order.orderNumber} has been rescheduled: ${reason}`,
          referenceType: 'shipment',
          referenceId: shipmentId,
        });
      }
    }

    return updated;
  }

  /**
   * Step 1 of delivery confirmation — sends an OTP to the recipient. Must be called before
   * completeDeliveryWithOtp; there is no other path to 'delivered'.
   */
  async sendDeliveryOtp(shipmentId: bigint, recipient: { name?: string; identifier: string }, alternateRecipientApprovedBy?: bigint) {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) throw ApiError.notFound('Shipment not found');
    if (!['out_for_delivery', 'rescheduled', 'delivery_attempted'].includes(shipment.status)) {
      throw ApiError.badRequest('OTP can only be sent once the shipment is out for delivery');
    }

    await shipmentRepository.update(shipmentId, {
      recipientName: recipient.name ?? shipment.recipientName,
      recipientPhone: recipient.identifier.includes('@') ? shipment.recipientPhone : recipient.identifier,
      ...(alternateRecipientApprovedBy ? { alternateRecipientApprover: { connect: { id: alternateRecipientApprovedBy } } } : {}),
    });

    await otpService.sendOtp(recipient.identifier, 'delivery_confirmation', shipmentId);
  }

  /**
   * Step 2 — the only path that can set status = 'delivered'. Reuses the same
   * expiry/attempt-limit/one-time-use guarantees as every other OTP purpose in the app
   * (see otp.helper.ts) — an expired or already-consumed code is rejected the same way a
   * login OTP would be.
   */
  async completeDeliveryWithOtp(shipmentId: bigint, identifier: string, otp: string, actor: { userId: bigint; type: 'admin' | 'staff' }) {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment) throw ApiError.notFound('Shipment not found');
    if (shipment.status === 'delivered') throw ApiError.badRequest('This shipment is already marked Delivered');

    await otpService.verify(identifier, 'delivery_confirmation', otp);

    const previousStatus = shipment.status;
    const updated = await shipmentRepository.update(shipmentId, { status: 'delivered', deliveredAt: new Date() });

    await shipmentRepository.addStatusHistory({
      shipmentId,
      orderId: shipment.orderId,
      updateType: 'delivered',
      previousStatus,
      newStatus: 'delivered',
      updatedBy: actor.userId,
      updatedByType: actor.type,
      message: `OTP-verified delivery to ${shipment.recipientName ?? identifier}`,
    });

    const order = await orderRepository.findById(shipment.orderId);
    if (order) {
      const school = await prisma.school.findUnique({ where: { id: order.schoolId } });
      if (school) {
        await notifyUser({
          userId: school.userId,
          type: 'order_delivered',
          title: 'Order delivered',
          message: `Order ${order.orderNumber} has been delivered`,
          referenceType: 'order',
          referenceId: order.id,
        });
      }
    }

    return updated;
  }

  historyForOrder(orderId: bigint) {
    return shipmentRepository.historyForOrder(orderId);
  }
}

export const deliveryService = new DeliveryService();
