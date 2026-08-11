import { Router } from 'express';
import { adminWhatsappController } from '@/controllers/adminWhatsapp.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listDeliveryLogsSchema,
  paginationOnlySchema,
  conversationIdParamSchema,
  broadcastSchema,
} from '@/validators/adminWhatsapp.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/whatsapp/delivery-logs:
 *   get:
 *     summary: WhatsApp outbound delivery log — filterable by status, paginated
 *     tags: [Admin WhatsApp]
 */
router.get('/delivery-logs', validate(listDeliveryLogsSchema), adminWhatsappController.listDeliveryLogs);

/**
 * @openapi
 * /admin/whatsapp/conversations:
 *   get:
 *     summary: Every dealer's current WhatsApp conversation state, paginated
 *     tags: [Admin WhatsApp]
 */
router.get('/conversations', validate(paginationOnlySchema), adminWhatsappController.listConversations);

/**
 * @openapi
 * /admin/whatsapp/conversations/{id}/messages:
 *   get:
 *     summary: Full inbound message history for one dealer's conversation
 *     tags: [Admin WhatsApp]
 */
router.get('/conversations/:id/messages', validate(conversationIdParamSchema), adminWhatsappController.getConversationMessages);

/**
 * @openapi
 * /admin/whatsapp/broadcast:
 *   post:
 *     summary: Send a registered WhatsApp template to a set of dealers at once
 *     tags: [Admin WhatsApp]
 */
router.post('/broadcast', validate(broadcastSchema), adminWhatsappController.broadcast);

export default router;
