import { env } from '@/config/env';

/**
 * Registry of WhatsApp template names this app sends. Template names/bodies
 * must be pre-registered and approved in Meta Business Manager (or the
 * equivalent for whichever BSP is configured) before they'll actually send —
 * this registry is the single source of truth for which `notifType` maps to
 * which template, so a new business event only needs one line added here.
 */
export interface WhatsappTemplateDef {
  templateName: string;
  /** Builds the ordered template body parameters from event-specific data. */
  buildParams: (data: Record<string, string>) => string[];
  deepLinkPath: (data: Record<string, string>) => string;
  /** Critical events bypass the user's notification-channel preferences. */
  critical?: boolean;
}

export const WHATSAPP_TEMPLATES: Record<string, WhatsappTemplateDef> = {
  order_status_updated: {
    templateName: 'edunest_order_status_update',
    buildParams: (d) => [d.orderNumber, d.status],
    deepLinkPath: (d) => `/portal/orders/${d.orderId}`,
  },
  order_confirmed: {
    templateName: 'edunest_order_confirmed',
    buildParams: (d) => [d.orderNumber],
    deepLinkPath: (d) => `/portal/orders/${d.orderId}`,
    critical: true,
  },
  dealer_assigned: {
    templateName: 'edunest_dealer_assigned',
    buildParams: (d) => [d.orderNumber, d.dealerName],
    deepLinkPath: (d) => `/portal/orders/${d.orderId}`,
  },
  order_dispatched: {
    templateName: 'edunest_order_dispatched',
    buildParams: (d) => [d.orderNumber],
    deepLinkPath: (d) => `/portal/orders/${d.orderId}`,
    critical: true,
  },
  order_delivered: {
    templateName: 'edunest_order_delivered',
    buildParams: (d) => [d.orderNumber],
    deepLinkPath: (d) => `/portal/orders/${d.orderId}`,
  },
  quotation_created: {
    templateName: 'edunest_quotation_created',
    buildParams: (d) => [d.requestNumber],
    deepLinkPath: (d) => `/request-quotation/${d.requestId}`,
  },
  quotation_accepted: {
    templateName: 'edunest_quotation_accepted',
    buildParams: (d) => [d.requestNumber],
    deepLinkPath: () => `/portal/orders`,
    critical: true,
  },
  quotation_rejected: {
    templateName: 'edunest_quotation_rejected',
    buildParams: (d) => [d.requestNumber],
    deepLinkPath: () => `/request-quotation`,
  },
  rfq_received: {
    templateName: 'edunest_rfq_received',
    buildParams: (d) => [d.requestNumber],
    deepLinkPath: () => `/dealer/quotations`,
    critical: true,
  },
  payment_received: {
    templateName: 'edunest_payment_received',
    buildParams: (d) => [d.orderNumber, d.amount],
    deepLinkPath: (d) => `/portal/orders/${d.orderId}`,
    critical: true,
  },
  support_reply: {
    templateName: 'edunest_support_reply',
    buildParams: (d) => [d.ticketNumber],
    deepLinkPath: () => `/portal/support`,
  },
  school_registered: {
    templateName: 'edunest_admin_new_school',
    buildParams: (d) => [d.schoolName],
    deepLinkPath: () => `/admin/schools`,
  },
  dealer_registered: {
    templateName: 'edunest_admin_new_dealer',
    buildParams: (d) => [d.dealerName],
    deepLinkPath: () => `/admin/dealers`,
  },
  dealer_work_order: {
    templateName: 'edunest_dealer_work_order',
    buildParams: (d) => [d.orderNumber, d.itemSummary],
    deepLinkPath: () => `/admin/orders`,
    critical: true,
  },
  production_milestone_dealer: {
    templateName: 'edunest_dealer_production_milestone',
    buildParams: (d) => [d.orderNumber, d.stage],
    deepLinkPath: () => `/admin/orders`,
  },
  dispatch_request_dealer: {
    templateName: 'edunest_dealer_dispatch_request',
    buildParams: (d) => [d.orderNumber],
    deepLinkPath: () => `/admin/orders`,
    critical: true,
  },
  delivery_confirmation_request_dealer: {
    templateName: 'edunest_dealer_delivery_confirmation',
    buildParams: (d) => [d.orderNumber],
    deepLinkPath: () => `/admin/orders`,
  },
};

export function buildDeepLink(path: string): string {
  return `${env.CLIENT_URL}${path}`;
}
