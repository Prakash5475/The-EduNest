import type { NextFunction, Request, Response } from 'express';
import { dealerRepository } from '@/repositories/dealer.repository';
import { ApiResponse } from '@/utils/ApiResponse';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { DealerBusinessType } from '@prisma/client';

export class DealerDirectoryController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, skip, take } = normalizePagination(
        req.query.page as string | undefined,
        req.query.limit as string | undefined,
      );
      const businessType = req.query.businessType as DealerBusinessType | undefined;
      const { items, total } = await dealerRepository.listActive(skip, take, businessType);
      ApiResponse.paginated(res, items, buildPaginationMeta(page, limit, total));
    } catch (err) {
      next(err);
    }
  }
}

export const dealerDirectoryController = new DealerDirectoryController();
