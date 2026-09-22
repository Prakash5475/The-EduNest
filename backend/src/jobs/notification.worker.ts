import { Worker, type Job } from 'bullmq';
import { redisForQueues } from '@/config/redis';
import { env } from '@/config/env';
import { QUEUE_NAMES, SOCKET_EVENTS } from '@/constants';
import { logger } from '@/config/logger';
import { getSocketServer } from '@/websocket/socket.server';
import { prisma } from '@/config/database';
import type { NotificationJobData } from '@/queues/notification.queue';

export function createNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    QUEUE_NAMES.NOTIFICATION,
    async (job: Job<NotificationJobData>) => {
      const io = getSocketServer();
      if (io) {
        io.to(`user:${job.data.userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, job.data);
        const unreadCount = await prisma.notification.count({
          where: { userId: BigInt(job.data.userId), isRead: false },
        });
        io.to(`user:${job.data.userId}`).emit(SOCKET_EVENTS.NOTIFICATION_UNREAD_COUNT, { unreadCount });
      }
      // Device push (FCM/APNs) integration point for a later phase — Phase 1
      // only wires the queue + socket delivery path.
      logger.info({ jobId: job.id, userId: job.data.userId }, 'Notification dispatched');
    },
    {
      connection: redisForQueues,
      prefix: env.QUEUE_PREFIX,
      concurrency: 10,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Notification job failed');
  });

  return worker;
}
