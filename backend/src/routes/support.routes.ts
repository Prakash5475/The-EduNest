import { Router } from 'express';
import { supportController } from '@/controllers/support.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  createTicketSchema,
  listTicketsSchema,
  ticketIdParamSchema,
  replySchema,
  assignTicketSchema,
  updateTicketStatusSchema,
  updateTicketPrioritySchema,
} from '@/validators/support.validators';

const router = Router();
const staffOnly = requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF);
router.use(authenticate);

/**
 * @openapi
 * /support/tickets:
 *   get:
 *     summary: List the current user's own support tickets
 *     tags: [Support]
 */
router.get('/tickets', validate(listTicketsSchema), supportController.listMine);

/**
 * @openapi
 * /support/tickets/admin:
 *   get:
 *     summary: List every support ticket across schools/dealers (admin/staff)
 *     tags: [Support]
 */
router.get('/tickets/admin', staffOnly, validate(listTicketsSchema), supportController.listForAdmin);

/**
 * @openapi
 * /support/tickets:
 *   post:
 *     summary: Raise a new support ticket (school or dealer), optionally with file attachments
 *     tags: [Support]
 */
router.post('/tickets', validate(createTicketSchema), supportController.create);

/**
 * @openapi
 * /support/tickets/{id}:
 *   get:
 *     summary: Get a ticket with its full reply history (owner, assignee, or admin/staff)
 *     tags: [Support]
 */
router.get('/tickets/:id', validate(ticketIdParamSchema), supportController.getById);

/**
 * @openapi
 * /support/tickets/{id}/replies:
 *   post:
 *     summary: Add a reply — internal notes are staff-only and never shown to the ticket raiser
 *     tags: [Support]
 */
router.post('/tickets/:id/replies', validate(replySchema), supportController.reply);

/**
 * @openapi
 * /support/tickets/{id}/assign:
 *   post:
 *     summary: Assign a ticket to a staff member (admin/staff)
 *     tags: [Support]
 */
router.post('/tickets/:id/assign', staffOnly, validate(assignTicketSchema), supportController.assign);

/**
 * @openapi
 * /support/tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status (admin/staff)
 *     tags: [Support]
 */
router.patch('/tickets/:id/status', staffOnly, validate(updateTicketStatusSchema), supportController.updateStatus);

/**
 * @openapi
 * /support/tickets/{id}/priority:
 *   patch:
 *     summary: Update ticket priority (admin/staff)
 *     tags: [Support]
 */
router.patch('/tickets/:id/priority', staffOnly, validate(updateTicketPrioritySchema), supportController.updatePriority);

export default router;
