import type { Prisma, Session } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class SessionRepository extends BaseRepository {
  create(data: Prisma.SessionCreateInput): Promise<Session> {
    return this.db.session.create({ data });
  }

  findByUuid(uuid: string): Promise<Session | null> {
    return this.db.session.findFirst({ where: { uuid } });
  }

  findActiveByUuid(uuid: string): Promise<Session | null> {
    return this.db.session.findFirst({
      where: { uuid, revokedAt: null, expiresAt: { gt: new Date() } },
    });
  }

  revoke(uuid: string): Promise<Session> {
    return this.db.session.update({ where: { uuid }, data: { revokedAt: new Date() } });
  }

  revokeAllForUser(userId: bigint): Promise<Prisma.BatchPayload> {
    return this.db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  listActiveForUser(userId: bigint): Promise<Session[]> {
    return this.db.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  deleteExpired(): Promise<Prisma.BatchPayload> {
    return this.db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  }
}

export const sessionRepository = new SessionRepository();
