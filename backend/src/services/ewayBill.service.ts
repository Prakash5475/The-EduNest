import { ewayBillRepository } from '@/repositories/ewayBill.repository';
import { orderRepository } from '@/repositories/order.repository';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiError } from '@/utils/ApiError';
import type { EwayBillStatus, EwayBillTransportMode } from '@prisma/client';

interface CreateInput {
  orderId: bigint;
  invoiceId?: bigint;
  transporterName?: string;
  transporterGstin?: string;
  transportMode?: EwayBillTransportMode;
  vehicleNumber?: string;
  distanceKm?: number;
}

/**
 * Record-keeping only. Nothing here calls the government e-way bill / IRP portal — there is
 * no such integration anywhere in this codebase. An admin generates the e-way bill on the
 * government portal themselves and pastes the resulting number into `markGenerated()`. This
 * class exists to track that a bill was made, its transporter/vehicle details, and its
 * validity window — not to produce a government-recognized number itself.
 */
export class EwayBillService {
  async create(input: CreateInput, createdBy: bigint) {
    const order = await orderRepository.findById(input.orderId);
    if (!order) throw ApiError.notFound('Order not found');

    return ewayBillRepository.create({
      order: { connect: { id: input.orderId } },
      ...(input.invoiceId ? { invoice: { connect: { id: input.invoiceId } } } : {}),
      transporterName: input.transporterName,
      transporterGstin: input.transporterGstin,
      transportMode: input.transportMode ?? 'road',
      vehicleNumber: input.vehicleNumber,
      distanceKm: input.distanceKm,
      status: 'draft',
      creator: { connect: { id: createdBy } },
    });
  }

  async getById(id: bigint) {
    const bill = await ewayBillRepository.findById(id);
    if (!bill) throw ApiError.notFound('E-way bill not found');
    return bill;
  }

  async getByOrderId(orderId: bigint) {
    const bill = await ewayBillRepository.findByOrderId(orderId);
    if (!bill) throw ApiError.notFound('No e-way bill exists for this order yet');
    return bill;
  }

  list(filters: { status?: EwayBillStatus; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    return ewayBillRepository.list({ status: filters.status, skip, take }).then(({ items, total }) => ({
      items,
      meta: buildPaginationMeta(page, limit, total),
    }));
  }

  /**
   * Record a number generated on the government portal by hand. Deliberately requires the
   * caller to supply the number — this function does not and cannot produce one itself.
   */
  async markGenerated(id: bigint, ewayBillNumber: string, validFrom: Date, validUntil: Date) {
    const bill = await ewayBillRepository.findById(id);
    if (!bill) throw ApiError.notFound('E-way bill not found');
    if (!ewayBillNumber.trim()) {
      throw ApiError.badRequest('An e-way bill number is required — generate it on the government portal first, then record it here');
    }
    return ewayBillRepository.update(id, { ewayBillNumber: ewayBillNumber.trim(), status: 'generated', validFrom, validUntil });
  }

  async cancel(id: bigint) {
    const bill = await ewayBillRepository.findById(id);
    if (!bill) throw ApiError.notFound('E-way bill not found');
    return ewayBillRepository.update(id, { status: 'cancelled' });
  }
}

export const ewayBillService = new EwayBillService();
