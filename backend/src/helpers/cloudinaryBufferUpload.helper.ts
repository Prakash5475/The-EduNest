import { cloudinary } from '@/config/cloudinary';
import { env } from '@/config/env';

/** Uploads an in-memory buffer (e.g. a generated PDF) to Cloudinary as a raw resource. */
export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { folder?: string; publicId?: string; format?: string } = {},
): Promise<{ url: string; publicId: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? env.CLOUDINARY_UPLOAD_FOLDER,
        resource_type: 'raw',
        public_id: options.publicId,
        format: options.format,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id, bytes: result.bytes });
      },
    );
    stream.end(buffer);
  });
}
