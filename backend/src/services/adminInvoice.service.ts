import { invoiceRepository } from '@/repositories/invoice.repository';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { InvoiceStatus } from '@prisma/client';

export class AdminInvoiceService {
  async list(filters: {
    status?: InvoiceStatus;
    schoolId?: bigint;
    from?: Date;
    to?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await invoiceRepository.listForAdmin({
      status: filters.status,
      schoolId: filters.schoolId,
      from: filters.from,
      to: filters.to,
      search: filters.search,
      skip,
      take,
    });
    return {
      items: items.map((invoice) => ({ ...invoice, downloadUrl: invoice.uploadedFile?.filePath ?? null })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: bigint) {
    const invoice = await invoiceRepository.findByIdForAdmin(id);
    if (!invoice) throw ApiError.notFound('Invoice not found');
    return { ...invoice, downloadUrl: invoice.uploadedFile?.filePath ?? null };
  }

  async getSummary() {
    return invoiceRepository.getAdminSummary();
  }
}

export const adminInvoiceService = new AdminInvoiceService();
