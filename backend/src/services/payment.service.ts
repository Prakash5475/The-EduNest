import crypto from 'node:crypto';
import { prisma } from '@/config/database';
import { env } from '@/config/env';
import { orderRepository } from '@/repositories/order.repository';
import { paymentRepository } from '@/repositories/payment.repository';
import { schoolRepository } from '@/repositories/school.repository';
import { razorpayService } from '@/services/razorpay.service';
import { uploadedFileRepository } from '@/repositories/uploadedFile.repository';
import { renderInvoicePdf } from '@/helpers/invoicePdf.helper';
import { uploadBufferToCloudinary } from '@/helpers/cloudinaryBufferUpload.helper';
import { notifyUser, notifyUsersWithRole } from '@/helpers/notification.helper';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/config/logger';
import type { School, Prisma } from '@prisma/client';

type AmountType = 'advance' | 'full' | 'balance';

async function generateInvoiceNumber(): Promise<string> {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = crypto.randomInt(100000, 999999);
  return `INV-${datePart}-${randomPart}`;
}

export class PaymentService {
  /**
   * Computes what may legally be charged right now and creates a Razorpay
   * order for it. The amount is ALWAYS computed server-side from
   * order.totalAmount and what's already been paid — the frontend only says
   * which kind of payment it's attempting; it never gets to name a number.
   */
  async initiate(school: School, orderId: bigint, amountType: AmountType) {
    const order = await orderRepository.findById(orderId);
    if (!order || order.schoolId !== school.id) throw ApiError.notFound('Order not found');
    if (order.status === 'cancelled') throw ApiError.badRequest('This order has been cancelled');
    if (order.paymentStatus === 'paid') throw ApiError.badRequest('This order is already fully paid');

    const totalAmount = Number(order.totalAmount);
    const alreadyPaid = await orderRepository.sumSuccessfulPayments(orderId);
    const balanceRemaining = Math.round((totalAmount - alreadyPaid) * 100) / 100;
    const minAdvance = Math.round(((totalAmount * env.ADVANCE_PAYMENT_MIN_PERCENT) / 100) * 100) / 100;

    let amount: number;
    let paymentType: 'advance' | 'balance' | 'full';

    if (alreadyPaid <= 0) {
      // First payment on this order — the 50% advance rule is enforced right here.
      if (amountType === 'full') {
        amount = totalAmount;
        paymentType = 'full';
      } else if (amountType === 'advance') {
        amount = minAdvance;
        paymentType = 'advance';
      } else {
        throw ApiError.badRequest('The first payment on an order must be at least the required advance, or paid in full');
      }
    } else {
      // Advance already paid — only the real remaining balance may be charged.
      if (amountType !== 'balance') {
        throw ApiError.badRequest('An advance has already been paid — only the remaining balance can be charged now');
      }
      if (balanceRemaining <= 0) throw ApiError.badRequest('There is no outstanding balance on this order');
      amount = balanceRemaining;
      paymentType = 'balance';
    }

    const payment = await paymentRepository.create({
      orderId: order.id,
      schoolId: school.id,
      amount,
      paymentType,
      gateway: 'razorpay',
    });

    const razorpayOrder = await razorpayService.createOrder({
      amountInPaise: Math.round(amount * 100),
      currency: 'INR',
      receipt: `payment-${payment.id}`,
      notes: { orderId: order.id.toString(), schoolId: school.id.toString(), paymentType },
    });

    await paymentRepository.updateStatus(payment.id, { gatewayReference: razorpayOrder.id });

    return {
      paymentId: payment.id,
      razorpayOrderId: razorpayOrder.id,
      amount,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      paymentType,
    };
  }

  /** Client-side "checkout succeeded" callback. Always re-verified against Razorpay's HMAC — never trusted at face value. */
  async verify(
    school: School,
    paymentId: bigint,
    input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment || payment.schoolId !== school.id) throw ApiError.notFound('Payment not found');
    if (payment.status === 'success') return this.getOrderAfterPayment(payment.orderId);
    if (payment.gatewayReference !== input.razorpayOrderId) {
      throw ApiError.badRequest('Payment does not match the order that was initiated');
    }

    const valid = razorpayService.verifyPaymentSignature(input);
    if (!valid) {
      await paymentRepository.updateStatus(payment.id, { status: 'failed' });
      await paymentRepository.addTransaction({
        paymentId: payment.id,
        transactionType: 'capture',
        amount: Number(payment.amount),
        status: 'failed',
        gatewayResponse: { reason: 'signature_verification_failed', ...input },
      });
      throw ApiError.badRequest('Payment verification failed');
    }

    return this.finalizeSuccess(payment.id, {
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
      razorpaySignature: input.razorpaySignature,
    });
  }

  /** Shared by the client verify() call and the webhook — idempotent, so whichever arrives first wins. */
  private async finalizeSuccess(paymentId: bigint, gatewayResponse: Prisma.InputJsonObject) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status === 'success') return this.getOrderAfterPayment(payment.orderId);
    if (!payment.orderId) throw ApiError.internal('Payment is not linked to an order');

    await paymentRepository.updateStatus(payment.id, { status: 'success' });
    await paymentRepository.addTransaction({
      paymentId: payment.id,
      transactionType: 'capture',
      amount: Number(payment.amount),
      status: 'success',
      gatewayResponse,
    });

    const order = await orderRepository.findById(payment.orderId);
    if (!order) throw ApiError.internal('Order not found for payment');

    const totalPaid = await orderRepository.sumSuccessfulPayments(order.id);
    const isFullyPaid = totalPaid >= Number(order.totalAmount) - 0.01;

    await orderRepository.update(order.id, {
      paymentStatus: isFullyPaid ? 'paid' : 'partially_paid',
      ...(order.status === 'pending' ? { status: 'confirmed' } : {}),
    });
    await orderRepository.addStatusHistory(
      order.id,
      order.status === 'pending' ? 'confirmed' : order.status,
      undefined,
      `Payment of ${payment.amount} (${payment.paymentType}) confirmed`,
    );

    await this.generateInvoice(order.id, payment.paymentType, isFullyPaid);

    const school = await schoolRepository.findById(payment.schoolId);
    if (school) {
      await notifyUser({
        userId: school.userId,
        type: 'payment_success',
        title: 'Payment received',
        message: `Your ${payment.paymentType} payment of ₹${payment.amount} for order ${order.orderNumber} was successful`,
        referenceType: 'payment',
        referenceId: payment.id,
      });
    }
    await notifyUsersWithRole(['super_admin', 'staff'], {
      type: 'payment_received',
      title: 'Payment received',
      message: `Payment of ₹${payment.amount} received for order ${order.orderNumber}`,
      referenceType: 'payment',
      referenceId: payment.id,
    });

    return this.getOrderAfterPayment(order.id);
  }

  private async getOrderAfterPayment(orderId: bigint | null) {
    if (!orderId) return null;
    return orderRepository.findById(orderId);
  }

  /**
   * Handbook distinction: an Advance Receipt is issued immediately on the
   * first (advance or full) payment; the Final GST Invoice is issued once
   * the order is fully settled. PDF rendering isn't wired up yet — this
   * records the real invoice data (amounts, GST split per line from the
   * actual OrderItems) with fileId left null until the PDF-generation phase.
   */
  private async generateInvoice(orderId: bigint, paymentType: AmountType | 'refund', isFullyPaid: boolean) {
    // A refund never lands here — finalizeSuccess only runs for captured payments — but
    // Payment.paymentType is typed as the full PaymentPaymentType enum, so guard anyway
    // rather than narrowing incorrectly and re-introducing the type error.
    if (paymentType === 'refund') return;

    const order = await orderRepository.findById(orderId);
    if (!order) return;

    const invoiceType = isFullyPaid ? 'final_invoice' : 'advance_receipt';

    // Don't double-issue the same invoice type for the same order.
    const existing = order.invoices.find((inv) => inv.invoiceType === invoiceType);
    if (existing) return existing;

    const invoiceNumber = await generateInvoiceNumber();
    const lineItems = order.orderItems.map((item) => ({
      orderItemId: item.id,
      description: item.itemNameSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate:
        Number(item.unitPrice) > 0 ? Math.round((Number(item.taxAmount) / Number(item.unitPrice) / item.quantity) * 10000) / 100 : 0,
      lineTotal: item.lineTotal,
    }));

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        schoolId: order.schoolId,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        totalAmount: order.totalAmount,
        invoiceType,
        status: isFullyPaid ? 'paid' : 'issued',
        invoiceItems: { createMany: { data: lineItems } },
      },
    });

    // Render the invoice/receipt to a real PDF and attach it via UploadedFile.fileId.
    // Best-effort: a PDF render/upload failure must never roll back the invoice record itself,
    // since the invoice data (amounts, line items) is the source of truth — the PDF is a rendering of it.
    try {
      const pdfBuffer = await renderInvoicePdf({
        invoiceNumber,
        invoiceType,
        issuedAt: invoice.issuedAt,
        orderNumber: order.orderNumber,
        schoolName: order.school.schoolName,
        schoolGstin: order.school.gstin,
        billingAddress: order.schoolAddress
          ? {
              addressLine1: order.schoolAddress.addressLine1,
              addressLine2: order.schoolAddress.addressLine2,
              city: order.schoolAddress.city,
              state: order.schoolAddress.state,
              pincode: order.schoolAddress.pincode,
            }
          : null,
        items: lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: Number(li.unitPrice),
          taxRate: li.taxRate,
          lineTotal: Number(li.lineTotal),
        })),
        subtotal: Number(order.subtotal),
        taxAmount: Number(order.taxAmount),
        totalAmount: Number(order.totalAmount),
      });

      const uploaded = await uploadBufferToCloudinary(pdfBuffer, {
        folder: 'invoices',
        publicId: invoiceNumber,
        format: 'pdf',
      });

      const uploadedFile = await uploadedFileRepository.create({
        fileName: `${invoiceNumber}.pdf`,
        filePath: uploaded.url,
        mimeType: 'application/pdf',
        fileSizeBytes: BigInt(uploaded.bytes),
        storageProvider: 'cloudinary',
      });

      await prisma.invoice.update({ where: { id: invoice.id }, data: { fileId: uploadedFile.id } });
    } catch (err) {
      logger.error({ err, invoiceId: invoice.id.toString() }, 'Invoice PDF generation/upload failed — invoice record kept without file');
    }

    logger.info({ orderId: order.id.toString(), invoiceType, paymentType }, 'Invoice generated');
    return invoice;
  }

  /**
   * Admin-initiated refund. Calls Razorpay's refund API for the payment's
   * original capture; the actual Refund record is created when Razorpay's
   * `refund.processed` webhook lands (see handleWebhook below) — this call
   * only *requests* the refund, it doesn't fabricate a completed state.
   */
  async refund(paymentId: bigint, amount?: number) {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) throw ApiError.notFound('Payment not found');
    if (payment.status !== 'success') {
      throw ApiError.badRequest('Only successfully captured payments can be refunded');
    }

    const captureTxn = [...payment.paymentTransactions]
      .reverse()
      .find((t) => t.transactionType === 'capture' && t.status === 'success');
    const razorpayPaymentId = (captureTxn?.gatewayResponse as Record<string, unknown> | null)?.razorpayPaymentId as
      | string
      | undefined;
    if (!razorpayPaymentId) {
      throw ApiError.internal('No captured Razorpay payment reference found for this payment');
    }

    const refundAmount = amount ?? Number(payment.amount);
    if (refundAmount <= 0 || refundAmount > Number(payment.amount)) {
      throw ApiError.badRequest('Refund amount must be greater than zero and not exceed the original payment');
    }

    const razorpayRefund = await razorpayService.createRefund(razorpayPaymentId, Math.round(refundAmount * 100));

    await paymentRepository.addTransaction({
      paymentId: payment.id,
      transactionType: 'refund',
      amount: refundAmount,
      status: 'pending',
      gatewayResponse: { razorpayRefundId: razorpayRefund.id, source: 'admin_request' },
    });

    return { requested: true, razorpayRefundId: razorpayRefund.id, amount: refundAmount };
  }

  async listHistory(school: School, page?: number, limit?: number) {
    const { normalizePagination, buildPaginationMeta } = await import('@/helpers/pagination.helper');
    const { page: p, limit: l, skip, take } = normalizePagination(page, limit);
    const { items, total } = await paymentRepository.listBySchool(school.id, skip, take);
    return { items, meta: buildPaginationMeta(p, l, total) };
  }

  /** Handles Razorpay webhook events — the authoritative confirmation path (never trust the frontend alone). */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const valid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!valid) throw ApiError.badRequest('Invalid webhook signature');

    const payload = JSON.parse(rawBody.toString('utf8')) as {
      event: string;
      payload: {
        payment?: { entity: { id: string; order_id: string; amount: number } };
        refund?: { entity: { id: string; payment_id: string; amount: number } };
      };
    };

    switch (payload.event) {
      case 'payment.captured':
      case 'order.paid': {
        const entity = payload.payload.payment?.entity;
        if (!entity) break;
        const payment = await paymentRepository.findByGatewayReference(entity.order_id);
        if (!payment) {
          logger.warn({ razorpayOrderId: entity.order_id }, 'Webhook payment.captured for unknown payment');
          break;
        }
        await this.finalizeSuccess(payment.id, {
          razorpayOrderId: entity.order_id,
          razorpayPaymentId: entity.id,
          source: 'webhook',
        });
        break;
      }
      case 'payment.failed': {
        const entity = payload.payload.payment?.entity;
        if (!entity) break;
        const payment = await paymentRepository.findByGatewayReference(entity.order_id);
        if (!payment || payment.status === 'success') break;
        await paymentRepository.updateStatus(payment.id, { status: 'failed' });
        await paymentRepository.addTransaction({
          paymentId: payment.id,
          transactionType: 'capture',
          amount: Number(payment.amount),
          status: 'failed',
          gatewayResponse: { razorpayPaymentId: entity.id, source: 'webhook' },
        });
        {
          const school = await schoolRepository.findById(payment.schoolId);
          if (school) {
            await notifyUser({
              userId: school.userId,
              type: 'payment_failed',
              title: 'Payment failed',
              message: `Your payment of ₹${payment.amount} could not be processed`,
              referenceType: 'payment',
              referenceId: payment.id,
            });
          }
        }
        break;
      }
      case 'refund.processed': {
        const entity = payload.payload.refund?.entity;
        if (!entity) break;
        const transaction = await prisma.paymentTransaction.findFirst({
          where: { gatewayResponse: { path: '$.razorpayPaymentId', equals: entity.payment_id } },
        });
        if (!transaction) {
          logger.warn({ razorpayPaymentId: entity.payment_id }, 'Webhook refund.processed for unknown payment');
          break;
        }
        const payment = await paymentRepository.findById(transaction.paymentId);
        if (!payment?.orderId) break;
        await prisma.refund.create({
          data: {
            orderId: payment.orderId,
            amount: entity.amount / 100,
            refundMethod: 'original_payment',
            status: 'completed',
            processedAt: new Date(),
          },
        });
        await paymentRepository.addTransaction({
          paymentId: payment.id,
          transactionType: 'refund',
          amount: entity.amount / 100,
          status: 'success',
          gatewayResponse: { razorpayRefundId: entity.id, source: 'webhook' },
        });
        {
          const school = await schoolRepository.findById(payment.schoolId);
          if (school) {
            await notifyUser({
              userId: school.userId,
              type: 'refund_processed',
              title: 'Refund processed',
              message: `A refund of ₹${entity.amount / 100} has been processed to your original payment method`,
              referenceType: 'payment',
              referenceId: payment.id,
            });
          }
        }
        break;
      }
      default:
        logger.info({ event: payload.event }, 'Unhandled Razorpay webhook event');
    }
  }
}

export const paymentService = new PaymentService();
