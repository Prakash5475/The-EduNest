import { Router } from 'express';
import { adminRbacController } from '@/controllers/adminRbac.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listUsersSchema,
  userIdParamSchema,
  updateUserStatusSchema,
  roleIdParamSchema,
  updateRolePermissionsSchema,
} from '@/validators/adminRbac.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: List users — filterable by user type/status, searchable by name/email, paginated. Admin/staff only.
 *     tags: [Admin Users]
 */
router.get('/users', validate(listUsersSchema), adminRbacController.listUsers);

/**
 * @openapi
 * /admin/users/{id}:
 *   get:
 *     summary: Get a single user's full detail, including roles and effective permissions
 *     tags: [Admin Users]
 */
router.get('/users/:id', validate(userIdParamSchema), adminRbacController.getUser);

/**
 * @openapi
 * /admin/users/{id}/status:
 *   patch:
 *     summary: Activate/deactivate a user account — notifies the user
 *     tags: [Admin Users]
 */
router.patch('/users/:id/status', validate(updateUserStatusSchema), adminRbacController.updateUserStatus);

/**
 * @openapi
 * /admin/roles:
 *   get:
 *     summary: List all roles with their mapped permissions
 *     tags: [Admin Roles]
 */
router.get('/roles', adminRbacController.listRoles);

/**
 * @openapi
 * /admin/roles/{id}:
 *   get:
 *     summary: Get a single role's permission mapping
 *     tags: [Admin Roles]
 */
router.get('/roles/:id', validate(roleIdParamSchema), adminRbacController.getRole);

/**
 * @openapi
 * /admin/roles/{id}/permissions:
 *   patch:
 *     summary: Replace a role's permission set (existing RolePermission schema — no new RBAC model)
 *     tags: [Admin Roles]
 */
router.patch('/roles/:id/permissions', validate(updateRolePermissionsSchema), adminRbacController.updateRolePermissions);

/**
 * @openapi
 * /admin/permissions:
 *   get:
 *     summary: List all permissions, grouped by module
 *     tags: [Admin Permissions]
 */
router.get('/permissions', adminRbacController.listPermissions);

export default router;
