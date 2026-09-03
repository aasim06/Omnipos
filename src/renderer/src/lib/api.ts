import { Product, Category, Order, StockMovement } from './types';
import { offlineDb, LocalOrder } from './offlineDb';
import { syncEngine } from './syncEngine';
import { KEYS, storage } from './storage';

let cachedApiUrl: string | null = null;

export async function resolveApiUrl(): Promise<string> {
  if (cachedApiUrl) return cachedApiUrl;

  // 1. Central Backend (Neon PostgreSQL on port 4000)
  const envUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${envUrl}/api/products`);
    if (res.ok) {
      cachedApiUrl = envUrl;
      return envUrl;
    }
  } catch {
    /* Central server unreachable */
  }

  // 2. Embedded local Electron Express backend
  if (typeof window !== 'undefined' && window.posApi?.getApiUrl) {
    const url = await window.posApi.getApiUrl();
    if (url) {
      cachedApiUrl = url;
      return url;
    }
  }

  cachedApiUrl = envUrl;
  return envUrl;
}

export const posApi = {
  /**
   * Fetch products: Live first, fallback to Dexie IndexedDB
   */
  async fetchProducts(module?: string): Promise<Product[]> {
    try {
      // 1. Try to fetch live from backend first and sync to Dexie
      try {
        const base = await resolveApiUrl();
        const res = await fetch(`${base}/api/products${module ? `?module=${module}` : ''}`);
        if (res.ok) {
          const remoteData = await res.json();
          if (Array.isArray(remoteData) && remoteData.length > 0) {
            await offlineDb.products.bulkPut(remoteData);
            return remoteData;
          }
        }
      } catch {
        /* Offline: proceed with local IndexedDB */
      }

      // 2. Fallback to local Dexie IndexedDB
      let localProducts: Product[] = [];
      if (module) {
        localProducts = await offlineDb.products.where('module').equals(module).toArray();
      } else {
        localProducts = await offlineDb.products.toArray();
      }

      if (localProducts.length > 0) {
        return localProducts;
      }
    } catch {
      /* Fallback to local storage if IndexedDB is blocked */
    }

    const legacy = storage.getList<Product>(KEYS.products);
    return module ? legacy.filter((p) => p.module === module) : legacy;
  },

  async saveProduct(product: Product): Promise<Product> {
    try {
      // 1. Write immediately to local Dexie IndexedDB
      await offlineDb.products.put(product);

      // 2. Queue in Outbox
      await syncEngine.enqueue('product', product.id, 'CREATE', product);

      // 3. Try network call
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (res.ok) return await res.json();
    } catch {
      /* Saved offline in Dexie & Outbox */
    }
    return product;
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      await offlineDb.products.delete(id);
      await syncEngine.enqueue('product', id, 'DELETE', { id });

      const base = await resolveApiUrl();
      await fetch(`${base}/api/products/${id}`, { method: 'DELETE' });
    } catch {
      /* Handled offline */
    }
  },

  async fetchCategories(module?: string): Promise<Category[]> {
    try {
      // 1. Try to fetch live from backend first and sync to Dexie
      try {
        const base = await resolveApiUrl();
        const res = await fetch(`${base}/api/categories${module ? `?module=${module}` : ''}`);
        if (res.ok) {
          const remoteCats = await res.json();
          if (Array.isArray(remoteCats) && remoteCats.length > 0) {
            await offlineDb.categories.bulkPut(remoteCats);
            return remoteCats;
          }
        }
      } catch {
        /* Offline: proceed with local IndexedDB */
      }

      // 2. Fallback to local Dexie IndexedDB
      let localCats: Category[] = [];
      if (module) {
        localCats = await offlineDb.categories.where('module').equals(module).toArray();
      } else {
        localCats = await offlineDb.categories.toArray();
      }

      if (localCats.length > 0) return localCats;
    } catch {
      /* Fallback */
    }
    const legacy = storage.getList<Category>(KEYS.categories);
    return module ? legacy.filter((c) => c.module === module) : legacy;
  },

  async saveCategory(cat: Category): Promise<Category> {
    try {
      await offlineDb.categories.put(cat);
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cat),
      });
      if (res.ok) return await res.json();
    } catch {
      /* Saved in Dexie */
    }
    return cat;
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      await offlineDb.categories.delete(id);
      const base = await resolveApiUrl();
      await fetch(`${base}/api/categories/${id}`, { method: 'DELETE' });
    } catch {
      /* Handled in Dexie */
    }
  },

  /**
   * Fetch Orders: Offline-First strategy.
   * Reads from Dexie IndexedDB, syncs with backend if reachable.
   */
  async fetchOrders(module?: string): Promise<Order[]> {
    try {
      let localOrders: LocalOrder[] = [];
      if (module) {
        localOrders = await offlineDb.orders.where('module').equals(module).reverse().sortBy('createdAt');
      } else {
        localOrders = await offlineDb.orders.reverse().sortBy('createdAt');
      }

      try {
        const base = await resolveApiUrl();
        const res = await fetch(`${base}/api/orders${module ? `?module=${module}` : ''}`);
        if (res.ok) {
          const remoteOrders = await res.json();
          if (Array.isArray(remoteOrders)) {
            // Mark remote orders as synced: 1
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

      if (localOrders.length > 0) {
        return localOrders;
      }
    } catch {
      /* Fallback */
    }

    const legacy = storage.getList<Order>(KEYS.orders);
    return module ? legacy.filter((o) => o.module === module) : legacy;
  },

  /**
   * Save Order (Zero-Lag Local Write):
   * 1. Foran local Dexie IndexedDB mein save hota hai with synced: 0.
   * 2. Outbox Queue mein push hota hai.
   * 3. Agar online ho, to background mein API ko push kar ke synced: 1 karta hai.
   * 4. Cashier ko bina rukaawat ke instant response milta hai (receipt print ho sakti hai).
   */
  async saveOrder(order: Order): Promise<Order> {
    const localOrder: LocalOrder = {
      ...order,
      synced: 0,
    };

    try {
      // 1. Instant local write to Dexie
      await offlineDb.orders.put(localOrder);

      // Deduct stock in local Dexie database for instant offline consistency
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

      // 2. Queue in Outbox for Cloud Sync
      await syncEngine.enqueue('order', order.id, 'CREATE', order);

      // 3. Try immediate push if online
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (res.ok) {
        const saved = await res.json();
        // Update local status to synced
        await offlineDb.orders.update(order.id, { synced: 1 });
        return saved;
      }
    } catch {
      // Offline: order is safely preserved in Dexie IndexedDB with synced: 0
      console.log(`[Omnipos Offline] Order #${order.id} saved in local Dexie DB. Queued for cloud sync.`);
    }

    return order;
  },

  async printReceipt(printerName?: string): Promise<boolean> {
    if (typeof window !== 'undefined' && window.posApi?.printReceipt) {
      const res = await window.posApi.printReceipt({ printerName, silent: true });
      return res.ok;
    }
    window.print();
    return true;
  },
};
