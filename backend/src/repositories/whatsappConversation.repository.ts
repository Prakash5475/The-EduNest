import type { Prisma, WhatsappConversation, WhatsappConversationState } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class WhatsappConversationRepository extends BaseRepository {
  findByDealerId(dealerId: bigint): Promise<WhatsappConversation | null> {
    return this.db.whatsappConversation.findUnique({ where: { dealerId } });
  }

  /** Looks a conversation up by the inbound message's from-phone, joined through the owning dealer. */
  findByPhone(phone: string) {
    return this.db.whatsappConversation.findFirst({ where: { phone }, include: { dealer: true } });
  }

  getOrCreateForDealer(dealerId: bigint, phone: string): Promise<WhatsappConversation> {
    return this.db.whatsappConversation.upsert({
      where: { dealerId },
      update: {},
      create: { dealerId, phone, state: 'idle' },
    });
  }

  updateState(
    id: bigint,
    data: {
      state: WhatsappConversationState;
      contextData?: Prisma.InputJsonValue;
      referenceType?: string | null;
      referenceId?: bigint | null;
      lastInboundAt?: Date;
      lastOutboundAt?: Date;
    },
  ) {
    return this.db.whatsappConversation.update({ where: { id }, data });
  }

  /** Admin conversation-history view — every dealer's current WhatsApp state, paginated. */
  async list(skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.db.whatsappConversation.findMany({
        include: { dealer: { select: { id: true, businessName: true } } },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.db.whatsappConversation.count(),
    ]);
    return { items, total };
  }

  /** Full inbound message history for one dealer's conversation. */
  async listMessages(conversationId: bigint, skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.db.whatsappInboundMessage.findMany({ where: { conversationId }, orderBy: { createdAt: 'desc' }, skip, take }),
      this.db.whatsappInboundMessage.count({ where: { conversationId } }),
    ]);
    return { items, total };
  }
}

export const whatsappConversationRepository = new WhatsappConversationRepository();
