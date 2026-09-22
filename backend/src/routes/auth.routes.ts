import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { authRateLimiter } from '@/middlewares/rateLimiter.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  sendOtpSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
} from '@/validators/auth.validators';
import { emailSchema } from '@/validators/common.validators';
import { z } from 'zod';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 */
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 */
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rotate an access/refresh token pair
 *     tags: [Auth]
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out the current session (or all sessions)
 *     tags: [Auth]
 */
router.post('/logout', authenticate, validate(logoutSchema), authController.logout);

/**
 * @openapi
 * /auth/otp/send:
 *   post:
 *     summary: Send an OTP to an email/phone for a given purpose
 *     tags: [Auth]
 */
router.post('/otp/send', authRateLimiter, validate(sendOtpSchema), authController.sendOtp);

/**
 * @openapi
 * /auth/otp/verify:
 *   post:
 *     summary: Verify an OTP
 *     tags: [Auth]
 */
router.post('/otp/verify', authRateLimiter, validate(verifyOtpSchema), authController.verifyOtp);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 */
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a reset token
 *     tags: [Auth]
 */
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change password while authenticated
 *     tags: [Auth]
 */
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

/**
 * @openapi
 * /auth/verify-email:
 *   get:
 *     summary: Verify email address via token
 *     tags: [Auth]
 */
router.get('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

router.post(
  '/verify-email/resend',
  authRateLimiter,
  validate(z.object({ body: z.object({ email: emailSchema }) })),
  authController.resendVerificationEmail,
);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user's claims
 *     tags: [Auth]
 */
router.get('/me', authenticate, authController.me);

export default router;
