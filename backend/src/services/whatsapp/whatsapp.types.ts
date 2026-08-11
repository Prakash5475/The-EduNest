/**
 * Every WhatsApp send goes through this interface. Business logic (and the
 * BullMQ worker) never talks to a specific vendor SDK directly — swapping
 * providers (Meta Cloud API, Gupshup, 360dialog, ...) means implementing this
 * interface and pointing WHATSAPP_PROVIDER at it in whatsapp.provider.ts.
 */
export interface WhatsappTemplateMessage {
  /** E.164 phone number, e.g. "+919876543210". */
  to: string;
  /** Name of the pre-approved WhatsApp template registered with the provider. */
  templateName: string;
  /** Ordered template variable substitutions, e.g. ["EN-1021", "Printing"]. */
  templateParams: string[];
  /** Language code for the template, e.g. "en" or "en_US". */
  languageCode?: string;
}

export interface WhatsappSendResult {
  success: boolean;
  providerMessageId?: string;
  providerResponse?: unknown;
  errorMessage?: string;
}

export interface WhatsappProvider {
  readonly name: string;
  sendTemplateMessage(message: WhatsappTemplateMessage): Promise<WhatsappSendResult>;
}
