import { z } from 'zod';

const fileInput = z.object({
  fileId: z.coerce.bigint(),
  fileType: z.enum(['logo', 'artwork', 'reference']),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
});

export const createCustomizationRequestSchema = z.object({
  body: z.object({
    productId: z.coerce.bigint(),
    quantity: z.coerce.number().int().positive(),
    schoolName: z.string().trim().max(150).optional(),
    customText: z.string().trim().max(255).optional(),
    color: z.string().trim().max(60).optional(),
    size: z.string().trim().max(60).optional(),
    material: z.string().trim().max(100).optional(),
    brandingRequirements: z.string().trim().optional(),
    printingRequirements: z.string().trim().optional(),
    specialInstructions: z.string().trim().optional(),
    files: z.array(fileInput).default([]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateCustomizationRequestSchema = z.object({
  body: z.object({
    quantity: z.coerce.number().int().positive().optional(),
    schoolName: z.string().trim().max(150).nullable().optional(),
    customText: z.string().trim().max(255).nullable().optional(),
    color: z.string().trim().max(60).nullable().optional(),
    size: z.string().trim().max(60).nullable().optional(),
    material: z.string().trim().max(100).nullable().optional(),
    brandingRequirements: z.string().trim().nullable().optional(),
    printingRequirements: z.string().trim().nullable().optional(),
    specialInstructions: z.string().trim().nullable().optional(),
    files: z.array(fileInput).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const customizationIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const listCustomizationRequestsSchema = z.object({
  query: z.object({
    status: z.enum(['pending_review', 'reviewed', 'approved', 'rejected']).optional(),
    schoolId: z.coerce.bigint().optional(),
    productId: z.coerce.bigint().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const reviewCustomizationRequestSchema = z.object({
  body: z.object({
    status: z.enum(['reviewed', 'approved', 'rejected']),
    reviewNotes: z.string().trim().max(2000).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
