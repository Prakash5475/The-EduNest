import { dealerRepository } from '@/repositories/dealer.repository';
import { notifyUser } from '@/helpers/notification.helper';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { DealerStatus } from '@prisma/client';

export class AdminDealerService {
  async list(filters: { status?: DealerStatus; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await dealerRepository.list({ status: filters.status, search: filters.search, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: bigint) {
    const dealer = await dealerRepository.findByIdWithDetail(id);
    if (!dealer) throw ApiError.notFound('Dealer not found');
    return dealer;
  }

  /** Approve/block/activate/deactivate a dealer account. Notifies the dealer's own user of the change. */
  async updateStatus(id: bigint, status: DealerStatus, reason?: string) {
    const existing = await dealerRepository.findById(id);
    if (!existing) throw ApiError.notFound('Dealer not found');

    const dealer = await dealerRepository.update(id, { status });

    await notifyUser({
      userId: dealer.userId,
      type: 'dealer_status_changed',
      title: `Your account is now ${status.replace(/_/g, ' ')}`,
      message: reason ?? `Your dealer account status was updated to ${status.replace(/_/g, ' ')}`,
      referenceType: 'dealer',
      referenceId: dealer.id,
    });

    return dealer;
  }
}

export const adminDealerService = new AdminDealerService();
