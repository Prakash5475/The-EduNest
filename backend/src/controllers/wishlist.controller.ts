import type { NextFunction, Response } from 'express';
import { wishlistService } from '@/services/wishlist.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class WishlistController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const wishlist = await wishlistService.list(school);
      ApiResponse.success(res, { wishlist });
    } catch (err) {
      next(err);
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const wishlist = await wishlistService.addItem(school, req.body.productId);
      ApiResponse.success(res, { wishlist }, 'Added to wishlist');
    } catch (err) {
      next(err);
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const wishlist = await wishlistService.removeItem(school, BigInt(req.params.itemId));
      ApiResponse.success(res, { wishlist }, 'Removed from wishlist');
    } catch (err) {
      next(err);
    }
  }

  async moveToCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const wishlist = await wishlistService.moveToCart(
        school,
        BigInt(req.params.itemId),
        req.body.quantity,
      );
      ApiResponse.success(res, { wishlist }, 'Moved to cart');
    } catch (err) {
      next(err);
    }
  }
}

export const wishlistController = new WishlistController();
