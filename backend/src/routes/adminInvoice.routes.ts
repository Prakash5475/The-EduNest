import { Router } from 'express';
import { adminInvoiceController } from '@/controllers/adminInvoice.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { listInvoicesSchema, invoiceIdParamSchema } from '@/validators/adminInvoice.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/invoices/summary:
 *   get:
 *     summary: Invoices dashboard summary — totals by status
 *     tags: [Admin Invoices]
 */
router.get('/summary', adminInvoiceController.summary);

/**
 * @openapi
 * /admin/invoices:
 *   get:
 *     summary: List invoices — filterable by status, school, and issued-date range; searchable by invoice/order number/school name. Admin/staff only.
 *     tags: [Admin Invoices]
 */
router.get('/', validate(listInvoicesSchema), adminInvoiceController.list);

/**
 * @openapi
 * /admin/invoices/{id}:
 *   get:
 *     summary: Get a single invoice's full detail — line items, related order, payment history, school, and download URL for the stored PDF
 *     tags: [Admin Invoices]
 */
router.get('/:id', validate(invoiceIdParamSchema), adminInvoiceController.getById);

export default router;
