import type { NextFunction, Response } from 'express';
import { adminOrderService } from '@/services/adminOrder.service';
import { orderService } from '@/services/order.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

export class AdminOrderController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await adminOrderService.list(q as never);
      ApiResponse.paginated(
        res,
        items.map((order) => ({ ...order, remainingDays: orderService.remainingDays(order) })),
        meta,
      );
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await adminOrderService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { order: { ...order, remainingDays: orderService.remainingDays(order) } });
    } catch (err) {
      next(err);
    }
  }

  async assignDealer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await adminOrderService.assignDealer(BigInt(req.params.id), BigInt(req.body.dealerId));
      ApiResponse.success(res, { order }, 'Dealer assigned');
    } catch (err) {
      next(err);
    }
  }

  async overrideStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const order = await adminOrderService.overrideStatus(
        BigInt(req.params.id),
        req.user,
        req.body.status,
        req.body.reason,
        req.body.note,
      );
      ApiResponse.success(res, { order }, 'Order updated');
    } catch (err) {
      next(err);
    }
  }
}

export const adminOrderController = new AdminOrderController();
