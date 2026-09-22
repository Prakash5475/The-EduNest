import type { NextFunction, Response } from 'express';
import { dealerOrderService } from '@/services/dealerOrder.service';
import { requireDealerContext } from '@/helpers/dealerContext.helper';
import { orderService } from '@/services/order.service';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class DealerOrderController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await dealerOrderService.list(dealer, q as never);
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
      const dealer = await requireDealerContext(req.user);
      const order = await dealerOrderService.getById(dealer, BigInt(req.params.id));
      ApiResponse.success(res, { order: { ...order, remainingDays: orderService.remainingDays(order) } });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const order = await dealerOrderService.updateStatus(dealer, BigInt(req.params.id), req.body.status, req.body.note);
      ApiResponse.success(res, { order }, 'Order status updated');
    } catch (err) {
      next(err);
    }
  }
}

export const dealerOrderController = new DealerOrderController();
