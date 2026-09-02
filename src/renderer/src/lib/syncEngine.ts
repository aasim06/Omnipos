import { offlineDb, SyncQueueItem, LocalOrder } from './offlineDb';
import { resolveApiUrl } from './api';
import { Product, Category, Order } from '@shared/types';

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

type SyncListener = (state: SyncState) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncedAt: Date | null = null;
  private lastError: string | null = null;
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.syncNow();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });

      // Periodic check every 20 seconds
      this.syncTimer = setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.syncNow();
        }
      }, 20000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async getPendingCount(): Promise<number> {
    try {
      return await offlineDb.syncQueue.where('status').equals('pending').count();
    } catch {
      return 0;
    }
  }

  public getState(): SyncState {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: 0,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
  }

  private async notify() {
    const pendingCount = await this.getPendingCount();
    const state: SyncState = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
    };
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Queue an action to be synced with the Central Cloud API
   */
  public async enqueue(
    entity: SyncQueueItem['entity'],
    entityId: string,
    action: SyncQueueItem['action'],
    payload: any
  ): Promise<void> {
    await offlineDb.syncQueue.add({
      entity,
      entityId,
      action,
      payload,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });

    this.notify();

    if (this.isOnline && !this.isSyncing) {
      // Trigger background sync without blocking
      void this.syncNow();
    }
  }

  /**
   * Trigger immediate push of outbox and pull of catalog updates
   */
  public async syncNow(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.lastError = null;
    await this.notify();

    try {
      const baseUrl = await this.resolveCloudUrl();

      // 1. Process Outbox Push
      const pendingItems = await offlineDb.syncQueue
        .where('status')
        .equals('pending')
        .limit(50)
        .toArray();

      if (pendingItems.length > 0) {
        for (const item of pendingItems) {
          try {
            await this.pushItem(baseUrl, item);
            // Mark synced in queue and remove or update status
            await offlineDb.syncQueue.update(item.id!, { status: 'synced' });
            if (item.entity === 'order') {
              await offlineDb.orders.update(item.entityId, { synced: 1 });
            }
          } catch (err: any) {
            console.warn(`[SyncEngine] Failed to sync ${item.entity} ${item.entityId}:`, err);
            await offlineDb.syncQueue.update(item.id!, {
              retryCount: item.retryCount + 1,
              lastError: err?.message || 'Network error',
            });
          }
        }
      }

      // 2. Process Catalog Pull (Cloud -> Local IndexedDB)
      await this.pullCatalog(baseUrl);

      this.lastSyncedAt = new Date();
      this.isOnline = true;
    } catch (err: any) {
      console.warn('[SyncEngine] Cloud sync check failed:', err);
      this.lastError = err?.message || 'Sync connection failed';
    } finally {
      this.isSyncing = false;
      await this.notify();
    }
  }

  private async pushItem(baseUrl: string, item: SyncQueueItem): Promise<void> {
    let endpoint = '';
    let method = 'POST';

    if (item.entity === 'order') {
      endpoint = `${baseUrl}/api/orders`;
      method = item.action === 'UPDATE' ? 'PUT' : 'POST';
    } else if (item.entity === 'product') {
      endpoint = `${baseUrl}/api/products`;
      method = item.action === 'UPDATE' ? 'PUT' : item.action === 'DELETE' ? 'DELETE' : 'POST';
    } else if (item.entity === 'expense') {
      endpoint = `${baseUrl}/api/expenses`;
    } else if (item.entity === 'khata') {
      endpoint = `${baseUrl}/api/khata`;
    }

    if (!endpoint) return;

    const url = item.action === 'UPDATE' || item.action === 'DELETE' 
      ? `${endpoint}/${item.entityId}` 
      : endpoint;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method !== 'DELETE' ? JSON.stringify(item.payload) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
    }
  }

  private async pullCatalog(baseUrl: string): Promise<void> {
    try {
      const res = await fetch(`${baseUrl}/api/products`);
      if (res.ok) {
        const products: Product[] = await res.json();
        if (Array.isArray(products) && products.length > 0) {
          await offlineDb.products.bulkPut(products);
        }
      }
    } catch {
      // Ignore pull errors if offline
    }

    try {
      const catRes = await fetch(`${baseUrl}/api/categories`);
      if (catRes.ok) {
        const categories: Category[] = await catRes.json();
        if (Array.isArray(categories) && categories.length > 0) {
          await offlineDb.categories.bulkPut(categories);
        }
      }
    } catch {
      // Ignore
    }
  }

  private async resolveCloudUrl(): Promise<string> {
    // Check .env cloud api url first, or fallback to local backend
    const cloudEnv = (import.meta as any).env?.VITE_CLOUD_API_URL;
    if (cloudEnv) return cloudEnv;
    return await resolveApiUrl();
  }
}

export const syncEngine = new SyncEngine();
