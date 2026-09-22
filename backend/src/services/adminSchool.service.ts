import { schoolRepository } from '@/repositories/school.repository';
import { userRepository } from '@/repositories/user.repository';
import { notifyUser } from '@/helpers/notification.helper';
import { hashPassword } from '@/helpers/password.helper';
import { generateSchoolCode } from '@/helpers/accountCode.helper';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { SchoolSchoolType, SchoolStatus } from '@prisma/client';

export class AdminSchoolService {
  async list(filters: { status?: SchoolStatus; schoolType?: string; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const status = filters.status === 'inactive'
      ? ['inactive', 'pending_approval', 'blocked'] as SchoolStatus[]
      : filters.status;
    const schoolTypes = filters.schoolType?.split(',') as SchoolSchoolType[] | undefined;
    const { items, total } = await schoolRepository.list({ status, schoolTypes, search: filters.search, skip, take });
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

  /** Create a new school account (user + school record) */
  async createSchool(input: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    schoolName: string;
    schoolCode?: string;
    schoolType?: SchoolSchoolType;
    boardAffiliation?: string;
    registrationNumber?: string;
    gstin?: string;
    status?: SchoolStatus;
  }) {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) throw ApiError.conflict('User with this email already exists');

    // Default initial password is the school's own registered phone number — hashed like
    // every other password, never stored in plain text.
    const pwd = input.password ?? input.phone;
    const passwordHash = await hashPassword(pwd);

    const user = await userRepository.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      userType: 'school',
      status: 'active',
      failedLoginCount: 0,
    });

    const code = input.schoolCode || (await generateSchoolCode());

    const school = await schoolRepository.create({
      user: { connect: { id: user.id } },
      schoolName: input.schoolName,
      schoolCode: code,
      schoolType: input.schoolType ?? 'k12',
      boardAffiliation: input.boardAffiliation || null,
      registrationNumber: input.registrationNumber || null,
      gstin: input.gstin || null,
      status: input.status ?? 'active',
    });

    return school;
  }
}

export const adminSchoolService = new AdminSchoolService();
