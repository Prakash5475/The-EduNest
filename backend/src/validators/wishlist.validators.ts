import { z } from 'zod';

export const addWishlistItemSchema = z.object({
  body: z.object({ productId: z.coerce.bigint() }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const wishlistItemParamSchema = z.object({
  params: z.object({ itemId: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const moveToCartSchema = z.object({
  body: z.object({ quantity: z.coerce.number().int().positive().optional() }),
  params: z.object({ itemId: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
