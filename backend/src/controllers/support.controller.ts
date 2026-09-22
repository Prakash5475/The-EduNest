import type { NextFunction, Response } from 'express';
import { supportService } from '@/services/support.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

export class SupportController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const ticket = await supportService.create(req.user, req.body);
      ApiResponse.created(res, { ticket }, 'Ticket raised');
    } catch (err) {
      next(err);
    }
  }

  async listMine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await supportService.listMine(req.user, q as never);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async listForAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await supportService.listForAdmin(q as never);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const ticket = await supportService.getById(req.user, BigInt(req.params.id));
      ApiResponse.success(res, { ticket });
    } catch (err) {
      next(err);
    }
  }

  async reply(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const reply = await supportService.reply(req.user, BigInt(req.params.id), req.body.message, req.body.isInternalNote);
      ApiResponse.created(res, { reply }, 'Reply added');
    } catch (err) {
      next(err);
    }
  }

  async assign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.assign(BigInt(req.params.id), req.body.assignedTo);
      ApiResponse.success(res, { ticket }, 'Ticket assigned');
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.updateStatus(BigInt(req.params.id), req.body.status);
      ApiResponse.success(res, { ticket }, 'Ticket status updated');
    } catch (err) {
      next(err);
    }
  }

  async updatePriority(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await supportService.updatePriority(BigInt(req.params.id), req.body.priority);
      ApiResponse.success(res, { ticket }, 'Ticket priority updated');
    } catch (err) {
      next(err);
    }
  }
}

export const supportController = new SupportController();
