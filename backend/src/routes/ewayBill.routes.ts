import { Router } from 'express';
import { ewayBillController } from '@/controllers/ewayBill.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listEwayBillsSchema,
  ewayBillIdParamSchema,
  orderIdParamSchema,
  createEwayBillSchema,
  markEwayBillGeneratedSchema,
} from '@/validators/ewayBill.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/eway-bills:
 *   get:
 *     summary: List e-way bill records (record-keeping only — no government API integration)
 *     tags: [Admin E-way Bills]
 */
router.get('/', validate(listEwayBillsSchema), ewayBillController.list);

/**
 * @openapi
 * /admin/eway-bills:
 *   post:
 *     summary: Create an e-way bill draft for an order
 *     tags: [Admin E-way Bills]
 */
router.post('/', validate(createEwayBillSchema), ewayBillController.create);

/**
 * @openapi
 * /admin/eway-bills/order/{orderId}:
 *   get:
 *     summary: Get the e-way bill for an order
 *     tags: [Admin E-way Bills]
 */
router.get('/order/:orderId', validate(orderIdParamSchema), ewayBillController.getByOrderId);

/**
 * @openapi
 * /admin/eway-bills/{id}:
 *   get:
 *     summary: Get a single e-way bill record
 *     tags: [Admin E-way Bills]
 */
router.get('/:id', validate(ewayBillIdParamSchema), ewayBillController.getById);

/**
 * @openapi
 * /admin/eway-bills/{id}/mark-generated:
 *   post:
 *     summary: Record the e-way bill number generated on the government portal (manual entry — not an API call)
 *     tags: [Admin E-way Bills]
 */
router.post('/:id/mark-generated', validate(markEwayBillGeneratedSchema), ewayBillController.markGenerated);

/**
 * @openapi
 * /admin/eway-bills/{id}/cancel:
 *   post:
 *     summary: Cancel an e-way bill record
 *     tags: [Admin E-way Bills]
 */
router.post('/:id/cancel', validate(ewayBillIdParamSchema), ewayBillController.cancel);

export default router;
