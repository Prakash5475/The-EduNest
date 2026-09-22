import PDFDocument from 'pdfkit';

export interface QuotationPdfLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface QuotationPdfData {
  requestNumber: string;
  dealerBusinessName: string;
  schoolName: string;
  status: string;
  validityDays: number;
  submittedAt: Date;
  notes?: string | null;
  items: QuotationPdfLineItem[];
  totalAmount: number;
}

/** Renders a dealer's quotation to a PDF buffer. No disk I/O, no persistence — generated on demand. */
export function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('EduNest');
    doc.fontSize(16).text('Quotation', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Request No: ${data.requestNumber}`);
    doc.text(`Dealer: ${data.dealerBusinessName}`);
    doc.text(`School: ${data.schoolName}`);
    doc.text(`Status: ${data.status}`);
    doc.text(`Submitted: ${data.submittedAt.toISOString().slice(0, 10)}`);
    doc.text(`Valid for: ${data.validityDays} days`);
    if (data.notes) doc.text(`Notes: ${data.notes}`);
    doc.moveDown();

    const tableTop = doc.y;
    const cols = { desc: 50, qty: 320, price: 390, total: 470 };
    doc.fontSize(10).text('Description', cols.desc, tableTop);
    doc.text('Qty', cols.qty, tableTop);
    doc.text('Unit Price', cols.price, tableTop);
    doc.text('Line Total', cols.total, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 22;
    for (const item of data.items) {
      doc.text(item.description, cols.desc, y, { width: 260 });
      doc.text(String(item.quantity), cols.qty, y);
      doc.text(item.unitPrice.toFixed(2), cols.price, y);
      doc.text(item.lineTotal.toFixed(2), cols.total, y);
      y += 20;
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
    y += 15;
    doc.fontSize(12).text(`Total: ${data.totalAmount.toFixed(2)}`, cols.total - 60, y);

    doc.end();
  });
}
