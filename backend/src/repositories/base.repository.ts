import { prisma } from '@/config/database';
import type { PrismaClient } from '@prisma/client';

/**
 * Thin base class so every repository shares the same Prisma client (or an
 * injected transaction client, via withClient) without re-importing prisma
 * everywhere. Keeps repositories swappable/mockable for unit tests.
 */
export abstract class BaseRepository {
  protected readonly db: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.db = client;
  }
}
