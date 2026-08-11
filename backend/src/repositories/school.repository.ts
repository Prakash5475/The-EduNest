import type { Prisma, School, SchoolStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

/**
 * Schools are customer accounts (see project concept: "Schools do not have a
 * separate management dashboard"). Every school-scoped resource (cart,
 * wishlist, orders, ...) is keyed by School.id, not User.id directly, so this
 * repository is the shared lookup every school-facing module depends on.
 * The full Schools admin/profile module (registration, documents, addresses)
 * ships in a later phase — this is intentionally minimal until then.
 */
export class SchoolRepository extends BaseRepository {
  findByUserId(userId: bigint): Promise<School | null> {
    return this.db.school.findFirst({ where: { userId, deletedAt: null } });
  }

  findById(id: bigint): Promise<School | null> {
    return this.db.school.findFirst({ where: { id, deletedAt: null } });
  }

  findByCode(schoolCode: string): Promise<School | null> {
    return this.db.school.findFirst({ where: { schoolCode } });
  }

  create(data: Prisma.SchoolCreateInput): Promise<School> {
    return this.db.school.create({ data });
  }

  update(id: bigint, data: Prisma.SchoolUpdateInput): Promise<School> {
    return this.db.school.update({ where: { id }, data });
  }

  findByIdWithProfile(id: bigint) {
    return this.db.school.findFirst({
      where: { id, deletedAt: null },
      include: { schoolProfiles: true, logoFile: { select: { filePath: true } } },
    });
  }

  /** Admin Schools Management — list, filterable by status and name/code search, paginated. */
  async list(filters: { status?: SchoolStatus; search?: string; skip: number; take: number }) {
    const where: Prisma.SchoolWhereInput = {
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? { OR: [{ schoolName: { contains: filters.search } }, { schoolCode: { contains: filters.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.db.school.findMany({ where, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.school.count({ where }),
    ]);
    return { items, total };
  }
}

export const schoolRepository = new SchoolRepository();
