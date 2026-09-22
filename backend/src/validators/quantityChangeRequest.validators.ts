import { z } from 'zod';

const STATUSES = ['pending', 'approved', 'rejected'] as const;

export const listQtyChangeRequestsSchema = z.object({
  query: z.object({
    status: z.enum(STATUSES).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const qtyChangeRequestIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const createQtyChangeRequestSchema = z.object({
  body: z
    .object({
      inventoryId: z.coerce.bigint().optional(),
      productId: z.coerce.bigint().optional(),
      warehouseId: z.coerce.bigint().optional(),
      requestedQuantity: z.coerce.number().int().min(0),
      reason: z.string().trim().min(3).max(500),
    })
    .superRefine((value, context) => {
      if (!value.inventoryId && (!value.productId || !value.warehouseId)) {
        context.addIssue({
          code: 'custom',
          path: ['inventoryId'],
          message: 'Provide an inventory record or a product and warehouse',
        });
      }
    }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const rejectQtyChangeRequestSchema = z.object({
  body: z.object({ rejectionReason: z.string().trim().min(3).max(500) }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
