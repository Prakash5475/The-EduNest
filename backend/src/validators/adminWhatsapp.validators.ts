import { z } from 'zod';

const WHATSAPP_STATUSES = ['queued', 'processing', 'sent', 'delivered', 'read', 'failed'] as const;

export const listDeliveryLogsSchema = z.object({
  query: z.object({
    status: z.enum(WHATSAPP_STATUSES).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
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

export const conversationIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  body: z.object({}).optional(),
});

export const broadcastSchema = z.object({
  body: z.object({
    dealerIds: z.array(z.coerce.bigint()).min(1),
    eventType: z.string().trim().min(1),
    data: z.record(z.string(), z.string()).default({}),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
