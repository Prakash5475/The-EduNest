import { Router } from 'express';
import { shippingMethodController } from '@/controllers/shippingMethod.controller';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /shipping-methods:
 *   get:
 *     summary: List active shipping methods available at checkout
 *     tags: [Shipping]
 */
router.get('/', shippingMethodController.list);

export default router;
