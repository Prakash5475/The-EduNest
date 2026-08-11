import { z } from 'zod';

const itemInput = z.object({
  productId: z.coerce.bigint().optional(),
  kitId: z.coerce.bigint().optional(),
  customItemDescription: z.string().trim().max(255).optional(),
  quantity: z.coerce.number().int().positive(),
});

export const createQuotationRequestSchema = z.object({
  body: z.object({
    title: z.string().trim().max(200).optional(),
    notes: z.string().trim().optional(),
    items: z.array(itemInput).min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const listQuotationRequestsSchema = z.object({
  query: z.object({
    status: z.enum(['open', 'in_review', 'quoted', 'closed', 'expired']).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const quotationRequestIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const assignDealersSchema = z.object({
  body: z.object({
    assignments: z
      .array(
        z.object({
          dealerId: z.coerce.bigint(),
          itemIds: z.array(z.coerce.bigint()).min(1),
          validityDays: z.coerce.number().int().positive().default(7),
          expectedCompletionDate: z.coerce.date().optional(),
          notes: z.string().trim().max(2000).optional(),
        }),
      )
      .min(1),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const dealerQuotationIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const updateDealerQuotationSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          itemId: z.coerce.bigint(),
          quotedUnitPrice: z.coerce.number().positive().optional(),
          quotedQuantity: z.coerce.number().int().positive().optional(),
        }),
      )
      .optional(),
    validityDays: z.coerce.number().int().positive().optional(),
    notes: z.string().trim().max(2000).optional(),
    expectedCompletionDate: z.coerce.date().optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const rejectDealerQuotationSchema = z.object({
  body: z.object({ reason: z.string().trim().max(500).optional() }).optional(),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const listDealerQuotationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});
