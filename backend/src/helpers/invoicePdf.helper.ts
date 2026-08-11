import PDFDocument from 'pdfkit';

export interface InvoicePdfLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  lineTotal: number;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  invoiceType: 'advance_receipt' | 'final_invoice';
  issuedAt: Date;
  orderNumber: string;
  schoolName: string;
  schoolGstin?: string | null;
  billingAddress?: { addressLine1: string; addressLine2?: string | null; city: string; state: string; pincode: string } | null;
  items: InvoicePdfLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

/** Renders an invoice/advance-receipt to a PDF buffer. No disk I/O — caller uploads the buffer wherever it needs to go. */
export function renderInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const title = data.invoiceType === 'final_invoice' ? 'GST Invoice' : 'Advance Receipt';
    doc.fontSize(18).text('EduNest', { continued: true }).fontSize(10).text('  ');
    doc.fontSize(16).text(title, { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Invoice No: ${data.invoiceNumber}`);
    doc.text(`Order No: ${data.orderNumber}`);
    doc.text(`Date: ${data.issuedAt.toISOString().slice(0, 10)}`);
    doc.moveDown();

    doc.fontSize(11).text('Billed To', { underline: true });
    doc.fontSize(10).text(data.schoolName);
    if (data.schoolGstin) doc.text(`GSTIN: ${data.schoolGstin}`);
    if (data.billingAddress) {
      const a = data.billingAddress;
      doc.text([a.addressLine1, a.addressLine2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(', '));
    }
    doc.moveDown();

    const tableTop = doc.y;
    const cols = { desc: 50, qty: 260, price: 320, tax: 390, total: 460 };
    doc.fontSize(10).text('Description', cols.desc, tableTop);
    doc.text('Qty', cols.qty, tableTop);
    doc.text('Unit Price', cols.price, tableTop);
    doc.text('Tax %', cols.tax, tableTop);
    doc.text('Line Total', cols.total, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 22;
    for (const item of data.items) {
      doc.text(item.description, cols.desc, y, { width: 200 });
      doc.text(String(item.quantity), cols.qty, y);
      doc.text(item.unitPrice.toFixed(2), cols.price, y);
      doc.text(`${item.taxRate.toFixed(2)}%`, cols.tax, y);
      doc.text(item.lineTotal.toFixed(2), cols.total, y);
      y += 20;
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
    y += 15;
    doc.text(`Subtotal: ${data.subtotal.toFixed(2)}`, cols.total - 60, y);
    y += 15;
    doc.text(`Tax: ${data.taxAmount.toFixed(2)}`, cols.total - 60, y);
    y += 15;
    doc.fontSize(11).text(`Total: ${data.totalAmount.toFixed(2)}`, cols.total - 60, y);

    doc.end();
  });
}
