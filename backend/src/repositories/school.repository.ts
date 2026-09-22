import type { Prisma, School, SchoolSchoolType, SchoolStatus } from '@prisma/client';
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

  /** Case-insensitive exact match on schoolName — used for the "school name as username" login flow. */
  findBySchoolName(schoolName: string): Promise<School | null> {
    return this.db.school.findFirst({ where: { schoolName: { equals: schoolName }, deletedAt: null }, orderBy: { id: 'asc' } });
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
  async list(filters: { status?: SchoolStatus | SchoolStatus[]; schoolTypes?: SchoolSchoolType[]; search?: string; skip: number; take: number }) {
    const where: Prisma.SchoolWhereInput = {
      deletedAt: null,
      ...(filters.status ? { status: Array.isArray(filters.status) ? { in: filters.status } : filters.status } : {}),
      ...(filters.schoolTypes?.length ? { schoolType: { in: filters.schoolTypes } } : {}),
      ...(filters.search
        ? { OR: [{ schoolName: { contains: filters.search } }, { schoolCode: { contains: filters.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.db.school.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          schoolProfiles: true,
          schoolAddresses: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.db.school.count({ where }),
    ]);
    return { items, total };
  }
}

export const schoolRepository = new SchoolRepository();
