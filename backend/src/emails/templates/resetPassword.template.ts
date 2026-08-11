import { emailLayout } from './layout';

export function resetPasswordEmailTemplate(
  fullName: string,
  resetUrl: string,
  expiresInMinutes: number,
): { subject: string; html: string } {
  const subject = 'Reset your password';
  const html = emailLayout(
    subject,
    `
    <h2 style="margin-top:0;">Password reset request</h2>
    <p>Hi ${fullName}, we received a request to reset your password. This link expires in ${expiresInMinutes} minutes.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:#1a2b4c;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;display:inline-block;">
        Reset password
      </a>
    </p>
    <p style="color:#8896a6;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `,
  );
  return { subject, html };
}
