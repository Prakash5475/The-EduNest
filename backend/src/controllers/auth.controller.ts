import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authService } from '@/services/auth.service';
import { otpService } from '@/services/otp.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { toPublicUser } from '@/utils/serializers';
import { getDeviceContext } from '@/helpers/request.helper';
import { env } from '@/config/env';
import { COOKIE_MAX_AGE_MS } from '@/constants';
import type { AuthenticatedRequest } from '@/types';
import type { OtpPurpose } from '@prisma/client';

function setRefreshCookie(res: Response, refreshToken: string): void {
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS.REFRESH_TOKEN,
    path: '/api/v1/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
}

function readRefreshToken(req: Request): string | undefined {
  return req.body?.refreshToken || (req.cookies?.[env.REFRESH_COOKIE_NAME] as string | undefined);
}

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user } = await authService.register(req.body);
      ApiResponse.created(res, { user: toPublicUser(user) }, 'Registration successful. Please verify your email.');
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const device = getDeviceContext(req);
      const { user, accessToken, refreshToken, expiresIn } = await authService.login(email, password, device);
      setRefreshCookie(res, refreshToken);
      ApiResponse.success(res, {
        user: toPublicUser(user),
        accessToken,
        refreshToken,
        expiresIn,
      }, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const presented = readRefreshToken(req);
      if (!presented) {
        throw ApiError.unauthorized('Refresh token missing');
      }
      const device = getDeviceContext(req);
      const { accessToken, refreshToken, expiresIn } = await authService.refresh(presented, device);
      setRefreshCookie(res, refreshToken);
      ApiResponse.success(res, { accessToken, refreshToken, expiresIn }, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.body?.allDevices && req.user) {
        await authService.logoutAllDevices(BigInt(req.user.id));
      } else if (req.user) {
        await authService.logout(req.user.sessionId);
      }
      clearRefreshCookie(res);
      ApiResponse.success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  async sendOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, purpose } = req.body as { identifier: string; purpose: OtpPurpose };
      await otpService.sendOtp(identifier, purpose);
      ApiResponse.success(res, null, 'Verification code sent');
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { identifier, purpose, otp } = req.body as { identifier: string; purpose: OtpPurpose; otp: string };
      await otpService.verify(identifier, purpose, otp);
      ApiResponse.success(res, null, 'Verification successful');
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      ApiResponse.success(res, null, 'If an account exists for this email, a reset link has been sent');
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      await authService.resetPassword(token, password);
      ApiResponse.success(res, null, 'Password reset successful. Please log in with your new password.');
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(BigInt(req.user.id), currentPassword, newPassword);
      ApiResponse.success(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query as { token: string };
      await authService.verifyEmail(token);
      ApiResponse.success(res, null, 'Email verified successfully', StatusCodes.OK);
    } catch (err) {
      next(err);
    }
  }

  async resendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resendVerificationEmail(req.body.email);
      ApiResponse.success(res, null, 'If an account exists for this email, a verification link has been sent');
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      ApiResponse.success(res, { user: req.user }, 'OK');
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
