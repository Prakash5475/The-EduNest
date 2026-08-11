import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  body: z.object({
    orderId: z.coerce.bigint(),
    amountType: z.enum(['advance', 'full', 'balance']),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const refundPaymentSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive().optional(),
    reason: z.string().trim().max(500).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
