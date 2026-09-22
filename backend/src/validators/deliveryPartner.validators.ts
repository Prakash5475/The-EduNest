import { z } from 'zod';

const PARTNER_STATUSES = ['active', 'inactive'] as const;
const AVAILABILITY_STATUSES = ['available', 'busy', 'offline'] as const;

export const listDeliveryPartnersSchema = z.object({
  query: z.object({
    status: z.enum(PARTNER_STATUSES).optional(),
    availabilityStatus: z.enum(AVAILABILITY_STATUSES).optional(),
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const deliveryPartnerIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

const deliveryPartnerBody = {
  fullName: z.string().trim().min(2).max(150),
  mobile: z.string().trim().min(6).max(20),
  email: z.string().trim().email().optional(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z.string().trim().max(10).optional(),
  vehicleType: z.string().trim().max(50).optional(),
  vehicleNumber: z.string().trim().max(30).optional(),
  joiningDate: z.coerce.date().optional(),
  notes: z.string().trim().max(2000).optional(),
};

export const createDeliveryPartnerSchema = z.object({
  body: z.object(deliveryPartnerBody),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateDeliveryPartnerSchema = z.object({
  body: z.object(deliveryPartnerBody).partial(),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const updateDeliveryPartnerStatusSchema = z.object({
  body: z.object({ status: z.enum(PARTNER_STATUSES) }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const updateDeliveryPartnerAvailabilitySchema = z.object({
  body: z.object({ availabilityStatus: z.enum(AVAILABILITY_STATUSES) }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
