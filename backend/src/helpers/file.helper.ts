import path from 'node:path';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOCUMENT_MIME_TYPES = [...ALLOWED_IMAGE_MIME_TYPES, 'application/pdf'];

export function isAllowedMimeType(mime: string, allowed: string[]): boolean {
  return allowed.includes(mime);
}

export function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${safeBase || 'file'}-${Date.now()}${ext.toLowerCase()}`;
}

export function bytesToMb(bytes: number): number {
  return Math.round((bytes / (1024 * 1024)) * 100) / 100;
}
