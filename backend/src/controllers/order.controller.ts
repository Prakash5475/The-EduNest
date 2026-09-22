import type { NextFunction, Response } from 'express';
import { orderService } from '@/services/order.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { renderChallanPdf } from '@/helpers/challanPdf.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

export class OrderController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await orderService.list(school, q as never);
      ApiResponse.paginated(
        res,
        items.map((order) => ({ ...order, remainingDays: orderService.remainingDays(order) })),
        meta,
      );
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const order = await orderService.getById(school, BigInt(req.params.id));
      ApiResponse.success(res, { order: { ...order, remainingDays: orderService.remainingDays(order) } });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const order = await orderService.cancel(school, BigInt(req.params.id), req.body?.reason);
      ApiResponse.success(res, { order }, 'Order cancelled');
    } catch (err) {
      next(err);
    }
  }

  async reorder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const cart = await orderService.reorder(school, BigInt(req.params.id));
      ApiResponse.success(res, { cart }, 'Items added to cart');
    } catch (err) {
      next(err);
    }
  }

  async downloadChallanPdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const order = await orderService.getForChallan(req.user, BigInt(req.params.id));

      const pdfBuffer = await renderChallanPdf({
        orderNumber: order.orderNumber,
        dealerBusinessName: order.dealer?.businessName ?? 'Unassigned',
        schoolName: order.school.schoolName,
        shippingAddress: order.schoolAddressRef
          ? {
              addressLine1: order.schoolAddressRef.addressLine1,
              addressLine2: order.schoolAddressRef.addressLine2,
              city: order.schoolAddressRef.city,
              state: order.schoolAddressRef.state,
              pincode: order.schoolAddressRef.pincode,
            }
          : null,
        dispatchedAt: new Date(),
        items: order.orderItems.map((item) => ({
          description: item.itemNameSnapshot,
          quantity: item.quantity,
        })),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="challan-${order.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
}

export const orderController = new OrderController();
