import type { NextFunction, Request, Response } from 'express';
import { adminRbacService } from '@/services/adminRbac.service';
import { ApiResponse } from '@/utils/ApiResponse';

export class AdminRbacController {
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userType, status, search, page, limit } = req.query as Record<string, string | undefined>;
      const result = await adminRbacService.listUsers({
        userType: userType as never,
        status: status as never,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      ApiResponse.paginated(res, result.items, result.meta);
    } catch (err) {
      next(err);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminRbacService.getUserById(BigInt(req.params.id));
      ApiResponse.success(res, { user });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminRbacService.setUserStatus(BigInt(req.params.id), req.body.status);
      ApiResponse.success(res, { user }, 'User status updated');
    } catch (err) {
      next(err);
    }
  }

  async listRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await adminRbacService.listRoles();
      ApiResponse.success(res, { roles });
    } catch (err) {
      next(err);
    }
  }

  async getRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await adminRbacService.getRoleById(BigInt(req.params.id));
      ApiResponse.success(res, { role });
    } catch (err) {
      next(err);
    }
  }

  async updateRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = await adminRbacService.updateRolePermissions(BigInt(req.params.id), req.body.permissionIds as bigint[]);
      ApiResponse.success(res, { role }, 'Role permissions updated');
    } catch (err) {
      next(err);
    }
  }

  async listPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminRbacService.listPermissions();
      ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const adminRbacController = new AdminRbacController();
