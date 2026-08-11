import { z } from 'zod';

export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    isRead: z.coerce.boolean().optional(),
    type: z.string().trim().max(60).optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const notificationIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});
