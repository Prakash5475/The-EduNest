import { env } from '@/config/env';
import { logger } from '@/config/logger';
import type { WhatsappProvider, WhatsappTemplateMessage, WhatsappSendResult } from '../whatsapp.types';

/**
 * Official Meta WhatsApp Cloud API (Graph API) — https://developers.facebook.com/docs/whatsapp/cloud-api
 * Sends pre-approved template messages only (Meta requires templates to be
 * submitted and approved in the Business Manager before they can be sent to
 * users outside a 24h session window, which covers essentially every
 * notification this app sends).
 */
export class MetaCloudProvider implements WhatsappProvider {
  readonly name = 'meta_cloud';

  async sendTemplateMessage(message: WhatsappTemplateMessage): Promise<WhatsappSendResult> {
    if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
      return { success: false, errorMessage: 'WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID are not set' };
    }

    const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const to = message.to.replace(/^\+/, ''); // Graph API expects digits only, no leading '+'

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: message.templateName,
        language: { code: message.languageCode ?? 'en' },
        components:
          message.templateParams.length > 0
            ? [{ type: 'body', parameters: message.templateParams.map((text) => ({ type: 'text', text })) }]
            : undefined,
      },
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const body = (await res.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message: string; code: number; error_data?: unknown };
      };

      if (!res.ok || body.error) {
        return {
          success: false,
          providerResponse: body,
          errorMessage: body.error?.message ?? `WhatsApp API responded with status ${res.status}`,
        };
      }

      return {
        success: true,
        providerMessageId: body.messages?.[0]?.id,
        providerResponse: body,
      };
    } catch (err) {
      logger.error({ err, to: message.to }, 'WhatsApp Cloud API request failed');
      return { success: false, errorMessage: err instanceof Error ? err.message : 'Unknown network error' };
    }
  }
}
