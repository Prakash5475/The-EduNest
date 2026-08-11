import type { NextFunction, Response } from 'express';
import { productionService } from '@/services/production.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

export class ProductionController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await productionService.listByOrder(req.user, BigInt(req.params.orderId));
      ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async addCheckpoint(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const checkpoint = await productionService.addCheckpoint(req.user, BigInt(req.params.orderId), req.body);
      ApiResponse.created(res, { checkpoint }, 'Production checkpoint logged');
    } catch (err) {
      next(err);
    }
  }

  async assignDealer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const order = await productionService.assignDealer(
        BigInt(req.params.orderId),
        BigInt(req.body.dealerId),
        BigInt(req.user.id),
        Boolean(req.body.force),
      );
      ApiResponse.success(res, { order }, 'Dealer assigned for production');
    } catch (err) {
      next(err);
    }
  }

  async dashboard(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dashboard = await productionService.getDashboard();
      ApiResponse.success(res, dashboard);
    } catch (err) {
      next(err);
    }
  }
}

export const productionController = new ProductionController();
