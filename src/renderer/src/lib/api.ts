import { Product, Category, Order, StockMovement, CategoryProfile, ModuleKey, ProductVariant, OrderRefund, ReturnedLineItem, Quotation } from './types';
import { offlineDb, LocalOrder, LocalCustomerKhata, LocalKhataTx, LocalExpense } from './offlineDb';
import { syncEngine } from './syncEngine';
import { KEYS, storage } from './storage';
import { uid } from './utils';
import { normalizePhone } from './khataRules';
import { computeKhataAging, KhataAging } from '@shared/khataAging';
import { nextQuoteNumber, nextRevisionNumber, applyQuotationSale, quoteLineRemaining } from '@shared/quotes';
import { parseRecipe, recipeLinesFor, recipeMovementId, RECIPE_USAGE_REASON } from './recipes';
import { decodeProductVariants, encodeProductVariants, setLocalVariantRegistry } from './variants';
import {
  CATEGORY_PROFILES,
  DefaultCategoryItem,
  BusinessProfile,
  BusinessCategoryTemplate,
} from './categoryProfiles';

let cachedApiUrl: string | null = null;
let cachedTenantMeta: { key?: string; schemaId?: string } | null = null;

export function resetTenantMeta(): void {
  cachedTenantMeta = null;
  cachedApiUrl = null;
}

/**
 * Signed-in user, sent to the local backend so it can refuse stock corrections from users
 * without the "Stock Corrections" permission. Base64(URI-encoded JSON) keeps it header-safe.
 */
function getUserHeader(): Record<string, string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('omnipos_user_session') : null;
    if (!raw) return {};
    const s = JSON.parse(raw);
    const payload = { name: s?.name || s?.username, role: s?.role, permissions: Array.isArray(s?.permissions) ? s.permissions : [] };
    return { 'x-omnipos-user': btoa(encodeURIComponent(JSON.stringify(payload))) };
  } catch {
    return {};
  }
}

export async function getTenantHeaders(): Promise<Record<string, string>> {
  return { ...(await getLicenseHeaders()), ...getUserHeader() };
}

async function getLicenseHeaders(): Promise<Record<string, string>> {
  if (cachedTenantMeta?.schemaId || cachedTenantMeta?.key) {
    return {
      ...(cachedTenantMeta.key ? { 'x-license-key': cachedTenantMeta.key } : {}),
      ...(cachedTenantMeta.schemaId ? { 'x-schema-id': cachedTenantMeta.schemaId } : {}),
    };
  }

  if (typeof window !== 'undefined' && window.posApi?.getLicenseMeta) {
    try {
      const meta = await window.posApi.getLicenseMeta();
      if (meta?.key || meta?.schemaId) {
        cachedTenantMeta = meta;
        return {
          ...(meta.key ? { 'x-license-key': meta.key } : {}),
          ...(meta.schemaId ? { 'x-schema-id': meta.schemaId } : {}),
        };
      }
    } catch {
      /* ignore */
    }
  }

  // Web Browser fallback (e.g. running on localhost:5174 or online)
  if (typeof window !== 'undefined' && window.localStorage) {
    const key = localStorage.getItem('omnipos_active_key');
    const schemaId = localStorage.getItem('omnipos_active_schema');
    if (key || schemaId) {
      return {
        ...(key ? { 'x-license-key': key } : {}),
        ...(schemaId ? { 'x-schema-id': schemaId } : {}),
      };
    }
  }

  return {};
}

/** True when running inside Electron desktop app */
const isElectron = typeof window !== 'undefined' && !!(window as any).posApi?.isElectron;

export async function resolveApiUrl(): Promise<string> {
  // ── Electron Desktop App: ALWAYS use local Express server ──────────────────
  // Products, categories, orders — all live in local SQLite.
  // We NEVER use Vercel when running inside Electron.
  if (isElectron) {
    // Return cached local URL immediately on subsequent calls
    if (cachedApiUrl) return cachedApiUrl;

    // Try the waiting IPC handler first (waits up to 5s for server to be ready)
    if ((window as any).posApi?.getLocalApiUrl) {
      try {
        const url = await (window as any).posApi.getLocalApiUrl();
        if (url && typeof url === 'string' && url.startsWith('http')) {
          cachedApiUrl = url;
          return url;
        }
      } catch { /* fall through */ }
    }

    // Fallback: non-waiting IPC with manual retry (up to 3s)
    for (let attempt = 0; attempt < 30; attempt++) {
      try {
        const url = await (window as any).posApi.getApiUrl();
        if (url && typeof url === 'string' && url.startsWith('http')) {
          cachedApiUrl = url;
          return url;
        }
      } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, 100));
    }

    // Last resort: scan common ports
    for (const port of [3001, 3000, 4000]) {
      try {
        const r = await fetch(`http://127.0.0.1:${port}/health`, {
          signal: AbortSignal.timeout(500),
        });
        if (r.ok) {
          cachedApiUrl = `http://127.0.0.1:${port}`;
          return cachedApiUrl;
        }
      } catch { /* try next */ }
    }

    // If we still can't connect (very rare), return localhost placeholder
    // so at least fetch errors are informative rather than hitting Vercel
    console.warn('[OmniPOS] Could not reach local backend server.');
    return 'http://127.0.0.1:3001';
  }

  // ── Web Browser: use cached URL or Vercel cloud ─────────────────────────────
  if (cachedApiUrl) return cachedApiUrl;

  if (typeof window !== 'undefined' && window.posApi?.getApiUrl) {
    try {
      const url = await window.posApi.getApiUrl();
      if (url && typeof url === 'string' && url.startsWith('http')) {
        cachedApiUrl = url;
        return url;
      }
    } catch { /* ignore */ }
  }

  const envUrl = (import.meta as any).env?.VITE_API_URL || 'https://omni-server-seven.vercel.app';
  return envUrl;
}

const DELETED_MOVEMENTS_KEY = 'omnipos_deleted_stock_movement_ids';

const LEGACY_DEMO_MOVEMENT_IDS = new Set([
  'mov_1788421309500',
  'mov_1788420004940',
  'mov_1788412007818',
]);

export function getDeletedMovementIds(): Set<string> {
  const set = new Set<string>(LEGACY_DEMO_MOVEMENT_IDS);
  try {
    const raw = localStorage.getItem(DELETED_MOVEMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id: string) => set.add(id));
      }
    }
  } catch {}
  return set;
}

export function recordDeletedMovementId(id: string): void {
  try {
    const set = getDeletedMovementIds();
    set.add(id);
    localStorage.setItem(DELETED_MOVEMENTS_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

/**
 * Apply a stock delta to the variant matching `variantLabel` on a local product.
 * Returns the updated variants array (and refreshes the local variant registry),
 * or null when the line has no variant or that variant does not track stock.
 */
function applyVariantStockDelta(product: Product, variantLabel: string | undefined, delta: number): ProductVariant[] | null {
  if (!variantLabel) return null;
  const decoded = decodeProductVariants(product);
  const variants = Array.isArray(decoded.variants) ? decoded.variants : [];
  const label = variantLabel.trim().toLowerCase();
  let changed = false;
  const next = variants.map((v) => {
    if (!changed && (v.label || '').trim().toLowerCase() === label && v.stock !== undefined && v.stock !== null) {
      changed = true;
      return { ...v, stock: Math.max(0, Number(v.stock || 0) + delta) };
    }
    return v;
  });
  if (!changed) return null;
  setLocalVariantRegistry(product.id, next, decoded.pricingType);
  return next;
}

/** Deduct a sold menu item's recipe ingredients in Dexie and log 'Recipe Usage' movements (idempotent). */
async function consumeLocalRecipe(
  order: Pick<Order, 'id' | 'module' | 'createdAt'>,
  lineIndex: number,
  line: { quantity?: number; variantLabel?: string; selectedUnit?: string },
  product: Product
): Promise<void> {
  const lines = recipeLinesFor(parseRecipe(product.recipe), line.variantLabel);
  const soldQty = baseQuantity(line, product);
  for (let k = 0; k < lines.length; k++) {
    const r = lines[k];
    const used = round3(r.quantity * soldQty);
    if (used <= 0) continue;
    const id = recipeMovementId(order.id, lineIndex, k);
    if (await offlineDb.stockMovements.get(id)) continue;
    const ingredient = await offlineDb.products.get(r.ingredientId);
    if (!ingredient || ingredient.openingStock === undefined || ingredient.openingStock === null) continue;
    await offlineDb.products.update(ingredient.id, {
      openingStock: Math.max(0, round3(Number(ingredient.openingStock || 0) - used)),
      updatedAt: new Date().toISOString(),
    });
    await offlineDb.stockMovements.put({
      id,
      module: order.module || ingredient.module || 'fastfood',
      productId: ingredient.id,
      productName: ingredient.name,
      type: 'out',
      quantity: used,
      unitCost: ingredient.costPrice ?? null,
      reason: RECIPE_USAGE_REASON,
      createdBy: 'POS',
      note: `Sale Order #${order.id}: ${soldQty} × ${product.name}${line.variantLabel ? ` (${line.variantLabel})` : ''}`,
      date: order.createdAt || new Date().toISOString(),
    });
  }
}

/** Round to 3 decimals so decimal stock (KG, L) doesn't drift. Mirrors the backend. */
export const round3 = (n: number): number => Math.round((Number(n) || 0) * 1000) / 1000;

/** Display name of the signed-in user, recorded on stock and ledger entries. */
export function currentUserName(): string | undefined {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('omnipos_user_session') : null;
    if (!raw) return undefined;
    const s = JSON.parse(raw);
    return (s?.name || s?.username || undefined) as string | undefined;
  } catch {
    return undefined;
  }
}

/** Quantity of a sale line in the product's base unit (wholesale-unit lines × conversion rate). */
function baseQuantity(line: { quantity?: number; selectedUnit?: string }, product: Pick<Product, 'conversionRate'> | undefined): number {
  const qty = Number(line.quantity || 1);
  const rate = Number(product?.conversionRate || 0);
  return round3(line.selectedUnit === 'primary' && rate > 1 ? qty * rate : qty);
}

/** Signed effect of a movement on product stock (+ for 'in', − for 'out'). */
function movementDelta(m: Pick<StockMovement, 'type' | 'quantity'>): number {
  const qty = Number(m.quantity || 0);
  return m.type === 'in' ? qty : -qty;
}

/** Apply a stock delta to a local product (Dexie + synchronous storage cache). */
async function applyLocalProductStockDelta(productId: string, delta: number): Promise<void> {
  if (!productId || !delta) return;
  const prod = await offlineDb.products.get(productId);
  if (!prod) return;
  const updates: Partial<Product> = {
    openingStock: Math.max(0, round3(Number(prod.openingStock || 0) + delta)),
    updatedAt: new Date().toISOString(),
  };
  await offlineDb.products.update(productId, updates);
  const cached = storage.getList<Product>(KEYS.products);
  storage.setList(KEYS.products, cached.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
}

/** Parse a movement's size/variant split ({ S: 2, M: 3 }) from an object or JSON string. */
export function parseVariantAllocations(raw: StockMovement['variantAllocations']): Record<string, number> {
  let v: any = raw;
  try {
    if (typeof v === 'string') v = v.trim() ? JSON.parse(v) : {};
  } catch {
    return {};
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: Record<string, number> = {};
  for (const [label, qty] of Object.entries(v)) {
    const n = round3(Number(qty));
    if (label && n > 0) out[label] = n;
  }
  return out;
}

/** True when a patch changes stock or value (and so must be posted as a correction). Mirrors the backend. */
function movementStockChanged(prev: StockMovement, patch: Partial<StockMovement>): boolean {
  if (patch.quantity !== undefined && round3(Number(patch.quantity)) !== round3(Number(prev.quantity))) return true;
  if (patch.type !== undefined && patch.type !== prev.type) return true;
  if (patch.unitCost !== undefined && (patch.unitCost ? Number(patch.unitCost) : null) !== (prev.unitCost ?? null)) return true;
  if (patch.productId !== undefined && patch.productId !== prev.productId) return true;
  if (
    patch.variantAllocations !== undefined &&
    JSON.stringify(parseVariantAllocations(patch.variantAllocations)) !== JSON.stringify(parseVariantAllocations(prev.variantAllocations))
  ) {
    return true;
  }
  return false;
}

/** Apply (sign 1) or undo (sign -1) a movement's effect on local stock and size stock. */
async function applyLocalMovementEffect(m: StockMovement, sign: 1 | -1): Promise<void> {
  try {
    await applyLocalProductStockDelta(m.productId, sign * movementDelta(m));
    const allocations = parseVariantAllocations(m.variantAllocations);
    if (Object.keys(allocations).length === 0) return;
    let prod = await offlineDb.products.get(m.productId);
    if (!prod) return;
    for (const [label, qty] of Object.entries(allocations)) {
      const next = applyVariantStockDelta(prod, label, sign * (m.type === 'in' ? qty : -qty));
      if (next) prod = { ...prod, variants: next };
    }
    await offlineDb.products.update(prod.id, { variants: prod.variants });
  } catch (err) {
    console.warn('[OfflineDB] local stock effect failed:', err);
  }
}

/** Mark a movement reversed locally, add its reversal entry and undo its stock effect. */
async function reverseLocally(existing: StockMovement, by: string | null, why?: string): Promise<void> {
  const now = new Date().toISOString();
  await offlineDb.stockMovements.put({
    ...existing,
    id: `rev_${existing.id}`,
    type: existing.type === 'in' ? 'out' : 'in',
    reason: 'Reversal',
    note: `Reversal of "${existing.reason || existing.type}" entry #${existing.id.slice(-8)}${why ? ` — ${why}` : ''}`,
    createdBy: by,
    reversalOf: existing.id,
    reversedAt: null,
    reversedBy: null,
    correctionOf: null,
    date: now,
  });
  await offlineDb.stockMovements.update(existing.id, { reversedAt: now, reversedBy: by });
  await applyLocalMovementEffect(existing, -1);
}

/**
 * Send a stock request to the backend. Resolves null when offline / unreachable (caller queues
 * it), otherwise { ok, status, error }.
 */
async function sendStockRequest(
  method: 'POST' | 'PUT',
  path: string,
  body: unknown
): Promise<{ ok: boolean; status: number; error?: string } | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  try {
    const base = await resolveApiUrl();
    const tenantHeaders = await getTenantHeaders();
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...tenantHeaders },
      body: JSON.stringify(body),
    });
    let error: string | undefined;
    if (!res.ok) {
      try {
        error = (await res.json())?.error;
      } catch {
        /* ignore */
      }
    }
    return { ok: res.ok || res.status === 404, status: res.status, error };
  } catch {
    return null;
  }
}

/** Active low-stock alert as returned by GET /api/stock-alerts. */
export interface StockAlertRow {
  id: string;
  productId: string;
  productName: string;
  level: 'low' | 'out';
  stock: number;
  limit: number | null;
  unit: string | null;
  costPrice: number | null;
  module: string | null;
  suggestedQty: number;
  status: string;
  readAt: string | null;
  snoozedUntil: string | null;
  createdAt: string;
}

/** Call a quotation endpoint on the backend; null when it cannot be reached. */
async function quoteBackend(path: string, init?: RequestInit): Promise<Response | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return null;
  try {
    const base = await resolveApiUrl();
    const tenantHeaders = await getTenantHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      return await fetch(`${base}${path}`, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...tenantHeaders, ...(init?.headers || {}) },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return null;
  }
}

/**
 * Send one local quotation to the backend and store the server's copy. Returns the server's
 * refusal message (e.g. it was already sold on another counter), or null when sent / offline.
 */
async function pushQuotation(q: Quotation & { synced?: 0 | 1 }): Promise<string | null> {
  const storeServerCopy = async (res: Response) => {
    const saved = await res.json().catch(() => null);
    if (saved?.id) await offlineDb.quotations.put({ ...saved, synced: 1 });
  };
  const errorOf = async (res: Response) => {
    const body = await res.json().catch(() => ({}));
    if (body?.quotation?.id) await offlineDb.quotations.put({ ...body.quotation, synced: 1 });
    return String(body?.error || `Quotation was refused (${res.status})`);
  };
  const postQuote = (status: Quotation['status']) =>
    quoteBackend('/api/quotations', { method: 'POST', body: JSON.stringify({ ...q, status }) });

  const sales = Array.isArray(q.sales) ? q.sales : [];
  if (sales.length > 0 || q.status === 'converted') {
    // One call per POS sale (the backend ignores an order it already recorded). Older tills sold
    // the whole quote without line detail: that is a single sale of everything.
    const toSend: (typeof sales[number] | null)[] = sales.length > 0 ? sales : [null];
    let last: Response | null = null;
    for (const sale of toSend) {
      const convert = () =>
        quoteBackend(`/api/quotations/${encodeURIComponent(q.id)}/convert`, {
          method: 'POST',
          body: JSON.stringify(sale ? { orderId: sale.orderId, lines: sale.lines, at: sale.at } : { orderId: q.convertedOrderId }),
        });
      let res = await convert();
      if (res?.status === 404) {
        // Never reached the backend before it was sold: create it, then record the sale
        const created = await postQuote('accepted');
        if (!created?.ok) return null;
        res = await convert();
      }
      if (!res) return null;
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return res.status >= 400 && res.status < 500 ? String(body?.error || 'Quotation was refused') : null;
      }
      last = res;
    }
    // A partly sold quote may still take an advance: keep the backend's figure in step
    if (q.status === 'partial' && Number(q.advanceAmount || 0) > 0) {
      const adv = await postQuote('partial');
      if (adv?.ok) last = adv;
    }
    if (last) await storeServerCopy(last);
    return null;
  }

  const res = await postQuote(q.status);
  if (!res) return null;
  if (res.ok) {
    await storeServerCopy(res);
    return null;
  }
  return res.status >= 400 && res.status < 500 ? errorOf(res) : null;
}

export const posApi = {
  /**
   * Fetch products: Cache-First for instant UI load (<5ms).
   * Immediately returns local Dexie IndexedDB / LocalStorage data,
   * then updates cache in the background without blocking the UI.
   */
  async fetchProducts(module?: string): Promise<Product[]> {
    // 1. Instant local Dexie check
    let localProducts: Product[] = [];
    try {
      const allDexie = await offlineDb.products.toArray();
      if (allDexie && allDexie.length > 0) {
        localProducts = allDexie.map(decodeProductVariants);
      }
    } catch (dexieErr) {
      console.warn('[OfflineDB] Dexie product query error:', dexieErr);
    }

    // 2. Fallback to LocalStorage dual-cache
    if (localProducts.length === 0) {
      try {
        const localFallback = storage.getList<Product>(KEYS.products);
        if (localFallback && localFallback.length > 0) {
          localProducts = localFallback.map(decodeProductVariants);
        }
      } catch (storageErr) {
        console.warn('[Storage] localStorage product query error:', storageErr);
      }
    }



    // Background sync helper: update cache without stalling the UI
    const syncRemote = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const tenantHeaders = await getTenantHeaders();
        const base = await resolveApiUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/products${module ? `?module=${module}` : ''}`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const remoteRaw = await res.json();
          if (Array.isArray(remoteRaw) && remoteRaw.length > 0) {
            const currentLocal = storage.getList<Product>(KEYS.products);
            const localMap = new Map(currentLocal.map((p) => [p.id, p]));

            const normalizedProducts: Product[] = remoteRaw.map((rawP: Product) => {
              const existing = localMap.get(rawP.id);
              const merged: Product = {
                ...rawP,
                variants: rawP.variants || existing?.variants,
                hasVariants: Boolean(rawP.hasVariants || existing?.hasVariants),
                pricingType: rawP.pricingType || existing?.pricingType,
              };
              return decodeProductVariants(merged);
            });

            // Save to Dexie IndexedDB
            try {
              await offlineDb.products.bulkPut(normalizedProducts);
            } catch (err) {
              console.warn('[OfflineDB] bulkPut products error:', err);
            }

            // Save to LocalStorage Dual-Cache
            try {
              const map = new Map(currentLocal.map((p) => [p.id, p]));
              normalizedProducts.forEach((p) => map.set(p.id, p));
              storage.setList(KEYS.products, Array.from(map.values()));
            } catch (err) {
              console.warn('[Storage] setList products error:', err);
            }
          }
        }
      } catch {
        /* Offline: background sync failed silently */
      }
    };

    // If local products exist, return them immediately (<5ms) and sync in background!
    if (localProducts.length > 0) {
      syncRemote().catch(() => {});
      if (module) {
        return localProducts.filter((p) => p.module === module);
      }
      return localProducts;
    }

    // Only if absolutely NO local products exist (first run or after purge), await network
    await syncRemote();
    try {
      const freshDexie = await offlineDb.products.toArray();
      if (freshDexie && freshDexie.length > 0) {
        const decoded = freshDexie.map(decodeProductVariants);
        return module ? decoded.filter((p) => p.module === module) : decoded;
      }
    } catch {}

    return [];
  },

  async saveProduct(product: Product): Promise<Product> {
    const decodedProduct = decodeProductVariants(product);

    // Save to local variant registry
    if (decodedProduct.variants && decodedProduct.variants.length > 0) {
      setLocalVariantRegistry(decodedProduct.id, decodedProduct.variants, decodedProduct.pricingType);
    }

    // Cloud-safe product with encoded variants in description
    const cloudPayload: Product = {
      ...decodedProduct,
      description: encodeProductVariants(
        decodedProduct.description,
        decodedProduct.variants,
        decodedProduct.pricingType
      ),
    };

    try {
      // 1. Write immediately to local Dexie IndexedDB
      await offlineDb.products.put(decodedProduct);

      // 2. Write immediately to LocalStorage
      const currentList = storage.getList<Product>(KEYS.products);
      const updated = [decodedProduct, ...currentList.filter((p) => p.id !== decodedProduct.id)];
      storage.setList(KEYS.products, updated);

      // 3. Queue in Outbox for background cloud sync
      await syncEngine.enqueue('product', decodedProduct.id, 'CREATE', cloudPayload);

      // 4. Try immediate network push if online
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(`${base}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders },
          body: JSON.stringify(cloudPayload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const remote = await res.json();
          return decodeProductVariants({ ...remote, variants: decodedProduct.variants, pricingType: decodedProduct.pricingType });
        } else {
          console.warn('[saveProduct] Local backend returned non-OK status:', res.status, await res.text().catch(() => ''));
        }
      }
    } catch (saveErr) {
      console.warn('[saveProduct] Offline fallback active:', saveErr);
      /* Saved safely offline in Dexie, localStorage, and Outbox */
    }
    return decodedProduct;
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await offlineDb.products.delete(id);
      const currentList = storage.getList<Product>(KEYS.products);
      storage.setList(KEYS.products, currentList.filter((p) => p.id !== id));
      await syncEngine.enqueue('product', id, 'DELETE', { id });

      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        await fetch(`${base}/api/products/${id}`, {
          method: 'DELETE',
          headers: tenantHeaders,
        });
      }
    } catch {
      /* Handled offline */
    }
  },

  /**
   * Fetch categories: Cache-First for instant UI load (<5ms).
   */
  async fetchCategories(module?: string): Promise<Category[]> {
    let localCats: Category[] = [];
    try {
      const allCats = await offlineDb.categories.toArray();
      if (allCats && allCats.length > 0) {
        localCats = allCats;
      }
    } catch {}

    if (localCats.length === 0) {
      try {
        const stored = storage.getList<Category>(KEYS.categories);
        if (stored && stored.length > 0) {
          localCats = stored;
        }
      } catch {}
    }



    // Auto-correct any non-shoe categories (like DVR / CCTV) that may have been saved with footwear profile
    let hasUpdatedCats = false;
    localCats = localCats.map((c) => {
      const n = (c.name || '').toLowerCase().trim();
      if (c.profile === 'footwear' && /(dvr|cctv|camera|nvr)/i.test(n)) {
        hasUpdatedCats = true;
        return {
          ...c,
          profile: 'cctv' as CategoryProfile,
          suggestedSizes: [],
          suggestedUnits: ['PCS', 'SET', 'BOX', 'COIL', 'METER'],
        };
      }
      if (c.profile === 'footwear' && /(cable|wire|screen|tv|monitor|laptop|computer|electronics|grocery|general|mobile|phone|food)/i.test(n)) {
        hasUpdatedCats = true;
        return {
          ...c,
          profile: 'standard' as CategoryProfile,
          suggestedSizes: [],
          suggestedUnits: ['PCS', 'BOX', 'PACK'],
        };
      }
      return c;
    });
    if (hasUpdatedCats) {
      void offlineDb.categories.bulkPut(localCats);
      storage.setList(KEYS.categories, localCats);
    }

    const syncRemoteCategories = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const tenantHeaders = await getTenantHeaders();
        const base = await resolveApiUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/categories${module ? `?module=${module}` : ''}`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const remoteCats = await res.json();
          if (Array.isArray(remoteCats) && remoteCats.length > 0) {
            // Merge onto the local copy: the server does not store every field (e.g. profile),
            // and empty server values must not wipe a colour or icon saved locally.
            const localById = new Map(localCats.map((c) => [c.id, c]));
            const merged: Category[] = remoteCats.map((r: Category) => {
              const l = localById.get(r.id);
              if (!l) return r;
              const out: Category = { ...l };
              (Object.keys(r) as (keyof Category)[]).forEach((k) => {
                if (r[k] !== null && r[k] !== undefined) (out as any)[k] = r[k];
              });
              return out;
            });
            try { await offlineDb.categories.bulkPut(merged); } catch {}
            try {
              const currentLocal = storage.getList<Category>(KEYS.categories);
              const map = new Map(currentLocal.map((c) => [c.id, c]));
              merged.forEach((c) => map.set(c.id, c));
              storage.setList(KEYS.categories, Array.from(map.values()));
            } catch {}
          }
        }
      } catch {}
    };

    // Return instant local categories (<5ms) and sync in background
    if (localCats.length > 0) {
      syncRemoteCategories().catch(() => {});
      if (module) {
        return localCats.filter((c) => !c.module || c.module === module);
      }
      return localCats;
    }

    await syncRemoteCategories();
    try {
      const freshCats = await offlineDb.categories.toArray();
      if (freshCats.length > 0) {
        return module ? freshCats.filter((c) => !c.module || c.module === module) : freshCats;
      }
    } catch {}

    return [];
  },

  async saveCategory(cat: Category): Promise<Category> {
    try {
      await offlineDb.categories.put(cat);
      const current = storage.getList<Category>(KEYS.categories);
      storage.setList(KEYS.categories, [cat, ...current.filter((c) => c.id !== cat.id)]);

      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const res = await fetch(`${base}/api/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders },
          body: JSON.stringify(cat),
        });
        if (res.ok) return await res.json();
      }
    } catch {
      /* Saved in Dexie and LocalStorage */
    }
    return cat;
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      await offlineDb.categories.delete(id);
      const current = storage.getList<Category>(KEYS.categories);
      storage.setList(KEYS.categories, current.filter((c) => c.id !== id));

      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        await fetch(`${base}/api/categories/${id}`, {
          method: 'DELETE',
          headers: tenantHeaders,
        });
      }
    } catch {
      /* Handled */
    }
  },

  /**
   * Fetch Default Categories by Business Profile from database/backend template registry
   */
  async fetchDefaultCategories(
    profile?: string,
    module?: string
  ): Promise<DefaultCategoryItem[]> {
    try {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const query = new URLSearchParams();
        if (profile) query.set('profile', profile);
        if (module) query.set('module', module);

        const res = await fetch(`${base}/api/categories/default-templates?${query.toString()}`, {
          headers: tenantHeaders,
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            return list;
          }
        }
      }
    } catch {
      /* network or server error */
    }

    return [];
  },

  /**
   * Fetch Business Profiles from backend (omnipos-server / embedded backend)
   */
  async fetchBusinessProfiles(): Promise<BusinessProfile[]> {
    try {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const res = await fetch(`${base}/api/business-profiles`, {
          headers: tenantHeaders,
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) return list;
        }
      }
    } catch {}
    return [];
  },

  async fetchBusinessProfile(id: string): Promise<BusinessProfile | null> {
    try {
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const res = await fetch(`${base}/api/business-profiles/${id}`, {
          headers: tenantHeaders,
        });
        if (res.ok) {
          return await res.json();
        }
      }
    } catch {}
    return null;
  },

  /**
   * Fetch Khatas: Cache-First for instant load (<5ms)
   */
  async fetchKhatas(): Promise<LocalCustomerKhata[]> {
    let localKhatas: LocalCustomerKhata[] = [];
    try {
      const all = await offlineDb.khatas.toArray();
      if (all && all.length > 0) {
        localKhatas = all;
      }
    } catch {}

    const syncRemoteKhatas = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/khata`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const remoteKhatas = await res.json();
          if (Array.isArray(remoteKhatas) && remoteKhatas.length > 0) {
            const currentLocal = await offlineDb.khatas.toArray();
            const localMap = new Map(currentLocal.map((k) => [k.id, k]));
            const merged: LocalCustomerKhata[] = remoteKhatas.map((rk: any) => {
              const local = localMap.get(rk.id);
              if (local && local.synced === 0) {
                return local;
              }
              return { ...rk, synced: 1 as const };
            });
            await offlineDb.khatas.bulkPut(merged);
          }
        }
      } catch {}
    };

    if (localKhatas.length > 0) {
      syncRemoteKhatas().catch(() => {});
      return localKhatas;
    }

    await syncRemoteKhatas();
    try {
      const fresh = await offlineDb.khatas.toArray();
      if (fresh.length > 0) return fresh;
    } catch {}

    // No accounts yet: an empty list (never a made-up "Guest" account that sales could post udhaar to)
    return [];
  },

  /**
   * Fetch Khata passbook transactions: Cache-First (<5ms)
   */
  async fetchKhataTransactions(khataId: string): Promise<LocalKhataTx[]> {
    let localTxs: LocalKhataTx[] = [];
    try {
      localTxs = await offlineDb.khataTransactions
        .where('khataId')
        .equals(khataId)
        .reverse()
        .sortBy('createdAt');
    } catch {}

    const syncRemote = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/khata/${khataId}/transactions`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const remote = await res.json();
          if (Array.isArray(remote) && remote.length > 0) {
            const prepared: LocalKhataTx[] = remote.map((t: any) => ({
              ...t,
              synced: 1 as const,
            }));
            await offlineDb.khataTransactions.bulkPut(prepared);
          }
        }
      } catch {}
    };

    if (localTxs.length > 0) {
      syncRemote().catch(() => {});
      return localTxs;
    }

    await syncRemote();
    try {
      return await offlineDb.khataTransactions
        .where('khataId')
        .equals(khataId)
        .reverse()
        .sortBy('createdAt');
    } catch {
      return [];
    }
  },

  /**
   * Save / Create Khata account offline-first
   */
  async saveKhata(khata: Partial<LocalCustomerKhata>): Promise<LocalCustomerKhata> {
    const isNew = !khata.id;
    // The balance moves only through ledger entries; editing a profile keeps what is owed
    const prior = isNew ? undefined : await offlineDb.khatas.get(khata.id!);
    // A phone number identifies one customer
    const wantedPhone = normalizePhone(khata.phone);
    if (wantedPhone.length >= 7) {
      const clash = (await offlineDb.khatas.toArray()).find(
        (k) => k.id !== khata.id && normalizePhone(k.phone) === wantedPhone
      );
      if (clash) throw new Error(`Phone ${khata.phone} already belongs to customer "${clash.name}".`);
    }
    const record: LocalCustomerKhata = {
      id: khata.id || `khata_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: khata.name || 'Unnamed Customer',
      phone: khata.phone || '',
      address: khata.address || '',
      cnic: khata.cnic || '',
      customerType: khata.customerType || 'retail',
      currentDebt: prior ? Number(prior.currentDebt || 0) : Number(khata.currentDebt || 0),
      creditLimit: khata.creditLimit === undefined ? 50000 : Number(khata.creditLimit || 0),
      dueDays: Number(khata.dueDays || 30),
      note: khata.note || '',
      synced: 0,
      createdAt: khata.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant Dexie Write
    await offlineDb.khatas.put(record);
    // An opening balance is a passbook line of its own (same id the backend gives it)
    if (isNew && record.currentDebt !== 0) {
      await offlineDb.khataTransactions.put({
        id: `ktx_open_${record.id}`,
        khataId: record.id,
        type: record.currentDebt > 0 ? 'DEBIT' : 'CREDIT',
        amount: Math.abs(record.currentDebt),
        balanceAfter: record.currentDebt,
        description: 'Opening balance',
        paymentMethod: 'opening',
        createdAt: record.createdAt || new Date().toISOString(),
        synced: 0,
      });
    }

    // 2. Queue for background cloud sync
    await syncEngine.enqueue('khata', record.id, isNew ? 'CREATE' : 'UPDATE', record);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_khata_updated', { detail: record }));
    }

    // 3. Non-blocking cloud sync in background
    if (typeof navigator === 'undefined' || navigator.onLine) {
      (async () => {
        try {
          const base = await resolveApiUrl();
          const tenantHeaders = await getTenantHeaders();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const res = await fetch(`${base}/api/khata${isNew ? '' : `/${record.id}`}`, {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json', ...tenantHeaders },
            body: JSON.stringify(record),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            await offlineDb.khatas.update(record.id, { synced: 1 });
          }
        } catch {}
      })();
    }

    return record;
  },

  /**
   * Record payment or debit credit transaction on customer khata offline-first
   */
  async addKhataTransaction(params: {
    khataId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    paymentMethod?: string;
    description?: string;
    orderId?: string;
  }): Promise<LocalKhataTx> {
    const amt = Math.round(Number(params.amount || 0) * 100) / 100;
    if (!(amt > 0)) throw new Error('Amount must be greater than zero.');
    const existing = await offlineDb.khatas.get(params.khataId);
    const prevDebt = Number(existing?.currentDebt || 0);
    // Same arithmetic as the backend: paying more than is owed leaves an advance (negative balance)
    const newDebt = Math.round((params.type === 'DEBIT' ? prevDebt + amt : prevDebt - amt) * 100) / 100;

    // 1. Update customer debt immediately in Dexie
    if (existing) {
      await offlineDb.khatas.update(params.khataId, {
        currentDebt: newDebt,
        updatedAt: new Date().toISOString(),
        synced: 0,
      });
    }

    // 2. Add transaction entry to Dexie
    const txRecord: LocalKhataTx = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      khataId: params.khataId,
      type: params.type,
      amount: amt,
      balanceAfter: newDebt,
      description: params.description || (params.type === 'DEBIT' ? 'POS Sale (Credit)' : 'Khata Payment'),
      paymentMethod: params.paymentMethod || 'cash',
      orderId: params.orderId,
      createdAt: new Date().toISOString(),
      synced: 0,
    };
    await offlineDb.khataTransactions.put(txRecord);

    // Cash received against udhaar is cash in the drawer (the backend does the same)
    if (params.type === 'CREDIT' && (params.paymentMethod || 'cash').toLowerCase() === 'cash') {
      try {
        const drawer = this.fetchCashDrawer();
        if (drawer?.status !== 'closed') {
          drawer.cashIn = Number(drawer.cashIn || 0) + amt;
          localStorage.setItem('omnipos_cash_drawer', JSON.stringify(drawer));
        }
      } catch {}
    }

    // 3. Queue into syncEngine
    await syncEngine.enqueue('khata', params.khataId, 'UPDATE', {
      transaction: txRecord,
      currentDebt: newDebt,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_khata_updated', { detail: { khataId: params.khataId, newDebt } }));
    }

    // 4. Non-blocking cloud push in background
    if (typeof navigator === 'undefined' || navigator.onLine) {
      (async () => {
        try {
          const base = await resolveApiUrl();
          const tenantHeaders = await getTenantHeaders();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const res = await fetch(`${base}/api/khata/${params.khataId}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...tenantHeaders },
            // The entry id makes this idempotent with the queued copy of the same entry
            body: JSON.stringify(txRecord),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            await offlineDb.khataTransactions.update(txRecord.id, { synced: 1 });
            await offlineDb.khatas.update(params.khataId, { synced: 1 });
          }
        } catch {}
      })();
    }

    return txRecord;
  },

  /**
   * Cancel a wrong manual ledger entry with the opposite entry (an audit-safe correction; nothing
   * is deleted). Done on the backend first so the two can never disagree; entries made by a sale
   * or a return are corrected with a sales return instead.
   */
  async reverseKhataTransaction(khataId: string, entry: LocalKhataTx): Promise<LocalKhataTx> {
    if (entry.reversalOf) throw new Error('A reversal entry cannot itself be reversed.');
    if (entry.orderId) throw new Error('This entry belongs to a sale or a return. Use Sales Return to correct it.');
    const body = {
      id: `rev_${entry.id}`,
      type: entry.type === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      amount: Number(entry.amount),
      paymentMethod: entry.paymentMethod || 'correction',
      description: `Reversal of: ${entry.description || entry.type}`,
      reversalOf: entry.id,
    };
    const res = await quoteBackend(`/api/khata/${encodeURIComponent(khataId)}/transaction`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res) throw new Error('Reversing an entry needs the backend. Check the connection and try again.');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Reversal refused (${res.status})`);

    const saved: LocalKhataTx = {
      ...data,
      createdAt: data.createdAt || data.date || new Date().toISOString(),
      reversalOf: entry.id,
      synced: 1,
    };
    await offlineDb.khataTransactions.put(saved);
    await offlineDb.khatas.update(khataId, { currentDebt: Number(data.balanceAfter || 0), updatedAt: new Date().toISOString() });
    // Undo today's cash wasooli in this till's drawer too
    if (
      entry.type === 'CREDIT' &&
      (entry.paymentMethod || '').toLowerCase() === 'cash' &&
      new Date(entry.createdAt).toDateString() === new Date().toDateString()
    ) {
      try {
        const drawer = this.fetchCashDrawer();
        drawer.cashIn = Math.max(0, Number(drawer.cashIn || 0) - Number(entry.amount));
        localStorage.setItem('omnipos_cash_drawer', JSON.stringify(drawer));
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_khata_updated', { detail: { khataId } }));
    }
    return saved;
  },

  /**
   * Receivables aging per account (unpaid udhaar by age, overdue against the credit term).
   * From the backend's full ledger; offline, from the entries this till holds.
   */
  async fetchKhataAging(): Promise<Record<string, KhataAging>> {
    const out: Record<string, KhataAging> = {};
    const res = await quoteBackend('/api/khata/aging');
    if (res?.ok) {
      const rows = await res.json().catch(() => []);
      if (Array.isArray(rows)) {
        for (const r of rows) out[r.khataId] = r;
        return out;
      }
    }
    const khatas = await offlineDb.khatas.toArray();
    for (const k of khatas) {
      const entries = await offlineDb.khataTransactions.where('khataId').equals(k.id).toArray();
      out[k.id] = computeKhataAging(
        entries.map((e) => ({ id: e.id, reversalOf: e.reversalOf, type: e.type, amount: e.amount, date: e.createdAt })),
        k.dueDays,
        { balance: Number(k.currentDebt || 0), openedAt: k.createdAt }
      );
    }
    return out;
  },

  /**
   * Delete Khata account offline-first
   */
  async deleteKhata(id: string): Promise<void> {
    const existing = await offlineDb.khatas.get(id);
    if (existing && Math.abs(Number(existing.currentDebt || 0)) >= 0.01) {
      throw new Error(
        `Is account par abhi PKR ${Number(existing.currentDebt).toLocaleString()} ka balance hai. Delete karne se pehle settle karein.`
      );
    }
    try {
      await offlineDb.khatas.delete(id);
      await offlineDb.khataTransactions.where('khataId').equals(id).delete();
      await syncEngine.enqueue('khata', id, 'DELETE', { id });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_khata_updated', { detail: { id, deleted: true } }));
      }

      if (typeof navigator === 'undefined' || navigator.onLine) {
        (async () => {
          try {
            const base = await resolveApiUrl();
            const tenantHeaders = await getTenantHeaders();
            await fetch(`${base}/api/khata/${id}`, {
              method: 'DELETE',
              headers: tenantHeaders,
            });
          } catch {}
        })();
      }
    } catch {}
  },

  /**
   * Fetch Orders: Cache-First for instant load (<5ms)
   */
  async fetchOrders(module?: string): Promise<Order[]> {
    let localOrders: LocalOrder[] = [];
    try {
      if (module) {
        localOrders = await offlineDb.orders.where('module').equals(module).reverse().sortBy('createdAt');
      } else {
        localOrders = await offlineDb.orders.reverse().sortBy('createdAt');
      }
    } catch {}

    const syncRemoteOrders = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/orders${module ? `?module=${module}` : ''}`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const remoteOrders = await res.json();
          if (Array.isArray(remoteOrders)) {
            // Keep local pending orders (synced: 0) intact!
            const currentLocal = await offlineDb.orders.toArray();
            const pendingMap = new Map(currentLocal.filter((o) => o.synced === 0).map((o) => [o.id, o]));
            const prepared: LocalOrder[] = remoteOrders.map((o: any) => {
              const pending = pendingMap.get(o.id);
              if (pending) return pending;
              return { ...o, synced: 1 as const };
            });
            await offlineDb.orders.bulkPut(prepared);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('pos_orders_updated'));
            }
          }
        }
      } catch {}
    };

    // Return instant local orders (<5ms) and sync in background!
    if (localOrders.length > 0) {
      syncRemoteOrders().catch(() => {});
      return localOrders;
    }

    await syncRemoteOrders();
    try {
      if (module) {
        return await offlineDb.orders.where('module').equals(module).reverse().sortBy('createdAt');
      }
      return await offlineDb.orders.reverse().sortBy('createdAt');
    } catch {}

    const legacy = storage.getList<Order>(KEYS.orders);
    return module ? legacy.filter((o) => o.module === module) : legacy;
  },

  /**
   * Fetch Refunds
   */
  async fetchRefunds(): Promise<OrderRefund[]> {
    let localRefunds: OrderRefund[] = [];
    try {
      localRefunds = await offlineDb.refunds.reverse().sortBy('createdAt');
    } catch {}

    const syncRemoteRefunds = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/refunds`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const remoteRefunds = await res.json();
          if (Array.isArray(remoteRefunds)) {
            await offlineDb.refunds.bulkPut(remoteRefunds);
          }
        }
      } catch (err) {
        console.warn('[OfflineDB] syncRemoteRefunds error:', err);
      }
    };

    if (localRefunds.length > 0) {
      syncRemoteRefunds().catch(() => {});
      return localRefunds;
    }

    await syncRemoteRefunds();
    try {
      return await offlineDb.refunds.reverse().sortBy('createdAt');
    } catch {
      return [];
    }
  },

  /**
   * Process a sales return. The backend is asked first: it checks the quantities still returnable,
   * prices the return at what the customer paid, and applies stock, drawer, ledger and order in one
   * transaction. A refusal (e.g. over-return) is thrown to the caller and nothing changes locally.
   * Only when the backend cannot be reached is the return applied on this till alone; the order is
   * then flagged unsynced so the catch-up resync replays it (by the same refund id, so only once).
   */
  async processOrderRefund(orderId: string, payload: {
    returnedLines: ReturnedLineItem[];
    refundAmount: number;
    reason?: string;
    paymentMode?: string;
    customerName?: string;
    khataId?: string;
  }): Promise<{ ok: boolean; refund: OrderRefund; order: Order; updatedKhata?: LocalCustomerKhata }> {
    const refundId = `ref_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const mode = (payload.paymentMode || 'cash').toLowerCase();
    const khataId = mode === 'khata' ? payload.khataId : undefined;
    if (mode === 'khata' && !khataId) {
      throw new Error('Choose the customer khata account to credit this refund to.');
    }

    // 1. Backend first
    let data: any = null;
    let refusal: string | null = null;
    try {
      const base = await resolveApiUrl();
      const tenantHeaders = await getTenantHeaders();
      const res = await fetch(`${base}/api/orders/${encodeURIComponent(orderId)}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...tenantHeaders },
        body: JSON.stringify({ ...payload, id: refundId, paymentMode: mode, khataId }),
      });
      if (res.ok) {
        data = await res.json();
      } else if (res.status >= 400 && res.status < 500) {
        const err = await res.json().catch(() => ({}));
        refusal = err?.error || `Return refused (${res.status})`;
      }
      // 5xx: treat like offline below
    } catch (netErr) {
      console.warn('[Refund] Backend unreachable, applying locally:', netErr);
    }
    if (refusal) throw new Error(refusal);

    const online = !!data?.refund;
    const refund: OrderRefund = online
      ? { ...data.refund, khataId }
      : {
          id: refundId,
          orderId,
          customerName: payload.customerName || 'Walk-In Customer',
          refundAmount: payload.refundAmount,
          paymentMode: mode,
          reason: payload.reason || 'Customer Return',
          khataId,
          items: payload.returnedLines,
          createdAt: new Date().toISOString(),
        };
    const amount = Number(refund.refundAmount || 0);
    const returned: ReturnedLineItem[] = online
      ? (() => { try { return typeof data.refund.items === 'string' ? JSON.parse(data.refund.items) : data.refund.items; } catch { return payload.returnedLines; } })()
      : payload.returnedLines;

    // 2. Restock this till (a returned Carton restocks its pieces). A duplicate was applied before.
    if (!data?.duplicate) {
      try {
        for (const line of returned) {
          const p = await offlineDb.products.get(line.productId);
          if (p && p.openingStock !== undefined && p.openingStock !== null) {
            const returnedQty = baseQuantity(line, p);
            const updatedVariants = applyVariantStockDelta(p, line.variantLabel, returnedQty);
            await offlineDb.products.update(p.id, {
              openingStock: (p.openingStock || 0) + returnedQty,
              ...(updatedVariants ? { variants: updatedVariants } : {}),
            });
          }
        }
      } catch (dexErr) {
        console.warn('[OfflineDB] local restock error:', dexErr);
      }
    }

    // 3. Khata: only a refund paid out *to the khata* touches the ledger (cash/card refunds never do)
    if (khataId && amount > 0 && !data?.duplicate) {
      try {
        const local = await offlineDb.khatas.get(khataId);
        const newDebt = data?.updatedKhata
          ? Number(data.updatedKhata.currentDebt || 0)
          : Math.round((Number(local?.currentDebt || 0) - amount) * 100) / 100;
        if (local) {
          await offlineDb.khatas.update(khataId, {
            currentDebt: newDebt,
            updatedAt: new Date().toISOString(),
            synced: online ? 1 : 0,
          });
        }
        await offlineDb.khataTransactions.put({
          id: `ktx_${refund.id}`,
          khataId,
          type: 'CREDIT',
          amount,
          balanceAfter: newDebt,
          description: `Sales return - Invoice #${orderId}${payload.reason ? ` (${payload.reason})` : ''}`,
          paymentMethod: 'khata',
          orderId,
          createdAt: refund.createdAt,
          synced: online ? 1 : 0,
        });
      } catch (khataLocalErr) {
        console.warn('[OfflineDB] local khata refund adjustment error:', khataLocalErr);
      }
    }

    // 4. Refund log
    try {
      await offlineDb.refunds.put(refund);
    } catch {}

    // 5. Order: take the backend's figures; offline, compute them and queue the catch-up
    let order: any = online ? data.order : null;
    try {
      const existingOrd = await offlineDb.orders.get(orderId);
      if (online && data.order) {
        if (existingOrd) {
          await offlineDb.orders.update(orderId, {
            refundedAmount: Number(data.order.refundedAmount || 0),
            stage: data.order.stage,
            updatedAt: new Date().toISOString(),
          });
        }
      } else if (existingOrd) {
        const newRefundedTotal = Number(existingOrd.refundedAmount || 0) + amount;
        const isFullyRefunded = existingOrd.totalAmount ? newRefundedTotal >= existingOrd.totalAmount - 0.01 : true;
        await offlineDb.orders.update(orderId, {
          refundedAmount: newRefundedTotal,
          stage: isFullyRefunded ? 'refunded' : existingOrd.stage || 'billed',
          updatedAt: new Date().toISOString(),
          synced: 0, // resyncPendingOrders re-sends the (known) order and replays this return once
        });
        order = await offlineDb.orders.get(orderId);
      }
    } catch {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_orders_updated'));
      window.dispatchEvent(new CustomEvent('pos_inventory_updated'));
      window.dispatchEvent(new CustomEvent('pos_khata_updated'));
    }

    return { ok: true, refund, order, updatedKhata: data?.updatedKhata };
  },

  /**
   * Fetch Expenses: Cache-First for instant load (<5ms)
   */
  async fetchExpenses(): Promise<LocalExpense[]> {
    let localExpenses: LocalExpense[] = [];
    try {
      localExpenses = await offlineDb.expenses.reverse().sortBy('date');
    } catch {}

    const syncRemoteExpenses = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/expenses`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const remote = await res.json();
          if (Array.isArray(remote) && remote.length > 0) {
            const current = await offlineDb.expenses.toArray();
            const pendingMap = new Map(current.filter((e) => e.synced === 0).map((e) => [e.id, e]));
            const merged: LocalExpense[] = remote.map((e: any) => {
              const pending = pendingMap.get(e.id);
              if (pending) return pending;
              return { ...e, synced: 1 as const };
            });
            await offlineDb.expenses.bulkPut(merged);
          }
        }
      } catch {}
    };

    if (localExpenses.length > 0) {
      syncRemoteExpenses().catch(() => {});
      return localExpenses;
    }

    await syncRemoteExpenses();
    try {
      return await offlineDb.expenses.reverse().sortBy('date');
    } catch {
      return [];
    }
  },

  async saveExpense(expense: Partial<LocalExpense>): Promise<LocalExpense> {
    const record: LocalExpense = {
      id: expense.id || `exp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      category: expense.category || 'General Expense',
      amount: Number(expense.amount || 0),
      paymentMode: expense.paymentMode || 'cash',
      vendorName: expense.vendorName || '',
      description: expense.description || '',
      date: expense.date || new Date().toISOString(),
      synced: 0,
    };

    await offlineDb.expenses.put(record);
    await syncEngine.enqueue('expense', record.id, 'CREATE', record);

    if (record.paymentMode === 'cash') {
      try {
        const rawDrawer = localStorage.getItem('omnipos_cash_drawer');
        const drawer = rawDrawer ? JSON.parse(rawDrawer) : null;
        if (drawer) {
          drawer.cashOut = Number(drawer.cashOut || 0) + record.amount;
          localStorage.setItem('omnipos_cash_drawer', JSON.stringify(drawer));
        }
      } catch {}
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${base}/api/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders },
          body: JSON.stringify(record),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          await offlineDb.expenses.update(record.id, { synced: 1 });
        }
      } catch {}
    }

    return record;
  },

  fetchCashDrawer(): any {
    try {
      const raw = localStorage.getItem('omnipos_cash_drawer');
      if (raw) return JSON.parse(raw);
    } catch {}
    const initial = {
      id: 'drawer_local_1',
      openingFloat: 5000,
      cashSales: 0,
      cashIn: 0,
      cashOut: 0,
      status: 'open' as const,
    };
    try {
      localStorage.setItem('omnipos_cash_drawer', JSON.stringify(initial));
    } catch {}
    return initial;
  },

  async saveCashDrawerAction(action: { type: 'CASH_IN' | 'CASH_OUT' | 'CLOSE'; amount?: number; notes?: string }): Promise<any> {
    const drawer = this.fetchCashDrawer();
    const amt = Number(action.amount || 0);

    if (action.type === 'CASH_IN') {
      drawer.cashIn = Number(drawer.cashIn || 0) + amt;
    } else if (action.type === 'CASH_OUT') {
      drawer.cashOut = Number(drawer.cashOut || 0) + amt;
    } else if (action.type === 'CLOSE') {
      drawer.status = 'closed';
      drawer.closingCash = drawer.openingFloat + drawer.cashSales + drawer.cashIn - drawer.cashOut;
    }

    localStorage.setItem('omnipos_cash_drawer', JSON.stringify(drawer));

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        await fetch(`${base}/api/cash-drawer/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders },
          body: JSON.stringify({ id: drawer.id, ...action }),
        });
      } catch {}
    }

    return drawer;
  },

  /**
   * Fetch Stock Movements: Cache-First for instant load (<5ms)
   */
  async fetchStockMovements(module?: string): Promise<StockMovement[]> {
    const deletedIds = getDeletedMovementIds();

    let localMovements: StockMovement[] = [];
    try {
      if (module && module !== 'all') {
        localMovements = await offlineDb.stockMovements.where('module').equals(module).reverse().sortBy('date');
      } else {
        localMovements = await offlineDb.stockMovements.reverse().sortBy('date');
      }
      if (deletedIds.size > 0) {
        localMovements = localMovements.filter((m) => !deletedIds.has(m.id));
        void offlineDb.stockMovements.bulkDelete(Array.from(deletedIds));
      }
    } catch {}

    const syncRemote = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/stock-movements`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const remote = await res.json();
          if (Array.isArray(remote)) {
            const currentDeleted = getDeletedMovementIds();
            // Never re-add records that the user has deleted
            const validRemote = remote.filter((r: any) => !currentDeleted.has(r.id));
            if (currentDeleted.size > 0) {
              await offlineDb.stockMovements.bulkDelete(Array.from(currentDeleted));
            }
            if (validRemote.length > 0) {
              await offlineDb.stockMovements.bulkPut(validRemote);
            }
          }
        }
      } catch {}
    };

    if (localMovements.length > 0) {
      syncRemote().catch(() => {});
      return localMovements;
    }

    await syncRemote();
    try {
      let fresh: StockMovement[] = [];
      if (module && module !== 'all') {
        fresh = await offlineDb.stockMovements.where('module').equals(module).reverse().sortBy('date');
      } else {
        fresh = await offlineDb.stockMovements.reverse().sortBy('date');
      }
      const currentDeleted = getDeletedMovementIds();
      return fresh.filter((m) => !currentDeleted.has(m.id));
    } catch {
      return [];
    }
  },

  async saveStockMovement(
    data: Partial<StockMovement> & { variants?: ProductVariant[]; newRetailPrice?: number; paidCash?: number; lineTotal?: number }
  ): Promise<StockMovement> {
    const record: StockMovement & { newRetailPrice?: number; paidCash?: number; lineTotal?: number } = {
      id: data.id || `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      module: data.module || 'minimart',
      productId: data.productId || '',
      productName: data.productName || 'Unknown Product',
      type: data.type || 'in',
      quantity: Math.max(0, round3(Number(data.quantity || 0))),
      reason: data.reason || 'Inventory Adjustment',
      createdBy: data.createdBy || currentUserName() || null,
      variantAllocations: data.variantAllocations ? parseVariantAllocations(data.variantAllocations) : undefined,
      note: data.note || data.referenceInvoice || '',
      referenceInvoice: data.referenceInvoice || '',
      vendorName: data.vendorName || '',
      vendorId: data.vendorId || undefined,
      unitCost: data.unitCost,
      unitPrice: data.unitPrice,
      batchNumber: data.batchNumber || undefined,
      expiryDate: data.expiryDate || undefined,
      date: data.date || new Date().toISOString(),
      ...(Number(data.newRetailPrice) > 0 ? { newRetailPrice: Number(data.newRetailPrice) } : {}),
      ...(Number(data.paidCash) > 0 ? { paidCash: Number(data.paidCash) } : {}),
      ...(Number(data.lineTotal) > 0 ? { lineTotal: Number(data.lineTotal) } : {}),
    };

    // 0. Manual stock entries go to the backend first: a refusal (unknown supplier, more than in
    //    stock…) is shown to the user and nothing changes here. Unreachable backend: saved locally
    //    and sent later (same id, once).
    let pushedOk = false;
    {
      const res = await quoteBackend('/api/stock-movements', { method: 'POST', body: JSON.stringify(record) });
      if (res && res.status >= 400 && res.status < 500) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Stock in refused (${res.status})`);
      }
      pushedOk = !!res?.ok;
      if (res?.ok) {
        const saved = await res.json().catch(() => null);
        if (saved?.referenceInvoice) record.referenceInvoice = saved.referenceInvoice;
        if (saved?.unitCost !== undefined && saved?.unitCost !== null) record.unitCost = saved.unitCost;
      }
    }

    // 1. Instant local write to Dexie
    await offlineDb.stockMovements.put(record);

    // 2. Instant stock adjustment in local products table (including variants)
    if (record.productId) {
      try {
        const prod = await offlineDb.products.get(record.productId);
        if (prod) {
          const currentStock = Number(prod.openingStock || 0);
          const updatedStock = record.type === 'in'
            ? round3(currentStock + record.quantity)
            : Math.max(0, round3(currentStock - record.quantity));

          const updates: Partial<Product> = {
            openingStock: updatedStock,
            updatedAt: new Date().toISOString(),
            ...(record.type === 'in' && record.newRetailPrice ? { price: record.newRetailPrice } : {}),
          };
          // Weighted average cost on receipts (mirrors the backend)
          if (record.type === 'in' && record.unitCost && record.unitCost > 0) {
            const curCost = Number(prod.costPrice || 0);
            updates.costPrice =
              currentStock > 0 && curCost > 0
                ? Math.round(((currentStock * curCost + record.quantity * record.unitCost) / (currentStock + record.quantity)) * 100) / 100
                : record.unitCost;
          }

          if (data.variants && data.variants.length > 0) {
            updates.variants = data.variants;
            setLocalVariantRegistry(record.productId, data.variants, prod.pricingType);
          }

          await offlineDb.products.update(record.productId, updates);

          // Keep storage cache synchronous
          const currentList = storage.getList<Product>(KEYS.products);
          const updatedList = currentList.map((p) => (p.id === record.productId ? { ...p, ...updates } : p));
          storage.setList(KEYS.products, updatedList);
        }
      } catch (err) {
        console.warn('[OfflineDB] Stock movement product update error:', err);
      }
    }

    // 3. Queue in outbox
    await syncEngine.enqueue('stockMovement', record.id, 'CREATE', record);

    // 4. Background push if online (already done for a receipt the backend accepted)
    if (!pushedOk && (typeof navigator === 'undefined' || navigator.onLine)) {
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        await fetch(`${base}/api/stock-movements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders },
          body: JSON.stringify(record),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch {}
    }

    return record;
  },

  async addStockMovement(data: Partial<StockMovement> & { variants?: ProductVariant[] }): Promise<StockMovement> {
    return this.saveStockMovement(data);
  },

  /**
   * Edit a stock entry. Descriptive changes (note, reason, vendor, date) update it in place.
   * Changes to quantity, type, cost, product or size split reverse the original and post a
   * corrected entry (same as the backend), so the ledger keeps full history.
   * Throws when the backend refuses (no permission, reversed entry).
   */
  async updateStockMovement(id: string, patch: Partial<StockMovement>): Promise<void> {
    const existing = await offlineDb.stockMovements.get(id);
    const by = currentUserName() || null;
    const stockChanged = !!existing && movementStockChanged(existing, patch);
    const newId = stockChanged ? `${id}_c${Date.now().toString(36)}` : undefined;
    const body = { ...patch, ...(newId ? { newId } : {}), createdBy: by };

    const remote = await sendStockRequest('PUT', `/api/stock-movements/${encodeURIComponent(id)}`, body);
    if (remote && !remote.ok && (remote.status === 400 || remote.status === 403)) {
      throw new Error(remote.error || 'The stock entry could not be changed.');
    }

    if (existing) {
      if (stockChanged && newId) {
        await reverseLocally(existing, by, 'corrected');
        const corrected: StockMovement = {
          ...existing,
          ...patch,
          id: newId,
          quantity: round3(Number(patch.quantity ?? existing.quantity)),
          createdBy: by,
          correctionOf: id,
          reversalOf: null,
          reversedAt: null,
          reversedBy: null,
        };
        await offlineDb.stockMovements.put(corrected);
        await applyLocalMovementEffect(corrected, 1);
      } else {
        await offlineDb.stockMovements.update(id, patch);
      }
    }

    if (!remote) {
      await syncEngine.enqueue('stockMovement', id, 'UPDATE', { id, ...body });
    }
  },

  /**
   * Reverse a stock entry (history is never deleted): posts an equal and opposite
   * "Reversal" entry, marks the original as reversed and restores stock.
   * Throws for entries that cannot be reversed or when the user lacks permission.
   */
  async reverseStockMovement(id: string, reason?: string): Promise<void> {
    const existing = await offlineDb.stockMovements.get(id);
    if (existing?.reversalOf) throw new Error('A reversal entry cannot itself be reversed.');
    if (existing?.reversedAt) return;
    const by = currentUserName() || null;

    const remote = await sendStockRequest('POST', `/api/stock-movements/${encodeURIComponent(id)}/reverse`, { createdBy: by, reason });
    if (remote && !remote.ok && (remote.status === 400 || remote.status === 403)) {
      throw new Error(remote.error || 'The stock entry could not be reversed.');
    }

    if (existing) await reverseLocally(existing, by, reason);
    // The backend's DELETE also reverses, so the queued fallback is safe to replay
    if (!remote) await syncEngine.enqueue('stockMovement', id, 'DELETE', { id });
  },

  /**
   * Record a purchase bill atomically on the backend (bill + stock + vendor ledger + prices).
   * Resolves null when the backend cannot be reached (caller falls back to the offline path).
   */
  async receivePurchaseBill(payload: Record<string, unknown>): Promise<{ ok: boolean; status: number; error?: string } | null> {
    const res = await sendStockRequest('POST', '/api/purchase-bills/receive', payload);
    return res;
  },

  /**
   * Save low-stock alert limits for many products (only minThreshold changes; null = store default).
   * Updates the local copy first, then the backend; throws if the backend rejects the save.
   */
  async setAlertLimits(items: { id: string; minThreshold: number | null }[]): Promise<void> {
    for (const it of items) {
      // undefined clears the item's own limit so the store default applies
      await this.patchLocalProduct(it.id, { minThreshold: it.minThreshold ?? undefined } as Partial<Product>);
    }
    const res = await sendStockRequest('POST', '/api/products/alert-limits', { items });
    if (res && !res.ok) throw new Error(res.error || 'Could not save alert limits');
  },

  /** Open stock batches of a product, earliest expiry information included ([] offline). */
  /** Every batch that still has stock (all products), for expiry overviews; [] when offline. */
  async fetchOpenBatches(): Promise<
    { id: string; productId: string; batchNumber: string | null; expiryDate: string | null; remaining: number; unitCost?: number | null }[]
  > {
    const res = await quoteBackend('/api/stock-batches?open=1');
    if (!res?.ok) return [];
    const rows = await res.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  },

  async fetchStockBatches(productId: string): Promise<{ id: string; batchNumber: string | null; expiryDate: string | null; remaining: number }[]> {
    if (!productId) return [];
    try {
      const base = await resolveApiUrl();
      const headers = await getTenantHeaders();
      const res = await fetch(`${base}/api/stock-batches?productId=${encodeURIComponent(productId)}&open=1`, { headers });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  /** Active low-stock alerts (empty when the backend cannot be reached). */
  async fetchStockAlerts(includeAll = false): Promise<StockAlertRow[]> {
    try {
      const base = await resolveApiUrl();
      const headers = await getTenantHeaders();
      const res = await fetch(`${base}/api/stock-alerts${includeAll ? '?include=all' : ''}`, { headers });
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  },

  async stockAlertAction(id: string, action: 'read' | 'dismiss' | 'snooze', hours?: number): Promise<void> {
    await sendStockRequest('POST', `/api/stock-alerts/${encodeURIComponent(id)}/${action}`, hours ? { hours } : {});
  },

  async readAllStockAlerts(): Promise<void> {
    await sendStockRequest('POST', '/api/stock-alerts/read-all', {});
  },

  /** Update fields of the local (offline) product copy only — the backend is already up to date. */
  async patchLocalProduct(id: string, patch: Partial<Product>): Promise<void> {
    try {
      await offlineDb.products.update(id, { ...patch, updatedAt: new Date().toISOString() });
      const cached = storage.getList<Product>(KEYS.products);
      storage.setList(KEYS.products, cached.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    } catch (err) {
      console.warn('[OfflineDB] patchLocalProduct failed:', err);
    }
  },

  /**
   * Catch-up: send POS sales that were saved only on this computer (the backend used to reject
   * every order carrying a payment mode) and then replay their refunds, so backend stock,
   * the sale ledger, alerts and reports become complete. Safe to run repeatedly: the backend
   * ignores an order id it already has, and refunds are replayed only once.
   */
  async resyncPendingOrders(): Promise<{ sent: number; failed: number; refunds: number }> {
    const result = { sent: 0, failed: 0, refunds: 0 };
    let pending: LocalOrder[] = [];
    try {
      pending = (await offlineDb.orders.toArray()).filter((o) => !o.synced);
    } catch {
      return result;
    }
    if (pending.length === 0) return result;
    pending.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let base: string;
    let headers: Record<string, string>;
    try {
      base = await resolveApiUrl();
      headers = { 'Content-Type': 'application/json', ...(await getTenantHeaders()) };
    } catch {
      return result;
    }

    for (const order of pending) {
      const localRefunds = (await offlineDb.refunds.where('orderId').equals(order.id).toArray()).filter((r) => r.id.startsWith('ref_'));
      try {
        const { synced: _s, ...payload } = order as any;
        // Post it as the sale it was; refunds below bring the backend to the same state
        const body = { ...payload, stage: payload.stage === 'refunded' ? 'paid' : payload.stage, refundedAmount: 0 };
        const res = await fetch(`${base}/api/orders`, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!res.ok) {
          result.failed++;
          continue;
        }
        await offlineDb.orders.update(order.id, { synced: 1 });
        result.sent++;

        for (const r of localRefunds) {
          const rr = await fetch(`${base}/api/orders/${encodeURIComponent(order.id)}/refund`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              returnedLines: Array.isArray(r.items) ? r.items : (() => { try { return JSON.parse(r.items as any); } catch { return []; } })(),
              refundAmount: r.refundAmount,
              reason: r.reason,
              paymentMode: r.paymentMode,
              customerName: r.customerName,
              khataId: (r as any).khataId,
              id: r.id,
              replay: true,
              createdAt: r.createdAt,
            }),
          });
          if (rr.ok) {
            const data = await rr.json().catch(() => null);
            await offlineDb.refunds.delete(r.id);
            if (data?.refund) await offlineDb.refunds.put(data.refund);
            result.refunds++;
          }
        }
      } catch {
        result.failed++;
      }
    }
    return result;
  },

  /** @deprecated History is no longer deleted — this now reverses the entry. */
  async deleteStockMovement(id: string): Promise<void> {
    return this.reverseStockMovement(id);
  },

  /**
   * Save Order with Tenant Header & Instant Local Stock Deduction
   */
  async saveOrder(order: Order): Promise<Order> {
    const localOrder: LocalOrder = {
      ...order,
      synced: 0,
    };

    try {
      // 1. Instant local write to Dexie
      await offlineDb.orders.put(localOrder);

      // Notify any listeners across the app (like Dashboard & Kitchen)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_orders_updated', { detail: order }));
      }

      // Deduct stock (incl. size/variant stock) in local Dexie database and log an
      // 'out' movement locally. The server writes the same movement id, so they merge.
      if (Array.isArray(order.lines)) {
        for (let idx = 0; idx < order.lines.length; idx++) {
          const line = order.lines[idx];
          if (line.productId) {
            try {
              const localProd = await offlineDb.products.get(line.productId);
              const alreadyRecorded = !!(await offlineDb.stockMovements.get(`sale_${order.id}_${idx}`));
              if (localProd && !alreadyRecorded && localProd.openingStock !== undefined && localProd.openingStock !== null) {
                const soldQty = baseQuantity(line, localProd);
                const newStock = Math.max(0, round3(localProd.openingStock - soldQty));
                const updatedVariants = applyVariantStockDelta(localProd, line.variantLabel, -soldQty);
                await offlineDb.products.update(line.productId, {
                  openingStock: newStock,
                  ...(updatedVariants ? { variants: updatedVariants } : {}),
                  updatedAt: new Date().toISOString(),
                });

                const movementId = `sale_${order.id}_${idx}`;
                const existingMovement = await offlineDb.stockMovements.get(movementId);
                if (!existingMovement) {
                  await offlineDb.stockMovements.put({
                    id: movementId,
                    module: order.module || localProd.module || 'minimart',
                    productId: localProd.id,
                    productName: line.variantLabel ? `${localProd.name} (${line.variantLabel})` : localProd.name,
                    type: 'out',
                    quantity: soldQty,
                    unitCost: localProd.costPrice ?? null,
                    unitPrice: Number(line.unitPrice || 0) || null,
                    reason: 'POS Sale',
                    note: `Sale Order #${order.id}`,
                    date: order.createdAt || new Date().toISOString(),
                  });
                }
              }

              // Recipe (bill of materials): consume the menu item's ingredients locally
              if (localProd) {
                await consumeLocalRecipe(order, idx, line, localProd);
              }
            } catch (dexieErr) {
              console.warn('[Offline DB] Error updating local stock:', dexieErr);
            }
          }
        }
      }

      // 2. Try immediate push if online with tenant headers
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          const base = await resolveApiUrl();
          const tenantHeaders = await getTenantHeaders();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);

          const res = await fetch(`${base}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...tenantHeaders },
            body: JSON.stringify(order),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const saved = await res.json();
            await offlineDb.orders.update(order.id, { synced: 1 });
            return saved;
          } else {
            await syncEngine.enqueue('order', order.id, 'CREATE', order);
          }
        } catch {
          await syncEngine.enqueue('order', order.id, 'CREATE', order);
        }
      } else {
        await syncEngine.enqueue('order', order.id, 'CREATE', order);
      }
    } catch {
      console.log(`[Omnipos Offline] Order #${order.id} saved in local DB. Queued for cloud sync.`);
    }

    return order;
  },

  /**
   * Get installed system printers (Electron)
   */
  async getPrinters(): Promise<any[]> {
    if (typeof window !== 'undefined' && (window as any).posApi?.getPrinters) {
      try {
        return await (window as any).posApi.getPrinters();
      } catch (err) {
        console.warn('[posApi] getPrinters error:', err);
        return [];
      }
    }
    return [];
  },

  /**
   * Print receipt or thermal KOT ticket
   */
  async printReceipt(options?: { printerName?: string; silent?: boolean; html?: string }): Promise<boolean> {
    // 1. Electron Desktop Environment
    if (typeof window !== 'undefined' && window.posApi?.printReceipt) {
      const res = await window.posApi.printReceipt(options);
      return res.ok;
    }

    // 2. Web Browser Fallback: Hidden iframe printing
    if (typeof document !== 'undefined' && options?.html) {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(options.html);
          doc.close();
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch {}
          }, 3000);
          return true;
        }
      } catch (err) {
        console.warn('[Web Print] iframe print error:', err);
      }
    }

    // 3. Native window.print fallback
    if (typeof window !== 'undefined') {
      window.print();
    }
    return true;
  },

  /**
   * Quotation / Estimate operations
   *
   * Quotations live in the local database for instant use and are kept on the backend so every
   * counter sees the same list. A quotation open past its validity date becomes "expired".
   * A quotation only becomes "converted" when the POS checkout that sold it succeeds, and from
   * then on it is a record of that sale: it cannot be edited, re-opened or deleted.
   */
  async fetchQuotations(): Promise<Quotation[]> {
    type LocalQuote = Quotation & { synced?: 0 | 1 };
    const ts = (v?: string) => new Date(v || 0).getTime() || 0;

    // One-time move of quotations kept in localStorage by older versions
    try {
      const legacy = storage.getList<Quotation>(KEYS.quotations);
      if (legacy.length > 0) {
        for (const q of legacy) {
          if (!(await offlineDb.quotations.get(q.id))) await offlineDb.quotations.put({ ...q, synced: 0 } as LocalQuote);
        }
        storage.setList(KEYS.quotations, []);
      }
    } catch {}

    // Merge with the backend: server copy wins unless this till holds a newer unsent edit
    const remote = await quoteBackend('/api/quotations');
    if (remote?.ok) {
      try {
        const remoteList: Quotation[] = await remote.json();
        const remoteIds = new Set(remoteList.map((q) => q.id));
        for (const r of remoteList) {
          const l = (await offlineDb.quotations.get(r.id)) as LocalQuote | undefined;
          const localNewer = l && l.synced === 0 && l.status !== 'converted' && ts(l.updatedAt) > ts(r.updatedAt);
          if (!l || r.status === 'converted' || !localNewer) {
            await offlineDb.quotations.put({ ...r, synced: 1 } as LocalQuote);
          }
        }
        for (const l of (await offlineDb.quotations.toArray()) as LocalQuote[]) {
          if (remoteIds.has(l.id)) {
            if (l.synced === 0) await pushQuotation(l);
          } else if (l.synced === 1) {
            await offlineDb.quotations.delete(l.id); // deleted on another counter
          } else {
            await pushQuotation(l);
          }
        }
      } catch (err) {
        console.warn('[Quotations] merge with backend failed:', err);
      }
    }

    // Validity: an open quotation past its date is expired
    const now = Date.now();
    const all = (await offlineDb.quotations.toArray()) as LocalQuote[];
    for (const q of all) {
      if ((q.status === 'draft' || q.status === 'sent') && q.validUntil && ts(q.validUntil) < now) {
        q.status = 'expired';
        q.updatedAt = new Date().toISOString();
        q.synced = 0;
        await offlineDb.quotations.put(q);
        void pushQuotation(q);
      }
    }
    return all.sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
  },

  async saveQuotation(quote: Quotation): Promise<Quotation> {
    const existing = await offlineDb.quotations.get(quote.id);
    if (existing?.status === 'converted' || existing?.status === 'partial') {
      throw new Error(`Quotation ${existing.quoteNumber} is already (partly) sold and cannot be changed.`);
    }
    if (quote.status === 'converted' || quote.status === 'partial') {
      throw new Error('A quotation is converted only by completing its sale at the POS counter.');
    }
    const record = { ...quote, updatedAt: new Date().toISOString(), synced: 0 as const };
    await offlineDb.quotations.put(record);
    const refused = await pushQuotation(record);
    if (refused) throw new Error(refused);
    return record;
  },

  async deleteQuotation(id: string): Promise<boolean> {
    const existing = await offlineDb.quotations.get(id);
    if (existing?.status === 'converted' || existing?.status === 'partial') {
      throw new Error(`Quotation ${existing.quoteNumber} is linked to a sale and cannot be deleted.`);
    }
    const res = await quoteBackend(`/api/quotations/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res && res.status === 409) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'This quotation cannot be deleted.');
    }
    await offlineDb.quotations.delete(id);
    return true;
  },

  /**
   * Quotation that may still be taken to the POS counter, or an error saying why not.
   */
  async getOpenableQuotation(id: string): Promise<Quotation> {
    const q = await offlineDb.quotations.get(id);
    if (!q) throw new Error('Quotation not found');
    if (q.status === 'converted') throw new Error(`Quotation ${q.quoteNumber} has already been sold (order #${q.convertedOrderId}).`);
    if (q.status === 'rejected') throw new Error(`Quotation ${q.quoteNumber} was rejected by the customer. Revise it to quote again.`);
    if (q.status === 'revised') throw new Error(`Quotation ${q.quoteNumber} was replaced by a newer revision. Sell the latest one.`);
    if (q.status === 'expired' || new Date(q.validUntil).getTime() < Date.now()) {
      throw new Error(`Quotation ${q.quoteNumber} has expired. Edit it to set a new validity before selling.`);
    }
    return q;
  },

  /**
   * Compare an openable quotation with today's catalogue: prices that changed since it was quoted,
   * items short in stock, and items no longer in the catalogue. The quoted price is honoured while
   * the quotation is valid; these are shown to the cashier before the cart is loaded.
   */
  async checkQuotationForSale(id: string): Promise<{ quote: Quotation; issues: string[] }> {
    const quote = await this.getOpenableQuotation(id);
    const issues: string[] = [];
    const need = new Map<string, { name: string; qty: number; stock: number }>();
    for (const quoted of quote.lines || []) {
      const line = { ...quoted, quantity: quoteLineRemaining(quoted) };
      if (line.quantity <= 0) continue;
      if (!line.productId || line.productId.startsWith('custom_')) continue;
      const raw = await offlineDb.products.get(line.productId);
      if (!raw) {
        issues.push(`${line.name}: no longer in the product list`);
        continue;
      }
      const p = decodeProductVariants(raw);
      const variant = line.variantLabel ? (p.variants || []).find((v: any) => v.label === line.variantLabel) : undefined;
      const current = variant
        ? variant.price !== undefined && variant.price !== null
          ? Number(variant.price)
          : Number(p.price || 0) + Number((variant as any).priceDelta || 0)
        : Number(p.price || 0);
      if (Math.abs(current - Number(line.unitPrice || 0)) > 0.009) {
        issues.push(`${line.name}: quoted PKR ${Number(line.unitPrice).toLocaleString()}, price today PKR ${current.toLocaleString()}`);
      }
      if (p.openingStock !== null && p.openingStock !== undefined) {
        const entry = need.get(p.id) || { name: p.name, qty: 0, stock: Number(p.openingStock) || 0 };
        entry.qty = round3(entry.qty + baseQuantity(line, p));
        need.set(p.id, entry);
      }
    }
    for (const n of need.values()) {
      if (n.qty > n.stock) issues.push(`${n.name}: quotation needs ${n.qty}, only ${n.stock} in stock`);
    }
    return { quote, issues };
  },

  /**
   * Take an advance against a quotation. The money is credited to the customer's khata (a cash
   * advance also goes into the drawer), so the POS can use it when the quote is sold.
   */
  async receiveQuotationAdvance(
    id: string,
    params: { khataId: string; amount: number; method: 'cash' | 'online' | 'card' }
  ): Promise<Quotation> {
    const q = await offlineDb.quotations.get(id);
    if (!q) throw new Error('Quotation not found');
    if (!['draft', 'sent', 'accepted', 'partial'].includes(q.status)) {
      throw new Error(`Quotation ${q.quoteNumber} is ${q.status}; an advance can only be taken on an open quotation.`);
    }
    const amount = Math.round(Number(params.amount || 0) * 100) / 100;
    if (!(amount > 0)) throw new Error('Enter the advance amount.');
    if (q.advanceKhataId && q.advanceKhataId !== params.khataId) {
      throw new Error('Advances on one quotation must go to the same customer account.');
    }
    await this.addKhataTransaction({
      khataId: params.khataId,
      type: 'CREDIT',
      amount,
      paymentMethod: params.method,
      description: `Advance for quotation ${q.quoteNumber}`,
    });
    const record = {
      ...q,
      advanceAmount: Math.round((Number(q.advanceAmount || 0) + amount) * 100) / 100,
      advanceKhataId: params.khataId,
      updatedAt: new Date().toISOString(),
      synced: 0 as const,
    };
    await offlineDb.quotations.put(record);
    await pushQuotation(record);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pos_quotations_updated'));
    return record;
  },

  /** Move a quotation along: sent to the customer, accepted or rejected by them, or back to draft. */
  async setQuotationStatus(id: string, status: 'draft' | 'sent' | 'accepted' | 'rejected'): Promise<Quotation> {
    const q = await offlineDb.quotations.get(id);
    if (!q) throw new Error('Quotation not found');
    if (q.status === 'converted' || q.status === 'revised' || q.status === 'partial') {
      throw new Error(`Quotation ${q.quoteNumber} is ${q.status === 'partial' ? 'partly sold' : q.status} and can no longer change.`);
    }
    if ((status === 'sent' || status === 'accepted') && new Date(q.validUntil).getTime() < Date.now()) {
      throw new Error(`Quotation ${q.quoteNumber} has expired. Edit it to set a new validity first.`);
    }
    return this.saveQuotation({ ...q, status });
  },

  /**
   * New version of a quotation (QT-…-R1, R2…) for changed prices or items. The old one is kept
   * as "revised" so it can no longer be sold, and the new draft links back to it.
   */
  async reviseQuotation(id: string): Promise<Quotation> {
    const q = await offlineDb.quotations.get(id);
    if (!q) throw new Error('Quotation not found');
    if (q.status === 'converted') throw new Error(`Quotation ${q.quoteNumber} is already sold.`);
    if (q.status === 'partial') throw new Error(`Quotation ${q.quoteNumber} is partly sold. Sell the rest or start a new quote.`);
    if (q.status === 'revised') throw new Error(`Quotation ${q.quoteNumber} already has a newer revision.`);
    const all = await offlineDb.quotations.toArray();
    const now = new Date();
    const lifeDays = Math.max(7, Math.round((new Date(q.validUntil).getTime() - new Date(q.createdAt).getTime()) / 86_400_000));
    const { convertedOrderId: _c, convertedAt: _a, ...rest } = q as any;
    const revision: Quotation = {
      ...rest,
      id: uid('quote_'),
      quoteNumber: nextRevisionNumber(q.quoteNumber, all.map((x) => x.quoteNumber)),
      status: 'draft',
      revisionOf: q.id,
      lines: (q.lines || []).map(({ soldQty: _s, ...l }) => ({ ...l })),
      sales: [],
      advanceAmount: 0,
      advanceKhataId: undefined,
      validUntil: new Date(now.getTime() + lifeDays * 86_400_000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const saved = await this.saveQuotation(revision);
    await this.saveQuotation({ ...q, status: 'revised' } as Quotation);
    return saved;
  },

  /** Copy of a quotation as a new draft with its own number (e.g. for another customer). */
  async duplicateQuotation(id: string): Promise<Quotation> {
    const q = await offlineDb.quotations.get(id);
    if (!q) throw new Error('Quotation not found');
    const all = await offlineDb.quotations.toArray();
    const now = new Date();
    const { convertedOrderId: _c, convertedAt: _a, revisionOf: _r, ...rest } = q as any;
    return this.saveQuotation({
      ...rest,
      id: uid('quote_'),
      quoteNumber: nextQuoteNumber(all.map((x) => x.quoteNumber)),
      status: 'draft',
      lines: (q.lines || []).map(({ soldQty: _s, ...l }) => ({ ...l })),
      sales: [],
      advanceAmount: 0,
      advanceKhataId: undefined,
      validUntil: new Date(now.getTime() + 7 * 86_400_000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    } as Quotation);
  },

  /**
   * Record that a POS sale sold this quotation. Called by the checkout after the order is saved.
   */
  async markQuotationConverted(
    id: string,
    orderId: string,
    soldLines?: { lineIndex: number; qty: number }[]
  ): Promise<void> {
    const q = await offlineDb.quotations.get(id);
    if (!q) return;
    const result = applyQuotationSale(q, orderId, soldLines);
    if (result.duplicate) return;
    if (result.error) throw new Error(result.error);
    const record = { ...result.quote, updatedAt: new Date().toISOString(), synced: 0 as const };
    await offlineDb.quotations.put(record);
    await pushQuotation(record);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_quotations_updated'));
    }
  },

  /**
   * Database Backup & Recovery operations
   */
  async getBackupStatus(): Promise<{ dbPath: string; dbSize: number; lastBackup?: string | null; lastBackupPath?: string | null; lastBackupSize?: number | null; isElectron: boolean }> {
    if (typeof window !== 'undefined' && window.posApi?.backup?.getStatus) {
      const status = await window.posApi.backup.getStatus();
      return { ...status, isElectron: true };
    }
    return {
      dbPath: 'IndexedDB (Browser Offline Storage)',
      dbSize: 0,
      lastBackup: null,
      lastBackupPath: null,
      lastBackupSize: null,
      isElectron: false,
    };
  },

  async createBackup(promptDialog: boolean = true): Promise<{ ok: boolean; path?: string; size?: number; cancelled?: boolean; error?: string }> {
    if (typeof window !== 'undefined' && window.posApi?.backup?.create) {
      try {
        // Guarantee all active Dexie & LocalStorage products & categories are written into SQLite before taking the snapshot!
        const dexieProducts = await offlineDb.products.toArray().catch(() => []);
        const localProducts = storage.getList<Product>(KEYS.products) || [];
        const prodMap = new Map<string, Product>();
        dexieProducts.forEach((p) => prodMap.set(p.id, p));
        localProducts.forEach((p) => prodMap.set(p.id, p));
        const allProducts = Array.from(prodMap.values());

        const dexieCategories = await offlineDb.categories.toArray().catch(() => []);
        const localCategories = storage.getList<Category>(KEYS.categories) || [];
        const catMap = new Map<string, Category>();
        dexieCategories.forEach((c) => catMap.set(c.id, c));
        localCategories.forEach((c) => catMap.set(c.id, c));
        const allCategories = Array.from(catMap.values());

        if (allProducts.length > 0 || allCategories.length > 0) {
          // 1. First priority: Direct IPC flush directly into SQLite via Prisma (guaranteed instant offline write)
          if (window.posApi?.backup?.flushSync) {
            try {
              const ipcRes = await window.posApi.backup.flushSync({ products: allProducts, categories: allCategories });
              console.log('[createBackup] Direct IPC flush result:', ipcRes);
            } catch (ipcErr) {
              console.warn('[createBackup] Direct IPC flush warning:', ipcErr);
            }
          }

          // 2. Also flush via Express backend if reachable
          try {
            const base = await resolveApiUrl();
            const headers = await getTenantHeaders();
            const flushRes = await fetch(`${base}/api/sync/flush-all`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...headers },
              body: JSON.stringify({ products: allProducts, categories: allCategories }),
            });
            const flushData = await flushRes.json().catch(() => ({}));
            console.log('[createBackup] Pre-backup Express flush result:', flushData);
          } catch {}
        }
      } catch (flushErr) {
        console.warn('[createBackup] Pre-backup flush warning:', flushErr);
      }
      return await window.posApi.backup.create({ promptDialog });
    }

    // Web Browser Fallback: dump all Dexie tables into JSON file download
    try {
      const dump = {
        app: 'Omnipos',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        products: await offlineDb.products.toArray(),
        categories: await offlineDb.categories.toArray(),
        orders: await offlineDb.orders.toArray(),
        refunds: await offlineDb.refunds.toArray(),
        quotations: await offlineDb.quotations.toArray(),
        khatas: await offlineDb.khatas.toArray(),
        khataTransactions: await offlineDb.khataTransactions.toArray(),
        expenses: await offlineDb.expenses.toArray(),
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Omnipos_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { ok: true, path: a.download, size: blob.size };
    } catch (e: any) {
      return { ok: false, error: e.message || 'Failed to download backup' };
    }
  },

  async restoreBackup(): Promise<{ ok: boolean; message?: string; cancelled?: boolean; error?: string }> {
    if (typeof window !== 'undefined' && window.posApi?.backup?.restore) {
      const res = await window.posApi.backup.restore();
      if (res.ok) {
        try {
          // Immediately populate Dexie & LocalStorage from freshly restored SQLite database!
          const base = await resolveApiUrl();
          const headers = await getTenantHeaders();
          const [pRes, cRes] = await Promise.all([
            fetch(`${base}/api/products`, { headers }),
            fetch(`${base}/api/categories`, { headers }),
          ]);
          if (pRes.ok) {
            const restoredProducts = await pRes.json();
            if (Array.isArray(restoredProducts)) {
              await offlineDb.products.clear();
              if (restoredProducts.length > 0) {
                await offlineDb.products.bulkPut(restoredProducts);
              }
              storage.setList(KEYS.products, restoredProducts);
            }
          }
          if (cRes.ok) {
            const restoredCategories = await cRes.json();
            if (Array.isArray(restoredCategories)) {
              await offlineDb.categories.clear();
              if (restoredCategories.length > 0) {
                await offlineDb.categories.bulkPut(restoredCategories);
              }
              storage.setList(KEYS.categories, restoredCategories);
            }
          }
        } catch (popErr) {
          console.warn('[restoreBackup] Post-restore populate error:', popErr);
        }
      }
      return res;
    }

    // Web Browser Fallback:
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.dbbackup,.db,.sqlite,.sqlite3,.bak';
      input.style.display = 'none';

      let settled = false;
      const cleanup = () => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };

      input.oncancel = () => {
        if (!settled) {
          settled = true;
          cleanup();
          resolve({ ok: false, cancelled: true });
        }
      };

      input.onchange = async () => {
        settled = true;
        const file = input.files?.[0];
        cleanup();
        if (!file) {
          resolve({ ok: false, cancelled: true });
          return;
        }

        try {
          // Read first 16 bytes to check if it's SQLite binary
          const slice = file.slice(0, 16);
          const buffer = await slice.arrayBuffer();
          const header = new TextDecoder().decode(buffer);

          if (header.startsWith('SQLite format 3')) {
            resolve({
              ok: false,
              error:
                'Yeh file native Windows SQLite database (.db / .dbbackup) hai. Isay restore karne ke liye Omnipos ko Windows Desktop Application mein open karein (Desktop shortcut ya terminal mein "npm run dev:electron"). Browser mode sirf JSON backups ko restore kar sakta hai.',
            });
            return;
          }

          // Try parsing JSON backup
          const text = await file.text();
          let parsed: any;
          try {
            parsed = JSON.parse(text);
          } catch {
            resolve({
              ok: false,
              error:
                'Invalid backup format. Agar yeh SQLite (.db / .dbbackup) file hai to Omnipos Windows Desktop App mein open karke restore karein.',
            });
            return;
          }

          const tables = parsed.data || parsed;
          let count = 0;

          if (Array.isArray(tables.products) && tables.products.length > 0) {
            await offlineDb.products.clear();
            await offlineDb.products.bulkPut(tables.products);
            count += tables.products.length;
          }
          if (Array.isArray(tables.categories) && tables.categories.length > 0) {
            await offlineDb.categories.clear();
            await offlineDb.categories.bulkPut(tables.categories);
            count += tables.categories.length;
          }
          if (Array.isArray(tables.orders) && tables.orders.length > 0) {
            await offlineDb.orders.clear();
            await offlineDb.orders.bulkPut(tables.orders);
            count += tables.orders.length;
          }
          if (Array.isArray(tables.refunds) && tables.refunds.length > 0) {
            await offlineDb.refunds.clear();
            await offlineDb.refunds.bulkPut(tables.refunds);
            count += tables.refunds.length;
          }
          if (Array.isArray(tables.quotations) && tables.quotations.length > 0) {
            await offlineDb.quotations.clear();
            await offlineDb.quotations.bulkPut(tables.quotations);
          }
          if (Array.isArray(tables.khatas) && tables.khatas.length > 0) {
            await offlineDb.khatas.clear();
            await offlineDb.khatas.bulkPut(tables.khatas);
            count += tables.khatas.length;
          }
          if (Array.isArray(tables.khataTransactions) && tables.khataTransactions.length > 0) {
            await offlineDb.khataTransactions.clear();
            await offlineDb.khataTransactions.bulkPut(tables.khataTransactions);
          }
          if (Array.isArray(tables.expenses) && tables.expenses.length > 0) {
            await offlineDb.expenses.clear();
            await offlineDb.expenses.bulkPut(tables.expenses);
            count += tables.expenses.length;
          }

          resolve({
            ok: true,
            message: `Backup data successfully restored into IndexedDB (${count} items restored)! Reloading app...`,
          });
        } catch (e: any) {
          resolve({ ok: false, error: e.message || 'Failed to restore backup in browser.' });
        }
      };

      document.body.appendChild(input);
      input.click();
    });
  },

  async exportJsonBackup(): Promise<{ ok: boolean; path?: string; counts?: any; cancelled?: boolean; error?: string }> {
    if (typeof window !== 'undefined' && window.posApi?.backup?.exportJson) {
      return await window.posApi.backup.exportJson();
    }
    return await this.createBackup(true);
  },

  /**
   * Complete database wipe: removes all products, categories, orders, khata,
   * expenses, and cash drawer data across Dexie IndexedDB, LocalStorage, and SQLite backend.
   * Keeps strictly the Admin user account.
   */
  async wipeAllDataExceptAdmin(): Promise<void> {
    // 1. Wipe Dexie IndexedDB
    try {
      await offlineDb.products.clear();
      await offlineDb.categories.clear();
      await offlineDb.orders.clear();
      await offlineDb.stockMovements.clear();
      await offlineDb.khatas.clear();
      await offlineDb.khataTransactions.clear();
      await offlineDb.expenses.clear();
      await offlineDb.syncQueue.clear();
    } catch (e) {
      console.warn('[wipeAllDataExceptAdmin] Dexie clear error:', e);
    }

    // 2. Wipe LocalStorage data caches
    try {
      storage.setList(KEYS.products, []);
      storage.setList(KEYS.categories, []);
      storage.setList(KEYS.orders, []);
      storage.setList(KEYS.stockMovements, []);
      // Vendor / ledger / purchase-bill cache (backed by the SQLite tables wiped below)
      storage.setList('pos.vendors', []);
      storage.setList('pos.vendor_transactions', []);
      storage.setList('pos.purchase_bills', []);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('omnipos_variant_registry');
        localStorage.removeItem('omnipos_demo_orders_cleared');
        localStorage.setItem('omnipos_data_wiped', 'true');
      }
    } catch (e) {
      console.warn('[wipeAllDataExceptAdmin] localStorage data clear error:', e);
    }

    // 3. Keep ONLY Admin user account (remove all cashiers/staff)
    try {
      if (typeof window !== 'undefined') {
        const prefix = 'omnipos.users';
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefix)) {
            try {
              const raw = localStorage.getItem(k);
              if (raw) {
                const users = JSON.parse(raw);
                if (Array.isArray(users)) {
                  const adminsOnly = users.filter(
                    (u: any) => u.role === 'admin' || u.username?.toLowerCase() === 'admin'
                  );
                  if (adminsOnly.length > 0) {
                    localStorage.setItem(k, JSON.stringify(adminsOnly));
                  } else {
                    localStorage.setItem(
                      k,
                      JSON.stringify([
                        {
                          id: 'user_admin_default',
                          username: 'admin',
                          name: 'Store Administrator',
                          role: 'admin',
                          password: 'admin',
                          permissions: [
                            'pos_fastfood',
                            'pos_omnimart',
                            'kitchen',
                            'catalog',
                            'inventory',
                            'khata',
                            'expenses',
                            'reports',
                            'admin',
                          ],
                          isActive: true,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        },
                      ])
                    );
                  }
                }
              }
            } catch {
              /* ignore */
            }
          }
        }
      }
    } catch (e) {
      console.warn('[wipeAllDataExceptAdmin] user filter error:', e);
    }

    // 4. Wipe SQLite Backend if server is reachable
    try {
      const base = await resolveApiUrl();
      const tenantHeaders = await getTenantHeaders();
      await fetch(`${base}/api/database/wipe`, {
        method: 'POST',
        headers: tenantHeaders,
      });
    } catch {
      /* offline */
    }

    // 5. Broadcast reset event so all active React hooks reload blank
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('pos_orders_updated'));
        window.dispatchEvent(new CustomEvent('pos_khata_updated'));
      }
    } catch {
      /* ignore */
    }
  },
};
