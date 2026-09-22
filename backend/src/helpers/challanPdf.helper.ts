import PDFDocument from 'pdfkit';

export interface ChallanPdfLineItem {
  description: string;
  quantity: number;
}

export interface ChallanPdfData {
  orderNumber: string;
  dealerBusinessName: string;
  schoolName: string;
  shippingAddress?: { addressLine1: string; addressLine2?: string | null; city: string; state: string; pincode: string } | null;
  dispatchedAt: Date;
  items: ChallanPdfLineItem[];
}

/** Renders a delivery challan (no pricing — quantities only) to a PDF buffer. No disk I/O, no persistence — generated on demand. */
export function renderChallanPdf(data: ChallanPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('EduNest');
    doc.fontSize(16).text('Delivery Challan', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Order No: ${data.orderNumber}`);
    doc.text(`Dispatched By (Dealer): ${data.dealerBusinessName}`);
    doc.text(`Date: ${data.dispatchedAt.toISOString().slice(0, 10)}`);
    doc.moveDown();

    doc.fontSize(11).text('Ship To', { underline: true });
    doc.fontSize(10).text(data.schoolName);
    if (data.shippingAddress) {
      const a = data.shippingAddress;
      doc.text([a.addressLine1, a.addressLine2, `${a.city}, ${a.state} ${a.pincode}`].filter(Boolean).join(', '));
    }
    doc.moveDown();

    const tableTop = doc.y;
    const cols = { desc: 50, qty: 460 };
    doc.fontSize(10).text('Description', cols.desc, tableTop);
    doc.text('Qty', cols.qty, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

    let y = tableTop + 22;
    for (const item of data.items) {
      doc.text(item.description, cols.desc, y, { width: 380 });
      doc.text(String(item.quantity), cols.qty, y);
      y += 20;
    }

    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
    y += 25;
    doc.fontSize(9).text('This is a delivery challan — no monetary value. Goods received in good condition.', cols.desc, y);
    y += 40;
    doc.text('Received by (signature): _______________________', cols.desc, y);

    doc.end();
  });
}
