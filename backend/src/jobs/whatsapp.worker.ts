import { Worker, type Job } from 'bullmq';
import { redisForQueues } from '@/config/redis';
import { env } from '@/config/env';
import { QUEUE_NAMES } from '@/constants';
import { logger } from '@/config/logger';
import { whatsappLogRepository } from '@/repositories/whatsappLog.repository';
import { getWhatsappProvider } from '@/services/whatsapp/whatsapp.provider';
import type { WhatsappJobData } from '@/queues/whatsapp.queue';
import type { Prisma } from '@prisma/client';

export function createWhatsappWorker(): Worker<WhatsappJobData> {
  const worker = new Worker<WhatsappJobData>(
    QUEUE_NAMES.WHATSAPP,
    async (job: Job<WhatsappJobData>) => {
      const log = await whatsappLogRepository.findById(BigInt(job.data.logId));
      if (!log) {
        logger.warn({ logId: job.data.logId }, 'WhatsApp job referenced a log row that no longer exists');
        return;
      }

      await whatsappLogRepository.updateStatus(log.id, { status: 'processing' });

      const provider = getWhatsappProvider();
      const result = await provider.sendTemplateMessage({
        to: log.phone,
        templateName: log.templateName,
        templateParams: Array.isArray(log.templateParams) ? (log.templateParams as string[]) : [],
        languageCode: 'en',
      });

      if (result.success) {
        await whatsappLogRepository.updateStatus(log.id, {
          status: 'sent',
          providerName: provider.name,
          providerMessageId: result.providerMessageId,
          providerResponse: (result.providerResponse ?? {}) as Prisma.InputJsonValue,
          sentAt: new Date(),
        });
      } else {
        await whatsappLogRepository.updateStatus(log.id, {
          status: 'failed',
          providerName: provider.name,
          errorMessage: result.errorMessage,
          providerResponse: (result.providerResponse ?? {}) as Prisma.InputJsonValue,
          retryCount: log.retryCount + 1,
          failedAt: new Date(),
        });
        // Throwing lets BullMQ's configured backoff/attempts retry it automatically.
        throw new Error(result.errorMessage ?? 'WhatsApp send failed');
      }

      logger.info({ jobId: job.id, logId: log.id.toString(), provider: provider.name }, 'WhatsApp message processed');
    },
    {
      connection: redisForQueues,
      prefix: env.QUEUE_PREFIX,
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'WhatsApp job failed');
  });

  return worker;
}
