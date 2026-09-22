import type { NextFunction, Request, Response } from 'express';
import { productService } from '@/services/product.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import type { AuthenticatedRequest } from '@/types';

export class ProductController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await productService.list(q as never);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { product });
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getBySlug(req.params.slug);
      ApiResponse.success(res, { product });
    } catch (err) {
      next(err);
    }
  }

  async compare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const raw = req.query.ids;
      const idList = (typeof raw === 'string' ? raw.split(',') : Array.isArray(raw) ? raw : []) as string[];
      if (idList.length === 0) throw ApiError.badRequest('Provide at least one product id via ?ids=1,2,3');
      const products = await productService.getManyForCompare(idList.map((id) => BigInt(id)));
      ApiResponse.success(res, { products });
    } catch (err) {
      next(err);
    }
  }

  async related(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const products = await productService.related(BigInt(req.params.id), limit);
      ApiResponse.success(res, { products });
    } catch (err) {
      next(err);
    }
  }

  async frequentlyBoughtTogether(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const products = await productService.frequentlyBoughtTogether(BigInt(req.params.id), limit);
      ApiResponse.success(res, { products });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const createdBy = req.user ? BigInt(req.user.id) : undefined;
      const product = await productService.create({ ...req.body, createdBy });
      ApiResponse.created(res, { product }, 'Product created');
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.update(BigInt(req.params.id), req.body);
      ApiResponse.success(res, { product }, 'Product updated');
    } catch (err) {
      next(err);
    }
  }

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await productService.delete(BigInt(req.params.id));
      ApiResponse.success(res, null, 'Product deleted');
    } catch (err) {
      next(err);
    }
  }

  async addVariant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.addVariant(BigInt(req.params.id), req.body);
      ApiResponse.created(res, { product }, 'Variant added');
    } catch (err) {
      next(err);
    }
  }

  async updateVariant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.updateVariant(
        BigInt(req.params.id),
        BigInt(req.params.variantId),
        req.body,
      );
      ApiResponse.success(res, { product }, 'Variant updated');
    } catch (err) {
      next(err);
    }
  }

  async adjustStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const inventory = await productService.adjustStock(BigInt(req.params.id), {
        ...req.body,
        createdBy: BigInt(req.user.id),
      });
      ApiResponse.success(res, { inventory }, 'Stock adjusted');
    } catch (err) {
      next(err);
    }
  }

  async lowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : undefined;
      const items = await productService.lowStockReport(threshold);
      ApiResponse.success(res, { items });
    } catch (err) {
      next(err);
    }
  }

  async recordView(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      await productService.recordView(school, BigInt(req.params.id));
      ApiResponse.success(res, null, 'View recorded');
    } catch (err) {
      next(err);
    }
  }

  async recentlyViewed(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const items = await productService.listRecentlyViewed(school, limit);
      ApiResponse.success(res, { items });
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
