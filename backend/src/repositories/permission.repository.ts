import { BaseRepository } from './base.repository';

export class PermissionRepository extends BaseRepository {
  list() {
    return this.db.permission.findMany({ orderBy: [{ module: 'asc' }, { name: 'asc' }] });
  }
}

export const permissionRepository = new PermissionRepository();
