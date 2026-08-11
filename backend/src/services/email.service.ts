import { EMAIL_JOB_NAMES } from '@/constants';
import { emailQueue } from '@/queues/email.queue';
import { welcomeEmailTemplate } from '@/emails/templates/welcome.template';
import { resetPasswordEmailTemplate } from '@/emails/templates/resetPassword.template';
import { otpEmailTemplate } from '@/emails/templates/otp.template';
import { env } from '@/config/env';

export class EmailService {
  async sendWelcomeEmail(to: string, fullName: string, verifyToken: string): Promise<void> {
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verifyToken}`;
    const { subject, html } = welcomeEmailTemplate(fullName, verifyUrl);
    await emailQueue.add(EMAIL_JOB_NAMES.WELCOME, { to, subject, html });
  }

  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    resetToken: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const { subject, html } = resetPasswordEmailTemplate(fullName, resetUrl, expiresInMinutes);
    await emailQueue.add(EMAIL_JOB_NAMES.RESET_PASSWORD, { to, subject, html });
  }

  async sendOtpEmail(to: string, otp: string, expiresInMinutes: number): Promise<void> {
    const { subject, html } = otpEmailTemplate(otp, expiresInMinutes);
    await emailQueue.add(EMAIL_JOB_NAMES.OTP, { to, subject, html });
  }
}

export const emailService = new EmailService();
