import { randomUUID } from 'node:crypto';
import type { User } from '@prisma/client';
import { env } from '@/config/env';
import { sessionRepository } from '@/repositories/session.repository';
import { userRepository } from '@/repositories/user.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/helpers/jwt.helper';
import { sha256Hash } from '@/helpers/password.helper';
import { addSeconds, parseDurationToMs } from '@/helpers/date.helper';
import { ApiError } from '@/utils/ApiError';
import type { DeviceContext } from '@/types';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: number;
}

async function loadRolesAndPermissions(userId: bigint) {
  const userWithRoles = await userRepository.withRolesAndPermissions(userId);
  const userRoles = (userWithRoles?.userRoles ?? []) as Array<{
    role: { slug: string; rolePermissions: Array<{ permission: { name: string } }> };
  }>;
  const roles: string[] = userRoles.map((ur) => ur.role.slug);
  const permissions: string[] = Array.from(
    new Set<string>(
      userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.name)),
    ),
  );
  return { roles, permissions };
}

export class TokenService {
  async issueTokenPair(user: User, device: DeviceContext): Promise<TokenPair> {
    const sessionUuid = randomUUID();
    const refreshToken = signRefreshToken({
      sub: user.uuid,
      userId: user.id.toString(),
      sessionId: sessionUuid,
    });

    const refreshExpiresMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);

    await sessionRepository.create({
      uuid: sessionUuid,
      user: { connect: { id: user.id } },
      refreshTokenHash: sha256Hash(refreshToken),
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      expiresAt: addSeconds(new Date(), refreshExpiresMs / 1000),
    });

    const { roles, permissions } = await loadRolesAndPermissions(user.id);

    const accessToken = signAccessToken({
      sub: user.uuid,
      userId: user.id.toString(),
      userType: user.userType,
      roles,
      permissions,
      sessionId: sessionUuid,
    });

    return {
      accessToken,
      refreshToken,
      sessionId: sessionUuid,
      expiresIn: parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN) / 1000,
    };
  }

  async rotateTokenPair(presentedRefreshToken: string, device: DeviceContext): Promise<TokenPair> {
    let payload;
    try {
      payload = verifyRefreshToken(presentedRefreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const session = await sessionRepository.findActiveByUuid(payload.sessionId);
    if (!session) {
      throw ApiError.unauthorized('Session expired or revoked');
    }

    if (session.refreshTokenHash !== sha256Hash(presentedRefreshToken)) {
      // Presented token doesn't match what we stored — possible reuse of a
      // rotated/stolen token. Revoke the session defensively.
      await sessionRepository.revoke(session.uuid);
      throw ApiError.unauthorized('Refresh token has already been rotated or is invalid');
    }

    const user = await userRepository.findById(session.userId);
    if (!user) {
      throw ApiError.unauthorized('User no longer exists');
    }

    // Rotate: revoke old session, issue a brand new one.
    await sessionRepository.revoke(session.uuid);
    return this.issueTokenPair(user, device);
  }

  async revokeSession(sessionUuid: string): Promise<void> {
    await sessionRepository.revoke(sessionUuid);
  }

  async revokeAllSessions(userId: bigint): Promise<void> {
    await sessionRepository.revokeAllForUser(userId);
  }
}

export const tokenService = new TokenService();
