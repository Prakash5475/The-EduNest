import type { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { PaginationMeta } from '@/types';

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'OK',
    statusCode: number = StatusCodes.OK,
    meta?: PaginationMeta | Record<string, unknown>,
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    });
  }

  static created<T>(res: Response, data: T, message = 'Created'): Response {
    return this.success(res, data, message, StatusCodes.CREATED);
  }

  static noContent(res: Response): Response {
    return res.status(StatusCodes.NO_CONTENT).send();
  }

  static paginated<T>(res: Response, data: T[], meta: PaginationMeta, message = 'OK'): Response {
    return res.status(StatusCodes.OK).json({ success: true, message, data, meta });
  }
}
