import { whatsappLogRepository } from '@/repositories/whatsappLog.repository';
import { whatsappConversationRepository } from '@/repositories/whatsappConversation.repository';
import { dealerRepository } from '@/repositories/dealer.repository';
import { sendWhatsappNotification } from '@/services/whatsapp/whatsapp.service';
import { WHATSAPP_TEMPLATES } from '@/services/whatsapp/whatsapp.templates';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { WhatsappMessageStatus } from '@prisma/client';

export class AdminWhatsappService {
  async listDeliveryLogs(status: WhatsappMessageStatus | undefined, page?: number, limit?: number) {
    const { page: p, limit: l, skip, take } = normalizePagination(page, limit);
    const { items, total } = await whatsappLogRepository.list(skip, take, status);
    return { items, meta: buildPaginationMeta(p, l, total) };
  }

  async listConversations(page?: number, limit?: number) {
    const { page: p, limit: l, skip, take } = normalizePagination(page, limit);
    const { items, total } = await whatsappConversationRepository.list(skip, take);
    return { items, meta: buildPaginationMeta(p, l, total) };
  }

  async getConversationMessages(conversationId: bigint, page?: number, limit?: number) {
    const { page: p, limit: l, skip, take } = normalizePagination(page, limit);
    const { items, total } = await whatsappConversationRepository.listMessages(conversationId, skip, take);
    return { items, meta: buildPaginationMeta(p, l, total) };
  }

  /** Sends the same registered template to a set of dealers at once. Reuses the existing
   * per-user send pipeline (queue, delivery ledger) — no new send path. */
  async broadcast(dealerIds: bigint[], eventType: string, data: Record<string, string>) {
    if (!WHATSAPP_TEMPLATES[eventType]) {
      throw ApiError.badRequest(`No WhatsApp template is registered for event type "${eventType}"`);
    }

    const results = await Promise.all(
      dealerIds.map(async (dealerId) => {
        const dealer = await dealerRepository.findById(dealerId);
        if (!dealer) return { dealerId: dealerId.toString(), queued: false, reason: 'Dealer not found' };
        await sendWhatsappNotification({ userId: dealer.userId, eventType, data });
        return { dealerId: dealerId.toString(), queued: true };
      }),
    );

    return { results };
  }
}

export const adminWhatsappService = new AdminWhatsappService();
