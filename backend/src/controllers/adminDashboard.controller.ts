import type { NextFunction, Request, Response } from 'express';
import { adminDashboardService } from '@/services/adminDashboard.service';
import { dealerCapacityService } from '@/services/dealerCapacity.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AdminDashboardController {
  async summary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await adminDashboardService.getSummary();
      ApiResponse.success(res, summary);
    } catch (err) {
      next(err);
    }
  }

  async topProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const items = await adminDashboardService.getTopProducts(limit);
      ApiResponse.success(res, { items });
    } catch (err) {
      next(err);
    }
  }

  async topCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const items = await adminDashboardService.getTopCategories(limit);
      ApiResponse.success(res, { items });
    } catch (err) {
      next(err);
    }
  }

  async revenueTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = req.query.months ? Number(req.query.months) : undefined;
      const trend = await adminDashboardService.getRevenueTrend(months);
      ApiResponse.success(res, { trend });
    } catch (err) {
      next(err);
    }
  }

  async dealerCapacity(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const snapshots = await dealerCapacityService.getAllSnapshots();
      ApiResponse.success(res, { dealers: snapshots });
    } catch (err) {
      next(err);
    }
  }

  async dealerCapacityById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const snapshot = await dealerCapacityService.getSnapshot(BigInt(req.params.dealerId));
      ApiResponse.success(res, { dealer: snapshot });
    } catch (err) {
      next(err);
    }
  }
}

export const adminDashboardController = new AdminDashboardController();
