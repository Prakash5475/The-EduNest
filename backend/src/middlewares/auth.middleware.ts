import type { NextFunction, Response } from 'express';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { verifyAccessToken } from '@/helpers/jwt.helper';
import { ApiError } from '@/utils/ApiError';
import type { AuthenticatedRequest } from '@/types';

function extractToken(req: AuthenticatedRequest): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

/** Requires a valid access token. Populates req.user. */
export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(ApiError.unauthorized('Authentication token missing'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      uuid: payload.sub,
      userType: payload.userType,
      roles: payload.roles,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
    };
    next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      next(ApiError.unauthorized('Access token expired'));
      return;
    }
    if (err instanceof JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid access token'));
      return;
    }
    next(ApiError.unauthorized('Authentication failed'));
  }
}

/** Populates req.user if a valid token is present, but never rejects the request. */
export function optionalAuthenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.userId,
      uuid: payload.sub,
      userType: payload.userType,
      roles: payload.roles,
      permissions: payload.permissions,
      sessionId: payload.sessionId,
    };
  } catch {
    // Silently ignore invalid tokens on optional routes
  }
  next();
}
