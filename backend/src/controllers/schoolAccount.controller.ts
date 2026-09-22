import type { NextFunction, Response } from 'express';
import { schoolAccountService } from '@/services/schoolAccount.service';
import { schoolDashboardService } from '@/services/schoolDashboard.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

export class SchoolAccountController {
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const account = await schoolAccountService.getMyAccount(school);
      ApiResponse.success(res, { school: account });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const account = await schoolAccountService.updateMyAccount(school, req.body);
      ApiResponse.success(res, { school: account }, 'Profile updated');
    } catch (err) {
      next(err);
    }
  }

  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const dashboard = await schoolDashboardService.getDashboard(school.id, school.userId);
      ApiResponse.success(res, dashboard);
    } catch (err) {
      next(err);
    }
  }
}

export const schoolAccountController = new SchoolAccountController();
