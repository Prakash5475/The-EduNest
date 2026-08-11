import { z } from 'zod';

const INVOICE_STATUSES = ['issued', 'paid', 'overdue', 'void'] as const;

export const listInvoicesSchema = z.object({
  query: z.object({
    status: z.enum(INVOICE_STATUSES).optional(),
    schoolId: z.coerce.bigint().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const invoiceIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});
