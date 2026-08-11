import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { disconnectRedis } from '@/config/redis';
import { createEmailWorker } from './email.worker';
import { createNotificationWorker } from './notification.worker';
import { createWhatsappWorker } from './whatsapp.worker';
import { createWhatsappInboundWorker } from './whatsappInbound.worker';
import { registerCronJobs } from './cron';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const emailWorker = createEmailWorker();
  const notificationWorker = createNotificationWorker();
  const whatsappWorker = createWhatsappWorker();
  const whatsappInboundWorker = createWhatsappInboundWorker();
  registerCronJobs();

  logger.info('Worker process started (email + notification + whatsapp + whatsapp-inbound queues, cron jobs)');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Worker shutting down');
    await Promise.all([emailWorker.close(), notificationWorker.close(), whatsappWorker.close(), whatsappInboundWorker.close()]);
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
