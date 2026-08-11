import type { Prisma, LoginHistory } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class LoginHistoryRepository extends BaseRepository {
  record(data: Prisma.LoginHistoryCreateInput): Promise<LoginHistory> {
    return this.db.loginHistory.create({ data });
  }

  listForUser(userId: bigint, take = 20): Promise<LoginHistory[]> {
    return this.db.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}

export const loginHistoryRepository = new LoginHistoryRepository();
