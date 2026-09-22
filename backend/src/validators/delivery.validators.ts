import { z } from 'zod';

const SHIPMENT_STATUSES = [
  'pending',
  'ready_for_dispatch',
  'assigned',
  'picked_up',
  'dispatched',
  'in_transit',
  'out_for_delivery',
  'delivery_attempted',
  'rescheduled',
  'delivered',
  'failed',
] as const;

export const shipmentIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const orderIdParamSchema = z.object({
  params: z.object({ orderId: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const listShipmentsSchema = z.object({
  query: z.object({
    deliveryPartnerId: z.coerce.bigint().optional(),
    status: z.enum(SHIPMENT_STATUSES).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const createShipmentSchema = z.object({
  body: z.object({
    orderId: z.coerce.bigint(),
    carrierName: z.string().trim().max(100).optional(),
    recipientName: z.string().trim().max(150).optional(),
    recipientPhone: z.string().trim().max(20).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const assignShipmentSchema = z.object({
  body: z.object({ deliveryPartnerId: z.coerce.bigint() }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const updateShipmentStatusSchema = z.object({
  body: z.object({
    status: z.enum(SHIPMENT_STATUSES),
    notes: z.string().trim().max(500).optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const rescheduleShipmentSchema = z.object({
  body: z.object({
    newDeliveryDate: z.coerce.date(),
    reason: z.string().trim().min(3).max(500),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const sendDeliveryOtpSchema = z.object({
  body: z.object({
    recipientName: z.string().trim().max(150).optional(),
    /** Email or phone — phone numbers are sent via WhatsApp (see otp.service.ts/whatsapp.service.ts); both throw a clear error if their channel's credentials aren't configured in .env, rather than a silent fake "sent". */
    identifier: z.string().trim().min(3).max(190),
    /** Set only when the recipient is not the school's registered contact — requires the endpoint to be called by a Super Admin. */
    alternateRecipientApprovedBy: z.coerce.bigint().optional(),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const verifyDeliveryOtpSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(190),
    otp: z.string().trim().min(4).max(10),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
