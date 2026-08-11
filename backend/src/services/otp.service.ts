import { env } from '@/config/env';
import { generateOtp, storeOtp, verifyOtp, type OtpVerificationResult } from '@/helpers/otp.helper';
import { sha256Hash } from '@/helpers/password.helper';
import { otpRepository } from '@/repositories/otp.repository';
import { userRepository } from '@/repositories/user.repository';
import { emailService } from '@/services/email.service';
import { addSeconds } from '@/helpers/date.helper';
import { ApiError } from '@/utils/ApiError';
import type { OtpPurpose } from '@prisma/client';

export class OtpService {
  async sendOtp(identifier: string, purpose: OtpPurpose): Promise<void> {
    const otp = generateOtp();
    await storeOtp({ identifier, purpose, otp });

    const user = await userRepository.findByEmail(identifier);

    await otpRepository.create({
      identifier,
      purpose,
      otpHash: sha256Hash(otp),
      expiresAt: addSeconds(new Date(), env.OTP_TTL_SECONDS),
      attemptCount: 0,
      ...(user ? { user: { connect: { id: user.id } } } : {}),
    });

    // Phase 1 sends OTPs by email only; SMS gateway integration is a later
    // phase concern, but the identifier/purpose contract already supports it.
    if (identifier.includes('@')) {
      await emailService.sendOtpEmail(identifier, otp, Math.ceil(env.OTP_TTL_SECONDS / 60));
    }
  }

  async verify(identifier: string, purpose: OtpPurpose, otp: string): Promise<void> {
    const result: OtpVerificationResult = await verifyOtp({ identifier, purpose, otp });

    if (result === 'valid') {
      await otpRepository.markConsumedLatest(identifier, purpose);
      return;
    }

    if (result === 'too_many_attempts') {
      throw ApiError.tooManyRequests('Too many incorrect attempts. Please request a new code.');
    }
    if (result === 'expired') {
      throw ApiError.badRequest('This code has expired. Please request a new one.');
    }
    throw ApiError.badRequest('Invalid verification code');
  }
}

export const otpService = new OtpService();
