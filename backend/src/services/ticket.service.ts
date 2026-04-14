import { PDFDocument, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';

import * as saleService from './sale.service';
import * as configService from './config.service';
import { Sale } from '../entities/Sale';
import { BusinessConfig } from '../entities/BusinessConfig';

/* ── Constants ───────────────────────────────────────── */

const PAGE_WIDTH = 226; // ~80mm thermal printer
const MARGIN = 10;
const USABLE_WIDTH = PAGE_WIDTH - MARGIN * 2;

const FONT_LG = 10;
const FONT_MD = 8;
const FONT_SM = 7;
const LINE_LG = 13;
const LINE_MD = 11;
const LINE_SM = 9;
const SEPARATOR_GAP = 8;

// Column positions (x) for line items table
const COL_QTY = 100;
const COL_PRICE = 135;
const COL_SUBTOTAL = MARGIN + USABLE_WIDTH; // right edge

/* ── Helpers ─────────────────────────────────────────── */

function formatDate(date: Date): string {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function formatCurrency(amount: number, symbol: string): string {
  // Manual formatting to avoid Node.js ICU dependency
  const fixed = amount.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  // Add dots as thousands separator (Colombian format: $50.000,00)
  const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimals = decPart === '00' ? '' : `,${decPart}`;
  return `${symbol}${withSeparators}${decimals}`;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.substring(0, maxLen - 2) + '..' : text;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

function drawCentered(page: PDFPage, text: string, y: number, font: PDFFont, size: number): void {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_WIDTH - w) / 2, y, size, font });
}

function drawRight(page: PDFPage, text: string, y: number, font: PDFFont, size: number, rightX: number): void {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - w, y, size, font });
}

function drawSeparator(page: PDFPage, y: number, font: PDFFont): void {
  const dash = '- '.repeat(28);
  drawCentered(page, dash, y, font, FONT_SM);
}

/* ── Height calculator ───────────────────────────────── */

function calculateHeight(sale: Sale, config: BusinessConfig): number {
  let h = 15; // top margin

  // Section 1: Business header
  h += LINE_LG; // business name
  if (config.businessAddress) h += LINE_SM;
  if (config.businessPhone) h += LINE_SM;
  h += 2 + SEPARATOR_GAP; // pre-separator gap + separator

  // Section 2: Sale info
  h += LINE_MD * 3; // venta #, fecha, cajero
  if (sale.customer) h += LINE_MD;
  h += SEPARATOR_GAP; // separator

  // Section 3: Line items
  h += LINE_MD; // table header
  h += LINE_MD * sale.details.length; // item rows
  h += SEPARATOR_GAP; // separator

  // Section 4-5: Total + payment
  h += LINE_LG; // total
  h += LINE_MD; // payment method

  // Section 6: Credit (conditional)
  if (sale.status === 'pending' && sale.credit) {
    h += SEPARATOR_GAP; // separator
    h += LINE_MD * 2; // credit title + pending balance
  }

  // Section 7: Footer
  h += SEPARATOR_GAP; // separator
  h += LINE_SM; // thanks message

  h += 10; // bottom padding safety margin

  return h;
}

/* ── Main function ───────────────────────────────────── */

export async function generateTicketPdf(saleId: number): Promise<Buffer> {
  const [sale, config] = await Promise.all([
    saleService.findById(saleId),
    configService.getConfig(),
  ]);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageHeight = calculateHeight(sale, config);
  const page = doc.addPage([PAGE_WIDTH, pageHeight]);

  let y = pageHeight - 15;

  /* ── Section 1: Business Header ──── */
  drawCentered(page, config.businessName, y, bold, FONT_LG);
  y -= LINE_LG;

  if (config.businessAddress) {
    drawCentered(page, config.businessAddress, y, font, FONT_SM);
    y -= LINE_SM;
  }
  if (config.businessPhone) {
    drawCentered(page, `Tel: ${config.businessPhone}`, y, font, FONT_SM);
    y -= LINE_SM;
  }

  y -= 2;
  drawSeparator(page, y, font);
  y -= SEPARATOR_GAP;

  /* ── Section 2: Sale Info ──── */
  page.drawText(`Venta #${sale.id}`, { x: MARGIN, y, size: FONT_MD, font: bold });
  y -= LINE_MD;

  page.drawText(`Fecha: ${formatDate(sale.createdAt)}`, { x: MARGIN, y, size: FONT_MD, font });
  y -= LINE_MD;

  page.drawText(`Cajero: ${sale.cashier.name}`, { x: MARGIN, y, size: FONT_MD, font });
  y -= LINE_MD;

  if (sale.customer) {
    page.drawText(`Cliente: ${sale.customer.name}`, { x: MARGIN, y, size: FONT_MD, font });
    y -= LINE_MD;
  }

  drawSeparator(page, y, font);
  y -= SEPARATOR_GAP;

  /* ── Section 3: Line Items ──── */
  // Column headers
  page.drawText('Producto', { x: MARGIN, y, size: FONT_MD, font: bold });
  drawRight(page, 'Cant', y, bold, FONT_MD, COL_QTY + 18);
  drawRight(page, 'P.Unit', y, bold, FONT_MD, COL_PRICE + 30);
  drawRight(page, 'Subtotal', y, bold, FONT_MD, COL_SUBTOTAL);
  y -= LINE_MD;

  for (const detail of sale.details) {
    const name = truncate(detail.product.name, 16);
    page.drawText(name, { x: MARGIN, y, size: FONT_MD, font });
    drawRight(page, String(detail.quantity), y, font, FONT_MD, COL_QTY + 18);
    drawRight(page, formatCurrency(detail.unitPrice, config.currencySymbol), y, font, FONT_MD, COL_PRICE + 30);
    drawRight(page, formatCurrency(detail.subtotal, config.currencySymbol), y, font, FONT_MD, COL_SUBTOTAL);
    y -= LINE_MD;
  }

  drawSeparator(page, y, font);
  y -= SEPARATOR_GAP;

  /* ── Section 4: Total ──── */
  const totalText = `TOTAL: ${formatCurrency(sale.total, config.currencySymbol)}`;
  drawRight(page, totalText, y, bold, FONT_LG, COL_SUBTOTAL);
  y -= LINE_LG;

  /* ── Section 5: Payment Method ──── */
  const methodLabel = PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod;
  page.drawText(`Pago: ${methodLabel}`, { x: MARGIN, y, size: FONT_MD, font });
  y -= LINE_MD;

  /* ── Section 6: Credit Info (conditional) ──── */
  if (sale.status === 'pending' && sale.credit) {
    drawSeparator(page, y, font);
    y -= SEPARATOR_GAP;

    drawCentered(page, '** VENTA A CREDITO **', y, bold, FONT_MD);
    y -= LINE_MD;

    const pendingText = `Saldo pendiente: ${formatCurrency(sale.credit.pendingBalance, config.currencySymbol)}`;
    drawCentered(page, pendingText, y, font, FONT_MD);
    y -= LINE_MD;
  }

  /* ── Section 7: Footer ──── */
  drawSeparator(page, y, font);
  y -= SEPARATOR_GAP;

  drawCentered(page, 'Gracias por su compra!', y, font, FONT_SM);

  /* ── Serialize ──── */
  const bytes = await doc.save();
  return Buffer.from(bytes);
}
