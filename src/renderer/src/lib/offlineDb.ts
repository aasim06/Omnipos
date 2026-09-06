import Dexie, { Table } from 'dexie';
import { Product, Order, Category, StockMovement } from '@shared/types';

export interface LocalOrder extends Order {
  synced: 0 | 1;
  syncError?: string;
}

export interface SyncQueueItem {
  id?: number;
  entity: 'order' | 'product' | 'khata' | 'expense' | 'stockMovement';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  retryCount: number;
  lastError?: string;
  createdAt: string;
}

export interface LocalCustomerKhata {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  cnic?: string;
  customerType?: string;
  currentDebt: number;
  creditLimit?: number;
  dueDays?: number;
  note?: string;
  synced: 0 | 1;
  createdAt?: string;
  updatedAt: string;
}

export interface LocalKhataTx {
  id: string;
  khataId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter?: number;
  description?: string;
  paymentMethod?: string;
  createdAt: string;
  synced?: 0 | 1;
}

export interface LocalExpense {
  id: string;
  category: string;
  amount: number;
  paymentMode: string;
  vendorName?: string;
  description?: string;
  date: string;
  synced: 0 | 1;
}

export class OmniposDexieDatabase extends Dexie {
  products!: Table<Product, string>;
  categories!: Table<Category, string>;
  orders!: Table<LocalOrder, string>;
  stockMovements!: Table<StockMovement, string>;
  khatas!: Table<LocalCustomerKhata, string>;
  khataTransactions!: Table<LocalKhataTx, string>;
  expenses!: Table<LocalExpense, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super('OmniposOfflineDB');
    this.version(1).stores({
      products: 'id, module, category, name, price, updatedAt',
      categories: 'id, module, name',
      orders: 'id, module, stage, synced, createdAt',
      stockMovements: 'id, module, productId, date',
      khatas: 'id, name, phone, synced, updatedAt',
      expenses: 'id, category, date, synced',
      syncQueue: '++id, entity, entityId, status, createdAt',
    });
    this.version(2).stores({
      khataTransactions: 'id, khataId, createdAt',
    });
  }
}

export const offlineDb = new OmniposDexieDatabase();
