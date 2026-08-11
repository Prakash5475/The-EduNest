import { productionRepository } from '@/repositories/production.repository';
import { orderRepository } from '@/repositories/order.repository';
import { dealerCapacityService } from '@/services/dealerCapacity.service';
import { dealerRepository } from '@/repositories/dealer.repository';
import { prisma } from '@/config/database';
import { notifyUser, notifyUsersWithRole } from '@/helpers/notification.helper';
import { whatsappConversationService } from '@/services/whatsapp/whatsappConversation.service';
import { getSocketServer } from '@/websocket/socket.server';
import { SOCKET_EVENTS } from '@/constants';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedUser } from '@/types';
import type { ProductionCheckpointStage, Order } from '@prisma/client';

/** Checkpoints that also advance the order's own status, so tracking pages
 * that only read Order.status stay in sync with the detailed checkpoint feed. */
const STATUS_BY_CHECKPOINT: Partial<Record<ProductionCheckpointStage, Order['status']>> = {
  dispatched: 'shipped',
  delivered: 'delivered',
  completed: 'completed',
};

/** Canonical forward order of the production pipeline — used to block out-of-sequence checkpoints. */
const STAGE_ORDER: ProductionCheckpointStage[] = [
  'order_received',
  'cutting',
  'stitching',
  'logo',
  'printing',
  'color_matching',
  'quality_check',
  'ready',
  'packed',
  'dispatched',
  'delivered',
  'completed',
];

function isStaff(user: AuthenticatedUser): boolean {
  return user.roles?.some((r) => r === 'super_admin' || r === 'staff') ?? false;
}

export class ProductionService {
  /** Shared tri-role access check (admin/staff, assigned dealer, or owning school) — reused by challan PDF export. */
  async assertCanAccessOrder(user: AuthenticatedUser, orderId: bigint) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    if (isStaff(user)) return order;

    if (user.userType === 'dealer') {
      const dealer = await prisma.dealer.findFirst({ where: { userId: BigInt(user.id) } });
      if (dealer && order.dealerId === dealer.id) return order;
    }
    if (user.userType === 'school') {
      const school = await prisma.school.findFirst({ where: { userId: BigInt(user.id) } });
      if (school && order.schoolId === school.id) return order;
    }
    throw ApiError.forbidden('You do not have access to this order');
  }

  async listByOrder(user: AuthenticatedUser, orderId: bigint) {
    const order = await this.assertCanAccessOrder(user, orderId);
    const history = await productionRepository.listByOrder(orderId);
    return { order, history };
  }

  /** Only the order's assigned dealer, or admin/staff, may log a checkpoint. */
  async addCheckpoint(
    user: AuthenticatedUser,
    orderId: bigint,
    input: {
      stage: ProductionCheckpointStage;
      completionPercentage: number;
      notes?: string;
      imageFileIds?: bigint[];
      overrideReason?: string;
    },
  ) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const actingAsStaff = isStaff(user);
    if (!actingAsStaff) {
      if (user.userType !== 'dealer') throw ApiError.forbidden('Only the assigned dealer or staff can update production status');
      const dealer = await prisma.dealer.findFirst({ where: { userId: BigInt(user.id) } });
      if (!dealer || order.dealerId !== dealer.id) {
        throw ApiError.forbidden('You are not the dealer assigned to this order');
      }
    }

    if (actingAsStaff && !input.overrideReason) {
      throw ApiError.badRequest('An override reason is required when an admin updates production on the dealer\'s behalf');
    }

    if (!order.dealerId) {
      throw ApiError.badRequest('This order has no dealer assigned yet — assign a dealer before logging production checkpoints');
    }

    const latest = await productionRepository.latestByOrder(orderId);
    const latestStage = latest?.stage;
    const newIndex = STAGE_ORDER.indexOf(input.stage);
    const latestIndex = latestStage ? STAGE_ORDER.indexOf(latestStage) : -1;
    if (newIndex < latestIndex && !actingAsStaff) {
      throw ApiError.badRequest(`Cannot move production backward from "${latestStage}" to "${input.stage}"`);
    }
    if (input.stage === 'completed' && latestIndex < STAGE_ORDER.indexOf('delivered') && !actingAsStaff) {
      throw ApiError.badRequest('An order must be marked "delivered" before it can be marked "completed"');
    }

    const checkpoint = await productionRepository.addCheckpoint({
      orderId,
      stage: input.stage,
      completionPercentage: input.completionPercentage,
      notes: input.notes,
      updatedBy: BigInt(user.id),
      updatedByType: actingAsStaff ? 'admin' : 'dealer',
      overrideReason: actingAsStaff ? input.overrideReason : undefined,
      imageFileIds: input.imageFileIds ?? [],
    });

    const newStatus = STATUS_BY_CHECKPOINT[input.stage];
    const statusChanged = newStatus && newStatus !== order.status;
    if (statusChanged) {
      await orderRepository.update(orderId, { status: newStatus });
    }
    await orderRepository.addStatusHistory(
      orderId,
      statusChanged ? newStatus! : order.status,
      BigInt(user.id),
      `Production checkpoint: ${input.stage} (${input.completionPercentage}%)`,
    );

    // Notify the school and admin/staff — never the dealer who just made the update.
    const school = await prisma.school.findUnique({ where: { id: order.schoolId } });
    if (school) {
      await notifyUser({
        userId: school.userId,
        type: 'order_checkpoint_updated',
        title: 'Order update',
        message: `Order ${order.orderNumber} reached "${input.stage.replace(/_/g, ' ')}" (${input.completionPercentage}%)`,
        referenceType: 'order',
        referenceId: order.id,
      });
    }
    await notifyUsersWithRole(['super_admin', 'staff'], {
      type: 'order_checkpoint_updated',
      title: 'Production update',
      message: `Order ${order.orderNumber}: ${input.stage.replace(/_/g, ' ')} (${input.completionPercentage}%)`,
      referenceType: 'order',
      referenceId: order.id,
    });

    // Dealers have no login portal in v1.0 — keep them in the loop via WhatsApp only.
    // "packed" and "dispatched" expect a specific reply back (dispatch details, delivery
    // confirmation) so the conversation is put into the matching awaiting-reply state; every
    // other stage is a one-way FYI confirmation with no state change.
    if (order.dealerId) {
      const dealer = await dealerRepository.findById(order.dealerId);
      const dealerUser = dealer ? await prisma.user.findUnique({ where: { id: dealer.userId }, select: { phone: true } }) : null;

      if (dealer && dealerUser?.phone) {
        if (input.stage === 'packed') {
          await notifyUser({
            userId: dealer.userId,
            type: 'dispatch_request',
            title: 'Ready for dispatch',
            message: `Order ${order.orderNumber} is packed — please share dispatch details`,
            referenceType: 'order',
            referenceId: order.id,
            whatsapp: { eventType: 'dispatch_request_dealer', data: { orderNumber: order.orderNumber } },
          });
          await whatsappConversationService.markAwaitingReply(dealer.id, dealerUser.phone, 'awaiting_dispatch_details', {
            referenceType: 'order',
            referenceId: order.id,
          });
        } else if (input.stage === 'dispatched') {
          await notifyUser({
            userId: dealer.userId,
            type: 'delivery_confirmation_request',
            title: 'Confirm delivery when complete',
            message: `Order ${order.orderNumber} was marked dispatched — please confirm once it's delivered`,
            referenceType: 'order',
            referenceId: order.id,
            whatsapp: { eventType: 'delivery_confirmation_request_dealer', data: { orderNumber: order.orderNumber } },
          });
          await whatsappConversationService.markAwaitingReply(dealer.id, dealerUser.phone, 'awaiting_delivery_confirmation', {
            referenceType: 'order',
            referenceId: order.id,
          });
        } else {
          await notifyUser({
            userId: dealer.userId,
            type: 'production_milestone',
            title: 'Production milestone recorded',
            message: `Order ${order.orderNumber} reached "${input.stage.replace(/_/g, ' ')}"`,
            referenceType: 'order',
            referenceId: order.id,
            whatsapp: { eventType: 'production_milestone_dealer', data: { orderNumber: order.orderNumber, stage: input.stage.replace(/_/g, ' ') } },
          });
        }
      }
    }

    const io = getSocketServer();
    io?.to(`order:${orderId}`).emit(SOCKET_EVENTS.ORDER_TRACKING_UPDATE, {
      orderId: orderId.toString(),
      stage: input.stage,
      completionPercentage: input.completionPercentage,
      status: statusChanged ? newStatus : order.status,
      createdAt: checkpoint.createdAt,
    });

    return checkpoint;
  }

  /** Assigns (or reassigns) the dealer responsible for producing an order. Staff/admin only. Blocks assignment to an overloaded dealer unless explicitly forced. */
  async assignDealer(orderId: bigint, dealerId: bigint, assignedBy: bigint, force = false) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const dealer = await dealerRepository.findById(dealerId);
    if (!dealer) throw ApiError.notFound('Dealer not found');

    const snapshot = await dealerCapacityService.getSnapshot(dealerId);
    if (snapshot.status === 'overloaded' && !force) {
      throw ApiError.badRequest(
        `${dealer.businessName} is currently overloaded (${snapshot.capacityPercent}% capacity). Pass force=true to assign anyway.`,
      );
    }

    await orderRepository.update(orderId, { dealerId });
    await orderRepository.addStatusHistory(
      orderId,
      order.status,
      assignedBy,
      `Assigned to dealer ${dealer.businessName} for production`,
    );

    await notifyUser({
      userId: dealer.userId,
      type: 'order_assigned',
      title: 'New order assigned',
      message: `Order ${order.orderNumber} has been assigned to you for production`,
      referenceType: 'order',
      referenceId: order.id,
      whatsapp: {
        eventType: 'dealer_work_order',
        data: { orderNumber: order.orderNumber, itemSummary: `${order.orderItems.length} item(s)` },
      },
    });

    const dealerUser = await prisma.user.findUnique({ where: { id: dealer.userId }, select: { phone: true } });
    if (dealerUser?.phone) {
      await whatsappConversationService.markAwaitingReply(dealer.id, dealerUser.phone, 'awaiting_work_order_ack', {
        referenceType: 'order',
        referenceId: order.id,
      });
    }

    return orderRepository.findById(orderId);
  }

  /** Staff-facing production overview: order counts by latest stage, overdue orders, dealers currently in production. */
  async getDashboard() {
    const [inProductionOrders, overdueOrders, latestCheckpoints] = await Promise.all([
      prisma.order.count({ where: { status: { in: ['confirmed', 'processing'] }, deletedAt: null } }),
      prisma.order.count({
        where: {
          productionDeadline: { lt: new Date() },
          status: { notIn: ['delivered', 'completed', 'cancelled', 'returned'] },
          deletedAt: null,
        },
      }),
      prisma.productionCheckpoint.groupBy({
        by: ['stage'],
        _count: { _all: true },
        where: { order: { deletedAt: null, status: { notIn: ['delivered', 'completed', 'cancelled', 'returned'] } } },
      }),
    ]);

    return {
      inProductionOrders,
      overdueOrders,
      byStage: Object.fromEntries(latestCheckpoints.map((c) => [c.stage, c._count._all])),
    };
  }
}

export const productionService = new ProductionService();
