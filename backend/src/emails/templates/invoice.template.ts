import { emailLayout } from './layout';

export function invoiceEmailTemplate(schoolName: string, invoiceNumber: string, totalAmount: string, downloadUrl: string) {
  const subject = `Invoice ${invoiceNumber} from EduNest`;
  const body = `
    <p>Dear ${schoolName},</p>
    <p>Your invoice <strong>${invoiceNumber}</strong> for <strong>₹${totalAmount}</strong> is ready.</p>
    <p><a href="${downloadUrl}" target="_blank" rel="noopener">Download Invoice PDF</a></p>
    <p>Thank you for your business.</p>
  `;
  return { subject, html: emailLayout(subject, body) };
}
