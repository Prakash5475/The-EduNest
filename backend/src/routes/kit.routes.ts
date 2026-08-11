import { Router } from 'express';
import { kitController } from '@/controllers/kit.controller';

const router = Router();

/**
 * @openapi
 * /kits:
 *   get:
 *     summary: Browse pre-bundled classroom/preschool kits (public, no auth required)
 *     tags: [Kits]
 */
router.get('/', kitController.list);

/**
 * @openapi
 * /kits/{id}:
 *   get:
 *     summary: Get a single kit's detail
 *     tags: [Kits]
 */
router.get('/:id', kitController.getById);

export default router;
