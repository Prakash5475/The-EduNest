import { Router } from 'express';
import { adminDealerController } from '@/controllers/adminDealer.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { listDealersSchema, dealerIdParamSchema, updateDealerStatusSchema } from '@/validators/adminDealer.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/dealers:
 *   get:
 *     summary: List dealers — filterable by status, searchable by business name/code. Admin/staff only.
 *     tags: [Admin Dealers]
 */
router.get('/', validate(listDealersSchema), adminDealerController.list);

/**
 * @openapi
 * /admin/dealers/{id}:
 *   get:
 *     summary: Get a single dealer's full detail (addresses, logo)
 *     tags: [Admin Dealers]
 */
router.get('/:id', validate(dealerIdParamSchema), adminDealerController.getById);

/**
 * @openapi
 * /admin/dealers/{id}/status:
 *   patch:
 *     summary: Approve/block/activate/deactivate a dealer account — notifies the dealer
 *     tags: [Admin Dealers]
 */
router.patch('/:id/status', validate(updateDealerStatusSchema), adminDealerController.updateStatus);

export default router;
