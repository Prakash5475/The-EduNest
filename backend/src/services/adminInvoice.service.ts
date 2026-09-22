import { invoiceRepository } from '@/repositories/invoice.repository';
import { emailService } from '@/services/email.service';
import { env } from '@/config/env';
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

  /** Emails the school its already-generated invoice PDF link. Fails loudly (no fake success) if the PDF or SMTP isn't ready. */
  async sendInvoice(id: bigint) {
    const invoice = await invoiceRepository.findByIdForAdmin(id);
    if (!invoice) throw ApiError.notFound('Invoice not found');
    if (!invoice.uploadedFile?.filePath) {
      throw ApiError.badRequest('This invoice has no generated PDF yet — it cannot be emailed');
    }
    const to = invoice.school.user?.email;
    if (!to) throw ApiError.badRequest('This school has no email on file');
    if (!env.SMTP_HOST || env.SMTP_USER === 'replace_me' || !env.SMTP_USER) {
      throw ApiError.internal('Email is not configured on this server (SMTP credentials missing/placeholder) — invoice was not sent');
    }
    const downloadUrl = invoice.uploadedFile.filePath.startsWith('http')
      ? invoice.uploadedFile.filePath
      : `${env.CLIENT_URL}${invoice.uploadedFile.filePath}`;
    await emailService.sendInvoiceEmail(to, invoice.school.schoolName, invoice.invoiceNumber, invoice.totalAmount.toString(), downloadUrl);
    return { sent: true, to };
  }
}

export const adminInvoiceService = new AdminInvoiceService();
