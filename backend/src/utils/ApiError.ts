import { StatusCodes } from 'http-status-codes';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Array<{ field?: string; message: string }>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Array<{ field?: string; message: string }>,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors?: Array<{ field?: string; message: string }>) {
    return new ApiError(StatusCodes.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(StatusCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(StatusCodes.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(StatusCodes.NOT_FOUND, message);
  }

  static conflict(message = 'Conflict') {
    return new ApiError(StatusCodes.CONFLICT, message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(StatusCodes.TOO_MANY_REQUESTS, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, undefined, false);
  }
}
