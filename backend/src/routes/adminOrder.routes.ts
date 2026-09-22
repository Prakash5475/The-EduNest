import { Router } from 'express';
import { adminOrderController } from '@/controllers/adminOrder.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listAdminOrdersSchema,
  adminOrderIdParamSchema,
  assignDealerSchema,
  overrideOrderStatusSchema,
} from '@/validators/adminOrder.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/orders:
 *   get:
 *     summary: List every order across all schools (admin/staff only)
 *     tags: [Admin Orders]
 */
router.get('/', validate(listAdminOrdersSchema), adminOrderController.list);

/**
 * @openapi
 * /admin/orders/{id}:
 *   get:
 *     summary: Get any order's full detail
 *     tags: [Admin Orders]
 */
router.get('/:id', validate(adminOrderIdParamSchema), adminOrderController.getById);

/**
 * @openapi
 * /admin/orders/{id}/assign-dealer:
 *   post:
 *     summary: Assign or reassign the dealer fulfilling an order
 *     tags: [Admin Orders]
 */
router.post('/:id/assign-dealer', validate(assignDealerSchema), adminOrderController.assignDealer);

/**
 * @openapi
 * /admin/orders/{id}/override-status:
 *   post:
 *     summary: Manually move an order's status forward when the dealer is unavailable (requires a reason, recorded in the audit trail)
 *     tags: [Admin Orders]
 */
router.post('/:id/override-status', validate(overrideOrderStatusSchema), adminOrderController.overrideStatus);

export default router;
