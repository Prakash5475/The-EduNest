import { z } from 'zod';

const SCHOOL_STATUSES = ['active', 'inactive', 'pending_approval', 'blocked'] as const;
const SCHOOL_TYPES = ['preschool', 'k12', 'play_school', 'montessori', 'other'] as const;

export const listSchoolsSchema = z.object({
  query: z.object({
    status: z.enum(SCHOOL_STATUSES).optional(),
    schoolType: z.string().refine((value) => value.split(',').every((type) => SCHOOL_TYPES.includes(type as (typeof SCHOOL_TYPES)[number])), 'Invalid school type').optional(),
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

export const createSchoolSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(150),
    email: z.string().trim().email(),
    phone: z.string().trim().min(6).max(20),
    password: z.string().min(6).optional(),
    schoolName: z.string().trim().min(2).max(200),
    schoolCode: z.string().trim().optional(),
    schoolType: z.enum(['preschool', 'k12', 'play_school', 'montessori', 'other']).optional(),
    boardAffiliation: z.string().trim().optional(),
    registrationNumber: z.string().trim().optional(),
    gstin: z.string().trim().optional(),
    status: z.enum(SCHOOL_STATUSES).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
