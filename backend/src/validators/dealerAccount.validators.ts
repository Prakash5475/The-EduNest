import { z } from 'zod';

export const updateDealerAccountSchema = z.object({
  body: z.object({
    businessName: z.string().trim().min(2).max(200).optional(),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/, 'Enter a valid 15-character GSTIN')
      .optional(),
    panNumber: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Enter a valid 10-character PAN')
      .optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const addDealerAddressSchema = z.object({
  body: z.object({
    addressType: z.enum(['registered', 'warehouse', 'billing']),
    addressLine1: z.string().trim().min(3).max(255),
    addressLine2: z.string().trim().max(255).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    country: z.string().trim().min(2).max(100).default('India'),
    pincode: z.string().trim().regex(/^\d{4,12}$/, 'Enter a valid postal code'),
    isDefault: z.coerce.boolean().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
