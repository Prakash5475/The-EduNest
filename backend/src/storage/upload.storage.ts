import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { ALLOWED_IMAGE_MIME_TYPES } from '@/helpers/file.helper';

const uploadRoot = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

const extensionFor = (mime: string, original: string) => {
  const ext = path.extname(original).toLowerCase();
  if (ext) return ext;
  const map: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'application/pdf': '.pdf' };
  return map[mime] ?? '';
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extensionFor(file.mimetype, file.originalname)}`),
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) return cb(new Error('Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF'));
    cb(null, true);
  },
});

export const uploadDocument = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
