import { whatsappConversationRepository } from '@/repositories/whatsappConversation.repository';
import { whatsappInboundMessageRepository } from '@/repositories/whatsappInboundMessage.repository';
import { dealerRepository } from '@/repositories/dealer.repository';
import { notifyUsersWithRole } from '@/helpers/notification.helper';
import { logger } from '@/config/logger';
import type { Prisma, WhatsappConversationState } from '@prisma/client';

export interface NormalizedInboundMessage {
  providerMessageId: string;
  fromPhone: string;
  messageType: string;
  bodyText?: string;
  rawPayload: Prisma.InputJsonValue;
}

export class WhatsappConversationService {
  /**
   * Advances a dealer's conversation into an "awaiting reply" state right before an outbound
   * message that expects a specific kind of response is sent (RFQ, work order, dispatch
   * request, delivery-confirmation request). Call sites are the outbound business-event
   * triggers (quotation/production services), not this module.
   */
  async markAwaitingReply(
    dealerId: bigint,
    phone: string,
    state: Exclude<WhatsappConversationState, 'idle'>,
    reference?: { referenceType: string; referenceId: bigint },
  ) {
    const conversation = await whatsappConversationRepository.getOrCreateForDealer(dealerId, phone);
    return whatsappConversationRepository.updateState(conversation.id, {
      state,
      referenceType: reference?.referenceType,
      referenceId: reference?.referenceId,
      lastOutboundAt: new Date(),
    });
  }

  /**
   * Persists a raw inbound webhook message idempotently (Meta redelivers on retry — the
   * providerMessageId unique constraint is the guard). Returns null if this message was
   * already recorded, so the caller can skip re-queuing processing for it.
   */
  async recordInboundMessage(message: NormalizedInboundMessage) {
    const existing = await whatsappInboundMessageRepository.findByProviderMessageId(message.providerMessageId);
    if (existing) return null;

    return whatsappInboundMessageRepository.create({
      providerMessageId: message.providerMessageId,
      fromPhone: message.fromPhone,
      messageType: message.messageType,
      bodyText: message.bodyText,
      rawPayload: message.rawPayload,
    });
  }

  /**
   * Ingests one already-persisted inbound message: resolves the dealer by phone, updates the
   * conversation's context with the raw reply, and notifies admin/staff to review it.
   *
   * Per the v1.0 business rule, a dealer's WhatsApp reply is NEVER auto-applied to a
   * quotation/production/payment record — admin staff review the reply and enter the
   * negotiated terms into the system themselves after the WhatsApp/phone discussion. This
   * method's job is only to make sure no reply is lost and that whoever picks it up has full
   * conversational context (what state the conversation was in, what it's a reply to) — it does
   * not write to DealerQuotation, Order, or Payment.
   */
  async processInboundMessage(inboundMessageId: bigint): Promise<void> {
    const message = await whatsappInboundMessageRepository.findById(inboundMessageId);
    if (!message) {
      logger.warn({ inboundMessageId: inboundMessageId.toString() }, 'WhatsApp inbound job referenced a message row that no longer exists');
      return;
    }

    try {
      const dealer = await dealerRepository.findByPhone(message.fromPhone);
      if (!dealer) {
        await whatsappInboundMessageRepository.markFailed(message.id, `No dealer found for phone ${message.fromPhone}`);
        return;
      }

      const conversation = await whatsappConversationRepository.getOrCreateForDealer(dealer.id, message.fromPhone);

      await whatsappConversationRepository.updateState(conversation.id, {
        state: 'idle',
        contextData: { lastReplyText: message.bodyText ?? null, lastReplyType: message.messageType, repliedInState: conversation.state },
        lastInboundAt: new Date(),
      });

      await notifyUsersWithRole(['super_admin', 'staff'], {
        type: 'whatsapp_reply_received',
        title: `WhatsApp reply from ${dealer.businessName}`,
        message: message.bodyText ? message.bodyText.slice(0, 200) : `New ${message.messageType} message received`,
        referenceType: 'whatsapp_conversation',
        referenceId: conversation.id,
      });

      await whatsappInboundMessageRepository.markProcessed(message.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error processing inbound message';
      await whatsappInboundMessageRepository.markFailed(message.id, errorMessage);
      throw err; // let BullMQ retry per its configured backoff
    }
  }
}

export const whatsappConversationService = new WhatsappConversationService();
