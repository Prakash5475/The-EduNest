import { logger } from '@/config/logger';
import type { WhatsappProvider, WhatsappTemplateMessage, WhatsappSendResult } from '../whatsapp.types';

/**
 * Active whenever WHATSAPP_PROVIDER=none (the default). Never claims a message
 * was delivered — it logs the attempt and returns a clear, honest failure so
 * the delivery ledger accurately reflects that no real channel is wired up
 * yet, instead of fabricating a "sent" status.
 */
export class NoneProvider implements WhatsappProvider {
  readonly name = 'none';

  async sendTemplateMessage(message: WhatsappTemplateMessage): Promise<WhatsappSendResult> {
    logger.warn(
      { to: message.to, templateName: message.templateName },
      'WhatsApp send skipped — WHATSAPP_PROVIDER is not configured (set it to meta_cloud with credentials to enable real delivery)',
    );
    return {
      success: false,
      errorMessage: 'WhatsApp delivery is not configured (WHATSAPP_PROVIDER=none)',
    };
  }
}
