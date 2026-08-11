import type { NextFunction, Response } from 'express';
import { dealerAccountService } from '@/services/dealerAccount.service';
import { requireDealerContext } from '@/helpers/dealerContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class DealerAccountController {
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const account = await dealerAccountService.getMyAccount(dealer);
      ApiResponse.success(res, { dealer: account });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const account = await dealerAccountService.updateMyAccount(dealer, req.body);
      ApiResponse.success(res, { dealer: account }, 'Profile updated');
    } catch (err) {
      next(err);
    }
  }

  async addAddress(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const address = await dealerAccountService.addAddress(dealer, req.body);
      ApiResponse.created(res, { address }, 'Address added');
    } catch (err) {
      next(err);
    }
  }
}

export const dealerAccountController = new DealerAccountController();
