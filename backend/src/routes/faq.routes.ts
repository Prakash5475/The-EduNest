import { Router } from 'express';
import { faqController } from '@/controllers/faq.controller';

const router = Router();

/**
 * @openapi
 * /faqs:
 *   get:
 *     summary: List all FAQs (public, no auth required)
 *     tags: [Support]
 */
router.get('/', faqController.list);

export default router;
