import { Router } from 'express';
import { quotationController } from '@/controllers/quotation.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  createQuotationRequestSchema,
  listQuotationRequestsSchema,
  quotationRequestIdParamSchema,
  assignDealersSchema,
  dealerQuotationIdParamSchema,
  updateDealerQuotationSchema,
  rejectDealerQuotationSchema,
  listDealerQuotationsSchema,
} from '@/validators/quotation.validators';

const router = Router();
const staffOnly = requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF);
router.use(authenticate);

/**
 * @openapi
 * /quotation-requests:
 *   get:
 *     summary: List the current school's quotation requests (Master Quotations)
 *     tags: [Quotations]
 */
router.get('/', validate(listQuotationRequestsSchema), quotationController.listMine);

/**
 * @openapi
 * /quotation-requests/admin:
 *   get:
 *     summary: List all quotation requests across schools (admin review queue)
 *     tags: [Quotations]
 */
router.get('/admin', staffOnly, validate(listQuotationRequestsSchema), quotationController.listForAdmin);

/**
 * @openapi
 * /quotation-requests/dealer/mine:
 *   get:
 *     summary: The current dealer's assigned quotations only — never another dealer's
 *     tags: [Quotations]
 */
router.get('/dealer/mine', validate(listDealerQuotationsSchema), quotationController.listForDealer);

/**
 * @openapi
 * /quotation-requests/dealer/{id}:
 *   get:
 *     summary: Get a single dealer quotation (must belong to the requesting dealer)
 *     tags: [Quotations]
 */
router.get('/dealer/:id', validate(dealerQuotationIdParamSchema), quotationController.getDealerQuotation);

/**
 * @openapi
 * /quotation-requests/dealer/{id}/pdf:
 *   get:
 *     summary: Download a dealer quotation as a PDF (owning school, the assigned dealer, or admin/staff)
 *     tags: [Quotations]
 */
router.get('/dealer/:id/pdf', validate(dealerQuotationIdParamSchema), quotationController.downloadDealerQuotationPdf);

/**
 * @openapi
 * /quotation-requests/dealer/{id}:
 *   patch:
 *     summary: Dealer revises pricing/quantities/validity/notes while still awaiting the school's decision
 *     tags: [Quotations]
 */
router.patch(
  '/dealer/:id',
  validate(updateDealerQuotationSchema),
  quotationController.updateDealerQuotation,
);

/**
 * @openapi
 * /quotation-requests:
 *   post:
 *     summary: School submits a new Master Quotation request (multiple products/kits/custom items)
 *     tags: [Quotations]
 */
router.post('/', validate(createQuotationRequestSchema), quotationController.create);

/**
 * @openapi
 * /quotation-requests/{id}:
 *   get:
 *     summary: Get a single quotation request with all its dealer quotations (owning school, or admin/staff)
 *     tags: [Quotations]
 */
router.get('/:id', validate(quotationRequestIdParamSchema), quotationController.getById);

/**
 * @openapi
 * /quotation-requests/{id}/assign:
 *   post:
 *     summary: Admin assigns disjoint item subsets to one or more dealers — creates one DealerQuotation per dealer
 *     tags: [Quotations]
 */
router.post('/:id/assign', staffOnly, validate(assignDealersSchema), quotationController.assignDealers);

/**
 * @openapi
 * /quotation-requests/dealer-quotations/{id}/accept:
 *   post:
 *     summary: School accepts a dealer's quotation — converts exactly that dealer's items into a new Order
 *     tags: [Quotations]
 */
router.post(
  '/dealer-quotations/:id/accept',
  validate(dealerQuotationIdParamSchema),
  quotationController.accept,
);

/**
 * @openapi
 * /quotation-requests/dealer-quotations/{id}/reject:
 *   post:
 *     summary: School rejects a dealer's quotation
 *     tags: [Quotations]
 */
router.post(
  '/dealer-quotations/:id/reject',
  validate(rejectDealerQuotationSchema),
  quotationController.reject,
);

export default router;
