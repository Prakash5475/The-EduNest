import { Router } from 'express';
import { auditController } from '@/controllers/audit.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { listAuditLogsSchema } from '@/validators/audit.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /audit-logs:
 *   get:
 *     summary: Central audit log — filterable by user, entity type, action, and date range. Admin/staff only.
 *     tags: [Audit Log]
 */
router.get('/', validate(listAuditLogsSchema), auditController.list);

export default router;
