import { Product, Category, Order, StockMovement } from './types';
import { offlineDb, LocalOrder } from './offlineDb';
import { syncEngine } from './syncEngine';
import { KEYS, storage } from './storage';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, isDemoLicense } from './seedData';
import { decodeProductVariants, encodeProductVariants, setLocalVariantRegistry } from './variants';

let cachedApiUrl: string | null = null;
let cachedTenantMeta: { key?: string; schemaId?: string } | null = null;

export async function getTenantHeaders(): Promise<Record<string, string>> {
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

export async function resolveApiUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;

  // 1. Embedded local Electron Express backend (Primary for Desktop Offline)
  if (typeof window !== 'undefined' && window.posApi?.getApiUrl) {
    try {
      const url = await window.posApi.getApiUrl();
      if (url) {
        cachedApiUrl = url;
        return url;
      }
    } catch {
      /* ignore */
    }
  }

  // 2. Central Cloud Backend (Vercel) or configured environment URL
  const envUrl = (import.meta as any).env?.VITE_API_URL || 'https://omni-server-seven.vercel.app';
  cachedApiUrl = envUrl;
  return envUrl;
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
      const existingIds = new Set((allDexie || []).map((p) => p.id));
      const missingProducts = INITIAL_PRODUCTS.filter((p) => !existingIds.has(p.id));
      if (missingProducts.length > 0) {
        try {
          await offlineDb.products.bulkPut(missingProducts);
          allDexie.push(...missingProducts);
        } catch (e) {
          console.warn('[OfflineDB] bulkPut missing products error:', e);
        }
      }
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

    // 3. Fallback to bundled seed catalog (if Demo license)
    if (localProducts.length === 0 && isDemoLicense()) {
      localProducts = INITIAL_PRODUCTS.map(decodeProductVariants);
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

    // Only if absolutely NO local products exist (first run on clean machine), await network
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
        const timeoutId = setTimeout(() => controller.abort(), 2000);

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
        }
      }
    } catch {
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
      const existingCatIds = new Set((allCats || []).map((c) => c.id));
      const missingCats = INITIAL_CATEGORIES.filter((c) => !existingCatIds.has(c.id));
      if (missingCats.length > 0) {
        try {
          await offlineDb.categories.bulkPut(missingCats);
          allCats.push(...missingCats);
        } catch (e) {
          console.warn('[OfflineDB] bulkPut missing categories error:', e);
        }
      }
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

    if (localCats.length === 0 && isDemoLicense()) {
      localCats = INITIAL_CATEGORIES;
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
            try { await offlineDb.categories.bulkPut(remoteCats); } catch {}
            try {
              const currentLocal = storage.getList<Category>(KEYS.categories);
              const map = new Map(currentLocal.map((c) => [c.id, c]));
              remoteCats.forEach((c) => map.set(c.id, c));
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
   * Fetch Khatas: Cache-First for instant load (<5ms)
   */
  async fetchKhatas(): Promise<any[]> {
    let localKhatas: any[] = [];
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${base}/api/khata`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const remoteKhatas = await res.json();
          if (Array.isArray(remoteKhatas) && remoteKhatas.length > 0) {
            try { await offlineDb.khatas.bulkPut(remoteKhatas); } catch {}
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

    return [
      { id: 'khata_guest', name: 'Guest', currentDebt: 0, creditLimit: 50000, synced: 1 },
      { id: 'khata_vip', name: 'Regular VIP Customer', phone: '0300-1234567', currentDebt: 0, creditLimit: 100000, synced: 1 },
    ];
  },

  /**
   * Fetch Orders: Offline-First strategy with tenant scoping
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

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${base}/api/orders${module ? `?module=${module}` : ''}`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const remoteOrders = await res.json();
          if (Array.isArray(remoteOrders)) {
            const prepared: LocalOrder[] = remoteOrders.map((o: any) => ({
              ...o,
              synced: 1 as const,
            }));
            await offlineDb.orders.bulkPut(prepared);
            return remoteOrders;
          }
        }
      } catch {
        /* Offline: return local orders */
      }
    }

    if (localOrders.length > 0) {
      return localOrders;
    }

    const legacy = storage.getList<Order>(KEYS.orders);
    return module ? legacy.filter((o) => o.module === module) : legacy;
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

      // Deduct stock in local Dexie database
      if (Array.isArray(order.lines)) {
        for (const line of order.lines) {
          if (line.productId) {
            try {
              const localProd = await offlineDb.products.get(line.productId);
              if (localProd && localProd.openingStock !== undefined && localProd.openingStock !== null) {
                const soldQty = Number(line.quantity || 1);
                const newStock = Math.max(0, localProd.openingStock - soldQty);
                await offlineDb.products.update(line.productId, {
                  openingStock: newStock,
                  updatedAt: new Date().toISOString(),
                });
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
};
