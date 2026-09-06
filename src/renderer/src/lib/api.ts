import { Product, Category, Order, StockMovement, CategoryProfile, ModuleKey } from './types';
import { offlineDb, LocalOrder, LocalCustomerKhata, LocalKhataTx, LocalExpense } from './offlineDb';
import { syncEngine } from './syncEngine';
import { KEYS, storage } from './storage';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, isDemoLicense } from './seedData';
import { decodeProductVariants, encodeProductVariants, setLocalVariantRegistry } from './variants';
import { CATEGORY_PROFILES } from './categoryProfiles';

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

  async seedBusinessProfile(profileKey: string, module?: ModuleKey): Promise<Category[]> {
    const config = CATEGORY_PROFILES[profileKey as CategoryProfile];
    if (!config) return [];
    const targetModule: ModuleKey = module || (profileKey === 'food' ? 'fastfood' : 'minimart');
    const createdCats: Category[] = [];

    for (const catName of config.defaultCategories) {
      const newCat: Category = {
        id: `cat_${profileKey}_${catName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        module: targetModule,
        name: catName,
        profile: profileKey as CategoryProfile,
        suggestedSizes: config.suggestedSizes,
        suggestedUnits: config.suggestedUnits,
        createdAt: new Date().toISOString(),
      };
      await posApi.saveCategory(newCat);
      createdCats.push(newCat);
    }

    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        fetch(`${base}/api/categories/seed-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders },
          body: JSON.stringify({ profileKey, module: targetModule }),
        }).catch(() => {});
      } catch {}
    }

    return createdCats;
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
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('pos_khata_updated'));
            }
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
      {
        id: 'khata_guest',
        name: 'Guest / Walk-in Customer',
        phone: '0300-0000000',
        currentDebt: 0,
        creditLimit: 50000,
        synced: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
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
    const record: LocalCustomerKhata = {
      id: khata.id || `khata_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: khata.name || 'Unnamed Customer',
      phone: khata.phone || '',
      address: khata.address || '',
      cnic: khata.cnic || '',
      customerType: khata.customerType || 'retail',
      currentDebt: Number(khata.currentDebt || 0),
      creditLimit: Number(khata.creditLimit || 50000),
      dueDays: Number(khata.dueDays || 30),
      note: khata.note || '',
      synced: 0,
      createdAt: khata.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Instant Dexie Write
    await offlineDb.khatas.put(record);

    // 2. Queue for background cloud sync
    await syncEngine.enqueue('khata', record.id, isNew ? 'CREATE' : 'UPDATE', record);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_khata_updated', { detail: record }));
    }

    // 3. Opportunistic cloud push if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

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
  }): Promise<LocalKhataTx> {
    const amt = Number(params.amount || 0);
    const existing = await offlineDb.khatas.get(params.khataId);
    const prevDebt = Number(existing?.currentDebt || 0);
    const newDebt = params.type === 'DEBIT' ? prevDebt + amt : Math.max(0, prevDebt - amt);

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
      createdAt: new Date().toISOString(),
      synced: 0,
    };
    await offlineDb.khataTransactions.put(txRecord);

    // 3. Queue into syncEngine
    await syncEngine.enqueue('khata', params.khataId, 'UPDATE', {
      transaction: txRecord,
      currentDebt: newDebt,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pos_khata_updated', { detail: { khataId: params.khataId, newDebt } }));
    }

    // 4. Background push if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      try {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${base}/api/khata/${params.khataId}/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...tenantHeaders },
          body: JSON.stringify({
            type: params.type,
            amount: amt,
            paymentMethod: params.paymentMethod || 'cash',
            description: params.description,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          await offlineDb.khataTransactions.update(txRecord.id, { synced: 1 });
          await offlineDb.khatas.update(params.khataId, { synced: 1 });
        }
      } catch {}
    }

    return txRecord;
  },

  /**
   * Delete Khata account offline-first
   */
  async deleteKhata(id: string): Promise<void> {
    try {
      await offlineDb.khatas.delete(id);
      await offlineDb.khataTransactions.where('khataId').equals(id).delete();
      await syncEngine.enqueue('khata', id, 'DELETE', { id });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_khata_updated', { detail: { id, deleted: true } }));
      }

      if (typeof navigator === 'undefined' || navigator.onLine) {
        const base = await resolveApiUrl();
        const tenantHeaders = await getTenantHeaders();
        await fetch(`${base}/api/khata/${id}`, {
          method: 'DELETE',
          headers: tenantHeaders,
        });
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
    let localMovements: StockMovement[] = [];
    try {
      if (module && module !== 'all') {
        localMovements = await offlineDb.stockMovements.where('module').equals(module).reverse().sortBy('date');
      } else {
        localMovements = await offlineDb.stockMovements.reverse().sortBy('date');
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
          if (Array.isArray(remote) && remote.length > 0) {
            await offlineDb.stockMovements.bulkPut(remote);
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
      if (module && module !== 'all') {
        return await offlineDb.stockMovements.where('module').equals(module).reverse().sortBy('date');
      }
      return await offlineDb.stockMovements.reverse().sortBy('date');
    } catch {
      return [];
    }
  },

  async saveStockMovement(data: Partial<StockMovement>): Promise<StockMovement> {
    const record: StockMovement = {
      id: data.id || `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      module: data.module || 'minimart',
      productId: data.productId || '',
      productName: data.productName || 'Unknown Product',
      type: data.type || 'in',
      quantity: Number(data.quantity || 0),
      reason: data.reason || 'Inventory Adjustment',
      referenceInvoice: data.referenceInvoice || '',
      vendorName: data.vendorName || '',
      unitCost: data.unitCost,
      date: data.date || new Date().toISOString(),
    };

    // 1. Instant local write to Dexie
    await offlineDb.stockMovements.put(record);

    // 2. Instant stock adjustment in local products table
    if (record.productId) {
      try {
        const prod = await offlineDb.products.get(record.productId);
        if (prod) {
          const currentStock = Number(prod.openingStock || 0);
          const updatedStock = record.type === 'in' 
            ? currentStock + record.quantity 
            : Math.max(0, currentStock - record.quantity);
          await offlineDb.products.update(record.productId, {
            openingStock: updatedStock,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('[OfflineDB] Stock movement product update error:', err);
      }
    }

    // 3. Queue in outbox
    await syncEngine.enqueue('stockMovement', record.id, 'CREATE', record);

    // 4. Background push if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
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
  },
};
