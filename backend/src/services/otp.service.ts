import { env } from '@/config/env';
import { generateOtp, storeOtp, verifyOtp, type OtpVerificationResult } from '@/helpers/otp.helper';
import { sha256Hash } from '@/helpers/password.helper';
import { otpRepository } from '@/repositories/otp.repository';
import { userRepository } from '@/repositories/user.repository';
import { emailService } from '@/services/email.service';
import { whatsappService } from '@/services/whatsapp.service';
import { addSeconds } from '@/helpers/date.helper';
import { ApiError } from '@/utils/ApiError';
import type { OtpPurpose } from '@prisma/client';

export class OtpService {
  async sendOtp(identifier: string, purpose: OtpPurpose, linkedShipmentId?: bigint): Promise<void> {
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
      ...(linkedShipmentId ? { shipment: { connect: { id: linkedShipmentId } } } : {}),
    });

    // Email identifiers use SMTP; phone identifiers use WhatsApp (Meta Cloud API) — both are
    // real, fully wired integrations, gated only by whether credentials are present in .env.
    // Neither path is a mock: sendOtpEmail throws on SMTP misconfiguration the same way
    // sendWhatsAppTemplate throws on missing WhatsApp credentials, so a missing integration
    // is never mistaken for a delivered OTP.
    if (identifier.includes('@')) {
      await emailService.sendOtpEmail(identifier, otp, Math.ceil(env.OTP_TTL_SECONDS / 60));
    } else {
      if (!whatsappService.isConfigured()) {
        throw ApiError.internal(
          'OTP could not be sent: this identifier is a phone number, which requires WhatsApp — ' +
            'set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env, and create/approve an OTP ' +
            "template (e.g. 'otp_verification') in the Meta Business dashboard first.",
        );
      }
      // 'otp_verification' must exist as an approved template in the WhatsApp Business
      // account — Meta requires template approval for any message outside a customer-
      // initiated session window, which an OTP always is.
      await whatsappService.sendWhatsAppTemplate(identifier, 'otp_verification', 'en', [otp]);
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
