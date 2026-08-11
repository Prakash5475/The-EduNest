import type { NextFunction, Request, Response } from 'express';
import { paymentService } from '@/services/payment.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

export class PaymentController {
  async initiate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const result = await paymentService.initiate(school, req.body.orderId, req.body.amountType);
      ApiResponse.created(res, result, 'Razorpay order created');
    } catch (err) {
      next(err);
    }
  }

  async verify(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const order = await paymentService.verify(school, BigInt(req.params.id), req.body);
      ApiResponse.success(res, { order }, 'Payment verified');
    } catch (err) {
      next(err);
    }
  }

  async listHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const { items, meta } = await paymentService.listHistory(school, page, limit);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  /** Staff/admin-only: request a refund for a captured payment. */
  async refund(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await paymentService.refund(BigInt(req.params.id), req.body.amount);
      ApiResponse.created(res, result, 'Refund requested');
    } catch (err) {
      next(err);
    }
  }

  /** Razorpay webhook — verified via HMAC signature, not authenticated as a user. */
  async webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.header('x-razorpay-signature');
      if (!signature) throw ApiError.badRequest('Missing webhook signature');
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
      await paymentService.handleWebhook(rawBody, signature);
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
