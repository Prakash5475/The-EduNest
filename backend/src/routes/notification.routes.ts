import { Router } from 'express';
import { notificationController } from '@/controllers/notification.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { listNotificationsSchema, notificationIdParamSchema } from '@/validators/notification.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     summary: List the current user's notifications (unreadCount included in meta)
 *     tags: [Notifications]
 */
router.get('/', validate(listNotificationsSchema), notificationController.list);

/**
 * @openapi
 * /notifications/{id}/read:
 *   post:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 */
router.post('/:id/read', validate(notificationIdParamSchema), notificationController.markRead);

/**
 * @openapi
 * /notifications/mark-all-read:
 *   post:
 *     summary: Mark every notification for the current user as read
 *     tags: [Notifications]
 */
router.post('/mark-all-read', notificationController.markAllRead);

export default router;
