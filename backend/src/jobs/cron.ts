import cron from 'node-cron';
import { logger } from '@/config/logger';
import { sessionRepository } from '@/repositories/session.repository';

/**
 * Registers Phase-1 housekeeping cron jobs. Business-module jobs (order
 * reminders, stock alerts, etc.) belong to later phases.
 */
export function registerCronJobs(): void {
  // Every day at 03:00 — purge expired refresh-token sessions.
  cron.schedule('0 3 * * *', async () => {
    try {
      const result = await sessionRepository.deleteExpired();
      logger.info({ deleted: result.count }, 'Cron: expired sessions purged');
    } catch (err) {
      logger.error({ err }, 'Cron: session cleanup failed');
    }
  });

  logger.info('Cron jobs registered');
}
