import type { User, Session, LoginHistory } from '@prisma/client';

export function toPublicUser(user: User) {
  return {
    id: user.id.toString(),
    uuid: user.uuid,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export function toPublicSession(session: Session) {
  return {
    id: session.uuid,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  };
}

export function toPublicLoginHistory(entry: LoginHistory) {
  return {
    id: entry.id.toString(),
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    status: entry.status,
    reason: entry.reason,
    createdAt: entry.createdAt,
  };
}
