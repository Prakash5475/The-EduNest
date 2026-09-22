import { z } from 'zod';

const USER_TYPES = ['school', 'dealer', 'admin', 'staff'] as const;
const USER_STATUSES = ['active', 'inactive', 'suspended', 'pending_verification'] as const;

export const listUsersSchema = z.object({
  query: z.object({
    userType: z.enum(USER_TYPES).optional(),
    status: z.enum(USER_STATUSES).optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const userIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const updateUserStatusSchema = z.object({
  body: z.object({ status: z.enum(USER_STATUSES) }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const roleIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const updateRolePermissionsSchema = z.object({
  body: z.object({ permissionIds: z.array(z.coerce.bigint()).min(0) }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
