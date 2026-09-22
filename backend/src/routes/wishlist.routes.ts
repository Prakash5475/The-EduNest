import { Router } from 'express';
import { wishlistController } from '@/controllers/wishlist.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import {
  addWishlistItemSchema,
  wishlistItemParamSchema,
  moveToCartSchema,
} from '@/validators/wishlist.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /wishlist:
 *   get:
 *     summary: Get the school's wishlist (created on first access)
 *     tags: [Wishlist]
 */
router.get('/', wishlistController.list);

/**
 * @openapi
 * /wishlist/items:
 *   post:
 *     summary: Add a product to the wishlist
 *     tags: [Wishlist]
 */
router.post('/items', validate(addWishlistItemSchema), wishlistController.addItem);

/**
 * @openapi
 * /wishlist/items/{itemId}:
 *   delete:
 *     summary: Remove a product from the wishlist
 *     tags: [Wishlist]
 */
router.delete('/items/:itemId', validate(wishlistItemParamSchema), wishlistController.removeItem);

/**
 * @openapi
 * /wishlist/items/{itemId}/move-to-cart:
 *   post:
 *     summary: Move a wishlist item into the active cart (defaults quantity to MOQ)
 *     tags: [Wishlist]
 */
router.post(
  '/items/:itemId/move-to-cart',
  validate(moveToCartSchema),
  wishlistController.moveToCart,
);

export default router;
