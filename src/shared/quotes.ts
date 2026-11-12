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
