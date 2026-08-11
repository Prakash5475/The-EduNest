export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  DEALER: 'dealer',
  STAFF: 'staff',
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

export const USER_TYPES = ['school', 'dealer', 'admin', 'staff'] as const;

export const REDIS_KEYS = {
  otp: (identifier: string, purpose: string) => `otp:${purpose}:${identifier}`,
  otpAttempts: (identifier: string, purpose: string) => `otp:attempts:${purpose}:${identifier}`,
  session: (sessionUuid: string) => `session:${sessionUuid}`,
  userPermissions: (userId: string | number) => `perms:${userId}`,
  rateLimitAuth: (ip: string) => `ratelimit:auth:${ip}`,
  passwordResetLock: (userId: string | number) => `pwreset:lock:${userId}`,
} as const;

export const QUEUE_NAMES = {
  EMAIL: 'email-queue',
  NOTIFICATION: 'notification-queue',
  WHATSAPP: 'whatsapp-queue',
  WHATSAPP_INBOUND: 'whatsapp-inbound-queue',
} as const;

export const EMAIL_JOB_NAMES = {
  WELCOME: 'welcome-email',
  RESET_PASSWORD: 'reset-password-email',
  OTP: 'otp-email',
} as const;

export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_UNREAD_COUNT: 'notification:unread-count',
  AUTH_ERROR: 'auth:error',
  ORDER_SUBSCRIBE: 'order:subscribe',
  ORDER_TRACKING_UPDATE: 'order:tracking-update',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const COOKIE_MAX_AGE_MS = {
  REFRESH_TOKEN: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const;
