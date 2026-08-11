import { z } from 'zod';

const SCHOOL_STATUSES = ['active', 'inactive', 'pending_approval', 'blocked'] as const;

export const listSchoolsSchema = z.object({
  query: z.object({
    status: z.enum(SCHOOL_STATUSES).optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const schoolIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const updateSchoolStatusSchema = z.object({
  body: z.object({
    status: z.enum(SCHOOL_STATUSES),
    reason: z.string().trim().max(500).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
