import type { Request } from 'express';
import type { DeviceContext } from '@/types';

export function getDeviceContext(req: Request): DeviceContext {
  const forwarded = req.headers['x-forwarded-for'];
  const ipAddress = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? null;

  return {
    ipAddress: ipAddress ?? null,
    userAgent: req.headers['user-agent'] ?? null,
  };
}
