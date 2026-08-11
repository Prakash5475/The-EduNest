import { Router } from 'express';
import { customizationController } from '@/controllers/customization.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  createCustomizationRequestSchema,
  updateCustomizationRequestSchema,
  customizationIdParamSchema,
  listCustomizationRequestsSchema,
  reviewCustomizationRequestSchema,
} from '@/validators/customization.validators';

const router = Router();
const staffOnly = requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF);
router.use(authenticate);

/**
 * @openapi
 * /customization-requests:
 *   get:
 *     summary: List the current school's customization requests
 *     tags: [Customization]
 */
router.get('/', validate(listCustomizationRequestsSchema), customizationController.listMine);

/**
 * @openapi
 * /customization-requests/admin:
 *   get:
 *     summary: List all customization requests across schools (admin/staff review queue)
 *     tags: [Customization]
 */
router.get('/admin', staffOnly, validate(listCustomizationRequestsSchema), customizationController.listForAdmin);

/**
 * @openapi
 * /customization-requests:
 *   post:
 *     summary: Submit a new customization request (Pending Review) — product must be marked customizable
 *     tags: [Customization]
 */
router.post('/', validate(createCustomizationRequestSchema), customizationController.create);

/**
 * @openapi
 * /customization-requests/{id}:
 *   get:
 *     summary: Get a single customization request (owning school, or admin/staff)
 *     tags: [Customization]
 */
router.get('/:id', validate(customizationIdParamSchema), customizationController.getById);

/**
 * @openapi
 * /customization-requests/{id}:
 *   patch:
 *     summary: Edit and resubmit a rejected customization request (resets to Pending Review)
 *     tags: [Customization]
 */
router.patch('/:id', validate(updateCustomizationRequestSchema), customizationController.resubmit);

/**
 * @openapi
 * /customization-requests/{id}/review:
 *   post:
 *     summary: Reviewer decision — Reviewed / Approved / Rejected (admin/staff)
 *     tags: [Customization]
 */
router.post(
  '/:id/review',
  staffOnly,
  validate(reviewCustomizationRequestSchema),
  customizationController.review,
);

/**
 * @openapi
 * /customization-requests/{id}/convert-to-cart:
 *   post:
 *     summary: Convert an Approved customization request into a cart line item (once only)
 *     tags: [Customization]
 */
router.post(
  '/:id/convert-to-cart',
  validate(customizationIdParamSchema),
  customizationController.convertToCart,
);

export default router;
