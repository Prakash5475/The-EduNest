import { Router } from 'express';
import { adminSchoolController } from '@/controllers/adminSchool.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { listSchoolsSchema, schoolIdParamSchema, updateSchoolStatusSchema } from '@/validators/adminSchool.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/schools:
 *   get:
 *     summary: List schools — filterable by status, searchable by name/code. Admin/staff only.
 *     tags: [Admin Schools]
 */
router.get('/', validate(listSchoolsSchema), adminSchoolController.list);

/**
 * @openapi
 * /admin/schools/{id}:
 *   get:
 *     summary: Get a single school's full profile
 *     tags: [Admin Schools]
 */
router.get('/:id', validate(schoolIdParamSchema), adminSchoolController.getById);

/**
 * @openapi
 * /admin/schools/{id}/status:
 *   patch:
 *     summary: Approve/block/activate/deactivate a school account — notifies the school
 *     tags: [Admin Schools]
 */
router.patch('/:id/status', validate(updateSchoolStatusSchema), adminSchoolController.updateStatus);

export default router;
