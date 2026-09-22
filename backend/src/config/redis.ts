import Redis, { type RedisOptions } from 'ioredis';
import { env, isDevelopment } from './env';
import { logger } from './logger';

const redisOptions: RedisOptions = {
  keyPrefix: env.REDIS_PREFIX,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: (times: number) => (isDevelopment ? null : Math.min(times * 200, 5000)),
};

export const redis = new Redis(env.REDIS_URL, redisOptions);

/**
 * BullMQ requires maxRetriesPerRequest: null and manages its own
 * key prefixing internally, so queues/workers get an unprefixed connection.
 */
export const redisForQueues = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: (times: number) => (isDevelopment ? null : Math.min(times * 200, 5000)),
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
redisForQueues.on('error', (err) => logger.error({ err }, 'Redis queue connection error'));

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  await redisForQueues.quit();
  logger.info('Redis connections closed');
}
