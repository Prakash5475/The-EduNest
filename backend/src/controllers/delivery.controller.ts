import type { NextFunction, Response } from 'express';
import { deliveryService } from '@/services/delivery.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

function actorFrom(req: AuthenticatedRequest): { userId: bigint; type: 'admin' | 'staff' } {
  const isStaff = req.user!.roles.includes('staff') && !req.user!.roles.includes('super_admin');
  return { userId: BigInt(req.user!.id), type: isStaff ? 'staff' : 'admin' };
}

export class DeliveryController {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deliveryPartnerId, status, page, limit } = req.query as Record<string, string | undefined>;
      const result = await deliveryService.list({
        deliveryPartnerId: deliveryPartnerId ? BigInt(deliveryPartnerId) : undefined,
        status: status as never,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orderId, ...rest } = req.body;
      const shipment = await deliveryService.createForOrder(BigInt(orderId), rest);
      ApiResponse.created(res, { shipment }, 'Shipment created');
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const shipment = await deliveryService.getById(BigInt(req.params.id));
      ApiResponse.success(res, { shipment });
    } catch (err) {
      next(err);
    }
  }

  async getByOrderId(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const shipment = await deliveryService.getByOrderId(BigInt(req.params.orderId));
      ApiResponse.success(res, { shipment });
    } catch (err) {
      next(err);
    }
  }

  async orderHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await deliveryService.historyForOrder(BigInt(req.params.orderId));
      ApiResponse.success(res, { history });
    } catch (err) {
      next(err);
    }
  }

  async assign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const shipment = await deliveryService.assign(BigInt(req.params.id), BigInt(req.body.deliveryPartnerId), BigInt(req.user!.id));
      ApiResponse.success(res, { shipment }, 'Shipment assigned');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const shipment = await deliveryService.updateStatus(BigInt(req.params.id), req.body.status, actorFrom(req), req.body.notes);
      ApiResponse.success(res, { shipment }, 'Shipment status updated');
    } catch (err) {
      next(err);
    }
  }

  async reschedule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const shipment = await deliveryService.reschedule(BigInt(req.params.id), req.body.newDeliveryDate, req.body.reason, actorFrom(req));
      ApiResponse.success(res, { shipment }, 'Delivery rescheduled');
    } catch (err) {
      next(err);
    }
  }

  async sendOtp(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { recipientName, identifier, alternateRecipientApprovedBy } = req.body;
      if (alternateRecipientApprovedBy && !req.user!.roles.includes('super_admin')) {
        throw ApiError.forbidden('Only a Super Admin can approve delivery to an alternate recipient');
      }
      await deliveryService.sendDeliveryOtp(
        BigInt(req.params.id),
        { name: recipientName, identifier },
        alternateRecipientApprovedBy ? BigInt(alternateRecipientApprovedBy) : undefined,
      );
      ApiResponse.success(res, {}, 'OTP sent to recipient');
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const shipment = await deliveryService.completeDeliveryWithOtp(BigInt(req.params.id), req.body.identifier, req.body.otp, actorFrom(req));
      ApiResponse.success(res, { shipment }, 'Delivery confirmed');
    } catch (err) {
      next(err);
    }
  }
}

export const deliveryController = new DeliveryController();
