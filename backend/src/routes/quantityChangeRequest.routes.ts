import { Router } from 'express';
import { quantityChangeRequestController } from '@/controllers/quantityChangeRequest.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listQtyChangeRequestsSchema,
  qtyChangeRequestIdParamSchema,
  createQtyChangeRequestSchema,
  rejectQtyChangeRequestSchema,
} from '@/validators/quantityChangeRequest.validators';

const router = Router();
// Admin/Staff only. Staff can raise a request; only the approve/reject endpoints matter for
// the "only Super Admin makes the final call" requirement — enforced per-route below, not
// by hiding the button, since Staff still has read access to the queue.
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/quantity-change-requests:
 *   get:
 *     summary: List quantity-change requests, filterable by status
 *     tags: [Admin Inventory]
 */
router.get('/', validate(listQtyChangeRequestsSchema), quantityChangeRequestController.list);

/**
 * @openapi
 * /admin/quantity-change-requests:
 *   post:
 *     summary: Raise a quantity-change request for an inventory record (Admin or Staff)
 *     tags: [Admin Inventory]
 */
router.post('/', validate(createQtyChangeRequestSchema), quantityChangeRequestController.create);

/**
 * @openapi
 * /admin/quantity-change-requests/{id}:
 *   get:
 *     summary: Get a single quantity-change request
 *     tags: [Admin Inventory]
 */
router.get('/:id', validate(qtyChangeRequestIdParamSchema), quantityChangeRequestController.getById);

/**
 * @openapi
 * /admin/quantity-change-requests/{id}/approve:
 *   post:
 *     summary: Approve — the only endpoint that updates inventory.quantity_available for a manual correction. Super Admin only.
 *     tags: [Admin Inventory]
 */
router.post(
  '/:id/approve',
  requireRole(SYSTEM_ROLES.SUPER_ADMIN),
  validate(qtyChangeRequestIdParamSchema),
  quantityChangeRequestController.approve,
);

/**
 * @openapi
 * /admin/quantity-change-requests/{id}/reject:
 *   post:
 *     summary: Reject a quantity-change request with a reason. Super Admin only.
 *     tags: [Admin Inventory]
 */
router.post(
  '/:id/reject',
  requireRole(SYSTEM_ROLES.SUPER_ADMIN),
  validate(rejectQtyChangeRequestSchema),
  quantityChangeRequestController.reject,
);

export default router;
