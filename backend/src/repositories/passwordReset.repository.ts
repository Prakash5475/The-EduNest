import type { Prisma, PasswordReset } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PasswordResetRepository extends BaseRepository {
  create(data: Prisma.PasswordResetCreateInput): Promise<PasswordReset> {
    return this.db.passwordReset.create({ data });
  }

  findValidByTokenHash(tokenHash: string): Promise<PasswordReset | null> {
    return this.db.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  markUsed(id: bigint): Promise<PasswordReset> {
    return this.db.passwordReset.update({ where: { id }, data: { usedAt: new Date() } });
  }

  invalidateAllForUser(userId: bigint): Promise<Prisma.BatchPayload> {
    return this.db.passwordReset.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}

export const passwordResetRepository = new PasswordResetRepository();
