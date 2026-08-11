import { Router } from 'express';
import { productionController } from '@/controllers/production.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { addCheckpointSchema, orderIdParamSchema, assignDealerSchema } from '@/validators/production.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /orders/production/dashboard:
 *   get:
 *     summary: Staff production overview — orders in production, overdue orders, order counts by checkpoint stage.
 *     tags: [Production Tracking]
 */
router.get('/production/dashboard', requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF), productionController.dashboard);

/**
 * @openapi
 * /orders/{orderId}/production:
 *   get:
 *     summary: Full production checkpoint history for an order (school owner, assigned dealer, or admin/staff)
 *     tags: [Production Tracking]
 */
router.get('/:orderId/production', validate(orderIdParamSchema), productionController.list);

/**
 * @openapi
 * /orders/{orderId}/production:
 *   post:
 *     summary: Log a production checkpoint — only the assigned dealer or admin/staff. Enforces forward stage order for dealers. Notifies school + admin and emits a live tracking update.
 *     tags: [Production Tracking]
 */
router.post('/:orderId/production', validate(addCheckpointSchema), productionController.addCheckpoint);

/**
 * @openapi
 * /orders/{orderId}/production/assign:
 *   post:
 *     summary: Assign (or reassign) the dealer responsible for producing an order. Staff/admin only. Blocked if the dealer is overloaded unless force=true.
 *     tags: [Production Tracking]
 */
router.post(
  '/:orderId/production/assign',
  requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF),
  validate(assignDealerSchema),
  productionController.assignDealer,
);

export default router;
