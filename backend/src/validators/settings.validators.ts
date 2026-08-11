import { z } from 'zod';

export const upsertApplicationSettingSchema = z.object({
  body: z.object({
    key: z.string().trim().min(1).max(100),
    value: z.string().nullable(),
    valueType: z.enum(['string', 'number', 'boolean', 'json']),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const upsertScopedSettingSchema = z.object({
  body: z.object({ key: z.string().trim().min(1).max(100), value: z.string().nullable() }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const upsertPaymentSettingSchema = z.object({
  body: z.object({
    providerName: z.string().trim().min(1).max(60),
    configKey: z.string().trim().min(1).max(100),
    configValue: z.string().nullable(),
    isActive: z.coerce.boolean().default(true),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const upsertKeyValueSchema = z.object({
  body: z.object({ configKey: z.string().trim().min(1).max(100), configValue: z.string().nullable() }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const upsertThemeSettingSchema = z.object({
  body: z.object({
    scopeType: z.enum(['platform', 'school']),
    scopeId: z.coerce.bigint().optional(),
    configKey: z.string().trim().min(1).max(100),
    configValue: z.string().nullable(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
