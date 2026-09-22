import type { NextFunction, Response } from 'express';
import { customizationService } from '@/services/customization.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

export class CustomizationController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const request = await customizationService.create(school, req.body);
      ApiResponse.created(res, { request }, 'Customization request submitted');
    } catch (err) {
      next(err);
    }
  }

  async listMine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await customizationService.listMine(school, q as never);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async listForAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await customizationService.listForAdmin(q as never);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const isStaff = req.user.roles.some((r) => r === 'super_admin' || r === 'staff');
      const request = isStaff
        ? await customizationService.getForAdmin(BigInt(req.params.id))
        : await customizationService.getForSchool(BigInt(req.params.id), await requireSchoolContext(req.user));
      ApiResponse.success(res, { request });
    } catch (err) {
      next(err);
    }
  }

  async resubmit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const request = await customizationService.resubmit(BigInt(req.params.id), school, req.body);
      ApiResponse.success(res, { request }, 'Customization request resubmitted');
    } catch (err) {
      next(err);
    }
  }

  async review(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const request = await customizationService.review(BigInt(req.params.id), { id: BigInt(req.user.id) }, req.body);
      ApiResponse.success(res, { request }, 'Customization request reviewed');
    } catch (err) {
      next(err);
    }
  }

  async convertToCart(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const cart = await customizationService.convertToCart(BigInt(req.params.id), school);
      ApiResponse.success(res, { cart }, 'Added to cart');
    } catch (err) {
      next(err);
    }
  }
}

export const customizationController = new CustomizationController();
