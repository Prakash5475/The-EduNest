import { z } from 'zod';

const DEALER_STATUSES = ['active', 'inactive', 'pending_approval', 'blocked'] as const;

export const listDealersSchema = z.object({
  query: z.object({
    status: z.enum(DEALER_STATUSES).optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const dealerIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const updateDealerStatusSchema = z.object({
  body: z.object({
    status: z.enum(DEALER_STATUSES),
    reason: z.string().trim().max(500).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const updateDealerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(150).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(5).max(20).optional(),
    businessName: z.string().trim().min(2).max(200).optional(),
    businessType: z.enum(['manufacturer', 'distributor', 'wholesaler', 'retailer']).optional(),
    gstin: z.string().trim().optional().nullable(),
    panNumber: z.string().trim().optional().nullable(),
    creditLimit: z.coerce.number().min(0).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const createDealerSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(150),
    email: z.string().trim().email(),
    phone: z.string().trim().min(5).max(20),
    password: z.string().min(6).optional(),
    businessName: z.string().trim().min(2).max(200),
    dealerCode: z.string().trim().optional(),
    businessType: z.enum(['manufacturer', 'distributor', 'wholesaler', 'retailer']).optional(),
    gstin: z.string().trim().optional(),
    panNumber: z.string().trim().optional(),
    creditLimit: z.coerce.number().min(0).optional(),
    status: z.enum(DEALER_STATUSES).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
