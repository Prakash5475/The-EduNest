import { z } from 'zod';

export const dateRangeQuerySchema = z.object({
  query: z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    format: z.enum(['csv', 'xlsx', 'pdf']).optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
