import { userRepository } from '@/repositories/user.repository';
import { sessionRepository } from '@/repositories/session.repository';
import { loginHistoryRepository } from '@/repositories/loginHistory.repository';
import { deviceTokenRepository } from '@/repositories/deviceToken.repository';
import { ApiError } from '@/utils/ApiError';
import type { User, DeviceTokenPlatform } from '@prisma/client';

export class UserService {
  async getProfile(userId: bigint): Promise<User> {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  }

  async updateProfile(userId: bigint, data: { fullName?: string; phone?: string }): Promise<User> {
    return userRepository.update(userId, data);
  }

  async listActiveSessions(userId: bigint) {
    return sessionRepository.listActiveForUser(userId);
  }

  async listLoginHistory(userId: bigint) {
    return loginHistoryRepository.listForUser(userId);
  }

  async registerDeviceToken(userId: bigint, deviceToken: string, platform: DeviceTokenPlatform) {
    return deviceTokenRepository.upsert(userId, deviceToken, platform);
  }

  async removeDeviceToken(deviceToken: string) {
    return deviceTokenRepository.deactivate(deviceToken);
  }
}

export const userService = new UserService();
