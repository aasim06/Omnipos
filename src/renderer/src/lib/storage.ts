/**
 * Storage abstraction layer.
 *
 * Everything in the app reads/writes through this file, not localStorage
 * directly. Today it's backed by localStorage; when this project is
 * wrapped in Tauri, only this file needs to change (e.g. to Tauri's fs
 * or SQL plugin) — components and pages stay untouched.
 */

const isBrowser = typeof window !== "undefined";

function readRaw<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeRaw<T>(key: string, value: T): void {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getList<T>(key: string): T[] {
    return readRaw<T[]>(key, []);
  },
  setList<T>(key: string, value: T[]): void {
    writeRaw(key, value);
  },
  getItem<T>(key: string, fallback: T): T {
    return readRaw<T>(key, fallback);
  },
  setItem<T>(key: string, value: T): void {
    writeRaw(key, value);
  },
};

// Storage keys — collected here so they're easy to audit and never collide.
export const KEYS = {
  products: "pos.products",
  categories: "pos.categories",
  orders: "pos.orders",
  stockMovements: "pos.stockMovements",
  storeSettings: "pos.storeSettings",
} as const;
