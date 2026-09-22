import { Router } from 'express';
import { schoolAccountController } from '@/controllers/schoolAccount.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { updateSchoolAccountSchema } from '@/validators/schoolAccount.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /schools/me:
 *   get:
 *     summary: Get the current school's full profile (School + SchoolProfile combined)
 *     tags: [Schools]
 */
router.get('/me', schoolAccountController.getMe);

/**
 * @openapi
 * /schools/dashboard:
 *   get:
 *     summary: The current school's dashboard — order stats, pending actions (unpaid orders, pending quotations, pending customization requests), recent orders, unread notifications.
 *     tags: [Schools]
 */
router.get('/dashboard', schoolAccountController.dashboard);

/**
 * @openapi
 * /schools/me:
 *   patch:
 *     summary: Update the current school's profile
 *     tags: [Schools]
 */
router.patch('/me', validate(updateSchoolAccountSchema), schoolAccountController.updateMe);

export default router;
