import type { NextFunction, Request, Response } from 'express';
import { auditService } from '@/services/audit.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AuditController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, entityType, action, from, to, page, limit } = req.query as Record<string, string | undefined>;
      const result = await auditService.list({
        userId: userId ? BigInt(userId) : undefined,
        entityType,
        action,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }
}

export const auditController = new AuditController();
