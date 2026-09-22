import type { NextFunction, Request, Response } from 'express';
import { warehouseService } from '@/services/warehouse.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class WarehouseController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive, page, limit } = req.query as Record<string, string | undefined>;
      const result = await warehouseService.list({
        isActive: isActive === undefined ? undefined : isActive === 'true',
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
      const warehouse = await warehouseService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { warehouse });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehouseService.create(req.body);
      ApiResponse.created(res, { warehouse }, 'Warehouse created');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehouseService.update(BigInt(req.params.id), req.body);
      ApiResponse.success(res, { warehouse }, 'Warehouse updated');
    } catch (err) {
      next(err);
    }
  }

  async setActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const warehouse = await warehouseService.setActive(BigInt(req.params.id), req.body.isActive);
      ApiResponse.success(res, { warehouse }, 'Warehouse status updated');
    } catch (err) {
      next(err);
    }
  }
}

export const warehouseController = new WarehouseController();
