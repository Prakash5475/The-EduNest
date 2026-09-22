import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { env } from '@/config/env';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
});

/** Stricter limiter for auth endpoints (login, OTP, password reset) to slow brute force / spam. */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts, please try again later',
  },
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
});
