import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    settings: z
      .array(
        z.object({
          key: z.string().trim().min(1).max(100),
          value: z.string().nullable(),
          valueType: z.enum(['string', 'number', 'boolean', 'json']),
        }),
      )
      .min(1),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
