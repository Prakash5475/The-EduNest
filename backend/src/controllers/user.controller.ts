import type { NextFunction, Response } from 'express';
import { userService } from '@/services/user.service';
import { ApiResponse } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { toPublicUser, toPublicSession, toPublicLoginHistory } from '@/utils/serializers';
import type { AuthenticatedRequest } from '@/types';
import type { DeviceTokenPlatform } from '@prisma/client';

export class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const user = await userService.getProfile(BigInt(req.user.id));
      ApiResponse.success(res, { user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const user = await userService.updateProfile(BigInt(req.user.id), req.body);
      ApiResponse.success(res, { user: toPublicUser(user) }, 'Profile updated');
    } catch (err) {
      next(err);
    }
  }

  async listSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const sessions = await userService.listActiveSessions(BigInt(req.user.id));
      ApiResponse.success(res, { sessions: sessions.map(toPublicSession) });
    } catch (err) {
      next(err);
    }
  }

  async listLoginHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const history = await userService.listLoginHistory(BigInt(req.user.id));
      ApiResponse.success(res, { history: history.map(toPublicLoginHistory) });
    } catch (err) {
      next(err);
    }
  }

  async registerDevice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const { deviceToken, platform } = req.body as { deviceToken: string; platform: DeviceTokenPlatform };
      await userService.registerDeviceToken(BigInt(req.user.id), deviceToken, platform);
      ApiResponse.success(res, null, 'Device registered');
    } catch (err) {
      next(err);
    }
  }

  async removeDevice(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { deviceToken } = req.params as { deviceToken: string };
      await userService.removeDeviceToken(deviceToken);
      ApiResponse.success(res, null, 'Device removed');
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
