import { Router } from 'express';
import { paymentController } from '@/controllers/payment.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  initiatePaymentSchema,
  verifyPaymentSchema,
  listPaymentsSchema,
  refundPaymentSchema,
} from '@/validators/payment.validators';

const router = Router();
const staffOnly = requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF);

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     summary: Razorpay webhook (payment.captured, payment.failed, refund.processed, order.paid) — HMAC verified, not user-authenticated
 *     tags: [Payments]
 */
router.post('/webhook', paymentController.webhook);

router.use(authenticate);

/**
 * @openapi
 * /payments/initiate:
 *   post:
 *     summary: Create a Razorpay order for an order's advance/balance/full payment — amount is always computed server-side (50% advance rule enforced here)
 *     tags: [Payments]
 */
router.post('/initiate', validate(initiatePaymentSchema), paymentController.initiate);

/**
 * @openapi
 * /payments/{id}/verify:
 *   post:
 *     summary: Verify a completed Razorpay checkout against its HMAC signature and finalize the order
 *     tags: [Payments]
 */
router.post('/:id/verify', validate(verifyPaymentSchema), paymentController.verify);

/**
 * @openapi
 * /payments/history:
 *   get:
 *     summary: The current school's full payment history (advances, balances, refunds)
 *     tags: [Payments]
 */
router.get('/history', validate(listPaymentsSchema), paymentController.listHistory);

/**
 * @openapi
 * /payments/{id}/refund:
 *   post:
 *     summary: Request a refund for a captured payment (staff/admin only) — actually calls Razorpay; the Refund record lands via webhook once Razorpay confirms it
 *     tags: [Payments]
 */
router.post('/:id/refund', staffOnly, validate(refundPaymentSchema), paymentController.refund);

export default router;
