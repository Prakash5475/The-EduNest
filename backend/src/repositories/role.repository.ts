import type { Prisma, Role } from '@prisma/client';
import { BaseRepository } from './base.repository';

const roleInclude = {
  rolePermissions: { include: { permission: true } },
} satisfies Prisma.RoleInclude;

export class RoleRepository extends BaseRepository {
  findBySlug(slug: string): Promise<Role | null> {
    return this.db.role.findFirst({ where: { slug, deletedAt: null } });
  }

  assignToUser(userId: bigint, roleId: bigint) {
    return this.db.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
  }

  /** Admin Roles management — full list with permission mapping. */
  list() {
    return this.db.role.findMany({ where: { deletedAt: null }, include: roleInclude, orderBy: { name: 'asc' } });
  }

  findByIdWithPermissions(id: bigint) {
    return this.db.role.findFirst({ where: { id, deletedAt: null }, include: roleInclude });
  }

  /** Replaces a role's permission set atomically. */
  async setPermissions(roleId: bigint, permissionIds: bigint[]) {
    await this.db.$transaction([
      this.db.rolePermission.deleteMany({ where: { roleId } }),
      this.db.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId, permissionId })) }),
    ]);
    return this.findByIdWithPermissions(roleId);
  }
}

export const roleRepository = new RoleRepository();
