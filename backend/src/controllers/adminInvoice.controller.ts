import type { NextFunction, Request, Response } from 'express';
import { adminInvoiceService } from '@/services/adminInvoice.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AdminInvoiceController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, schoolId, from, to, search, page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminInvoiceService.list({
        status: status as never,
        schoolId: schoolId ? BigInt(schoolId) : undefined,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await adminInvoiceService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { invoice });
    } catch (err) {
      next(err);
    }
  }

  async summary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await adminInvoiceService.getSummary();
      ApiResponse.success(res, { byStatus: summary });
    } catch (err) {
      next(err);
    }
  }
}

export const adminInvoiceController = new AdminInvoiceController();
