import type { DeviceTokenPlatform, DeviceToken } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class DeviceTokenRepository extends BaseRepository {
  upsert(userId: bigint, deviceToken: string, platform: DeviceTokenPlatform): Promise<DeviceToken> {
    return this.db.deviceToken.upsert({
      where: { deviceToken },
      update: { userId, platform, isActive: true },
      create: { userId, deviceToken, platform, isActive: true },
    });
  }

  deactivate(deviceToken: string): Promise<DeviceToken> {
    return this.db.deviceToken.update({ where: { deviceToken }, data: { isActive: false } });
  }

  listActiveForUser(userId: bigint): Promise<DeviceToken[]> {
    return this.db.deviceToken.findMany({ where: { userId, isActive: true } });
  }
}

export const deviceTokenRepository = new DeviceTokenRepository();
