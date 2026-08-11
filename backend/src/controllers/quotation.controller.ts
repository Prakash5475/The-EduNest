import type { NextFunction, Response } from 'express';
import { quotationService } from '@/services/quotation.service';
import { requireSchoolContext } from '@/helpers/schoolContext.helper';
import { requireDealerContext } from '@/helpers/dealerContext.helper';
import { schoolRepository } from '@/repositories/school.repository';
import { renderQuotationPdf } from '@/helpers/quotationPdf.helper';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

export class QuotationController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const request = await quotationService.createRequest(school, req.body);
      ApiResponse.created(res, { request }, 'Quotation request submitted');
    } catch (err) {
      next(err);
    }
  }

  async listMine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await quotationService.listMine(school, q as never);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async listForAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = req.query as Record<string, unknown>;
      const { items, meta } = await quotationService.listForAdmin(q as never);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const isStaff = req.user.roles.some((r) => r === 'super_admin' || r === 'staff');
      const request = isStaff
        ? await quotationService.getForAdmin(BigInt(req.params.id))
        : await quotationService.getForSchool(BigInt(req.params.id), await requireSchoolContext(req.user));
      ApiResponse.success(res, { request });
    } catch (err) {
      next(err);
    }
  }

  async assignDealers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const dealerQuotations = await quotationService.assignDealers(
        BigInt(req.user.id),
        BigInt(req.params.id),
        req.body.assignments,
      );
      ApiResponse.created(res, { dealerQuotations }, 'Dealers assigned');
    } catch (err) {
      next(err);
    }
  }

  async listForDealer(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const page = req.query.page ? Number(req.query.page) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const { items, meta } = await quotationService.listForDealer(dealer, page, limit);
      ApiResponse.paginated(res, items, meta);
    } catch (err) {
      next(err);
    }
  }

  async getDealerQuotation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const dealerQuotation = await quotationService.getDealerQuotationForDealer(BigInt(req.params.id), dealer);
      ApiResponse.success(res, { dealerQuotation });
    } catch (err) {
      next(err);
    }
  }

  async downloadDealerQuotationPdf(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const id = BigInt(req.params.id);
      const isStaff = req.user.roles.some((r) => r === 'super_admin' || r === 'staff');

      const dq = isStaff
        ? await quotationService.getDealerQuotationForAdmin(id)
        : req.user.userType === 'dealer'
          ? await quotationService.getDealerQuotationForDealer(id, await requireDealerContext(req.user))
          : await quotationService.getDealerQuotationForSchool(id, await requireSchoolContext(req.user));

      const school = await schoolRepository.findById(dq.quotationRequest.schoolId);

      const pdfBuffer = await renderQuotationPdf({
        requestNumber: dq.quotationRequest.requestNumber,
        dealerBusinessName: dq.dealer.businessName,
        schoolName: school?.schoolName ?? 'Unknown School',
        status: dq.status,
        validityDays: dq.validityDays,
        submittedAt: dq.submittedAt,
        notes: dq.notes,
        items: dq.dealerQuotationItems.map((item) => ({
          description: item.quotationRequestProduct.product?.name ?? item.quotationRequestProduct.kit?.name ?? item.quotationRequestProduct.customItemDescription ?? 'Item',
          quantity: item.quotedQuantity,
          unitPrice: Number(item.quotedUnitPrice),
          lineTotal: Number(item.quotedUnitPrice) * item.quotedQuantity,
        })),
        totalAmount: Number(dq.totalAmount),
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quotation-${dq.quotationRequest.requestNumber}-${dq.dealer.businessName}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }

  async updateDealerQuotation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dealer = await requireDealerContext(req.user);
      const dealerQuotation = await quotationService.updateDealerQuotation(BigInt(req.params.id), dealer, req.body);
      ApiResponse.success(res, { dealerQuotation }, 'Quotation updated');
    } catch (err) {
      next(err);
    }
  }

  async accept(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const order = await quotationService.acceptDealerQuotation(BigInt(req.params.id), school);
      ApiResponse.success(res, { order }, 'Quotation accepted — order created');
    } catch (err) {
      next(err);
    }
  }

  async reject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const school = await requireSchoolContext(req.user);
      const dealerQuotation = await quotationService.rejectDealerQuotation(
        BigInt(req.params.id),
        school,
        req.body?.reason,
      );
      ApiResponse.success(res, { dealerQuotation }, 'Quotation rejected');
    } catch (err) {
      next(err);
    }
  }
}

export const quotationController = new QuotationController();
