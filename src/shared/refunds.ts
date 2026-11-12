/**
 * Sales-return arithmetic shared by the backend refund route and the Process Return dialog,
 * so the till and the server agree on what is still returnable and what it is worth.
 */

export interface RefundableLine {
  productId?: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  variantLabel?: string | null;
  selectedUnit?: string | null;
}

export interface ReturnedLineLike {
  lineIndex?: number;
  productId?: string | null;
  name?: string;
  quantity: number;
  variantLabel?: string | null;
  selectedUnit?: string | null;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

const sameLine = (l: RefundableLine, r: ReturnedLineLike): boolean =>
  String(l.productId || '') === String(r.productId || '') &&
  (l.name || '') === (r.name || '') &&
  (l.variantLabel || '') === (r.variantLabel || '') &&
  (l.selectedUnit || '') === (r.selectedUnit || '');

/** Parse an OrderRefund.items value (JSON string or array) into returned lines. */
export function parseRefundItems(items: unknown): ReturnedLineLike[] {
  if (Array.isArray(items)) return items as ReturnedLineLike[];
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Quantity already returned for each order line, from the order's earlier refunds. Returns
 * recorded with a lineIndex count against that line; older ones (no index) are matched by
 * product / name / variant / unit and fill the matching lines in order.
 */
export function returnedQtyByLine(lines: RefundableLine[], previousReturns: ReturnedLineLike[]): number[] {
  const returned = lines.map(() => 0);
  for (const r of previousReturns) {
    let qty = Number(r.quantity) || 0;
    if (qty <= 0) continue;
    const idx = Number.isInteger(r.lineIndex) ? Number(r.lineIndex) : -1;
    if (idx >= 0 && idx < lines.length) {
      returned[idx] = round3(returned[idx] + qty);
      continue;
    }
    for (let i = 0; i < lines.length && qty > 0; i++) {
      if (!sameLine(lines[i], r)) continue;
      const room = Math.max(0, Number(lines[i].quantity || 0) - returned[i]);
      const take = Math.min(room, qty);
      returned[i] = round3(returned[i] + take);
      qty = round3(qty - take);
    }
  }
  return returned;
}

/**
 * What the customer actually paid per unit, relative to the list price: the bill total over the
 * gross of its lines. Carries the bill discount (and any charge added on top) into a return.
 */
export function billPriceFactor(lines: RefundableLine[], totalAmount: number): number {
  const gross = lines.reduce((s, l) => s + Number(l.unitPrice || 0) * Number(l.quantity || 0), 0);
  if (gross <= 0 || !(Number(totalAmount) >= 0)) return 1;
  return Number(totalAmount) / gross;
}

/** Refund value of returning `qty` units of a line at the price the customer paid. */
export function lineRefundValue(line: RefundableLine, qty: number, factor: number): number {
  return round2(qty * Number(line.unitPrice || 0) * factor);
}
