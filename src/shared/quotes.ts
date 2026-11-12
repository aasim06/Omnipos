/**
 * Quotation numbering shared by the Quotations screen and the backend: QT-<year>-<4-digit sequence>,
 * restarting each year, e.g. QT-2026-0001.
 */

const QUOTE_NO = /^QT-(\d{4})-(\d+)$/i;

export function nextQuoteNumber(existing: Array<string | null | undefined>, now: Date = new Date()): string {
  const year = now.getFullYear();
  let max = 0;
  for (const n of existing) {
    const m = QUOTE_NO.exec(String(n || '').trim());
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }
  return `QT-${year}-${String(max + 1).padStart(4, '0')}`;
}

/** Same quote number regardless of case / spaces. */
export function sameQuoteNumber(a: unknown, b: unknown): boolean {
  return String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase();
}
