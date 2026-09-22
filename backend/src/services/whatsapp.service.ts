import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { ApiError } from '@/utils/ApiError';

function isConfigured(): boolean {
  return Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
}

/**
 * Sends a WhatsApp message via Meta's WhatsApp Cloud API. Requires a real Meta Business
 * account, phone number ID, and access token in `.env` — there is no mock/fake path: if the
 * credentials are missing, this throws immediately rather than silently succeeding, so a
 * missing integration is never mistaken for a delivered message.
 *
 * `templateName`/`templateParams` use Meta's template message format (required for any
 * message sent outside a customer-initiated 24-hour session window — e.g. OTPs, order
 * confirmations). For free-form text within an active session window, use `sendWhatsAppText`.
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  templateParams: string[] = [],
): Promise<void> {
  if (!isConfigured()) {
    throw ApiError.internal(
      'WhatsApp is not configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env to enable it.',
    );
  }

  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: to.replace(/[^\d+]/g, ''),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(templateParams.length
        ? { components: [{ type: 'body', parameters: templateParams.map((text) => ({ type: 'text', text })) }] }
        : {}),
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    logger.error({ status: response.status, errorBody, to, templateName }, 'WhatsApp message send failed');
    throw ApiError.internal(`WhatsApp message failed to send (status ${response.status}). Check WHATSAPP_ACCESS_TOKEN and the template name/approval status.`);
  }
}

/** Free-form text — only deliverable within Meta's 24-hour customer-initiated session window. */
export async function sendWhatsAppText(to: string, text: string): Promise<void> {
  if (!isConfigured()) {
    throw ApiError.internal(
      'WhatsApp is not configured — set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env to enable it.',
    );
  }

  const url = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/[^\d+]/g, ''),
      type: 'text',
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    logger.error({ status: response.status, errorBody, to }, 'WhatsApp text message send failed');
    throw ApiError.internal(`WhatsApp message failed to send (status ${response.status}).`);
  }
}

export const whatsappService = { sendWhatsAppTemplate, sendWhatsAppText, isConfigured };
