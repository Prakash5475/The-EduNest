import type { NextFunction, Request, Response } from 'express';
import { categoryService } from '@/services/category.service';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class CategoryController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await categoryService.list({
        parentId: q.parentId as bigint | undefined,
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

  async tree(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tree = await categoryService.tree();
      ApiResponse.success(res, { categories: tree });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { category });
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.getBySlug(req.params.slug);
      ApiResponse.success(res, { category });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.create(req.body);
      ApiResponse.created(res, { category }, 'Category created');
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoryService.update(BigInt(req.params.id), req.body);
      ApiResponse.success(res, { category }, 'Category updated');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoryService.delete(BigInt(req.params.id));
      ApiResponse.success(res, null, 'Category deleted');
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
