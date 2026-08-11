import type { NextFunction, Request, Response } from 'express';
import { adminPaymentService } from '@/services/adminPayment.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AdminPaymentController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, paymentType, search, page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminPaymentService.list({
        status: status as never,
        paymentType: paymentType as never,
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
      const payment = await adminPaymentService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { payment });
    } catch (err) {
      next(err);
    }
  }

  async refundHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminPaymentService.getRefundHistory(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async summary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await adminPaymentService.getSummary();
      ApiResponse.success(res, summary);
    } catch (err) {
      next(err);
    }
  }
}

export const adminPaymentController = new AdminPaymentController();
