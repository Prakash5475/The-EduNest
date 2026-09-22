import type { NextFunction, Request, Response } from 'express';
import { adminSettingsService } from '@/services/adminSettings.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AdminSettingsController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminSettingsService.list();
      ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminSettingsService.update(req.body.settings);
      ApiResponse.success(res, result, 'Settings updated');
    } catch (err) {
      next(err);
    }
  }
}

export const adminSettingsController = new AdminSettingsController();
