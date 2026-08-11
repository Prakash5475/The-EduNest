import type { NextFunction, Request, Response } from 'express';
import { faqRepository } from '@/repositories/faq.repository';
import { ApiResponse } from '@/utils/ApiResponse';

export class FaqController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const faqs = await faqRepository.listAll();
      ApiResponse.success(res, { faqs });
    } catch (err) {
      next(err);
    }
  }
}

export const faqController = new FaqController();
