import type { NextFunction, Request, Response } from 'express';
import { brandService } from '@/services/brand.service';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class BrandController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await brandService.list({
        isActive: q.isActive as boolean | undefined,
        search: q.search as string | undefined,
        page: q.page as number | undefined,
        limit: q.limit as number | undefined,
      });
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { brand });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.create(req.body);
      ApiResponse.created(res, { brand }, 'Brand created');
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await brandService.update(BigInt(req.params.id), req.body);
      ApiResponse.success(res, { brand }, 'Brand updated');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await brandService.delete(BigInt(req.params.id));
      ApiResponse.success(res, null, 'Brand deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const brandController = new BrandController();
