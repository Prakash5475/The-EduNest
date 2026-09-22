import type { NextFunction, Request, Response } from 'express';
import { kitRepository, resolveKitUnitPrice } from '@/repositories/kit.repository';
import { ApiResponse } from '@/utils/ApiResponse';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiError } from '@/utils/ApiError';

/** Adds a computed `price` (lowest-tier unit price) and `referencePrice` (sum of buying items separately) to each kit. */
function withComputedPricing<
  T extends {
    kitPricing: Array<{ minQuantity: number; pricePerUnit: unknown; effectiveFrom: Date; effectiveTo: Date | null }>;
    kitProducts: Array<{ quantity: number; isOptional: boolean; product: { basePrice: unknown } }>;
  },
>(kit: T) {
  const price = resolveKitUnitPrice(kit.kitPricing, 1);
  const referencePrice = kit.kitProducts
    .filter((kp) => !kp.isOptional)
    .reduce((sum, kp) => sum + kp.quantity * Number(kp.product.basePrice), 0);
  return { ...kit, price, referencePrice };
}

export class KitController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, skip, take } = normalizePagination(
        req.query.page as string | undefined,
        req.query.limit as string | undefined,
      );
      const { items, total } = await kitRepository.listActive(skip, take, req.query.category as string | undefined);
      ApiResponse.paginated(res, items.map(withComputedPricing), buildPaginationMeta(page, limit, total));
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const kit = await kitRepository.findActiveById(BigInt(req.params.id));
      if (!kit) throw ApiError.notFound('Kit not found');
      ApiResponse.success(res, { kit: withComputedPricing(kit) });
    } catch (err) {
      next(err);
    }
  }
}

export const kitController = new KitController();
