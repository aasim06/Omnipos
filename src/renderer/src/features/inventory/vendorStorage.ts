import { storage } from '@/lib/storage';
import { resolveApiUrl, getTenantHeaders, currentUserName } from '@/lib/api';
import { uid } from '@/lib/utils';
import { PurchaseBill } from '@shared/types';

export interface Vendor {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance?: number; // PKR balance (positive = payable/we owe vendor)
  currentBalance?: number; // Running balance payable
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorTransaction {
  id: string;
  vendorId: string;
  /** BILL = we owe more, PAYMENT = we paid, ADJUSTMENT = signed correction (edit/delete of a purchase) */
  type: 'BILL' | 'PAYMENT' | 'ADJUSTMENT';
  amount: number;
  balanceAfter: number;
  description: string;
  billId?: string;
  paymentMethod?: string;
  createdBy?: string; // user who recorded the entry
  date: string;
  createdAt: string;
}

const STORAGE_KEY = 'pos.vendors';
const TX_STORAGE_KEY = 'pos.vendor_transactions';
const BILLS_STORAGE_KEY = 'pos.purchase_bills';

const SYNC_DIRTY_KEY = 'pos.vendor_sync_dirty';

/*
 * Vendors, the vendor ledger and purchase bills live in the SQLite database (Vendor,
 * VendorTransaction, PurchaseBill tables). localStorage is kept as a synchronous
 * read cache so the existing screens stay instant: every write updates the cache and
 * is pushed to the backend in order; syncWithServer() uploads anything the backend
 * is missing (including pre-upgrade data) and then refreshes the cache from it.
 */
let pushChain: Promise<unknown> = Promise.resolve();

function pushToServer(path: string, method: 'POST' | 'DELETE', body?: unknown): Promise<Response | null> {
  const run = async (): Promise<Response | null> => {
    try {
      const base = await resolveApiUrl();
      const headers = await getTenantHeaders();
      const res = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok && res.status !== 409) storage.setItem(SYNC_DIRTY_KEY, true);
      return res;
    } catch {
      storage.setItem(SYNC_DIRTY_KEY, true);
      return null;
    }
  };
  // Serialise pushes so a vendor is always created before its ledger rows arrive
  const next = pushChain.then(run, run);
  pushChain = next.catch(() => undefined);
  return next;
}

const nullToUndefined = <T extends Record<string, any>>(row: T): T => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) out[k] = v === null ? undefined : v;
  return out as T;
};

const LEGACY_DUMMY_IDS = new Set(['vend_1', 'vend_2', 'vend_3', 'vend_4']);
const LEGACY_DUMMY_NAMES = new Set([
  'metro cash & carry wholesale',
  'dawn bread & bun distributors',
  'prime meat & chicken supplies',
  'pak packaging & disposables',
]);

export const vendorStorage = {
  getVendors(): Vendor[] {
    const list = storage.getList<Vendor>(STORAGE_KEY);
    if (!list || list.length === 0) {
      return [];
    }

    // Auto-purge legacy static demo vendors from storage
    const cleaned = list.filter((v) => {
      if (v.id && LEGACY_DUMMY_IDS.has(v.id)) return false;
      const lower = (v.name || '').trim().toLowerCase();
      if (LEGACY_DUMMY_NAMES.has(lower)) return false;
      const compLower = (v.companyName || '').trim().toLowerCase();
      if (LEGACY_DUMMY_NAMES.has(compLower)) return false;
      return true;
    });

    let changed = cleaned.length !== list.length;

    // Auto-migrate legacy entries so that business name is consistently in 'name'
    const migrated = cleaned.map((v) => {
      if (v.companyName && v.companyName !== v.name && !v.contactPerson) {
        changed = true;
        return {
          ...v,
          contactPerson: v.name,
          name: v.companyName,
          currentBalance: v.currentBalance ?? v.openingBalance ?? 0,
        };
      }
      return {
        ...v,
        currentBalance: v.currentBalance ?? v.openingBalance ?? 0,
      };
    });

    if (changed) {
      storage.setList(STORAGE_KEY, migrated);
      return migrated;
    }

    return migrated;
  },

  saveVendor(
    vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    opts: { push?: boolean } = {}
  ): Vendor {
    const push = opts.push !== false;
    const list = this.getVendors();
    const now = new Date().toISOString();

    if (vendor.id) {
      const idx = list.findIndex((v) => v.id === vendor.id);
      if (idx !== -1) {
        const prev = list[idx];
        const prevOpening = prev.openingBalance ?? 0;
        const prevCurrent = prev.currentBalance ?? prevOpening;
        // currentBalance is the single source of truth for what we owe the vendor.
        // Editing the opening balance shifts the running balance by the same delta.
        let nextCurrent = vendor.currentBalance ?? prevCurrent;
        if (vendor.currentBalance === undefined && vendor.openingBalance !== undefined) {
          nextCurrent = prevCurrent + ((vendor.openingBalance ?? 0) - prevOpening);
        }
        const updated: Vendor = {
          ...prev,
          ...vendor,
          id: vendor.id,
          currentBalance: nextCurrent,
          updatedAt: now,
        };
        list[idx] = updated;
        storage.setList(STORAGE_KEY, list);
        if (push) {
          // The backend recomputes currentBalance itself (opening-balance shift only)
          const { currentBalance: _cb, ...profile } = updated;
          void pushToServer('/api/vendors', 'POST', profile);
        }
        return updated;
      }
    }

    const newVendor: Vendor = {
      ...vendor,
      id: uid('vend_'),
      currentBalance: vendor.openingBalance ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newVendor);
    storage.setList(STORAGE_KEY, list);
    if (push) void pushToServer('/api/vendors', 'POST', newVendor);
    return newVendor;
  },

  deleteVendor(id: string): void {
    const list = this.getVendors().filter((v) => v.id !== id);
    storage.setList(STORAGE_KEY, list);
    void pushToServer(`/api/vendors/${encodeURIComponent(id)}`, 'DELETE');
  },

  /** Payable balance we owe this vendor (running ledger balance). */
  getBalance(vendor: Pick<Vendor, 'currentBalance' | 'openingBalance'> | null | undefined): number {
    if (!vendor) return 0;
    return vendor.currentBalance ?? vendor.openingBalance ?? 0;
  },

  /** Find a vendor by id first, then by (company) name, case-insensitive. */
  findVendor(idOrName?: { id?: string; name?: string }): Vendor | undefined {
    const all = this.getVendors();
    if (idOrName?.id) {
      const byId = all.find((v) => v.id === idOrName.id);
      if (byId) return byId;
    }
    const n = (idOrName?.name || '').trim().toLowerCase();
    if (!n) return undefined;
    return all.find(
      (v) => (v.name || '').trim().toLowerCase() === n || (v.companyName || '').trim().toLowerCase() === n
    );
  },

  /* ── Vendor Running Ledger Transactions ── */
  getTransactions(vendorId?: string): VendorTransaction[] {
    const all = storage.getList<VendorTransaction>(TX_STORAGE_KEY) || [];
    if (!vendorId) return all;
    return all.filter((t) => t.vendorId === vendorId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  recordTransaction(
    vendorId: string,
    type: 'BILL' | 'PAYMENT' | 'ADJUSTMENT',
    amount: number,
    description: string,
    paymentMethod = 'cash',
    billId?: string,
    opts: { id?: string } = {}
  ): VendorTransaction {
    const vendors = this.getVendors();
    const vendor = vendors.find((v) => v.id === vendorId);
    const prevBalance = vendor?.currentBalance ?? vendor?.openingBalance ?? 0;
    // BILL increases what we owe (+amount), PAYMENT decreases what we owe (-amount)
    // ADJUSTMENT carries a signed amount (+ increases payable, - reduces it)
    const newBalance = type === 'PAYMENT' ? prevBalance - amount : prevBalance + amount;

    if (vendor) {
      vendor.currentBalance = newBalance;
      this.saveVendor(vendor, { push: false });
    }

    const txs = storage.getList<VendorTransaction>(TX_STORAGE_KEY) || [];
    const now = new Date().toISOString();
    const newTx: VendorTransaction = {
      id: opts.id || uid('vtx_'),
      vendorId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      paymentMethod,
      billId,
      createdBy: currentUserName(),
      date: now,
      createdAt: now,
    };

    txs.unshift(newTx);
    storage.setList(TX_STORAGE_KEY, txs);
    void pushToServer('/api/vendor-transactions', 'POST', newTx);
    return newTx;
  },

  /* ── Multi-Item Purchase Bills Storage ── */
  getPurchaseBills(): PurchaseBill[] {
    return storage.getList<PurchaseBill>(BILLS_STORAGE_KEY) || [];
  },

  /** True when another bill (not `exceptId`) already uses this bill number (case-insensitive). */
  isBillNumberTaken(billNumber: string, exceptId?: string): boolean {
    const n = billNumber.trim().toLowerCase();
    if (!n) return false;
    return this.getPurchaseBills().some((b) => b.id !== exceptId && (b.billNumber || '').trim().toLowerCase() === n);
  },

  /**
   * Ask the backend whether a bill number is already used. Resolves false when it is free
   * or the backend cannot be reached (the local check still applies).
   */
  async isBillNumberTakenOnServer(billNumber: string, exceptId?: string): Promise<boolean> {
    try {
      const base = await resolveApiUrl();
      const headers = await getTenantHeaders();
      const res = await fetch(`${base}/api/purchase-bills`, { headers });
      if (!res.ok) return false;
      const rows: PurchaseBill[] = await res.json();
      const n = billNumber.trim().toLowerCase();
      return rows.some((b) => b.id !== exceptId && (b.billNumber || '').trim().toLowerCase() === n);
    } catch {
      return false;
    }
  },

  savePurchaseBill(bill: PurchaseBill): PurchaseBill {
    if (!bill.createdBy) bill = { ...bill, createdBy: currentUserName() };
    const bills = this.getPurchaseBills();
    const idx = bills.findIndex((b) => b.id === bill.id);
    if (idx !== -1) {
      bills[idx] = bill;
    } else {
      bills.unshift(bill);
    }
    storage.setList(BILLS_STORAGE_KEY, bills);
    void pushToServer('/api/purchase-bills', 'POST', bill);
    return bill;
  },

  /** Wait until every queued push has reached the backend (or failed). */
  async flush(): Promise<void> {
    await pushChain;
  },

  /**
   * Upload anything the backend is missing (first run after upgrade, or writes made while it
   * was unreachable), then replace the local cache with the backend's data.
   * Returns true when the cache was refreshed from the backend.
   */
  async syncWithServer(): Promise<boolean> {
    try {
      await pushChain;
      const base = await resolveApiUrl();
      const headers = await getTenantHeaders();
      const jsonHeaders = { 'Content-Type': 'application/json', ...headers };

      const ping = await fetch(`${base}/api/vendors`, { headers });
      if (!ping.ok) return false;

      const localVendors = storage.getList<Vendor>(STORAGE_KEY);
      const localTx = storage.getList<VendorTransaction>(TX_STORAGE_KEY);
      const localBills = storage.getList<PurchaseBill>(BILLS_STORAGE_KEY);
      if (localVendors.length || localTx.length || localBills.length) {
        const imp = await fetch(`${base}/api/vendors/import`, {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ vendors: localVendors, transactions: localTx, bills: localBills }),
        });
        if (!imp.ok) return false;
      }

      const [vRes, tRes, bRes] = await Promise.all([
        fetch(`${base}/api/vendors`, { headers }),
        fetch(`${base}/api/vendor-transactions`, { headers }),
        fetch(`${base}/api/purchase-bills`, { headers }),
      ]);
      if (!vRes.ok || !tRes.ok || !bRes.ok) return false;
      const [vendors, txs, bills] = await Promise.all([vRes.json(), tRes.json(), bRes.json()]);

      storage.setList(STORAGE_KEY, (vendors as Vendor[]).map(nullToUndefined));
      storage.setList(TX_STORAGE_KEY, (txs as VendorTransaction[]).map(nullToUndefined));
      storage.setList(BILLS_STORAGE_KEY, (bills as PurchaseBill[]).map(nullToUndefined));
      storage.setItem(SYNC_DIRTY_KEY, false);
      return true;
    } catch {
      return false;
    }
  },

  /** Drop the local cache (used by the full data wipe). */
  clearLocalCache(): void {
    storage.setList(STORAGE_KEY, []);
    storage.setList(TX_STORAGE_KEY, []);
    storage.setList(BILLS_STORAGE_KEY, []);
    storage.setItem(SYNC_DIRTY_KEY, false);
  },
};
