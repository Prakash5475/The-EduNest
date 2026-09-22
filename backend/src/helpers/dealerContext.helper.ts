import { dealerRepository } from '@/repositories/dealer.repository';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedUser } from '@/types';
import type { Dealer } from '@prisma/client';

/** Resolves the Dealer record for the current logged-in user, or throws. */
export async function requireDealerContext(user: AuthenticatedUser | undefined): Promise<Dealer> {
  if (!user) throw ApiError.unauthorized();
  if (user.userType !== 'dealer') {
    throw ApiError.forbidden('This action is only available to dealer accounts');
  }
  const dealer = await dealerRepository.findByUserId(BigInt(user.id));
  if (!dealer) throw ApiError.notFound('No dealer profile found for this account');
  return dealer;
}
