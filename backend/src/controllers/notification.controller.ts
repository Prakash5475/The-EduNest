import type { NextFunction, Response } from 'express';
import { notificationRepository } from '@/repositories/notification.repository';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { getSocketServer } from '@/websocket/socket.server';
import { SOCKET_EVENTS } from '@/constants';
import type { AuthenticatedRequest } from '@/types';

function emitUnreadCount(userId: bigint, unreadCount: number): void {
  const io = getSocketServer();
  if (io) io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, { unreadCount });
}

export class NotificationController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { page, limit, skip, take } = normalizePagination(
        req.query.page as string | undefined,
        req.query.limit as string | undefined,
      );
      const { items, total, unreadCount } = await notificationRepository.list(BigInt(req.user.id), skip, take, {
        isRead: req.query.isRead as boolean | undefined,
        type: req.query.type as string | undefined,
      });
      const meta = { ...buildPaginationMeta(page, limit, total), unreadCount };
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const existing = await notificationRepository.findOwned(BigInt(req.user.id), BigInt(req.params.id));
      if (!existing) throw ApiError.notFound('Notification not found');
      const notification = await notificationRepository.markRead(existing.id, existing.createdAt);
      const { unreadCount } = await notificationRepository.list(BigInt(req.user.id), 0, 0);
      emitUnreadCount(BigInt(req.user.id), unreadCount);
      ApiResponse.success(res, { notification }, 'Marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await notificationRepository.markAllRead(BigInt(req.user.id));
      emitUnreadCount(BigInt(req.user.id), 0);
      ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
