import type { NextFunction, Request, Response } from 'express';
import { adminDealerService } from '@/services/adminDealer.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AdminDealerController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminDealerService.list({
        status: status as never,
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
      const dealer = await adminDealerService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { dealer });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await adminDealerService.updateStatus(BigInt(req.params.id), req.body.status, req.body.reason);
      ApiResponse.success(res, { dealer }, 'Dealer status updated');
    } catch (err) {
      next(err);
    }
  }
}

export const adminDealerController = new AdminDealerController();
