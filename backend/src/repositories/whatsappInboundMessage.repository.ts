import type { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class WhatsappInboundMessageRepository extends BaseRepository {
  /** Idempotency guard — Meta may redeliver the same webhook event on retry. */
  findByProviderMessageId(providerMessageId: string) {
    return this.db.whatsappInboundMessage.findUnique({ where: { providerMessageId } });
  }

  findById(id: bigint) {
    return this.db.whatsappInboundMessage.findUnique({ where: { id } });
  }

  create(data: {
    conversationId?: bigint;
    providerMessageId: string;
    fromPhone: string;
    messageType: string;
    bodyText?: string;
    rawPayload: Prisma.InputJsonValue;
  }) {
    return this.db.whatsappInboundMessage.create({ data });
  }

  markProcessed(id: bigint) {
    return this.db.whatsappInboundMessage.update({ where: { id }, data: { processedAt: new Date(), processingError: null } });
  }

  markFailed(id: bigint, error: string) {
    return this.db.whatsappInboundMessage.update({ where: { id }, data: { processingError: error } });
  }

  async list(skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.db.whatsappInboundMessage.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.whatsappInboundMessage.count(),
    ]);
    return { items, total };
  }
}

export const whatsappInboundMessageRepository = new WhatsappInboundMessageRepository();
