import { paymentRepository } from '@/repositories/payment.repository';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { PaymentPaymentType, PaymentStatus } from '@prisma/client';

export class AdminPaymentService {
  async list(filters: { status?: PaymentStatus; paymentType?: PaymentPaymentType; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await paymentRepository.listForAdmin({
      status: filters.status,
      paymentType: filters.paymentType,
      search: filters.search,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: bigint) {
    const payment = await paymentRepository.findByIdForAdmin(id);
    if (!payment) throw ApiError.notFound('Payment not found');
    return payment;
  }

  async getRefundHistory(page?: number, limit?: number) {
    const { page: p, limit: l, skip, take } = normalizePagination(page, limit);
    const { items, total } = await paymentRepository.listRefundHistory(skip, take);
    return { items, meta: buildPaginationMeta(p, l, total) };
  }

  async getSummary() {
    return paymentRepository.getAdminSummary();
  }
}

export const adminPaymentService = new AdminPaymentService();
