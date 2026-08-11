import { UserStatus, UserUserType, SchoolStatus, DealerStatus, type User, type SchoolSchoolType, type DealerBusinessType } from '@prisma/client';
import { userRepository } from '@/repositories/user.repository';
import { schoolRepository } from '@/repositories/school.repository';
import { dealerRepository } from '@/repositories/dealer.repository';
import { generateSchoolCode, generateDealerCode } from '@/helpers/accountCode.helper';
import { roleRepository } from '@/repositories/role.repository';
import { sessionRepository } from '@/repositories/session.repository';
import { loginHistoryRepository } from '@/repositories/loginHistory.repository';
import { passwordResetRepository } from '@/repositories/passwordReset.repository';
import { tokenService } from '@/services/token.service';
import { emailService } from '@/services/email.service';
import { hashPassword, comparePassword, generateRandomToken, sha256Hash } from '@/helpers/password.helper';
import { addMinutes } from '@/helpers/date.helper';
import { redis } from '@/config/redis';
import { ApiError } from '@/utils/ApiError';
import { eventBus, DOMAIN_EVENTS } from '@/events/eventBus';
import { logger } from '@/config/logger';
import type { DeviceContext } from '@/types';
import type { RegisterInput } from '@/validators/auth.validators';

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const PASSWORD_RESET_TTL_MINUTES = 30;
const EMAIL_VERIFY_TTL_HOURS = 24;

function emailVerifyKey(token: string): string {
  return `email-verify:${sha256Hash(token)}`;
}

export class AuthService {
  async register(input: RegisterInput): Promise<{ user: User }> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    if (input.phone) {
      const existingPhone = await userRepository.findByPhone(input.phone);
      if (existingPhone) {
        throw ApiError.conflict('An account with this phone number already exists');
      }
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.create({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      passwordHash,
      userType: input.userType as UserUserType,
      status: UserStatus.pending_verification,
      failedLoginCount: 0,
    });

    const defaultRole = await roleRepository.findBySlug(input.userType);
    if (defaultRole) {
      await roleRepository.assignToUser(user.id, defaultRole.id);
    } else {
      logger.warn({ userType: input.userType }, 'No default role found for user type — skipping role assignment');
    }

    // Every school/dealer account needs its profile row created up front — the
    // rest of the app (cart, wishlist, orders, dashboards, ...) is keyed off
    // School.id / Dealer.id, not User.id directly.
    if (input.userType === 'school' && input.schoolName && input.schoolType) {
      const schoolCode = await generateSchoolCode();
      await schoolRepository.create({
        schoolName: input.schoolName,
        schoolCode,
        schoolType: input.schoolType as SchoolSchoolType,
        status: SchoolStatus.pending_approval,
        user: { connect: { id: user.id } },
      });
    } else if (input.userType === 'dealer' && input.businessName && input.businessType) {
      const dealerCode = await generateDealerCode();
      await dealerRepository.create({
        businessName: input.businessName,
        dealerCode,
        businessType: input.businessType as DealerBusinessType,
        status: DealerStatus.pending_approval,
        commissionRate: 0,
        averageRating: 0,
        user: { connect: { id: user.id } },
      });
    }

    const verifyToken = generateRandomToken(32);
    await redis.set(emailVerifyKey(verifyToken), user.id.toString(), 'EX', EMAIL_VERIFY_TTL_HOURS * 3600);
    await emailService.sendWelcomeEmail(user.email, user.fullName, verifyToken);

    eventBus.emit(DOMAIN_EVENTS.USER_REGISTERED, { userId: user.id.toString() });

    return { user };
  }

  async login(
    email: string,
    password: string,
    device: DeviceContext,
  ): Promise<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }> {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw ApiError.forbidden('Account temporarily locked due to too many failed login attempts');
    }

    if (user.status === UserStatus.suspended) {
      throw ApiError.forbidden('This account has been suspended');
    }
    if (user.status === UserStatus.inactive) {
      throw ApiError.forbidden('This account is inactive');
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);

    if (!passwordMatches) {
      await this.handleFailedLogin(user, device);
      throw ApiError.unauthorized('Invalid email or password');
    }

    await userRepository.resetFailedLoginCount(user.id);
    await userRepository.touchLastLogin(user.id);
    await loginHistoryRepository.record({
      user: { connect: { id: user.id } },
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      status: 'success',
    });

    const { accessToken, refreshToken, expiresIn } = await tokenService.issueTokenPair(user, device);

    eventBus.emit(DOMAIN_EVENTS.USER_LOGGED_IN, { userId: user.id.toString() });

    return { user, accessToken, refreshToken, expiresIn };
  }

  private async handleFailedLogin(user: User, device: DeviceContext): Promise<void> {
    await loginHistoryRepository.record({
      user: { connect: { id: user.id } },
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      status: 'failed',
      reason: 'invalid_password',
    });

    const updated = await userRepository.incrementFailedLoginCount(user.id);
    if (updated.failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS) {
      await userRepository.lockUntil(user.id, addMinutes(new Date(), LOCKOUT_MINUTES));
    }
  }

  async refresh(
    refreshToken: string,
    device: DeviceContext,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    return tokenService.rotateTokenPair(refreshToken, device);
  }

  async logout(sessionId: string): Promise<void> {
    await tokenService.revokeSession(sessionId);
    eventBus.emit(DOMAIN_EVENTS.USER_LOGGED_OUT, { sessionId });
  }

  async logoutAllDevices(userId: bigint): Promise<void> {
    await tokenService.revokeAllSessions(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    // Deliberately do not reveal whether the account exists.
    if (!user) return;

    await passwordResetRepository.invalidateAllForUser(user.id);

    const rawToken = generateRandomToken(32);
    await passwordResetRepository.create({
      user: { connect: { id: user.id } },
      tokenHash: sha256Hash(rawToken),
      expiresAt: addMinutes(new Date(), PASSWORD_RESET_TTL_MINUTES),
    });

    await emailService.sendPasswordResetEmail(user.email, user.fullName, rawToken, PASSWORD_RESET_TTL_MINUTES);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const record = await passwordResetRepository.findValidByTokenHash(sha256Hash(rawToken));
    if (!record) {
      throw ApiError.badRequest('This reset link is invalid or has expired');
    }

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(record.userId, passwordHash);
    await passwordResetRepository.markUsed(record.id);
    await sessionRepository.revokeAllForUser(record.userId);

    eventBus.emit(DOMAIN_EVENTS.PASSWORD_CHANGED, { userId: record.userId.toString() });
  }

  async changePassword(userId: bigint, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const matches = await comparePassword(currentPassword, user.passwordHash);
    if (!matches) throw ApiError.badRequest('Current password is incorrect');

    const passwordHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, passwordHash);

    eventBus.emit(DOMAIN_EVENTS.PASSWORD_CHANGED, { userId: userId.toString() });
  }

  async verifyEmail(token: string): Promise<void> {
    const key = emailVerifyKey(token);
    const userId = await redis.get(key);
    if (!userId) {
      throw ApiError.badRequest('This verification link is invalid or has expired');
    }

    await userRepository.markEmailVerified(BigInt(userId));
    await userRepository.update(BigInt(userId), { status: UserStatus.active });
    await redis.del(key);

    eventBus.emit(DOMAIN_EVENTS.EMAIL_VERIFIED, { userId });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user || user.emailVerifiedAt) return; // silent no-op either way

    const verifyToken = generateRandomToken(32);
    await redis.set(emailVerifyKey(verifyToken), user.id.toString(), 'EX', EMAIL_VERIFY_TTL_HOURS * 3600);
    await emailService.sendWelcomeEmail(user.email, user.fullName, verifyToken);
  }
}

export const authService = new AuthService();
