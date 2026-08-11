import crypto from 'node:crypto';
import { env } from '@/config/env';
import { redis } from '@/config/redis';
import { REDIS_KEYS } from '@/constants';
import { sha256Hash } from './password.helper';

export function generateOtp(length: number = env.OTP_LENGTH): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

interface StoreOtpParams {
  identifier: string; // email or phone
  purpose: string;
  otp: string;
  ttlSeconds?: number;
}

export async function storeOtp({
  identifier,
  purpose,
  otp,
  ttlSeconds = env.OTP_TTL_SECONDS,
}: StoreOtpParams): Promise<void> {
  const key = REDIS_KEYS.otp(identifier, purpose);
  await redis.set(key, sha256Hash(otp), 'EX', ttlSeconds);
  await redis.del(REDIS_KEYS.otpAttempts(identifier, purpose));
}

interface VerifyOtpParams {
  identifier: string;
  purpose: string;
  otp: string;
}

export type OtpVerificationResult = 'valid' | 'invalid' | 'expired' | 'too_many_attempts';

export async function verifyOtp({ identifier, purpose, otp }: VerifyOtpParams): Promise<OtpVerificationResult> {
  const key = REDIS_KEYS.otp(identifier, purpose);
  const attemptsKey = REDIS_KEYS.otpAttempts(identifier, purpose);

  const attempts = await redis.incr(attemptsKey);
  if (attempts === 1) {
    await redis.expire(attemptsKey, env.OTP_TTL_SECONDS);
  }
  if (attempts > env.OTP_MAX_ATTEMPTS) {
    return 'too_many_attempts';
  }

  const storedHash = await redis.get(key);
  if (!storedHash) return 'expired';

  if (storedHash !== sha256Hash(otp)) return 'invalid';

  await redis.del(key);
  await redis.del(attemptsKey);
  return 'valid';
}

export async function invalidateOtp(identifier: string, purpose: string): Promise<void> {
  await redis.del(REDIS_KEYS.otp(identifier, purpose));
  await redis.del(REDIS_KEYS.otpAttempts(identifier, purpose));
}
