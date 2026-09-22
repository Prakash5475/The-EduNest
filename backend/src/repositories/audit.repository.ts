import { BaseRepository } from './base.repository';

export interface AuditLogCreateInput {
  userId?: bigint;
  action: string;
  entityType: string;
  entityId: bigint;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
}

export interface AuditLogFilters {
  userId?: bigint;
  entityType?: string;
  action?: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
}

export class AuditRepository extends BaseRepository {
  create(data: AuditLogCreateInput) {
    return this.db.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues as never,
        newValues: data.newValues as never,
        ipAddress: data.ipAddress,
      },
    });
  }

  async list(filters: AuditLogFilters) {
    const where = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.entityType ? { entityType: filters.entityType } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.db.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}

export const auditRepository = new AuditRepository();
