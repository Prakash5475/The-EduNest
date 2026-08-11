import { PrismaClient } from '@prisma/client';
import { isProduction } from './env';
import { logger } from './logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Reuse a single PrismaClient instance across hot-reloads in dev so we don't
 * exhaust the MySQL connection pool with every nodemon restart.
 */
export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: isProduction
      ? [{ emit: 'event', level: 'error' }]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
  });

if (!isProduction) {
  global.__prisma = prisma;
}

(prisma as unknown as { $on: (event: string, cb: (e: unknown) => void) => void }).$on('error', (e: unknown) => {
  logger.error({ err: e }, 'Prisma client error');
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('MySQL connected via Prisma');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('MySQL connection closed');
}
