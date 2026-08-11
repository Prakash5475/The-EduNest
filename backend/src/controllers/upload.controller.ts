import type { NextFunction, Response } from 'express';
import { uploadedFileRepository } from '@/repositories/uploadedFile.repository';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

export class UploadController {
  async uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw ApiError.badRequest('No file provided');
      const file = await uploadedFileRepository.create({
        fileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        fileSizeBytes: BigInt(req.file.size),
        storageProvider: 'cloudinary',
        ...(req.user ? { user: { connect: { id: BigInt(req.user.id) } } } : {}),
      });
      ApiResponse.created(res, { file: { id: file.id, fileName: file.fileName, filePath: file.filePath } }, 'File uploaded');
    } catch (err) {
      next(err);
    }
  }

  async uploadDocument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) throw ApiError.badRequest('No file provided');
      const file = await uploadedFileRepository.create({
        fileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        fileSizeBytes: BigInt(req.file.size),
        storageProvider: 'cloudinary',
        ...(req.user ? { user: { connect: { id: BigInt(req.user.id) } } } : {}),
      });
      ApiResponse.created(res, { file: { id: file.id, fileName: file.fileName, filePath: file.filePath } }, 'File uploaded');
    } catch (err) {
      next(err);
    }
  }
}

export const uploadController = new UploadController();
