import type { NextFunction, Response } from 'express';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

/** Allows the request only if the authenticated user holds at least one of the given roles (by slug). */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}

/** Allows the request only if the authenticated user holds every listed permission. */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    const hasAll = requiredPermissions.every((perm) => req.user!.permissions.includes(perm));
    if (!hasAll) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}

/** Allows the request if the authenticated user holds at least one of the listed permissions. */
export function requireAnyPermission(...anyPermissions: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    const hasAny = anyPermissions.some((perm) => req.user!.permissions.includes(perm));
    if (!hasAny) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}

/** Restricts a route to a specific user_type (school / dealer / admin / staff). */
export function requireUserType(...allowedTypes: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    if (!allowedTypes.includes(req.user.userType)) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}
