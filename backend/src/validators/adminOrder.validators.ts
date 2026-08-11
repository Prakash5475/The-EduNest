import { z } from 'zod';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned'] as const;

export const listAdminOrdersSchema = z.object({
  query: z.object({
    status: z.enum(ORDER_STATUSES).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'normal']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const adminOrderIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const assignDealerSchema = z.object({
  body: z.object({ dealerId: z.coerce.bigint() }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const overrideOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(ORDER_STATUSES),
    reason: z.string().trim().min(3).max(500),
    note: z.string().trim().max(2000).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
