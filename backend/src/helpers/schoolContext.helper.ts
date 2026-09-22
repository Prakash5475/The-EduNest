import { schoolRepository } from '@/repositories/school.repository';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedUser } from '@/types';
import type { School } from '@prisma/client';

/** Resolves the School record for the current logged-in user, or throws. */
export async function requireSchoolContext(user: AuthenticatedUser | undefined): Promise<School> {
  if (!user) throw ApiError.unauthorized();
  if (user.userType !== 'school') {
    throw ApiError.forbidden('This action is only available to school accounts');
  }
  const school = await schoolRepository.findByUserId(BigInt(user.id));
  if (!school) throw ApiError.notFound('No school profile found for this account');
  return school;
}
