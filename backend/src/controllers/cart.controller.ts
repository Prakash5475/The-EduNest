import type { NextFunction, Response } from 'express';
import { cartService } from '@/services/cart.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class CartController {
  async getCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const cart = await cartService.getCart(school);
      ApiResponse.success(res, { cart });
    } catch (err) {
      next(err);
    }
  }

  async addItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const cart = await cartService.addItem(school, req.body);
      ApiResponse.success(res, { cart }, 'Item added to cart');
    } catch (err) {
      next(err);
    }
  }

  async updateItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const cart = await cartService.updateItemQuantity(school, BigInt(req.params.itemId), req.body.quantity);
      ApiResponse.success(res, { cart }, 'Cart updated');
    } catch (err) {
      next(err);
    }
  }

  async removeItem(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const cart = await cartService.removeItem(school, BigInt(req.params.itemId));
      ApiResponse.success(res, { cart }, 'Item removed from cart');
    } catch (err) {
      next(err);
    }
  }

  async clear(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const cart = await cartService.clear(school);
      ApiResponse.success(res, { cart }, 'Cart cleared');
    } catch (err) {
      next(err);
    }
  }

  async previewCoupon(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const preview = await cartService.previewCoupon(school, req.body.code);
      ApiResponse.success(res, preview);
    } catch (err) {
      next(err);
    }
  }
}

export const cartController = new CartController();
