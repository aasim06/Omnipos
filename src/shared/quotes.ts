/**
 * Yearly document numbering shared by the screens and the backend: <PREFIX>-<year>-<4-digit
 * sequence>, restarting each year. Quotations use QT-2026-0001, credit notes CN-2026-0001.
 */

export function nextYearlyNumber(prefix: string, existing: Array<string | null | undefined>, now: Date = new Date()): string {
  const year = now.getFullYear();
  const re = new RegExp(`^${prefix}-(\\d{4})-(\\d+)$`, 'i');
  let max = 0;
  for (const n of existing) {
    const m = re.exec(String(n || '').trim());
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }
  return `${prefix}-${year}-${String(max + 1).padStart(4, '0')}`;
}

export function nextQuoteNumber(existing: Array<string | null | undefined>, now: Date = new Date()): string {
  return nextYearlyNumber('QT', existing, now);
}

export function nextCreditNoteNumber(existing: Array<string | null | undefined>, now: Date = new Date()): string {
  return nextYearlyNumber('CN', existing, now);
}

/** Same quote number regardless of case / spaces. */
export function sameQuoteNumber(a: unknown, b: unknown): boolean {
  return String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase();
}

/**
 * Number for a revision of a quotation: QT-2026-0004 → QT-2026-0004-R1, then -R2, … based on the
 * revisions that already exist.
 */
export function nextRevisionNumber(baseNumber: string, existing: Array<string | null | undefined>): string {
  const root = String(baseNumber || '').trim().replace(/-R\d+$/i, '');
  const re = new RegExp(`^${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-R(\\d+)$`, 'i');
  let max = 0;
  for (const n of existing) {
    const m = re.exec(String(n || '').trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${root}-R${max + 1}`;
}

// ── Quotation lines: line discount, partial sales ──

export interface QuoteLineLike {
  unitPrice: number;
  quantity: number;
  /** Discount on this line only, in percent */
  discountPercent?: number;
  /** Units of this line already sold through the POS */
  soldQty?: number;
}

export interface QuoteSale {
  orderId: string;
  at: string;
  lines: { lineIndex: number; qty: number }[];
}

const r2q = (n: number) => Math.round(n * 100) / 100;
const r3q = (n: number) => Math.round(n * 1000) / 1000;

/** Unit price after the line's own discount. */
export function quoteLineUnitNet(line: QuoteLineLike): number {
  const d = Math.min(100, Math.max(0, Number(line.discountPercent) || 0));
  return r2q(Number(line.unitPrice || 0) * (1 - d / 100));
}

/** Line amount after the line's own discount (before any whole-bill discount). */
export function quoteLineNet(line: QuoteLineLike): number {
  return r2q(quoteLineUnitNet(line) * Number(line.quantity || 0));
}

/** Units of a line not yet sold. */
export function quoteLineRemaining(line: QuoteLineLike): number {
  return Math.max(0, r3q(Number(line.quantity || 0) - Number(line.soldQty || 0)));
}

/**
 * Record a POS sale against a quotation: each sold quotation line's soldQty grows (never past what
 * was quoted), the sale is logged once per order id, and the status becomes "partial" or, once
 * every unit is sold, "converted". Pure: returns the updated quotation, or the reason it was refused.
 */
export function applyQuotationSale<Q extends { status: string; lines: QuoteLineLike[]; sales?: QuoteSale[] | null; convertedOrderId?: string | null; convertedAt?: string | null; quoteNumber?: string }>(
  quote: Q,
  orderId: string,
  soldLines: { lineIndex: number; qty: number }[] | null | undefined,
  at: string = new Date().toISOString()
): { quote: Q; duplicate?: boolean; error?: string } {
  const sales = Array.isArray(quote.sales) ? quote.sales : [];
  if (sales.some((s) => s.orderId === orderId) || (quote.status === 'converted' && quote.convertedOrderId === orderId)) {
    return { quote, duplicate: true };
  }
  if (quote.status === 'converted') {
    return { quote, error: `Quotation ${quote.quoteNumber || ''} is already fully sold (order #${quote.convertedOrderId}).` };
  }
  const lines = quote.lines.map((l) => ({ ...l }));
  // No line detail (older tills): the sale takes everything still open
  const wanted = soldLines && soldLines.length > 0 ? soldLines : lines.map((l, i) => ({ lineIndex: i, qty: quoteLineRemaining(l) }));
  const applied: { lineIndex: number; qty: number }[] = [];
  for (const s of wanted) {
    const line = lines[s.lineIndex];
    if (!line) continue;
    const qty = Math.min(quoteLineRemaining(line), Math.max(0, Number(s.qty) || 0));
    if (qty <= 0) continue;
    line.soldQty = r3q(Number(line.soldQty || 0) + qty);
    applied.push({ lineIndex: s.lineIndex, qty });
  }
  if (applied.length === 0) {
    return { quote, error: 'Nothing from this quotation is left to sell in that order.' };
  }
  const allSold = lines.every((l) => quoteLineRemaining(l) <= 0);
  return {
    quote: {
      ...quote,
      lines,
      sales: [...sales, { orderId, at, lines: applied }],
      status: allSold ? 'converted' : 'partial',
      convertedOrderId: orderId,
      convertedAt: allSold ? at : quote.convertedAt ?? null,
    },
  };
}
