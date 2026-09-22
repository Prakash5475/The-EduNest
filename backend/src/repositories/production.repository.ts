import type { ProductionCheckpointStage, ProductionCheckpointUpdatedByType } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ProductionRepository extends BaseRepository {
  listByOrder(orderId: bigint) {
    return this.db.productionCheckpoint.findMany({
      where: { orderId },
      include: { productionCheckpointImages: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  latestByOrder(orderId: bigint) {
    return this.db.productionCheckpoint.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  addCheckpoint(data: {
    orderId: bigint;
    stage: ProductionCheckpointStage;
    completionPercentage: number;
    notes?: string;
    updatedBy?: bigint;
    updatedByType?: ProductionCheckpointUpdatedByType;
    overrideReason?: string;
    imageFileIds: bigint[];
  }) {
    return this.db.productionCheckpoint.create({
      data: {
        orderId: data.orderId,
        stage: data.stage,
        completionPercentage: data.completionPercentage,
        notes: data.notes,
        updatedBy: data.updatedBy,
        updatedByType: data.updatedByType ?? 'system',
        overrideReason: data.overrideReason,
        ...(data.imageFileIds.length
          ? { productionCheckpointImages: { createMany: { data: data.imageFileIds.map((fileId) => ({ fileId })) } } }
          : {}),
      },
      include: { productionCheckpointImages: true },
    });
  }
}

export const productionRepository = new ProductionRepository();
