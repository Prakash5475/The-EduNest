import type { Prisma, UploadedFile } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UploadedFileRepository extends BaseRepository {
  create(data: Prisma.UploadedFileCreateInput): Promise<UploadedFile> {
    return this.db.uploadedFile.create({ data });
  }

  findById(id: bigint): Promise<UploadedFile | null> {
    return this.db.uploadedFile.findFirst({ where: { id, deletedAt: null } });
  }
}

export const uploadedFileRepository = new UploadedFileRepository();
