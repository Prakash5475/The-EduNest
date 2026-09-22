import { z } from 'zod';

export const listWarehousesSchema = z.object({
  query: z.object({
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const warehouseIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const warehouseBody = {
  name: z.string().trim().min(2).max(150),
  location: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z.string().trim().max(10).optional(),
};

export const createWarehouseSchema = z.object({
  body: z.object(warehouseBody),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateWarehouseSchema = z.object({
  body: z.object(warehouseBody).partial(),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const setWarehouseActiveSchema = z.object({
  body: z.object({ isActive: z.boolean() }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
