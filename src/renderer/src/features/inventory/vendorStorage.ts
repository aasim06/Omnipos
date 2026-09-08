import { storage } from '@/lib/storage';
import { uid } from '@/lib/utils';

export interface Vendor {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance?: number; // PKR balance
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'pos.vendors';

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
        };
      }
      return v;
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
        const updated: Vendor = {
          ...list[idx],
          ...vendor,
          id: vendor.id,
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
};
