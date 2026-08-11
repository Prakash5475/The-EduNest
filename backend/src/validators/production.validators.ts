import { z } from 'zod';

const CHECKPOINTS = [
  'order_received',
  'cutting',
  'stitching',
  'logo',
  'printing',
  'color_matching',
  'quality_check',
  'ready',
  'packed',
  'dispatched',
  'delivered',
  'completed',
] as const;

export const addCheckpointSchema = z.object({
  body: z.object({
    stage: z.enum(CHECKPOINTS),
    completionPercentage: z.coerce.number().int().min(0).max(100),
    notes: z.string().trim().max(2000).optional(),
    imageFileIds: z.array(z.coerce.bigint()).default([]),
    overrideReason: z.string().trim().max(500).optional(),
  }),
  params: z.object({ orderId: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const orderIdParamSchema = z.object({
  params: z.object({ orderId: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const assignDealerSchema = z.object({
  body: z.object({
    dealerId: z.coerce.bigint(),
    force: z.coerce.boolean().optional(),
  }),
  params: z.object({ orderId: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
