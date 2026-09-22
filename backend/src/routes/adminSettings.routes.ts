import { Router } from 'express';
import { adminSettingsController } from '@/controllers/adminSettings.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { updateSettingsSchema } from '@/validators/adminSettings.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/settings:
 *   get:
 *     summary: List application settings, grouped by category (derived from key prefix). Admin/staff only.
 *     tags: [Admin Settings]
 */
router.get('/', adminSettingsController.list);

/**
 * @openapi
 * /admin/settings:
 *   patch:
 *     summary: Bulk upsert application settings (key/value/valueType). Reuses the existing ApplicationSetting table.
 *     tags: [Admin Settings]
 */
router.patch('/', validate(updateSettingsSchema), adminSettingsController.update);

export default router;
