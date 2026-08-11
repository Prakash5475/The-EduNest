import { Router } from 'express';
import { adminPaymentController } from '@/controllers/adminPayment.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { listPaymentsSchema, paymentIdParamSchema, paginationOnlySchema } from '@/validators/adminPayment.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/payments/summary:
 *   get:
 *     summary: Payments dashboard summary — totals by status, total refunded
 *     tags: [Admin Payments]
 */
router.get('/summary', adminPaymentController.summary);

/**
 * @openapi
 * /admin/payments/refunds:
 *   get:
 *     summary: Flat refund history across all payments, paginated
 *     tags: [Admin Payments]
 */
router.get('/refunds', validate(paginationOnlySchema), adminPaymentController.refundHistory);

/**
 * @openapi
 * /admin/payments:
 *   get:
 *     summary: List payments — filterable by status/payment type, searchable by order number/school name/gateway reference. Admin/staff only.
 *     tags: [Admin Payments]
 */
router.get('/', validate(listPaymentsSchema), adminPaymentController.list);

/**
 * @openapi
 * /admin/payments/{id}:
 *   get:
 *     summary: Get a single payment's full detail (transactions, method, order, school)
 *     tags: [Admin Payments]
 */
router.get('/:id', validate(paymentIdParamSchema), adminPaymentController.getById);

export default router;
