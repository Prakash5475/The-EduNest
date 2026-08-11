import type { StorageEngine } from 'multer';
import type { Request } from 'express';
import { cloudinary } from '@/config/cloudinary';
import { env } from '@/config/env';

interface CloudinaryStorageOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

/**
 * multer-storage-cloudinary only supports the Cloudinary v1 SDK as a peer
 * dependency, which conflicts with cloudinary@^2. Streaming straight through
 * cloudinary.uploader.upload_stream is a handful of lines and avoids the
 * conflict entirely.
 */
export class CloudinaryStorageEngine implements StorageEngine {
  private readonly folder: string;
  private readonly resourceType: 'image' | 'video' | 'raw' | 'auto';

  constructor(options: CloudinaryStorageOptions = {}) {
    this.folder = options.folder ?? env.CLOUDINARY_UPLOAD_FOLDER;
    this.resourceType = options.resourceType ?? 'auto';
  }

  _handleFile(
    _req: Request,
    file: Express.Multer.File,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: this.folder, resource_type: this.resourceType },
      (error, result) => {
        if (error || !result) {
          callback(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        callback(undefined, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        } as Partial<Express.Multer.File>);
      },
    );
    file.stream.pipe(uploadStream);
  }

  _removeFile(_req: Request, file: Express.Multer.File, callback: (error: Error | null) => void): void {
    const publicId = (file as Express.Multer.File & { filename?: string }).filename;
    if (!publicId) {
      callback(null);
      return;
    }
    cloudinary.uploader
      .destroy(publicId)
      .then(() => callback(null))
      .catch((err: Error) => callback(err));
  }
}
