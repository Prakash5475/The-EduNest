import { z } from 'zod';

export const listAuditLogsSchema = z.object({
  query: z.object({
    userId: z.coerce.bigint().optional(),
    entityType: z.string().trim().max(60).optional(),
    action: z.string().trim().max(100).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
