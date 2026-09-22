import type { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function sendCsv(res: Response, filename: string, rows: Record<string, unknown>[]): void {
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const lines = [columns.join(','), ...rows.map((row) => columns.map((c) => csvEscape(row[c])).join(','))];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(lines.join('\n'));
}

async function sendExcel(res: Response, filename: string, sheetName: string, rows: Record<string, unknown>[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  sheet.columns = columns.map((c) => ({ header: c, key: c, width: 20 }));
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

function sendPdf(res: Response, filename: string, title: string, rows: Record<string, unknown>[]): void {
  const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  doc.fontSize(16).text(title);
  doc.moveDown(0.5);

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const startX = 40;
  const usableWidth = doc.page.width - 80;
  const colWidth = columns.length > 0 ? usableWidth / columns.length : usableWidth;

  doc.fontSize(9);
  let y = doc.y;
  columns.forEach((c, i) => doc.text(c, startX + i * colWidth, y, { width: colWidth }));
  y += 16;
  doc.moveTo(startX, y).lineTo(startX + usableWidth, y).stroke();
  y += 4;

  for (const row of rows) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 40;
    }
    columns.forEach((c, i) => doc.text(String(row[c] ?? ''), startX + i * colWidth, y, { width: colWidth }));
    y += 16;
  }

  doc.end();
}

/** Streams `rows` to the response in the requested tabular export format. */
export async function sendReportExport(
  res: Response,
  format: ExportFormat,
  options: { filename: string; title: string; rows: Record<string, unknown>[] },
): Promise<void> {
  if (format === 'csv') return sendCsv(res, options.filename, options.rows);
  if (format === 'xlsx') return sendExcel(res, options.filename, options.title, options.rows);
  return sendPdf(res, options.filename, options.title, options.rows);
}
