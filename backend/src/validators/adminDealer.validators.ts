import { z } from 'zod';

const DEALER_STATUSES = ['active', 'inactive', 'pending_approval', 'blocked'] as const;

export const listDealersSchema = z.object({
  query: z.object({
    status: z.enum(DEALER_STATUSES).optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const dealerIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const updateDealerStatusSchema = z.object({
  body: z.object({
    status: z.enum(DEALER_STATUSES),
    reason: z.string().trim().max(500).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
