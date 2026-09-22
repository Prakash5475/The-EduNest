import { Router } from 'express';
import { cartController } from '@/controllers/cart.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamSchema,
  couponPreviewSchema,
} from '@/validators/cart.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: Get the current school's active cart (created on first access)
 *     tags: [Cart]
 */
router.get('/', cartController.getCart);

/**
 * @openapi
 * /cart/items:
 *   post:
 *     summary: Add a product to the cart (MOQ enforced server-side)
 *     tags: [Cart]
 */
router.post('/items', validate(addCartItemSchema), cartController.addItem);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   patch:
 *     summary: Update a cart line item's quantity
 *     tags: [Cart]
 */
router.patch('/items/:itemId', validate(updateCartItemSchema), cartController.updateItem);

/**
 * @openapi
 * /cart/items/{itemId}:
 *   delete:
 *     summary: Remove a line item from the cart
 *     tags: [Cart]
 */
router.delete('/items/:itemId', validate(cartItemParamSchema), cartController.removeItem);

/**
 * @openapi
 * /cart:
 *   delete:
 *     summary: Clear the entire cart
 *     tags: [Cart]
 */
router.delete('/', cartController.clear);

/**
 * @openapi
 * /cart/coupon-preview:
 *   post:
 *     summary: Validate a coupon code against the current cart and preview the discount (not persisted until checkout)
 *     tags: [Cart]
 */
router.post('/coupon-preview', validate(couponPreviewSchema), cartController.previewCoupon);

export default router;
