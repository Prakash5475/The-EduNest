import type { Prisma, SchoolAddress } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class SchoolAddressRepository extends BaseRepository {
  listBySchool(schoolId: bigint): Promise<SchoolAddress[]> {
    return this.db.schoolAddress.findMany({
      where: { schoolId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: bigint): Promise<SchoolAddress | null> {
    return this.db.schoolAddress.findUnique({ where: { id } });
  }

  create(data: Prisma.SchoolAddressCreateInput): Promise<SchoolAddress> {
    return this.db.schoolAddress.create({ data });
  }

  update(id: bigint, data: Prisma.SchoolAddressUpdateInput): Promise<SchoolAddress> {
    return this.db.schoolAddress.update({ where: { id }, data });
  }

  delete(id: bigint): Promise<SchoolAddress> {
    return this.db.schoolAddress.delete({ where: { id } });
  }

  /** Clears the default flag on every other address for this school. */
  clearDefaultsExcept(schoolId: bigint, exceptId: bigint): Promise<Prisma.BatchPayload> {
    return this.db.schoolAddress.updateMany({
      where: { schoolId, id: { not: exceptId } },
      data: { isDefault: false },
    });
  }
}

export const schoolAddressRepository = new SchoolAddressRepository();
