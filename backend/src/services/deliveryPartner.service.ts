import { deliveryPartnerRepository } from '@/repositories/deliveryPartner.repository';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiError } from '@/utils/ApiError';
import type { DeliveryPartnerStatus, DeliveryPartnerAvailabilityStatus } from '@prisma/client';

interface UpsertInput {
  fullName: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  joiningDate?: Date;
  notes?: string;
}

export class DeliveryPartnerService {
  async create(input: UpsertInput) {
    const existing = await deliveryPartnerRepository.findByMobile(input.mobile);
    if (existing) throw ApiError.conflict('A delivery partner with this mobile number already exists');
    return deliveryPartnerRepository.create(input);
  }

  async update(id: bigint, input: Partial<UpsertInput>) {
    const partner = await deliveryPartnerRepository.findById(id);
    if (!partner) throw ApiError.notFound('Delivery partner not found');
    if (input.mobile && input.mobile !== partner.mobile) {
      const clash = await deliveryPartnerRepository.findByMobile(input.mobile);
      if (clash) throw ApiError.conflict('A delivery partner with this mobile number already exists');
    }
    return deliveryPartnerRepository.update(id, input);
  }

  async setStatus(id: bigint, status: DeliveryPartnerStatus) {
    const partner = await deliveryPartnerRepository.findById(id);
    if (!partner) throw ApiError.notFound('Delivery partner not found');
    return deliveryPartnerRepository.update(id, { status });
  }

  async setAvailability(id: bigint, availabilityStatus: DeliveryPartnerAvailabilityStatus) {
    const partner = await deliveryPartnerRepository.findById(id);
    if (!partner) throw ApiError.notFound('Delivery partner not found');
    return deliveryPartnerRepository.update(id, { availabilityStatus });
  }

  async getById(id: bigint) {
    const partner = await deliveryPartnerRepository.findById(id);
    if (!partner) throw ApiError.notFound('Delivery partner not found');
    const activeAssignments = await deliveryPartnerRepository.countActiveAssignments(id);
    return { ...partner, activeAssignments };
  }

  async list(filters: { status?: DeliveryPartnerStatus; availabilityStatus?: DeliveryPartnerAvailabilityStatus; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await deliveryPartnerRepository.list({ ...filters, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async remove(id: bigint) {
    const partner = await deliveryPartnerRepository.findById(id);
    if (!partner) throw ApiError.notFound('Delivery partner not found');
    const active = await deliveryPartnerRepository.countActiveAssignments(id);
    if (active > 0) {
      throw ApiError.badRequest('This partner has active (undelivered) assignments — reassign them before deactivating');
    }
    return deliveryPartnerRepository.softDelete(id);
  }
}

export const deliveryPartnerService = new DeliveryPartnerService();
