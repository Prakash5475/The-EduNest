import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { ApiError } from '@/utils/ApiError';
import { logger } from '@/config/logger';
import { isProduction } from '@/config/env';

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): ApiError {
  switch (err.code) {
    case 'P2002':
      return ApiError.conflict(`Duplicate value for ${(err.meta?.target as string[])?.join(', ') ?? 'field'}`);
    case 'P2025':
      return ApiError.notFound('Record not found');
    case 'P2003':
      return ApiError.badRequest('Related record does not exist');
    default:
      return ApiError.internal('Database error');
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let apiError: ApiError;

  if (err instanceof ApiError) {
    apiError = err;
  } else if (err instanceof ZodError) {
    apiError = ApiError.badRequest(
      'Validation failed',
      err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    );
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    apiError = mapPrismaError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    apiError = ApiError.badRequest('Invalid data provided');
  } else {
    const message = err instanceof Error ? err.message : 'Internal server error';
    apiError = new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, undefined, false);
  }

  if (!apiError.isOperational) {
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  } else if (apiError.statusCode >= 500) {
    logger.error({ err: apiError, path: req.path, method: req.method }, apiError.message);
  } else {
    logger.warn({ path: req.path, method: req.method, statusCode: apiError.statusCode }, apiError.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.errors ? { errors: apiError.errors } : {}),
    ...(!isProduction && !apiError.isOperational && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
}
