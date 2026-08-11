import { prisma } from '@/config/database';
import { notificationQueue } from '@/queues/notification.queue';
import { sendWhatsappNotification } from '@/services/whatsapp/whatsapp.service';
import { logger } from '@/config/logger';

export interface NotifyInput {
  userId: bigint;
  type: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: bigint;
  /** When set, also queues a WhatsApp delivery for this event (see whatsapp.templates.ts). */
  whatsapp?: { eventType: string; data: Record<string, string> };
}

/**
 * Single call site for every notification in the app: persists the in-app
 * `Notification` row (so /notifications and the unread badge have real data)
 * and enqueues the BullMQ job that fans out to the WebSocket room (and,
 * later, email/push) via `notification.worker.ts`. Never fabricate a
 * notification purely client-side — always go through here.
 */
export async function notifyUser(input: NotifyInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.message,
      notifType: input.type,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      isRead: false,
    },
  });

  try {
    await notificationQueue.add('notify', {
      userId: input.userId.toString(),
      title: input.title,
      message: input.message,
      type: input.type,
      data: {
        referenceType: input.referenceType,
        referenceId: input.referenceId?.toString(),
      },
    });
  } catch (err) {
    // Real-time delivery failing shouldn't lose the notification — it's already
    // persisted and will show up next time the user opens the app.
    logger.error({ err, userId: input.userId.toString() }, 'Failed to enqueue notification delivery');
  }

  if (input.whatsapp) {
    try {
      await sendWhatsappNotification({
        userId: input.userId,
        eventType: input.whatsapp.eventType,
        data: input.whatsapp.data,
        notificationId: notification.id,
        notificationCreatedAt: notification.createdAt,
      });
    } catch (err) {
      logger.error({ err, userId: input.userId.toString() }, 'Failed to queue WhatsApp delivery');
    }
  }

  return notification;
}

/** Notify every user holding one of the given roles (e.g. all super_admin/staff) — used for admin-facing alerts. */
export async function notifyUsersWithRole(roleSlugs: string[], input: Omit<NotifyInput, 'userId'>) {
  const users = await prisma.user.findMany({
    where: { userRoles: { some: { role: { slug: { in: roleSlugs } } } }, deletedAt: null },
    select: { id: true },
  });
  await Promise.all(users.map((u: { id: bigint }) => notifyUser({ ...input, userId: u.id })));
}
