import { z } from 'zod';

const addressBody = z.object({
  addressType: z.enum(['registered', 'billing', 'shipping', 'branch']),
  addressLine1: z.string().trim().min(3).max(255),
  addressLine2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100).default('India'),
  pincode: z.string().trim().regex(/^\d{4,12}$/, 'Enter a valid postal code'),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isDefault: z.coerce.boolean().optional(),
});

export const createAddressSchema = z.object({
  body: addressBody,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateAddressSchema = z.object({
  body: addressBody.partial(),
  params: z.object({ addressId: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const addressIdParamSchema = z.object({
  params: z.object({ addressId: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});
