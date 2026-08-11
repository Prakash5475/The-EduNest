import type { NextFunction, Request, Response } from 'express';
import { shippingMethodRepository } from '@/repositories/shippingMethod.repository';
import { ApiResponse } from '@/utils/ApiResponse';

export class ShippingMethodController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const methods = await shippingMethodRepository.listActive();
      ApiResponse.success(res, { shippingMethods: methods });
    } catch (err) {
      next(err);
    }
  }
}

export const shippingMethodController = new ShippingMethodController();
