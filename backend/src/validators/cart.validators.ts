import { z } from 'zod';

export const addCartItemSchema = z.object({
  body: z
    .object({
      productId: z.coerce.bigint().optional(),
      kitId: z.coerce.bigint().optional(),
      variantId: z.coerce.bigint().optional(),
      dealerId: z.coerce.bigint().optional(),
      quantity: z.coerce.number().int().positive(),
    })
    .refine((v) => Boolean(v.productId) !== Boolean(v.kitId), {
      message: 'Provide exactly one of productId or kitId',
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().positive(),
  }),
  params: z.object({ itemId: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const cartItemParamSchema = z.object({
  params: z.object({ itemId: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const couponPreviewSchema = z.object({
  body: z.object({ code: z.string().trim().min(1).max(40) }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
