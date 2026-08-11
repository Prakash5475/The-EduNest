import type { NextFunction, Response } from 'express';
import { schoolAddressService } from '@/services/schoolAddress.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class SchoolAddressController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const addresses = await schoolAddressService.list(school);
      ApiResponse.success(res, { addresses });
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const address = await schoolAddressService.create(school, req.body);
      ApiResponse.created(res, { address }, 'Address added');
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const address = await schoolAddressService.update(school, BigInt(req.params.addressId), req.body);
      ApiResponse.success(res, { address }, 'Address updated');
    } catch (err) {
      next(err);
    }
  }

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      await schoolAddressService.remove(school, BigInt(req.params.addressId));
      ApiResponse.success(res, null, 'Address removed');
    } catch (err) {
      next(err);
    }
  }

  async setDefault(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const address = await schoolAddressService.setDefault(school, BigInt(req.params.addressId));
      ApiResponse.success(res, { address }, 'Default address updated');
    } catch (err) {
      next(err);
    }
  }
}

export const schoolAddressController = new SchoolAddressController();
