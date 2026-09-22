import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api/v1'),
  APP_URL: z.string().url().default('http://localhost:4000'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  REDIS_PREFIX: z.string().default('edunest:'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  JWT_ISSUER: z.string().default('the-edunest'),
  JWT_AUDIENCE: z.string().default('the-edunest-clients'),

  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters'),
  REFRESH_COOKIE_NAME: z.string().default('edunest_rt'),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(6),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),

  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  MAIL_FROM_NAME: z.string().default('The EduNest'),
  MAIL_FROM_ADDRESS: z.string().email().default('no-reply@theedunest.com'),

  // WhatsApp Cloud API (Meta) — leave blank to disable; whatsapp.service.ts checks these
  // at call time and throws a clear error rather than silently pretending to send.
  WHATSAPP_API_VERSION: z.string().default('v20.0'),
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(''),
  WHATSAPP_ACCESS_TOKEN: z.string().default(''),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().default(''),


  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
  ADVANCE_PAYMENT_MIN_PERCENT: z.coerce.number().min(1).max(100).default(50),

  // Fallback only — the authoritative source is the admin-editable Settings table
  // (ApplicationSetting keys `company_gst_state`/`company_gstin`). These env vars exist
  // purely so GST calculation has *something* to fall back to before an admin ever opens
  // Settings; they are never hardcoded into the tax-calculation logic itself.
  COMPANY_GST_STATE: z.string().default(''),
  COMPANY_GSTIN: z.string().default(''),

  QUEUE_PREFIX: z.string().default('edunest'),

  SWAGGER_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  SWAGGER_ROUTE: z.string().default('/docs'),
});

type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:');
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

export const corsAllowedOrigins = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim());
