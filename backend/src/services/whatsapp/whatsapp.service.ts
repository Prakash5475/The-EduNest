import { prisma } from '@/config/database';
import { whatsappLogRepository } from '@/repositories/whatsappLog.repository';
import { whatsappQueue } from '@/queues/whatsapp.queue';
import { WHATSAPP_TEMPLATES, buildDeepLink } from './whatsapp.templates';
import { logger } from '@/config/logger';

export interface SendWhatsappInput {
  userId: bigint;
  eventType: string;
  data: Record<string, string>;
  notificationId?: bigint;
  notificationCreatedAt?: Date;
}

async function isChannelEnabled(userId: bigint, notifType: string): Promise<boolean> {
  const pref = await prisma.notificationSetting.findUnique({
    where: { userId_channel_notifType: { userId, channel: 'whatsapp', notifType } },
  });
  // No explicit preference row yet => default to enabled (opt-out model).
  return pref ? pref.isEnabled : true;
}

/**
 * Queues a WhatsApp delivery attempt for a business event. Safe to call for
 * every notification — silently no-ops for event types with no registered
 * template, and respects the recipient's channel preference unless the
 * template is marked `critical`.
 */
export async function sendWhatsappNotification(input: SendWhatsappInput): Promise<void> {
  const template = WHATSAPP_TEMPLATES[input.eventType];
  if (!template) return; // No WhatsApp template registered for this event yet — fine, in-app/socket already covers it.

  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { phone: true } });
  if (!user?.phone) {
    logger.warn({ userId: input.userId.toString(), eventType: input.eventType }, 'Cannot send WhatsApp — user has no phone number on file');
    return;
  }

  if (!template.critical) {
    const enabled = await isChannelEnabled(input.userId, input.eventType);
    if (!enabled) return;
  }

  const params = template.buildParams(input.data);
  const deepLink = buildDeepLink(template.deepLinkPath(input.data));
  const bodyPreview = `[${template.templateName}] ${params.join(' | ')} — ${deepLink}`;

  const log = await whatsappLogRepository.create({
    user: { connect: { id: input.userId } },
    phone: user.phone,
    eventType: input.eventType,
    templateName: template.templateName,
    templateParams: params,
    bodyPreview,
    status: 'queued',
    providerName: 'pending',
    ...(input.notificationId && input.notificationCreatedAt
      ? { notificationId: input.notificationId, notificationCreatedAt: input.notificationCreatedAt }
      : {}),
  });

  try {
    await whatsappQueue.add('send', { logId: log.id.toString() });
  } catch (err) {
    logger.error({ err, logId: log.id.toString() }, 'Failed to enqueue WhatsApp delivery job');
    await whatsappLogRepository.updateStatus(log.id, {
      status: 'failed',
      errorMessage: 'Failed to enqueue delivery job',
      failedAt: new Date(),
    });
  }
}
