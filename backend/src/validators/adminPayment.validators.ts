import { z } from 'zod';

const PAYMENT_STATUSES = ['initiated', 'pending', 'success', 'failed', 'refunded'] as const;
const PAYMENT_TYPES = ['advance', 'balance', 'full', 'refund'] as const;

export const listPaymentsSchema = z.object({
  query: z.object({
    status: z.enum(PAYMENT_STATUSES).optional(),
    paymentType: z.enum(PAYMENT_TYPES).optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const paymentIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const paginationOnlySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
