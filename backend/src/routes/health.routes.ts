import { Router, type Request, type Response } from 'express';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { ApiResponse } from '@/utils/ApiResponse';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 */
router.get('/', (_req: Request, res: Response) => {
  ApiResponse.success(res, { status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * @openapi
 * /health/ready:
 *   get:
 *     summary: Readiness probe — checks DB and Redis connectivity
 *     tags: [Health]
 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, 'ok' | 'error'> = { database: 'ok', redis: 'ok' };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = 'error';
  }

  try {
    await redis.ping();
  } catch {
    checks.redis = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');
  ApiResponse.success(res, { checks }, healthy ? 'Ready' : 'Not ready', healthy ? 200 : 503);
});

export default router;
