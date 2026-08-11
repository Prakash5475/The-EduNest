import type { NextFunction, Request, Response } from 'express';

/**
 * Stamps every outgoing response with the request id and a server timestamp
 * header. Business responses themselves are shaped consistently via
 * ApiResponse (src/utils/ApiResponse.ts) rather than here, keeping this
 * middleware purely transport-level.
 */
export function responseFormatter(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Response-Time-Started', Date.now().toString());
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    res.setHeader('X-Api-Version', 'v1');
    return originalJson(body);
  };
  next();
}
