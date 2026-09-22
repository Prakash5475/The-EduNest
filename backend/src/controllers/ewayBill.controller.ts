import type { NextFunction, Response } from 'express';
import { ewayBillService } from '@/services/ewayBill.service';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class EwayBillController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query as Record<string, string | undefined>;
      const result = await ewayBillService.list({ status: status as never, page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await ewayBillService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { ewayBill: bill });
    } catch (err) {
      next(err);
    }
  }

  async getByOrderId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await ewayBillService.getByOrderId(BigInt(req.params.orderId));
      ApiResponse.success(res, { ewayBill: bill });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, invoiceId, ...rest } = req.body;
      const bill = await ewayBillService.create(
        { orderId: BigInt(orderId), invoiceId: invoiceId ? BigInt(invoiceId) : undefined, ...rest },
        BigInt(req.user!.id),
      );
      ApiResponse.created(res, { ewayBill: bill }, 'E-way bill draft created');
    } catch (err) {
      next(err);
    }
  }

  async markGenerated(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ewayBillNumber, validFrom, validUntil } = req.body;
      const bill = await ewayBillService.markGenerated(BigInt(req.params.id), ewayBillNumber, validFrom, validUntil);
      ApiResponse.success(res, { ewayBill: bill }, 'E-way bill number recorded');
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bill = await ewayBillService.cancel(BigInt(req.params.id));
      ApiResponse.success(res, { ewayBill: bill }, 'E-way bill cancelled');
    } catch (err) {
      next(err);
    }
  }
}

export const ewayBillController = new EwayBillController();
