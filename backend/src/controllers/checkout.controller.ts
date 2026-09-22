import type { NextFunction, Response } from 'express';
import { checkoutService } from '@/services/checkout.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class CheckoutController {
  async checkout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const order = await checkoutService.createOrderFromCart(school, req.body);
      ApiResponse.created(res, { order }, 'Order created — proceed to payment');
    } catch (err) {
      next(err);
    }
  }
}

export const checkoutController = new CheckoutController();
