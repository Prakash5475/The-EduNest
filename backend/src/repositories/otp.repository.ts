import type { Prisma, Otp } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class OtpRepository extends BaseRepository {
  create(data: Prisma.OtpCreateInput): Promise<Otp> {
    return this.db.otp.create({ data });
  }

  markConsumedLatest(identifier: string, purpose: Otp['purpose']): Promise<Prisma.BatchPayload> {
    return this.db.otp.updateMany({
      where: { identifier, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }
}

export const otpRepository = new OtpRepository();
