import type { NextFunction, Request, Response } from 'express';
import { whatsappWebhookService } from '@/services/whatsapp/whatsappWebhook.service';
import { logger } from '@/config/logger';

export class WhatsappWebhookController {
  /** Meta's one-time GET verification handshake when the webhook subscription is configured. */
  verify(req: Request, res: Response): void {
    const mode = req.query['hub.mode'] as string | undefined;
    const token = req.query['hub.verify_token'] as string | undefined;
    const challenge = req.query['hub.challenge'] as string | undefined;

    if (whatsappWebhookService.verifyHandshake(mode, token) && challenge) {
      res.status(200).send(challenge);
      return;
    }
    res.sendStatus(403);
  }

  /** Every inbound message / delivery-status callback arrives here — HMAC-verified, not user-authenticated. */
  async receive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.header('x-hub-signature-256');
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));

      if (!whatsappWebhookService.verifySignature(rawBody, signature)) {
        logger.warn({ hasSignatureHeader: !!signature }, 'Rejected WhatsApp webhook — signature validation failed');
        res.sendStatus(403);
        return;
      }

      // Meta requires a fast 200 response — process, but never let a downstream failure
      // turn into a webhook error that would make Meta retry the whole delivery indefinitely.
      res.status(200).json({ received: true });

      try {
        await whatsappWebhookService.handlePayload(req.body);
      } catch (err) {
        logger.error({ err }, 'Error handling WhatsApp webhook payload');
      }
    } catch (err) {
      next(err);
    }
  }
}

export const whatsappWebhookController = new WhatsappWebhookController();
