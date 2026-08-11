import type { NextFunction, Request, Response } from 'express';
import { dealerCapacityService } from '@/services/dealerCapacity.service';
import { dealerAnalyticsService } from '@/services/dealerAnalytics.service';
import { requireDealerContext } from '@/helpers/dealerContext.helper';
import { sendReportExport, type ExportFormat } from '@/helpers/reportExport.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import type { AuthenticatedRequest } from '@/types';

function rangeFrom(req: Request) {
  return {
    from: req.query.from ? new Date(req.query.from as string) : undefined,
    to: req.query.to ? new Date(req.query.to as string) : undefined,
  };
}

function formatFrom(req: Request): ExportFormat | undefined {
  const f = req.query.format as string | undefined;
  return f === 'csv' || f === 'xlsx' || f === 'pdf' ? f : undefined;
}

export class DealerDashboardController {
  async dashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const dashboard = await dealerCapacityService.getDashboard(dealer.id);
      ApiResponse.success(res, dashboard);
    } catch (err) {
      next(err);
    }
  }

  async analytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const performance = await dealerAnalyticsService.getPerformance(dealer.id, rangeFrom(req));
      ApiResponse.success(res, performance);
    } catch (err) {
      next(err);
    }
  }

  async exportOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const format = formatFrom(req) ?? 'csv';
      const rows = await dealerAnalyticsService.getExportRows(dealer.id, rangeFrom(req));
      await sendReportExport(res, format, { filename: 'my-orders-report', title: 'My Orders Report', rows });
    } catch (err) {
      next(err);
    }
  }
}

export const dealerDashboardController = new DealerDashboardController();
