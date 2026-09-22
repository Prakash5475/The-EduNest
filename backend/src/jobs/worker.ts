import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { disconnectRedis } from '@/config/redis';
import { createEmailWorker } from './email.worker';
import { createNotificationWorker } from './notification.worker';
import { registerCronJobs } from './cron';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const emailWorker = createEmailWorker();
  const notificationWorker = createNotificationWorker();
  registerCronJobs();

  logger.info('Worker process started (email + notification queues, cron jobs)');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Worker shutting down');
    await Promise.all([emailWorker.close(), notificationWorker.close()]);
    await disconnectDatabase();
    await disconnectRedis();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Worker failed to start');
  process.exit(1);
});
