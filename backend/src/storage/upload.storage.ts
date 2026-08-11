import multer from 'multer';
import { CloudinaryStorageEngine } from './cloudinaryStorage.engine';
import { ALLOWED_IMAGE_MIME_TYPES } from '@/helpers/file.helper';

const storage = new CloudinaryStorageEngine({ resourceType: 'auto' });

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF'));
      return;
    }
    cb(null, true);
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
