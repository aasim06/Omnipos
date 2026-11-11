/**
 * Low-stock alert limits — one place for "is this item low / out?".
 *
 * Each product may set its own alert limit (Product.minThreshold):
 *   - a number above 0  → alert when stock is at or below it (decimals allowed: 2.5 KG)
 *   - 0                  → low-stock alert switched off for this item (it can still show "Out")
 *   - empty (null)       → use the store-wide default limit
 * The store-wide default is kept in localStorage for instant reads and in the backend's
 * AppSetting table (key below) so the backend can raise alerts with the same rule.
 */
import type { Product } from './types';
import { resolveApiUrl, getTenantHeaders } from './api';

export const LOW_STOCK_DEFAULT_SETTING = 'inventory.lowStockDefault';
const LOCAL_KEY = 'pos.lowStockDefault';
export const FALLBACK_LOW_STOCK_LIMIT = 10;

export type StockStatus = 'untracked' | 'out' | 'low' | 'ok';

function readLocalDefault(): number {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_KEY) : null;
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : FALLBACK_LOW_STOCK_LIMIT;
  } catch {
    return FALLBACK_LOW_STOCK_LIMIT;
  }
}

/** Store-wide default alert limit for items without their own limit. */
export function getLowStockDefault(): number {
  return readLocalDefault();
}

/** Save the store-wide default (local + backend). */
export async function setLowStockDefault(value: number): Promise<void> {
  const n = Math.max(0, Math.round((Number(value) || 0) * 1000) / 1000);
  try {
    localStorage.setItem(LOCAL_KEY, String(n));
  } catch {
    /* ignore */
  }
  try {
    const base = await resolveApiUrl();
    const headers = await getTenantHeaders();
    await fetch(`${base}/api/settings/${LOW_STOCK_DEFAULT_SETTING}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ value: n }),
    });
  } catch {
    /* offline: local value still applies */
  }
}

/** Refresh the cached default from the backend (call when inventory screens open). */
export async function loadLowStockDefault(): Promise<number> {
  try {
    const base = await resolveApiUrl();
    const headers = await getTenantHeaders();
    const res = await fetch(`${base}/api/settings/${LOW_STOCK_DEFAULT_SETTING}`, { headers });
    if (res.ok) {
      const data = await res.json();
      const n = Number(data?.value);
      if (Number.isFinite(n) && n >= 0) {
        localStorage.setItem(LOCAL_KEY, String(n));
        return n;
      }
    }
  } catch {
    /* ignore */
  }
  return readLocalDefault();
}

/** The alert limit that applies to a product, or null when its low-stock alert is off. */
export function getAlertLimit(p: Pick<Product, 'minThreshold'>): number | null {
  const own = p.minThreshold;
  if (own === null || own === undefined || (own as unknown) === '') {
    const d = getLowStockDefault();
    return d > 0 ? d : null;
  }
  const n = Number(own);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Number to compare stock against ("stock <= lowStockLimit(p)" means low).
 * Returns -Infinity when the alert is off so the comparison is never true.
 */
export function lowStockLimit(p: Pick<Product, 'minThreshold'>): number {
  return getAlertLimit(p) ?? Number.NEGATIVE_INFINITY;
}

/** Stock status of a product: untracked (no stock tracking), out, low or ok. */
export function getStockStatus(p: Pick<Product, 'openingStock' | 'minThreshold'>): StockStatus {
  if (p.openingStock === null || p.openingStock === undefined) return 'untracked';
  const stock = Number(p.openingStock) || 0;
  if (stock <= 0) return 'out';
  return stock <= lowStockLimit(p) ? 'low' : 'ok';
}
