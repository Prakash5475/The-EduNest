import { Queue } from 'bullmq';
import { redisForQueues } from '@/config/redis';
import { env } from '@/config/env';
import { QUEUE_NAMES } from '@/constants';

export interface NotificationJobData {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: Record<string, unknown>;
}

export const notificationQueue = new Queue<NotificationJobData>(QUEUE_NAMES.NOTIFICATION, {
  connection: redisForQueues,
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});
