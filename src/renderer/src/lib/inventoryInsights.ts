/**
 * Stock figures shared by the Inventory Dashboard and the Catalog Overview, so both always agree:
 * net sales per product, batch-wise expiry, reorder suggestions and stock flows for a period.
 */
import type { OrderRefund, Product, StockMovement } from '@shared/types';
import { parseRefundItems } from '@shared/refunds';
import { getAlertLimit } from './stockStatus';
import { reasonInfo } from '@/features/inventory/stockOutReasons';

const DAY = 86_400_000;
const r2 = (n: number) => Math.round(n * 100) / 100;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** Entries that cancel each other (an entry and its reversal) are left out of every figure. */
export function isLiveMovement(m: StockMovement): boolean {
  return !m.reversedAt && !m.reversalOf && m.reason !== 'Reversal';
}

/** Units sold per product since `since` (POS sales, less units returned by customers). */
export function netSoldSince(movements: StockMovement[], refunds: OrderRefund[], since: number): Map<string, number> {
  const sold = new Map<string, number>();
  for (const m of movements) {
    if (m.type !== 'out' || m.reason !== 'POS Sale' || !isLiveMovement(m)) continue;
    if (new Date(m.date).getTime() < since) continue;
    sold.set(m.productId, r3((sold.get(m.productId) || 0) + (Number(m.quantity) || 0)));
  }
  for (const r of refunds) {
    if (new Date(r.createdAt).getTime() < since) continue;
    for (const it of parseRefundItems(r.items) as any[]) {
      if (!it?.productId || !sold.has(it.productId)) continue;
      sold.set(it.productId, Math.max(0, r3((sold.get(it.productId) || 0) - (Number(it.quantity) || 0))));
    }
  }
  return sold;
}

export interface ExpiryItem {
  key: string;
  productId: string;
  name: string;
  batch: string | null;
  qty: number;
  /** Days until expiry (negative = already expired) */
  days: number;
  /** Value at cost */
  value: number;
}

/**
 * Stock that expires within `horizonDays` (or already has), batch by batch. Products without
 * batch records fall back to their own expiry date.
 */
export function expiryRisk(
  products: Product[],
  batches: { id: string; productId: string; batchNumber: string | null; expiryDate: string | null; remaining: number; unitCost?: number | null }[],
  horizonDays: number,
  now: number = Date.now()
): ExpiryItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const out: ExpiryItem[] = [];
  const withBatches = new Set<string>();
  const daysTo = (iso: string) => Math.ceil((new Date(iso).getTime() - now) / DAY);
  for (const b of batches) {
    const p = byId.get(b.productId);
    if (!p || !b.expiryDate || !(b.remaining > 0)) continue;
    withBatches.add(p.id);
    const days = daysTo(b.expiryDate);
    if (days > horizonDays) continue;
    out.push({
      key: b.id,
      productId: p.id,
      name: p.name,
      batch: b.batchNumber,
      qty: r3(b.remaining),
      days,
      value: r2(b.remaining * Number(b.unitCost ?? p.costPrice ?? 0)),
    });
  }
  for (const p of products) {
    if (withBatches.has(p.id) || !p.expiryDate || !(Number(p.openingStock) > 0)) continue;
    const days = daysTo(p.expiryDate);
    if (days > horizonDays) continue;
    out.push({
      key: `p_${p.id}`,
      productId: p.id,
      name: p.name,
      batch: p.batchNumber || null,
      qty: r3(Number(p.openingStock)),
      days,
      value: r2(Number(p.openingStock) * Number(p.costPrice || 0)),
    });
  }
  return out.sort((a, b) => a.days - b.days);
}

/**
 * How much to order: enough for `coverDays` of the average daily sales over `lookbackDays`, on top
 * of the item's alert (safety) level, less what is on hand. At least 1.
 */
export function suggestedReorderQty(p: Product, soldInLookback: number, lookbackDays = 30, coverDays = 14): number {
  const minLevel = getAlertLimit(p) ?? 0;
  const daily = soldInLookback / lookbackDays;
  const target = Math.ceil(daily * coverDays) + minLevel;
  return Math.max(1, Math.ceil(target - Math.max(0, Number(p.openingStock) || 0)));
}

export interface StockFlows {
  purchasesValue: number;
  purchasesEntries: number;
  customerReturnsValue: number;
  /** Loss / write-off (damage, expiry, theft…) by reason, at cost */
  losses: { reason: string; label: string; entries: number; units: number; value: number }[];
  lossValue: number;
  /** Internal use (store use, samples…) at cost */
  usageValue: number;
  /** Goods sent back to suppliers, at cost */
  vendorReturnsValue: number;
  /** Physical count corrections: + found, − missing, at cost */
  countGainValue: number;
  countLossValue: number;
  /** Cost of goods sold through the POS */
  salesCostValue: number;
}

/** What came in and went out (at cost) since `since`, reversed pairs left out. */
export function stockFlowsSince(movements: StockMovement[], since: number): StockFlows {
  const f: StockFlows = {
    purchasesValue: 0,
    purchasesEntries: 0,
    customerReturnsValue: 0,
    losses: [],
    lossValue: 0,
    usageValue: 0,
    vendorReturnsValue: 0,
    countGainValue: 0,
    countLossValue: 0,
    salesCostValue: 0,
  };
  const loss = new Map<string, { reason: string; label: string; entries: number; units: number; value: number }>();
  for (const m of movements) {
    if (!isLiveMovement(m) || new Date(m.date).getTime() < since) continue;
    const qty = Number(m.quantity) || 0;
    const value = qty * Number(m.unitCost || 0);
    const reason = m.reason || '';
    if (reason === 'Stock Count Adjustment') {
      if (m.type === 'in') f.countGainValue += value;
      else f.countLossValue += value;
      continue;
    }
    if (m.type === 'in') {
      if (reason === 'Sales Return / Customer Refund') f.customerReturnsValue += value;
      else {
        f.purchasesValue += value;
        f.purchasesEntries += 1;
      }
      continue;
    }
    if (reason === 'POS Sale' || reason === 'Recipe Usage') {
      f.salesCostValue += value;
      continue;
    }
    const info = reasonInfo(reason);
    if (info.kind === 'usage') f.usageValue += value;
    else if (info.kind === 'return') f.vendorReturnsValue += value;
    else {
      const e = loss.get(info.value || 'Other') || { reason: info.value || 'Other', label: info.label, entries: 0, units: 0, value: 0 };
      e.entries += 1;
      e.units = r3(e.units + qty);
      e.value += value;
      loss.set(e.reason, e);
      f.lossValue += value;
    }
  }
  f.losses = Array.from(loss.values())
    .map((e) => ({ ...e, value: r2(e.value) }))
    .sort((a, b) => b.value - a.value);
  for (const k of ['purchasesValue', 'customerReturnsValue', 'lossValue', 'usageValue', 'vendorReturnsValue', 'countGainValue', 'countLossValue', 'salesCostValue'] as const) {
    f[k] = r2(f[k]);
  }
  return f;
}

export const startOfMonth = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), 1).getTime();
export const startOfToday = (now = new Date()) => new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
