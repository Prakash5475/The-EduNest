import pino from 'pino';
import { env, isProduction } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'edunest-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.password_hash',
      '*.passwordHash',
      '*.token',
      '*.refreshToken',
      '*.otp',
    ],
    censor: '[REDACTED]',
  },
});

export const auditLogger = logger.child({ channel: 'audit' });
