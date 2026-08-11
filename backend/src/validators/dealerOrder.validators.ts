import { z } from 'zod';

export const listDealerOrdersSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const dealerOrderIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const updateDealerOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['confirmed', 'processing', 'shipped']),
    note: z.string().trim().max(500).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
