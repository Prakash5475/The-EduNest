import { z } from 'zod';

const STATUSES = ['draft', 'generated', 'cancelled', 'expired'] as const;
const MODES = ['road', 'rail', 'air', 'ship'] as const;

export const listEwayBillsSchema = z.object({
  query: z.object({
    status: z.enum(STATUSES).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const ewayBillIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const orderIdParamSchema = z.object({
  params: z.object({ orderId: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const createEwayBillSchema = z.object({
  body: z.object({
    orderId: z.coerce.bigint(),
    invoiceId: z.coerce.bigint().optional(),
    transporterName: z.string().trim().max(150).optional(),
    transporterGstin: z.string().trim().max(15).optional(),
    transportMode: z.enum(MODES).optional(),
    vehicleNumber: z.string().trim().max(20).optional(),
    distanceKm: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const markEwayBillGeneratedSchema = z.object({
  body: z.object({
    ewayBillNumber: z.string().trim().min(3).max(20),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
