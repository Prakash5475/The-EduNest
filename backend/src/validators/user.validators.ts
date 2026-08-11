import { z } from 'zod';
import { phoneSchema } from './common.validators';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(150).optional(),
    phone: phoneSchema.optional(),
  }),
});

export const registerDeviceSchema = z.object({
  body: z.object({
    deviceToken: z.string().min(10, 'Invalid device token'),
    platform: z.enum(['ios', 'android', 'web']),
  }),
});

export const removeDeviceSchema = z.object({
  params: z.object({
    deviceToken: z.string().min(10, 'Invalid device token'),
  }),
});
