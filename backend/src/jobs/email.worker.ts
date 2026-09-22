import { Worker, type Job } from 'bullmq';
import { redisForQueues } from '@/config/redis';
import { env } from '@/config/env';
import { QUEUE_NAMES } from '@/constants';
import { mailTransport, mailDefaults } from '@/config/mailer';
import { logger } from '@/config/logger';
import type { EmailJobData } from '@/queues/email.queue';

export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    QUEUE_NAMES.EMAIL,
    async (job: Job<EmailJobData>) => {
      const { to, subject, html } = job.data;
      await mailTransport.sendMail({ ...mailDefaults, to, subject, html });
      logger.info({ jobId: job.id, to, subject }, 'Email sent');
    },
    {
      connection: redisForQueues,
      prefix: env.QUEUE_PREFIX,
      concurrency: 5,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Email job failed');
  });

  return worker;
}
