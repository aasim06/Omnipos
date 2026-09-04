import { Product, Category } from "./types";

// 100% Blank catalog - no hardcoded dummy products or categories
export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_PRODUCTS: Product[] = [];

export function isDemoLicense(): boolean {
  if (typeof window === "undefined") return false;
  const activeKey = (
    localStorage.getItem("omnipos_active_key") ||
    localStorage.getItem("omnipos_license_key") ||
    ""
  ).toUpperCase().trim();
  if (!activeKey) return true;
  return activeKey.includes("DEMO") || activeKey === "OMNI-DEMO-2026-LIVE";
}

export async function ensureInitialData(): Promise<void> {
  // Clean catalog: no mock items, no hardcoded auto-deletions
  return;
}
