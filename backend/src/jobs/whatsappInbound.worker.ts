import { Worker, type Job } from 'bullmq';
import { redisForQueues } from '@/config/redis';
import { env } from '@/config/env';
import { QUEUE_NAMES } from '@/constants';
import { logger } from '@/config/logger';
import { whatsappConversationService } from '@/services/whatsapp/whatsappConversation.service';
import type { WhatsappInboundJobData } from '@/queues/whatsappInbound.queue';

export function createWhatsappInboundWorker(): Worker<WhatsappInboundJobData> {
  const worker = new Worker<WhatsappInboundJobData>(
    QUEUE_NAMES.WHATSAPP_INBOUND,
    async (job: Job<WhatsappInboundJobData>) => {
      await whatsappConversationService.processInboundMessage(BigInt(job.data.inboundMessageId));
      logger.info({ jobId: job.id, inboundMessageId: job.data.inboundMessageId }, 'WhatsApp inbound message processed');
    },
    {
      connection: redisForQueues,
      prefix: env.QUEUE_PREFIX,
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'WhatsApp inbound job failed');
  });

  return worker;
}
