import type { Prisma, SchoolProfile } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class SchoolProfileRepository extends BaseRepository {
  findBySchoolId(schoolId: bigint): Promise<SchoolProfile | null> {
    return this.db.schoolProfile.findFirst({ where: { schoolId } });
  }

  async upsert(schoolId: bigint, data: Omit<Prisma.SchoolProfileUpdateInput, 'school'>): Promise<SchoolProfile> {
    const existing = await this.findBySchoolId(schoolId);
    if (existing) {
      return this.db.schoolProfile.update({ where: { id: existing.id }, data });
    }
    return this.db.schoolProfile.create({
      data: { ...(data as Prisma.SchoolProfileCreateWithoutSchoolInput), school: { connect: { id: schoolId } } },
    });
  }
}

export const schoolProfileRepository = new SchoolProfileRepository();
