import { Router } from 'express';
import { whatsappWebhookController } from '@/controllers/whatsappWebhook.controller';

const router = Router();

/**
 * @openapi
 * /webhooks/whatsapp:
 *   get:
 *     summary: Meta WhatsApp Cloud API webhook verification handshake (hub.mode/hub.verify_token/hub.challenge). Not authenticated — Meta calls this directly.
 *     tags: [WhatsApp Webhook]
 */
router.get('/', whatsappWebhookController.verify);

/**
 * @openapi
 * /webhooks/whatsapp:
 *   post:
 *     summary: Meta WhatsApp Cloud API inbound webhook — messages and delivery-status callbacks. HMAC-verified (X-Hub-Signature-256), not user-authenticated.
 *     tags: [WhatsApp Webhook]
 */
router.post('/', (req, res, next) => whatsappWebhookController.receive(req, res, next));

export default router;
