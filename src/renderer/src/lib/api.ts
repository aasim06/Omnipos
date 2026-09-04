import { Product, Category, Order, StockMovement } from './types';
import { offlineDb, LocalOrder } from './offlineDb';
import { syncEngine } from './syncEngine';
import { KEYS, storage } from './storage';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, isDemoLicense } from './seedData';

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

  // 2. Central Cloud Backend (Vercel)
  const envUrl = (import.meta as any).env?.VITE_API_URL || 'https://omni-server-seven.vercel.app';
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return envUrl;
  }

  try {
    const tenantHeaders = await getTenantHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${envUrl}/api/products`, {
      headers: tenantHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      cachedApiUrl = envUrl;
      return envUrl;
    }
  } catch {
    /* Central server unreachable or network offline */
  }

  cachedApiUrl = envUrl;
  return envUrl;
}

export const posApi = {
  /**
   * Fetch products: Live first (if online), fallback to Dexie IndexedDB,
   * then localStorage, and finally bundled seed catalog.
   */
  async fetchProducts(module?: string): Promise<Product[]> {
    // 1. Try to fetch live from backend when online, and cache locally
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const tenantHeaders = await getTenantHeaders();
        const base = await resolveApiUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${base}/api/products${module ? `?module=${module}` : ''}`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const remoteData = await res.json();
          if (Array.isArray(remoteData) && remoteData.length > 0) {
            // Save to Dexie IndexedDB
            try {
              await offlineDb.products.bulkPut(remoteData);
            } catch (err) {
              console.warn('[OfflineDB] bulkPut products error:', err);
            }

            // Save to LocalStorage Dual-Cache
            try {
              const currentLocal = storage.getList<Product>(KEYS.products);
              const map = new Map(currentLocal.map((p) => [p.id, p]));
              remoteData.forEach((p) => map.set(p.id, p));
              storage.setList(KEYS.products, Array.from(map.values()));
            } catch (err) {
              console.warn('[Storage] setList products error:', err);
            }

            return remoteData;
          }
        }
      } catch {
        /* Offline: proceed immediately with local storage */
      }
    }

    // 2. Fallback to local Dexie IndexedDB (Offline Persistence)
    try {
      const allDexie = await offlineDb.products.toArray();
      if (allDexie && allDexie.length > 0) {
        if (module) {
          return allDexie.filter((p) => p.module === module);
        }
        return allDexie;
      }
    } catch (dexieErr) {
      console.warn('[OfflineDB] Dexie product query error:', dexieErr);
    }

    // 3. Fallback to LocalStorage (Secondary Offline Cache)
    try {
      const localFallback = storage.getList<Product>(KEYS.products);
      if (localFallback && localFallback.length > 0) {
        if (module) {
          return localFallback.filter((p) => p.module === module);
        }
        return localFallback;
      }
    } catch (storageErr) {
      console.warn('[Storage] localStorage product query error:', storageErr);
    }

    // 4. Bundled INITIAL_PRODUCTS catalog fallback (if Demo license)
    if (isDemoLicense()) {
      const seed = module ? INITIAL_PRODUCTS.filter((p) => p.module === module) : INITIAL_PRODUCTS;
      return seed;
    }

    // For real production client keys: return empty array if no products exist yet
    return [];
  },

  async saveProduct(product: Product): Promise<Product> {
    try {
      // 1. Write immediately to local Dexie IndexedDB
      await offlineDb.products.put(product);

      // 2. Write immediately to LocalStorage
      const currentList = storage.getList<Product>(KEYS.products);
      const updated = [product, ...currentList.filter((p) => p.id !== product.id)];
      storage.setList(KEYS.products, updated);

      // 3. Queue in Outbox for background cloud sync
      await syncEngine.enqueue('product', product.id, 'CREATE', product);

      // 4. Try immediate network push if online
      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${base}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders },
          body: JSON.stringify(product),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) return await res.json();
      }
    } catch {
      /* Saved safely offline in Dexie, localStorage, and Outbox */
    }
    return product;
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
   * Fetch categories: Live first (if online), fallback to Dexie, then localStorage, then seed
   */
  async fetchCategories(module?: string): Promise<Category[]> {
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const tenantHeaders = await getTenantHeaders();
        const base = await resolveApiUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${base}/api/categories${module ? `?module=${module}` : ''}`, {
          headers: tenantHeaders,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const remoteCats = await res.json();
          if (Array.isArray(remoteCats) && remoteCats.length > 0) {
            try {
              await offlineDb.categories.bulkPut(remoteCats);
            } catch {}

            try {
              const currentLocal = storage.getList<Category>(KEYS.categories);
              const map = new Map(currentLocal.map((c) => [c.id, c]));
              remoteCats.forEach((c) => map.set(c.id, c));
              storage.setList(KEYS.categories, Array.from(map.values()));
            } catch {}

            return remoteCats;
          }
        }
      } catch {
        /* Offline */
      }
    }

    // 2. Fallback to local Dexie IndexedDB
    try {
      const allCats = await offlineDb.categories.toArray();
      if (allCats && allCats.length > 0) {
        if (module) {
          const filtered = allCats.filter((c) => c.module === module);
          if (filtered.length > 0) return filtered;
        }
        return allCats;
      }
    } catch {}

    // 3. Fallback to LocalStorage
    try {
      const localCats = storage.getList<Category>(KEYS.categories);
      if (localCats && localCats.length > 0) {
        if (module) {
          const filtered = localCats.filter((c) => c.module === module);
          if (filtered.length > 0) return filtered;
        }
        return localCats;
      }
    } catch {}

    // 4. Bundled INITIAL_CATEGORIES fallback (if Demo key)
    if (isDemoLicense()) {
      return module ? INITIAL_CATEGORIES.filter((c) => c.module === module) : INITIAL_CATEGORIES;
    }

    // For real production client keys: return empty array if no categories exist yet
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
   * Fetch Khatas with full offline resilience
   */
  async fetchKhatas(): Promise<any[]> {
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const base = await resolveApiUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${base}/api/khata`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const remoteKhatas = await res.json();
          if (Array.isArray(remoteKhatas) && remoteKhatas.length > 0) {
            try {
              await offlineDb.khatas.bulkPut(remoteKhatas);
            } catch {}
            return remoteKhatas;
          }
        }
      } catch {
        /* Offline */
      }
    }

    try {
      const localKhatas = await offlineDb.khatas.toArray();
      if (localKhatas && localKhatas.length > 0) return localKhatas;
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
