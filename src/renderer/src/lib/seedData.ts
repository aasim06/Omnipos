import { KEYS, storage } from "./storage";
import { Order, Product } from "./types";

export const INITIAL_PRODUCTS: Product[] = [];

export function ensureInitialData() {
  if (typeof window === "undefined") return;

  // Clean out any legacy mock dummy products
  const existingProducts = storage.getList<Product>(KEYS.products);
  const cleanedProducts = existingProducts.filter(
    (p) => !p.id.startsWith("prod_ff_") && !p.id.startsWith("prod_mm_")
  );
  if (cleanedProducts.length !== existingProducts.length) {
    storage.setList(KEYS.products, cleanedProducts);
  }

  const existingOrders = storage.getList<Order>(KEYS.orders);
  // Filter out legacy sample mock orders
  const cleanedOrders = existingOrders.filter(
    (o) => o.id !== "ord_ff_101" && o.id !== "ord_mm_201"
  );
  if (cleanedOrders.length !== existingOrders.length) {
    storage.setList(KEYS.orders, cleanedOrders);
  }
}
