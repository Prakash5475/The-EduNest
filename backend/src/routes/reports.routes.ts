import { Router } from 'express';
import { reportsController } from '@/controllers/reports.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { dateRangeQuerySchema } from '@/validators/reports.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /reports/orders:
 *   get:
 *     summary: Orders report — real data, filterable by date range. Add ?format=csv|xlsx|pdf to export.
 *     tags: [Reports]
 */
router.get('/orders', validate(dateRangeQuerySchema), reportsController.orders);

/**
 * @openapi
 * /reports/payments:
 *   get:
 *     summary: Payments report
 *     tags: [Reports]
 */
router.get('/payments', validate(dateRangeQuerySchema), reportsController.payments);

/**
 * @openapi
 * /reports/gst:
 *   get:
 *     summary: GST summary report
 *     tags: [Reports]
 */
router.get('/gst', validate(dateRangeQuerySchema), reportsController.gst);

/**
 * @openapi
 * /reports/invoices:
 *   get:
 *     summary: Invoices report (advance receipts vs final invoices)
 *     tags: [Reports]
 */
router.get('/invoices', validate(dateRangeQuerySchema), reportsController.invoices);

/**
 * @openapi
 * /reports/dealer-performance:
 *   get:
 *     summary: Dealer performance report (completed/cancelled/late orders per dealer)
 *     tags: [Reports]
 */
router.get('/dealer-performance', reportsController.dealerPerformance);

/**
 * @openapi
 * /reports/production:
 *   get:
 *     summary: Production report — checkpoint counts by stage
 *     tags: [Reports]
 */
router.get('/production', validate(dateRangeQuerySchema), reportsController.production);

/**
 * @openapi
 * /reports/priority-orders:
 *   get:
 *     summary: Priority + late/near-deadline orders report
 *     tags: [Reports]
 */
router.get('/priority-orders', reportsController.priorityOrders);

/**
 * @openapi
 * /reports/quotations:
 *   get:
 *     summary: Quotations report — status breakdown and conversion rate
 *     tags: [Reports]
 */
router.get('/quotations', validate(dateRangeQuerySchema), reportsController.quotations);

export default router;
