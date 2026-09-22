import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1),
    category: z.enum(['order', 'payment', 'product', 'account', 'technical', 'other']),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    fileIds: z.array(z.coerce.bigint()).default([]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const listTicketsSchema = z.object({
  query: z.object({
    status: z.enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    assignedTo: z.coerce.bigint().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const ticketIdParamSchema = z.object({
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const replySchema = z.object({
  body: z.object({
    message: z.string().trim().min(1),
    isInternalNote: z.coerce.boolean().default(false),
  }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const assignTicketSchema = z.object({
  body: z.object({ assignedTo: z.coerce.bigint() }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const updateTicketStatusSchema = z.object({
  body: z.object({ status: z.enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed']) }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const updateTicketPrioritySchema = z.object({
  body: z.object({ priority: z.enum(['low', 'medium', 'high', 'urgent']) }),
  params: z.object({ id: z.coerce.bigint() }),
  query: z.object({}).optional(),
});
