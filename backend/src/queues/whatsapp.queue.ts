import { Queue } from 'bullmq';
import { redisForQueues } from '@/config/redis';
import { env } from '@/config/env';
import { QUEUE_NAMES } from '@/constants';

export interface WhatsappJobData {
  logId: string;
}

export const whatsappQueue = new Queue<WhatsappJobData>(QUEUE_NAMES.WHATSAPP, {
  connection: redisForQueues,
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 7 * 86400 },
  },
});
