import { emailLayout } from './layout';

export function welcomeEmailTemplate(fullName: string, verifyUrl: string): { subject: string; html: string } {
  const subject = 'Welcome to The EduNest';
  const html = emailLayout(
    subject,
    `
    <h2 style="margin-top:0;">Welcome, ${fullName} 👋</h2>
    <p>Thanks for creating an account with The EduNest. Please verify your email address to activate your account.</p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="background:#1a2b4c;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;display:inline-block;">
        Verify my email
      </a>
    </p>
    <p style="color:#8896a6;font-size:13px;">Or copy this link into your browser: <br/>${verifyUrl}</p>
    `,
  );
  return { subject, html };
}
