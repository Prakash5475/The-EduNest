import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { env } from '@/config/env';

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Constant-time comparison for tokens/hashes that aren't bcrypt (e.g. SHA-256 hashed refresh tokens). */
export function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** SHA-256 hash for high-frequency lookups (refresh tokens, password-reset tokens) where bcrypt's cost is unnecessary. */
export function sha256Hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateRandomToken(bytes = 48): string {
  return crypto.randomBytes(bytes).toString('hex');
}

const PASSWORD_RULES = {
  minLength: 8,
  requireUppercase: /[A-Z]/,
  requireLowercase: /[a-z]/,
  requireNumber: /\d/,
  requireSpecial: /[^A-Za-z0-9]/,
};

export function getPasswordStrengthIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < PASSWORD_RULES.minLength) {
    issues.push(`Must be at least ${PASSWORD_RULES.minLength} characters`);
  }
  if (!PASSWORD_RULES.requireUppercase.test(password)) issues.push('Must include an uppercase letter');
  if (!PASSWORD_RULES.requireLowercase.test(password)) issues.push('Must include a lowercase letter');
  if (!PASSWORD_RULES.requireNumber.test(password)) issues.push('Must include a number');
  if (!PASSWORD_RULES.requireSpecial.test(password)) issues.push('Must include a special character');
  return issues;
}
