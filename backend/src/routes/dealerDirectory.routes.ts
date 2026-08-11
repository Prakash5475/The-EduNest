import { Router } from 'express';
import { dealerDirectoryController } from '@/controllers/dealerDirectory.controller';

const router = Router();

/**
 * @openapi
 * /dealers:
 *   get:
 *     summary: Browse the public directory of active dealers (marketplace) — no auth required
 *     tags: [Dealers]
 */
router.get('/', dealerDirectoryController.list);

export default router;
