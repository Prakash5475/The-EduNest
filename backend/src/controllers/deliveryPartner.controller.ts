import type { NextFunction, Request, Response } from 'express';
import { deliveryPartnerService } from '@/services/deliveryPartner.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class DeliveryPartnerController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, availabilityStatus, search, page, limit } = req.query as Record<string, string | undefined>;
      const result = await deliveryPartnerService.list({
        status: status as never,
        availabilityStatus: availabilityStatus as never,
        search,
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
      const partner = await deliveryPartnerService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { partner });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partner = await deliveryPartnerService.create(req.body);
      ApiResponse.created(res, { partner }, 'Delivery partner created');
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partner = await deliveryPartnerService.update(BigInt(req.params.id), req.body);
      ApiResponse.success(res, { partner }, 'Delivery partner updated');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partner = await deliveryPartnerService.setStatus(BigInt(req.params.id), req.body.status);
      ApiResponse.success(res, { partner }, 'Delivery partner status updated');
    } catch (err) {
      next(err);
    }
  }

  async updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const partner = await deliveryPartnerService.setAvailability(BigInt(req.params.id), req.body.availabilityStatus);
      ApiResponse.success(res, { partner }, 'Delivery partner availability updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await deliveryPartnerService.remove(BigInt(req.params.id));
      ApiResponse.success(res, {}, 'Delivery partner deactivated');
    } catch (err) {
      next(err);
    }
  }
}

export const deliveryPartnerController = new DeliveryPartnerController();
