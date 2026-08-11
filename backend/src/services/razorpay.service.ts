import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

let client: Razorpay | null = null;

/** Lazily constructed so the app can boot (e.g. in tests) without Razorpay credentials set. */
function getClient(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured — set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET');
  }
  if (!client) {
    client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
  return client;
}

export class RazorpayService {
  /** Amount must be in the smallest currency unit (paise for INR). */
  async createOrder(params: { amountInPaise: number; currency: string; receipt: string; notes?: Record<string, string> }) {
    const rzp = getClient();
    return rzp.orders.create({
      amount: params.amountInPaise,
      currency: params.currency,
      receipt: params.receipt,
      notes: params.notes,
    });
  }

  /** HMAC-SHA256 of `${razorpayOrderId}|${razorpayPaymentId}` using the key secret — per Razorpay's documented checkout verification scheme. */
  verifyPaymentSignature(params: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }): boolean {
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
      .digest('hex');
    return timingSafeEqualHex(expected, params.razorpaySignature);
  }

  /** Webhook payloads are signed with the separate webhook secret over the raw request body. */
  verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
    const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
    return timingSafeEqualHex(expected, signature);
  }

  async createRefund(razorpayPaymentId: string, amountInPaise?: number) {
    const rzp = getClient();
    // The Razorpay SDK requires the params object itself; `amount` inside it is optional
    // and omitting it triggers a full refund of the payment.
    return rzp.payments.refund(razorpayPaymentId, amountInPaise ? { amount: amountInPaise } : {});
  }

  async fetchPayment(razorpayPaymentId: string) {
    const rzp = getClient();
    return rzp.payments.fetch(razorpayPaymentId);
  }
}

function timingSafeEqualHex(expectedHex: string, actualHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, 'hex');
    const b = Buffer.from(actualHex, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    logger.warn({ err }, 'Razorpay signature comparison failed to parse hex');
    return false;
  }
}

export const razorpayService = new RazorpayService();
