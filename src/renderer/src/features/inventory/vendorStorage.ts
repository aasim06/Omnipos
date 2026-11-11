import { storage } from '@/lib/storage';
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
  date: string;
  createdAt: string;
}

const STORAGE_KEY = 'pos.vendors';
const TX_STORAGE_KEY = 'pos.vendor_transactions';
const BILLS_STORAGE_KEY = 'pos.purchase_bills';

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

  saveVendor(vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Vendor {
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
    return newVendor;
  },

  deleteVendor(id: string): void {
    const list = this.getVendors().filter((v) => v.id !== id);
    storage.setList(STORAGE_KEY, list);
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
    billId?: string
  ): VendorTransaction {
    const vendors = this.getVendors();
    const vendor = vendors.find((v) => v.id === vendorId);
    const prevBalance = vendor?.currentBalance ?? vendor?.openingBalance ?? 0;
    // BILL increases what we owe (+amount), PAYMENT decreases what we owe (-amount)
    // ADJUSTMENT carries a signed amount (+ increases payable, - reduces it)
    const newBalance = type === 'PAYMENT' ? prevBalance - amount : prevBalance + amount;

    if (vendor) {
      vendor.currentBalance = newBalance;
      this.saveVendor(vendor);
    }

    const txs = storage.getList<VendorTransaction>(TX_STORAGE_KEY) || [];
    const now = new Date().toISOString();
    const newTx: VendorTransaction = {
      id: uid('vtx_'),
      vendorId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      paymentMethod,
      billId,
      date: now,
      createdAt: now,
    };

    txs.unshift(newTx);
    storage.setList(TX_STORAGE_KEY, txs);
    return newTx;
  },

  /* ── Multi-Item Purchase Bills Storage ── */
  getPurchaseBills(): PurchaseBill[] {
    return storage.getList<PurchaseBill>(BILLS_STORAGE_KEY) || [];
  },

  savePurchaseBill(bill: PurchaseBill): PurchaseBill {
    const bills = this.getPurchaseBills();
    const idx = bills.findIndex((b) => b.id === bill.id);
    if (idx !== -1) {
      bills[idx] = bill;
    } else {
      bills.unshift(bill);
    }
    storage.setList(BILLS_STORAGE_KEY, bills);
    return bill;
  },
};
