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

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vend_1',
    name: 'Metro Cash & Carry Wholesale',
    companyName: 'Metro Cash & Carry Wholesale',
    contactPerson: 'Muhammad Tariq',
    phone: '0300-1234567',
    email: 'metro.supplies@gmail.com',
    address: 'Thokar Niaz Baig, Multan Road, Lahore',
    openingBalance: 0,
    category: 'Groceries & Bulk Items',
    notes: 'Primary supplier for cooking oil, grains, and beverages',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vend_2',
    name: 'Dawn Bread & Bun Distributors',
    companyName: 'Dawn Bread & Bun Distributors',
    contactPerson: 'Adeel Khan',
    phone: '0321-9876543',
    email: 'dawn.orderdesk@dawn.com',
    address: 'Industrial Area, Kot Lakhpat, Lahore',
    openingBalance: 15000,
    category: 'Bakery & Buns',
    notes: 'Supplies fresh burger buns and bakery items every morning',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vend_3',
    name: 'Prime Meat & Chicken Supplies',
    companyName: 'Prime Meat & Chicken Supplies',
    contactPerson: 'Chaudhry Bilal',
    phone: '0333-5551234',
    email: 'primemeat.lhr@gmail.com',
    address: 'Meat Market, Tollinton Market, Lahore',
    openingBalance: 28500,
    category: 'Poultry & Meat',
    notes: 'Supplies daily fresh chicken fillets, wings, and patties',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vend_4',
    name: 'Pak Packaging & Disposables',
    companyName: 'Pak Packaging & Disposables',
    contactPerson: 'Rashid Mehmood',
    phone: '0312-4447788',
    email: 'rashid.packaging@yahoo.com',
    address: 'Urdu Bazar, Lahore',
    openingBalance: 0,
    category: 'Packaging & Cartons',
    notes: 'Burger boxes, kraft bags, cups, and napkins',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const vendorStorage = {
  getVendors(): Vendor[] {
    const list = storage.getList<Vendor>(STORAGE_KEY);
    if (!list || list.length === 0) {
      storage.setList(STORAGE_KEY, INITIAL_VENDORS);
      return INITIAL_VENDORS;
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
