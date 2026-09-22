import { z } from 'zod';

export const updateSchoolAccountSchema = z.object({
  body: z.object({
    schoolName: z.string().trim().min(2).max(200).optional(),
    boardAffiliation: z.string().trim().max(80).optional(),
    registrationNumber: z.string().trim().max(80).optional(),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/, 'Enter a valid 15-character GSTIN')
      .optional(),
    websiteUrl: z.string().trim().url().max(255).optional(),
    contactEmail: z.string().trim().email().max(190).optional(),
    contactPhone: z.string().trim().max(20).optional(),
    altPhone: z.string().trim().max(20).optional(),
    about: z.string().trim().max(5000).optional(),
    studentCount: z.coerce.number().int().nonnegative().optional(),
    teacherCount: z.coerce.number().int().nonnegative().optional(),
    branchCount: z.coerce.number().int().positive().optional(),
    establishedYear: z.string().trim().max(4).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
