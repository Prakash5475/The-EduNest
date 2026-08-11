import crypto from 'node:crypto';
import { env } from '@/config/env';
import { whatsappConversationService } from './whatsappConversation.service';
import { whatsappInboundQueue } from '@/queues/whatsappInbound.queue';
import { whatsappLogRepository } from '@/repositories/whatsappLog.repository';
import { logger } from '@/config/logger';
import type { Prisma, WhatsappMessageStatus } from '@prisma/client';

interface MetaWebhookMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  [key: string]: unknown;
}

interface MetaWebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  errors?: Array<{ title: string }>;
}

interface MetaWebhookPayload {
  object: string;
  entry?: Array<{
    changes?: Array<{ field: string; value: { messages?: MetaWebhookMessage[]; statuses?: MetaWebhookStatus[] } }>;
  }>;
}

/**
 * Parses and dispatches Meta WhatsApp Cloud API webhook events, per the official spec:
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started (signature)
 * https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples (payload shape)
 */
export class WhatsappWebhookService {
  /** GET handshake — Meta calls this once when the webhook subscription is configured. */
  verifyHandshake(mode: string | undefined, token: string | undefined): boolean {
    return mode === 'subscribe' && !!env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  }

  /** POST signature validation — every delivery is signed with the app secret (X-Hub-Signature-256). */
  verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
    if (!env.WHATSAPP_APP_SECRET) {
      logger.warn('WHATSAPP_APP_SECRET is not set — refusing to accept unsigned WhatsApp webhook payloads');
      return false;
    }
    if (!signatureHeader?.startsWith('sha256=')) return false;

    const expected = crypto.createHmac('sha256', env.WHATSAPP_APP_SECRET).update(rawBody).digest('hex');
    const provided = signatureHeader.slice('sha256='.length);
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(provided, 'hex');
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  }

  async handlePayload(payload: MetaWebhookPayload): Promise<void> {
    if (payload.object !== 'whatsapp_business_account') return;

    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue;
        for (const message of change.value.messages ?? []) {
          await this.handleInboundMessage(message);
        }
        for (const status of change.value.statuses ?? []) {
          await this.handleStatusUpdate(status);
        }
      }
    }
  }

  private async handleInboundMessage(message: MetaWebhookMessage): Promise<void> {
    const bodyText = message.type === 'text' ? message.text?.body : undefined;
    const record = await whatsappConversationService.recordInboundMessage({
      providerMessageId: message.id,
      fromPhone: `+${message.from}`,
      messageType: message.type,
      bodyText,
      rawPayload: message as unknown as Prisma.InputJsonValue,
    });
    if (!record) return; // Meta redelivery of an event we've already recorded — skip re-queuing
    await whatsappInboundQueue.add('process', { inboundMessageId: record.id.toString() });
  }

  /** Delivery-status callback for a message WE sent (sent/delivered/read/failed) — updates the existing WhatsappMessageLog. */
  private async handleStatusUpdate(status: MetaWebhookStatus): Promise<void> {
    const log = await whatsappLogRepository.findByProviderMessageId(status.id);
    if (!log) return; // status callback for a message this app didn't send (or older than the log retention window)

    if (status.status === 'delivered') {
      await whatsappLogRepository.updateStatus(log.id, { status: 'delivered' as WhatsappMessageStatus, deliveredAt: new Date(Number(status.timestamp) * 1000) });
    } else if (status.status === 'read') {
      await whatsappLogRepository.updateStatus(log.id, { status: 'read' as WhatsappMessageStatus, readAt: new Date(Number(status.timestamp) * 1000) });
    } else if (status.status === 'failed') {
      await whatsappLogRepository.updateStatus(log.id, {
        status: 'failed' as WhatsappMessageStatus,
        errorMessage: status.errors?.[0]?.title ?? 'Delivery failed',
        failedAt: new Date(),
      });
    }
  }
}

export const whatsappWebhookService = new WhatsappWebhookService();
