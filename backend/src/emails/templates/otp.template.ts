import { emailLayout } from './layout';

export function otpEmailTemplate(otp: string, expiresInMinutes: number): { subject: string; html: string } {
  const subject = `${otp} is your The EduNest verification code`;
  const html = emailLayout(
    subject,
    `
    <h2 style="margin-top:0;">Your verification code</h2>
    <p>Use the code below to continue. It expires in ${expiresInMinutes} minutes.</p>
    <p style="text-align:center;margin:28px 0;">
      <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a2b4c;">${otp}</span>
    </p>
    <p style="color:#8896a6;font-size:13px;">Don't share this code with anyone, including EduNest staff.</p>
    `,
  );
  return { subject, html };
}
