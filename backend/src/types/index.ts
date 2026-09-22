import type { Request } from 'express';

export interface JwtAccessPayload {
  sub: string; // user uuid
  userId: string; // stringified BigInt user id
  userType: string;
  roles: string[];
  permissions: string[];
  sessionId: string; // session uuid, ties access token to a refresh session
}

export interface JwtRefreshPayload {
  sub: string; // user uuid
  userId: string;
  sessionId: string;
}

export interface AuthenticatedUser {
  id: string;
  uuid: string;
  userType: string;
  roles: string[];
  permissions: string[];
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface DeviceContext {
  ipAddress: string | null;
  userAgent: string | null;
}
