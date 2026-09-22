import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    billingAddressId: z.coerce.bigint(),
    shippingAddressId: z.coerce.bigint(),
    shippingMethodId: z.coerce.bigint(),
    couponCode: z.string().trim().min(1).max(40).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
