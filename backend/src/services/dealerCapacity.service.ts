import { prisma } from '@/config/database';
import { dealerRepository } from '@/repositories/dealer.repository';
import { orderRepository } from '@/repositories/order.repository';
import { settingsRepository } from '@/repositories/settings.repository';
import { ApiError } from '@/utils/ApiError';

/** Above this many concurrent active orders, a dealer is considered at full capacity for the "Overloaded" label. */
const CAPACITY_ORDER_THRESHOLD_DEFAULT = 40;
const CAPACITY_THRESHOLD_SETTING_KEY = 'dealer_capacity_order_threshold';

async function getCapacityThreshold(): Promise<number> {
  const settings = await settingsRepository.listApplication();
  const setting = settings.find((s) => s.settingKey === CAPACITY_THRESHOLD_SETTING_KEY);
  const parsed = setting?.settingValue ? Number(setting.settingValue) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : CAPACITY_ORDER_THRESHOLD_DEFAULT;
}

const ACTIVE_ORDER_STATUSES = ['confirmed', 'processing', 'shipped'] as const;

export interface DealerCapacitySnapshot {
  dealerId: string;
  businessName: string;
  activeOrders: number;
  ordersInProduction: number;
  nearDeadlineOrders: number;
  overdueOrders: number;
  pendingDeliveries: number;
  completedOrders: number;
  averageProductionDays: number | null;
  capacityPercent: number;
  status: 'available' | 'moderate' | 'overloaded';
  recommendation: string;
}

export class DealerCapacityService {
  /** Real workload snapshot for one dealer, computed entirely from Order/ProductionCheckpoint data. */
  async getSnapshot(dealerId: bigint): Promise<DealerCapacitySnapshot> {
    const dealer = await dealerRepository.findById(dealerId);
    if (!dealer) throw ApiError.notFound('Dealer not found');

    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 3);

    const [activeOrders, ordersInProduction, nearDeadlineOrders, overdueOrders, pendingDeliveries, completedOrders, completedWithTimes] =
      await Promise.all([
        prisma.order.count({ where: { dealerId, deletedAt: null, status: { in: [...ACTIVE_ORDER_STATUSES] } } }),
        prisma.order.count({ where: { dealerId, deletedAt: null, status: 'processing' } }),
        prisma.order.count({
          where: {
            dealerId,
            deletedAt: null,
            productionDeadline: { gte: now, lte: soon },
            status: { notIn: ['delivered', 'completed', 'cancelled', 'returned'] },
          },
        }),
        prisma.order.count({
          where: {
            dealerId,
            deletedAt: null,
            productionDeadline: { lt: now },
            status: { notIn: ['delivered', 'completed', 'cancelled', 'returned'] },
          },
        }),
        prisma.order.count({ where: { dealerId, deletedAt: null, status: { in: ['shipped', 'processing'] } } }),
        prisma.order.count({ where: { dealerId, deletedAt: null, status: 'completed' } }),
        prisma.order.findMany({
          where: { dealerId, deletedAt: null, status: 'completed' },
          select: { placedAt: true, updatedAt: true },
          take: 50,
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

    const averageProductionDays =
      completedWithTimes.length > 0
        ? Math.round(
            (completedWithTimes.reduce((sum, o) => sum + (o.updatedAt.getTime() - o.placedAt.getTime()), 0) /
              completedWithTimes.length /
              (1000 * 60 * 60 * 24)) *
              10,
          ) / 10
        : null;

    const capacityThreshold = await getCapacityThreshold();
    const capacityPercent = Math.min(100, Math.round((activeOrders / capacityThreshold) * 100));
    const status: DealerCapacitySnapshot['status'] =
      capacityPercent >= 85 ? 'overloaded' : capacityPercent >= 50 ? 'moderate' : 'available';
    const recommendation =
      status === 'overloaded'
        ? `${dealer.businessName} is overloaded — consider assigning new work elsewhere.`
        : status === 'moderate'
          ? `${dealer.businessName} has moderate load — can take on limited additional work.`
          : `${dealer.businessName} has available production capacity.`;

    return {
      dealerId: dealer.id.toString(),
      businessName: dealer.businessName,
      activeOrders,
      ordersInProduction,
      nearDeadlineOrders,
      overdueOrders,
      pendingDeliveries,
      completedOrders,
      averageProductionDays,
      capacityPercent,
      status,
      recommendation,
    };
  }

  /** Capacity snapshot for every active dealer — the Admin's view before assigning work. */
  async getAllSnapshots() {
    const dealers = await prisma.dealer.findMany({ where: { status: 'active' }, select: { id: true } });
    return Promise.all(dealers.map((d) => this.getSnapshot(d.id)));
  }

  async getDashboard(dealerId: bigint) {
    const dealer = await dealerRepository.findById(dealerId);
    if (!dealer) throw ApiError.notFound('Dealer not found');

    const [snapshot, assignedOrders, recentCheckpoints, pendingQuotations, unreadNotifications] = await Promise.all([
      this.getSnapshot(dealerId),
      orderRepository.list({ dealerId, skip: 0, take: 10 }),
      prisma.productionCheckpoint.findMany({
        where: { order: { dealerId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { order: { select: { id: true, orderNumber: true } } },
      }),
      prisma.dealerQuotation.count({ where: { dealerId, status: 'submitted' } }),
      prisma.notification.count({ where: { userId: dealer.userId, isRead: false } }),
    ]);

    return {
      capacity: snapshot,
      recentOrders: assignedOrders.items,
      recentCheckpoints,
      pendingQuotations,
      unreadNotifications,
    };
  }
}

export const dealerCapacityService = new DealerCapacityService();
