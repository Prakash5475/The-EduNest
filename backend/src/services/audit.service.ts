import { auditRepository } from '@/repositories/audit.repository';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { logger } from '@/config/logger';

export interface AuditRecordInput {
  userId?: bigint;
  action: string;
  entityType: string;
  entityId: bigint;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string;
}

export interface AuditListFilters {
  userId?: bigint;
  entityType?: string;
  action?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export class AuditService {
  /** Single call site for writing an audit entry — never fails the caller's request if logging itself errors. */
  async record(input: AuditRecordInput): Promise<void> {
    try {
      await auditRepository.create(input);
    } catch (err) {
      // Audit logging must never break the underlying action it's observing —
      // but a silent failure here is invisible without this log line.
      logger.error({ err, action: input.action, entityType: input.entityType }, 'Audit log write failed');
    }
  }

  async list(filters: AuditListFilters) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await auditRepository.list({
      userId: filters.userId,
      entityType: filters.entityType,
      action: filters.action,
      from: filters.from,
      to: filters.to,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}

export const auditService = new AuditService();
