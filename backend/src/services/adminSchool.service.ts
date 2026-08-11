import { schoolRepository } from '@/repositories/school.repository';
import { notifyUser } from '@/helpers/notification.helper';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { SchoolStatus } from '@prisma/client';

export class AdminSchoolService {
  async list(filters: { status?: SchoolStatus; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await schoolRepository.list({ status: filters.status, search: filters.search, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: bigint) {
    const school = await schoolRepository.findByIdWithProfile(id);
    if (!school) throw ApiError.notFound('School not found');
    return school;
  }

  /** Approve/block/activate/deactivate a school account. Notifies the school's own user of the change. */
  async updateStatus(id: bigint, status: SchoolStatus, reason?: string) {
    const existing = await schoolRepository.findById(id);
    if (!existing) throw ApiError.notFound('School not found');

    const school = await schoolRepository.update(id, { status });

    await notifyUser({
      userId: school.userId,
      type: 'school_status_changed',
      title: `Your account is now ${status.replace(/_/g, ' ')}`,
      message: reason ?? `Your school account status was updated to ${status.replace(/_/g, ' ')}`,
      referenceType: 'school',
      referenceId: school.id,
    });

    return school;
  }
}

export const adminSchoolService = new AdminSchoolService();
