import type { NextFunction, Request, Response } from 'express';
import { adminSchoolService } from '@/services/adminSchool.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AdminSchoolController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search, page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminSchoolService.list({
        status: status as never,
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
      const school = await adminSchoolService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { school });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await adminSchoolService.updateStatus(BigInt(req.params.id), req.body.status, req.body.reason);
      ApiResponse.success(res, { school }, 'School status updated');
    } catch (err) {
      next(err);
    }
  }
}

export const adminSchoolController = new AdminSchoolController();
