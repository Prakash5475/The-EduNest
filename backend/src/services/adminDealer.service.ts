import { dealerRepository } from '@/repositories/dealer.repository';
import { userRepository } from '@/repositories/user.repository';
import { notifyUser } from '@/helpers/notification.helper';
import { hashPassword } from '@/helpers/password.helper';
import { generateDealerCode } from '@/helpers/accountCode.helper';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/config/logger';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { DealerBusinessType, DealerStatus } from '@prisma/client';

export class AdminDealerService {
  async list(filters: { status?: DealerStatus; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const status = filters.status === 'inactive'
      ? ['inactive', 'pending_approval', 'blocked'] as DealerStatus[]
      : filters.status;
    const { items, total } = await dealerRepository.list({ status, search: filters.search, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: bigint) {
    const dealer = await dealerRepository.findByIdWithDetail(id);
    if (!dealer) throw ApiError.notFound('Dealer not found');
    return dealer;
  }

  /** Approve/block/activate/deactivate a dealer account. Notifies the dealer's own user of the change. */
  async updateStatus(id: bigint, status: DealerStatus, reason?: string) {
    const existing = await dealerRepository.findById(id);
    if (!existing) throw ApiError.notFound('Dealer not found');

    await dealerRepository.update(id, { status });

    try {
      await notifyUser({
        userId: existing.userId,
        type: 'dealer_status_changed',
        title: `Your account is now ${status.replace(/_/g, ' ')}`,
        message: reason ?? `Your dealer account status was updated to ${status.replace(/_/g, ' ')}`,
        referenceType: 'dealer',
        referenceId: existing.id,
      });
    } catch (err) {
      logger.error({ err, dealerId: id.toString() }, 'Dealer status notification failed');
    }

    return this.getById(id);
  }

  async updateDealer(id: bigint, input: {
    fullName?: string; email?: string; phone?: string; businessName?: string;
    businessType?: DealerBusinessType; gstin?: string | null; panNumber?: string | null; creditLimit?: number;
  }) {
    const dealer = await dealerRepository.findById(id);
    if (!dealer) throw ApiError.notFound('Dealer not found');
    const { fullName, email, phone, businessName, businessType, gstin, panNumber, creditLimit } = input;
    await dealerRepository.update(id, {
      ...(businessName !== undefined ? { businessName } : {}),
      ...(businessType !== undefined ? { businessType } : {}),
      ...(gstin !== undefined ? { gstin } : {}),
      ...(panNumber !== undefined ? { panNumber } : {}),
      ...(creditLimit !== undefined ? { creditLimit } : {}),
    });
    if (fullName !== undefined || email !== undefined || phone !== undefined) {
      await userRepository.update(dealer.userId, {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
      });
    }
    return this.getById(id);
  }

  /** Create a new dealer account (user + dealer record) */
  async createDealer(input: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    businessName: string;
    dealerCode?: string;
    businessType?: DealerBusinessType;
    gstin?: string;
    panNumber?: string;
    creditLimit?: number;
    status?: DealerStatus;
  }) {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) throw ApiError.conflict('User with this email already exists');

    // Default initial password is the dealer's own phone number (never a fixed shared
    // string) — hashed exactly like every other password, never stored in plain text.
    const pwd = input.password ?? input.phone;
    const passwordHash = await hashPassword(pwd);

    const user = await userRepository.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      userType: 'dealer',
      status: 'active',
      failedLoginCount: 0,
    });

    const code = input.dealerCode || (await generateDealerCode());

    const dealer = await dealerRepository.create({
      user: { connect: { id: user.id } },
      businessName: input.businessName,
      dealerCode: code,
      businessType: input.businessType ?? 'distributor',
      gstin: input.gstin || null,
      panNumber: input.panNumber || null,
      commissionRate: 0,
      averageRating: 4.5,
      status: input.status ?? 'active',
    });

    return dealer;
  }
}

export const adminDealerService = new AdminDealerService();
