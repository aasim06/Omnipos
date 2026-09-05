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

const INITIAL_VENDORS: Vendor[] = [];

export const vendorStorage = {
  getVendors(): Vendor[] {
    const list = storage.getList<Vendor>(STORAGE_KEY);
    if (!list || list.length === 0) {
      return [];
    }

    // Auto-migrate legacy entries so that business name is consistently in 'name'
    let changed = false;
    const migrated = list.map((v) => {
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

    return list;
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
