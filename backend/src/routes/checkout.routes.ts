import { Router } from 'express';
import { checkoutController } from '@/controllers/checkout.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { checkoutSchema } from '@/validators/checkout.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /checkout:
 *   post:
 *     summary: Convert the active cart into an Order (pending, unpaid) — does not charge money
 *     tags: [Checkout]
 */
router.post('/', validate(checkoutSchema), checkoutController.checkout);

export default router;
