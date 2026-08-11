import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import { env } from '@/config/env';
import type { JwtAccessPayload, JwtRefreshPayload } from '@/types';

const commonSignOptions: Pick<SignOptions, 'issuer' | 'audience'> = {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

const commonVerifyOptions: VerifyOptions = {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

export function signAccessToken(payload: JwtAccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    ...commonSignOptions,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: JwtRefreshPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    ...commonSignOptions,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, commonVerifyOptions);
  return decoded as unknown as JwtAccessPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, commonVerifyOptions);
  return decoded as unknown as JwtRefreshPayload;
}

/** Decodes without verifying — only for reading claims off an already-validated token. */
export function decodeToken<T>(token: string): T | null {
  return jwt.decode(token) as T | null;
}
