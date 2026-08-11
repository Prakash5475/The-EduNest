import type { NextFunction, Request, Response } from 'express';
import { adminWhatsappService } from '@/services/adminWhatsapp.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AdminWhatsappController {
  async listDeliveryLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminWhatsappService.listDeliveryLogs(status as never, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async listConversations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminWhatsappService.listConversations(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async getConversationMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminWhatsappService.getConversationMessages(
        BigInt(req.params.id),
        page ? Number(page) : undefined,
        limit ? Number(limit) : undefined,
      );
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminWhatsappService.broadcast(req.body.dealerIds, req.body.eventType, req.body.data);
      ApiResponse.success(res, result, 'Broadcast queued');
    } catch (err) {
      next(err);
    }
  }
}

export const adminWhatsappController = new AdminWhatsappController();
