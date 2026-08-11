import type { NextFunction, Request, Response } from 'express';
import { auditService } from '@/services/audit.service';
import type { AuthenticatedRequest } from '@/types';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function actionForRequest(method: string, path: string): string {
  if (path.endsWith('/login')) return 'login';
  if (path.endsWith('/logout')) return 'logout';
  if (path.endsWith('/status') || path.endsWith('/override-status')) return 'status_change';
  if (path.includes('/payments/') || path.startsWith('/payments')) {
    if (path.endsWith('/refund')) return 'refund';
    if (path.endsWith('/verify')) return 'payment_verify';
    if (path.endsWith('/initiate')) return 'payment_initiate';
  }
  if (method === 'DELETE') return 'delete';
  if (method === 'POST') return 'create';
  return 'update';
}

function entityTypeForPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const first = segments.find((s) => Number.isNaN(Number(s))) ?? segments[0] ?? 'unknown';
  return first.replace(/s$/, '');
}

function firstNumericId(req: Request): bigint | undefined {
  for (const value of Object.values(req.params)) {
    if (value && /^\d+$/.test(value)) {
      try {
        return BigInt(value);
      } catch {
        continue;
      }
    }
  }
  return undefined;
}

/**
 * Captures every successful mutating (POST/PATCH/PUT/DELETE) request as an audit_logs row —
 * user, action, entity, request body, and response body — without requiring individual
 * controllers/services to call an audit function themselves. Mounted once, globally.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  let capturedBody: unknown;
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    capturedBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    const authReq = req as AuthenticatedRequest;
    const path = req.path;
    const responseData = (capturedBody as { data?: { id?: string | number } } | undefined)?.data;
    const entityId = firstNumericId(req) ?? (responseData?.id !== undefined ? BigInt(responseData.id) : undefined);
    if (entityId === undefined) return;

    void auditService.record({
      userId: authReq.user ? BigInt(authReq.user.id) : undefined,
      action: actionForRequest(req.method, path),
      entityType: entityTypeForPath(path),
      entityId,
      newValues: Object.keys(req.body ?? {}).length > 0 ? req.body : undefined,
      ipAddress: req.ip,
    });
  });

  next();
}
