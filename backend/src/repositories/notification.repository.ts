import { BaseRepository } from './base.repository';

export class NotificationRepository extends BaseRepository {
  async list(userId: bigint, skip: number, take: number, filters?: { isRead?: boolean; type?: string }) {
    const where = {
      userId,
      ...(filters?.isRead !== undefined ? { isRead: filters.isRead } : {}),
      ...(filters?.type ? { notifType: filters.type } : {}),
    };
    const [items, total, unreadCount] = await Promise.all([
      this.db.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.notification.count({ where }),
      this.db.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { items, total, unreadCount };
  }

  findOwned(userId: bigint, id: bigint) {
    return this.db.notification.findFirst({ where: { id, userId } });
  }

  markRead(id: bigint, createdAt: Date) {
    return this.db.notification.update({
      where: { id_createdAt: { id, createdAt } },
      data: { isRead: true, readAt: new Date() },
    });
  }

  markAllRead(userId: bigint) {
    return this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

export const notificationRepository = new NotificationRepository();
