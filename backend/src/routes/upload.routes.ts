import { Router } from 'express';
import { uploadController } from '@/controllers/upload.controller';
import { uploadImage, uploadDocument } from '@/storage/upload.storage';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /uploads/image:
 *   post:
 *     summary: Upload an image (product photos, logos, avatars) to Cloudinary and register it as an UploadedFile
 *     tags: [Uploads]
 */
router.post('/image', uploadImage.single('file'), uploadController.uploadImage);

/**
 * @openapi
 * /uploads/document:
 *   post:
 *     summary: Upload a document/attachment (support tickets, quotations, school/dealer documents, invoices) to Cloudinary
 *     tags: [Uploads]
 */
router.post('/document', uploadDocument.single('file'), uploadController.uploadDocument);

export default router;
