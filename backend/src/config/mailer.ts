import nodemailer, { type Transporter } from 'nodemailer';
import { env, isTest } from './env';
import { logger } from './logger';

export const mailTransport: Transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export async function verifyMailTransport(): Promise<void> {
  if (isTest) return;
  try {
    await mailTransport.verify();
    logger.info('SMTP transport verified');
  } catch (err) {
    logger.warn({ err }, 'SMTP transport verification failed — emails will fail to send');
  }
}

export const mailDefaults = {
  from: `"${env.MAIL_FROM_NAME}" <${env.MAIL_FROM_ADDRESS}>`,
};
