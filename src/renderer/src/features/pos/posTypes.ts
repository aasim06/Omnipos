import { CartLine } from '@shared/types';

/* ─── Fast Food Order Types & Parked Orders ──────────────────────────── */

export type FastFoodOrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface ParkedOrder {
  id: string;
  parkedAt: string;
  label: string;
  orderType: FastFoodOrderType;
  tableOrToken: string;
  lines: CartLine[];
  subtotal: number;
}

export interface PosCounterProps {
  module: 'fastfood' | 'minimart';
  modeType?: 'fastfood' | 'minimart' | 'paint';
}

export interface CustomerOption {
  id?: string;
  name: string;
  phone?: string;
  currentDebt?: number;
  creditLimit?: number;
}
