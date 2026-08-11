import type { Prisma, User, UserStatus, UserUserType } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository {
  findByEmail(email: string): Promise<User | null> {
    return this.db.user.findFirst({ where: { email, deletedAt: null } });
  }

  findByUuid(uuid: string): Promise<User | null> {
    return this.db.user.findFirst({ where: { uuid, deletedAt: null } });
  }

  findById(id: bigint): Promise<User | null> {
    return this.db.user.findFirst({ where: { id, deletedAt: null } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.db.user.findFirst({ where: { phone, deletedAt: null } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  update(id: bigint, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  async withRolesAndPermissions(id: bigint) {
    return this.db.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });
  }

  incrementFailedLoginCount(id: bigint) {
    return this.db.user.update({
      where: { id },
      data: { failedLoginCount: { increment: 1 } },
    });
  }

  resetFailedLoginCount(id: bigint) {
    return this.db.user.update({
      where: { id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  lockUntil(id: bigint, until: Date) {
    return this.db.user.update({ where: { id }, data: { lockedUntil: until } });
  }

  markEmailVerified(id: bigint) {
    return this.db.user.update({ where: { id }, data: { emailVerifiedAt: new Date() } });
  }

  markPhoneVerified(id: bigint) {
    return this.db.user.update({ where: { id }, data: { phoneVerifiedAt: new Date() } });
  }

  touchLastLogin(id: bigint) {
    return this.db.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  updatePassword(id: bigint, passwordHash: string) {
    return this.db.user.update({ where: { id }, data: { passwordHash } });
  }

  /** Admin Users management — list, filterable by user type/status, searchable by name/email, paginated. */
  async list(filters: { userType?: UserUserType; status?: UserStatus; search?: string; skip: number; take: number }) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(filters.userType ? { userType: filters.userType } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? { OR: [{ fullName: { contains: filters.search } }, { email: { contains: filters.search } }] } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.user.count({ where }),
    ]);
    return { items, total };
  }
}

export const userRepository = new UserRepository();
