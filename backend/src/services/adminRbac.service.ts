import { userRepository } from '@/repositories/user.repository';
import { roleRepository } from '@/repositories/role.repository';
import { permissionRepository } from '@/repositories/permission.repository';
import { notifyUser } from '@/helpers/notification.helper';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { UserStatus, UserUserType } from '@prisma/client';

export class AdminRbacService {
  async listUsers(filters: { userType?: UserUserType; status?: UserStatus; search?: string; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await userRepository.list({
      userType: filters.userType,
      status: filters.status,
      search: filters.search,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getUserById(id: bigint) {
    const user = await userRepository.withRolesAndPermissions(id);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  /** Activate/deactivate a user account. Notifies the user of the change. */
  async setUserStatus(id: bigint, status: UserStatus) {
    const existing = await userRepository.findById(id);
    if (!existing) throw ApiError.notFound('User not found');

    const user = await userRepository.update(id, { status });

    await notifyUser({
      userId: user.id,
      type: 'account_status_changed',
      title: `Your account is now ${status}`,
      message: `Your account status was updated to ${status}`,
      referenceType: 'user',
      referenceId: user.id,
    });

    return user;
  }

  async listRoles() {
    return roleRepository.list();
  }

  async getRoleById(id: bigint) {
    const role = await roleRepository.findByIdWithPermissions(id);
    if (!role) throw ApiError.notFound('Role not found');
    return role;
  }

  /** Replaces a role's permission set. Schema already supports this via RolePermission — no new model introduced.
   * System roles (isSystem) are protected from having their permission set edited here, since clearing a
   * system role's permissions (e.g. super_admin) could lock every requirePermission()-gated route for that role. */
  async updateRolePermissions(id: bigint, permissionIds: bigint[]) {
    const role = await roleRepository.findByIdWithPermissions(id);
    if (!role) throw ApiError.notFound('Role not found');
    if (role.isSystem) {
      throw ApiError.badRequest(`"${role.name}" is a protected system role — its permissions cannot be edited here`);
    }
    return roleRepository.setPermissions(id, permissionIds);
  }

  /** Exposes the existing Permission table, grouped by module. Does not invent a new RBAC model. */
  async listPermissions() {
    const permissions = await permissionRepository.list();
    const byModule: Record<string, typeof permissions> = {};
    for (const permission of permissions) {
      (byModule[permission.module] ??= []).push(permission);
    }
    return { permissions, byModule };
  }
}

export const adminRbacService = new AdminRbacService();
