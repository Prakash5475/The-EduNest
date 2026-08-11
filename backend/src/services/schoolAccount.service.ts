import { schoolRepository } from '@/repositories/school.repository';
import { schoolProfileRepository } from '@/repositories/schoolProfile.repository';
import { ApiError } from '@/utils/ApiError';
import type { School } from '@prisma/client';

export interface SchoolAccountUpdateInput {
  schoolName?: string;
  boardAffiliation?: string;
  registrationNumber?: string;
  gstin?: string;
  websiteUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  altPhone?: string;
  about?: string;
  studentCount?: number;
  teacherCount?: number;
  branchCount?: number;
  establishedYear?: string;
}

export class SchoolAccountService {
  async getMyAccount(school: School) {
    const full = await schoolRepository.findByIdWithProfile(school.id);
    if (!full) throw ApiError.notFound('School not found');
    return { ...full, schoolProfile: full.schoolProfiles[0] ?? null };
  }

  async updateMyAccount(school: School, input: SchoolAccountUpdateInput) {
    const { schoolName, boardAffiliation, registrationNumber, gstin, ...profileFields } = input;

    if (schoolName || boardAffiliation !== undefined || registrationNumber !== undefined || gstin !== undefined) {
      await schoolRepository.update(school.id, { schoolName, boardAffiliation, registrationNumber, gstin });
    }

    const hasProfileFields = Object.values(profileFields).some((v) => v !== undefined);
    if (hasProfileFields) {
      const existing = await schoolProfileRepository.findBySchoolId(school.id);
      await schoolProfileRepository.upsert(school.id, {
        ...profileFields,
        branchCount: profileFields.branchCount ?? existing?.branchCount ?? 1,
      });
    }

    return this.getMyAccount(school);
  }
}

export const schoolAccountService = new SchoolAccountService();
