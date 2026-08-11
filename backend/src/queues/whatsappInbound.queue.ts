import { Queue } from 'bullmq';
import { redisForQueues } from '@/config/redis';
import { env } from '@/config/env';
import { QUEUE_NAMES } from '@/constants';

export interface WhatsappInboundJobData {
  inboundMessageId: string;
}

/** Separate from the outbound `whatsappQueue` — inbound processing (conversation-state
 * transitions, business-logic side effects) has different failure semantics than a template
 * send, so it gets its own queue rather than overloading the outbound job type. */
export const whatsappInboundQueue = new Queue<WhatsappInboundJobData>(QUEUE_NAMES.WHATSAPP_INBOUND, {
  connection: redisForQueues,
  prefix: env.QUEUE_PREFIX,
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 7 * 86400 },
  },
});
