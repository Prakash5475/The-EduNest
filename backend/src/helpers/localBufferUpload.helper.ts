import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const uploadRoot = path.resolve(process.cwd(), 'uploads');

/**
 * Writes an in-memory buffer (e.g. a generated invoice PDF) to the local
 * uploads directory and returns a URL servable via the existing
 * `app.use('/uploads', express.static(...))` mount in app.ts.
 *
 * Mirrors src/storage/upload.storage.ts's naming/safety rules (unique,
 * collision-proof filenames; no path segments from caller input reach the
 * filesystem) so generated files and user-uploaded files behave the same way
 * in local dev, on Hostinger, and inside the ZIP package.
 */
export function uploadBufferToLocal(
  buffer: Buffer,
  options: { folder?: string; publicId?: string; format?: string } = {},
): { url: string; publicId: string; bytes: number } {
  const folder = (options.folder ?? 'files').replace(/[^a-zA-Z0-9_-]/g, '');
  const ext = options.format ? `.${options.format.replace(/^\./, '')}` : '';
  const safeBase = (options.publicId ?? crypto.randomBytes(8).toString('hex')).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${safeBase}${ext}`;

  const dir = path.join(uploadRoot, folder);
  fs.mkdirSync(dir, { recursive: true });
  const fullPath = path.join(dir, fileName);
  fs.writeFileSync(fullPath, buffer);

  return {
    url: `/uploads/${folder}/${fileName}`,
    publicId: `${folder}/${fileName}`,
    bytes: buffer.length,
  };
}
