import { Router } from 'express';
import { userController } from '@/controllers/user.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { updateProfileSchema, registerDeviceSchema, removeDeviceSchema } from '@/validators/user.validators';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Users]
 */
router.get('/me', userController.getProfile);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Update the current user's profile
 *     tags: [Users]
 */
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);

/**
 * @openapi
 * /users/me/sessions:
 *   get:
 *     summary: List active sessions for the current user
 *     tags: [Users]
 */
router.get('/me/sessions', userController.listSessions);

/**
 * @openapi
 * /users/me/login-history:
 *   get:
 *     summary: List recent login history for the current user
 *     tags: [Users]
 */
router.get('/me/login-history', userController.listLoginHistory);

/**
 * @openapi
 * /users/me/devices:
 *   post:
 *     summary: Register a push-notification device token
 *     tags: [Users]
 */
router.post('/me/devices', validate(registerDeviceSchema), userController.registerDevice);

/**
 * @openapi
 * /users/me/devices/{deviceToken}:
 *   delete:
 *     summary: Deactivate a push-notification device token
 *     tags: [Users]
 */
router.delete('/me/devices/:deviceToken', validate(removeDeviceSchema), userController.removeDevice);

export default router;
