import type { NextFunction, Response } from 'express';
import { quantityChangeRequestService } from '@/services/quantityChangeRequest.service';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class QuantityChangeRequestController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query as Record<string, string | undefined>;
      const result = await quantityChangeRequestService.list({
        status: status as never,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await quantityChangeRequestService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { request });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { inventoryId, productId, warehouseId, requestedQuantity, reason } = req.body;
      const request = await quantityChangeRequestService.create(
        {
          inventoryId: inventoryId ? BigInt(inventoryId) : undefined,
          productId: productId ? BigInt(productId) : undefined,
          warehouseId: warehouseId ? BigInt(warehouseId) : undefined,
        },
        Number(requestedQuantity),
        reason,
        BigInt(req.user!.id),
      );
      ApiResponse.created(res, { request }, 'Quantity change request submitted');
    } catch (err) {
      next(err);
    }
  }

  async approve(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const inventory = await quantityChangeRequestService.approve(BigInt(req.params.id), BigInt(req.user!.id));
      ApiResponse.success(res, { inventory }, 'Quantity change approved and stock updated');
    } catch (err) {
      next(err);
    }
  }

  async reject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await quantityChangeRequestService.reject(BigInt(req.params.id), BigInt(req.user!.id), req.body.rejectionReason);
      ApiResponse.success(res, { request }, 'Quantity change request rejected');
    } catch (err) {
      next(err);
    }
  }
}

export const quantityChangeRequestController = new QuantityChangeRequestController();
