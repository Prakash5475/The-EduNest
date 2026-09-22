import { Router } from 'express';
import { deliveryPartnerController } from '@/controllers/deliveryPartner.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listDeliveryPartnersSchema,
  deliveryPartnerIdParamSchema,
  createDeliveryPartnerSchema,
  updateDeliveryPartnerSchema,
  updateDeliveryPartnerStatusSchema,
  updateDeliveryPartnerAvailabilitySchema,
} from '@/validators/deliveryPartner.validators';

const router = Router();
// Admin/staff only, matching every other roster (schools/dealers) — there is no
// delivery-partner login/portal in this phase (see FINAL_STATUS.md for why).
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/delivery-partners:
 *   get:
 *     summary: List delivery partners — filterable by status/availability, searchable
 *     tags: [Admin Delivery Partners]
 */
router.get('/', validate(listDeliveryPartnersSchema), deliveryPartnerController.list);

/**
 * @openapi
 * /admin/delivery-partners:
 *   post:
 *     summary: Add a delivery partner
 *     tags: [Admin Delivery Partners]
 */
router.post('/', validate(createDeliveryPartnerSchema), deliveryPartnerController.create);

/**
 * @openapi
 * /admin/delivery-partners/{id}:
 *   get:
 *     summary: Get a delivery partner, including their current active-assignment count
 *     tags: [Admin Delivery Partners]
 */
router.get('/:id', validate(deliveryPartnerIdParamSchema), deliveryPartnerController.getById);

/**
 * @openapi
 * /admin/delivery-partners/{id}:
 *   patch:
 *     summary: Edit a delivery partner's details
 *     tags: [Admin Delivery Partners]
 */
router.patch('/:id', validate(updateDeliveryPartnerSchema), deliveryPartnerController.update);

/**
 * @openapi
 * /admin/delivery-partners/{id}/status:
 *   patch:
 *     summary: Activate/deactivate a delivery partner
 *     tags: [Admin Delivery Partners]
 */
router.patch('/:id/status', validate(updateDeliveryPartnerStatusSchema), deliveryPartnerController.updateStatus);

/**
 * @openapi
 * /admin/delivery-partners/{id}/availability:
 *   patch:
 *     summary: Set a delivery partner's availability (available/busy/offline)
 *     tags: [Admin Delivery Partners]
 */
router.patch('/:id/availability', validate(updateDeliveryPartnerAvailabilitySchema), deliveryPartnerController.updateAvailability);

/**
 * @openapi
 * /admin/delivery-partners/{id}:
 *   delete:
 *     summary: Deactivate (soft-delete) a delivery partner — blocked while they have active assignments
 *     tags: [Admin Delivery Partners]
 */
router.delete('/:id', validate(deliveryPartnerIdParamSchema), deliveryPartnerController.remove);

export default router;
