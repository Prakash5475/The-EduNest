import type { NextFunction, Request, Response } from 'express';
import { reportsService } from '@/services/reports.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { sendReportExport, type ExportFormat } from '@/helpers/reportExport.helper';

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

export class ReportsController {
  async orders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.ordersReport(rangeFrom(req));
      const format = formatFrom(req);
      if (format) {
        const rows = report.orders.map((o) => ({
          orderNumber: o.orderNumber,
          school: o.school?.schoolName ?? '',
          status: o.status,
          priority: o.priority,
          totalAmount: Number(o.totalAmount),
          placedAt: o.placedAt?.toISOString() ?? '',
        }));
        await sendReportExport(res, format, { filename: 'orders-report', title: 'Orders Report', rows });
        return;
      }
      ApiResponse.success(res, report);
    } catch (err) {
      next(err);
    }
  }

  async payments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.paymentsReport(rangeFrom(req));
      const format = formatFrom(req);
      if (format) {
        const rows = report.payments.map((p) => ({
          id: p.id.toString(),
          orderId: p.orderId?.toString() ?? '',
          amount: Number(p.amount),
          paymentType: p.paymentType,
          status: p.status,
          createdAt: p.createdAt?.toISOString() ?? '',
        }));
        await sendReportExport(res, format, { filename: 'payments-report', title: 'Payments Report', rows });
        return;
      }
      ApiResponse.success(res, report);
    } catch (err) {
      next(err);
    }
  }

  async gst(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.gstReport(rangeFrom(req));
      const format = formatFrom(req);
      if (format) {
        const rows = report.orders.map((o) => ({
          orderNumber: o.orderNumber,
          subtotal: Number(o.subtotal),
          taxAmount: Number(o.taxAmount),
          totalAmount: Number(o.totalAmount),
          placedAt: o.placedAt?.toISOString() ?? '',
        }));
        await sendReportExport(res, format, { filename: 'gst-report', title: 'GST Report', rows });
        return;
      }
      ApiResponse.success(res, report);
    } catch (err) {
      next(err);
    }
  }

  async invoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.invoicesReport(rangeFrom(req));
      const format = formatFrom(req);
      if (format) {
        const rows = report.invoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          invoiceType: i.invoiceType,
          status: i.status,
          totalAmount: Number(i.totalAmount),
          issuedAt: i.issuedAt?.toISOString() ?? '',
        }));
        await sendReportExport(res, format, { filename: 'invoices-report', title: 'Invoices Report', rows });
        return;
      }
      ApiResponse.success(res, report);
    } catch (err) {
      next(err);
    }
  }

  async dealerPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealers = await reportsService.dealerPerformanceReport();
      const format = formatFrom(req);
      if (format) {
        const rows = dealers.map((d) => ({
          businessName: d.businessName,
          averageRating: d.averageRating,
          completedOrders: d.completedOrders,
          cancelledOrders: d.cancelledOrders,
          lateOrders: d.lateOrders,
        }));
        await sendReportExport(res, format, { filename: 'dealer-performance-report', title: 'Dealer Performance Report', rows });
        return;
      }
      ApiResponse.success(res, { dealers });
    } catch (err) {
      next(err);
    }
  }

  async production(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.productionReport(rangeFrom(req));
      const format = formatFrom(req);
      if (format) {
        const rows = Object.entries(report.byStage).map(([stage, count]) => ({ stage, count }));
        await sendReportExport(res, format, { filename: 'production-report', title: 'Production Report', rows });
        return;
      }
      ApiResponse.success(res, report);
    } catch (err) {
      next(err);
    }
  }

  async priorityOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.priorityOrdersReport();
      const format = formatFrom(req);
      if (format) {
        const rows = Object.entries(report).map(([metric, value]) => ({ metric, value }));
        await sendReportExport(res, format, { filename: 'priority-orders-report', title: 'Priority Orders Report', rows });
        return;
      }
      ApiResponse.success(res, report);
    } catch (err) {
      next(err);
    }
  }

  async quotations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await reportsService.quotationsReport(rangeFrom(req));
      const format = formatFrom(req);
      if (format) {
        const rows = [
          { metric: 'total', value: report.total },
          { metric: 'conversionRate', value: report.conversionRate },
          ...Object.entries(report.byStatus).map(([status, count]) => ({ metric: `status:${status}`, value: count })),
        ];
        await sendReportExport(res, format, { filename: 'quotations-report', title: 'Quotations Report', rows });
        return;
      }
      ApiResponse.success(res, report);
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
