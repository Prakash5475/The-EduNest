import { z } from 'zod';

export const listOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const orderIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const cancelOrderSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({ reason: z.string().trim().max(255).optional() }).optional(),
});
