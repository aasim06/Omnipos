import { KEYS, storage } from "./storage";
import { Order, Product, Category } from "./types";
import { offlineDb } from "./offlineDb";

export const INITIAL_CATEGORIES: Category[] = [
  // Fast Food Categories
  { id: "cat_ff_burger", module: "fastfood", name: "Burger", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_pizza", module: "fastfood", name: "Pizza", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_fries", module: "fastfood", name: "Fries", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_ff_bev", module: "fastfood", name: "Beverages", createdAt: "2026-09-01T00:00:00.000Z" },

  // Minimart Categories
  { id: "cat_mm_grocery", module: "minimart", name: "Grocery", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_dairy", module: "minimart", name: "Dairy", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_veg", module: "minimart", name: "Vegetables", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_snacks", module: "minimart", name: "Snacks", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_toys", module: "minimart", name: "Toys", createdAt: "2026-09-01T00:00:00.000Z" },
  { id: "cat_mm_gen", module: "minimart", name: "General", createdAt: "2026-09-01T00:00:00.000Z" },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Fast Food Products
  {
    id: "prod_ff_1",
    module: "fastfood",
    name: "Crispy Zinger Burger",
    description: "Crispy chicken fillet with Mayo & Lettuce",
    costPrice: 320,
    price: 550,
    category: "Burger",
    skuCode: "SKU-89915275",
    rackLocation: "Kitchen A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 55,
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    createdAt: "2026-09-01T11:58:10.401Z",
    updatedAt: "2026-09-04T06:48:47.824Z",
  },
  {
    id: "prod_ff_mtlj440rsgbr7",
    module: "fastfood",
    name: "Crown crust",
    description: "Signature stuffed crust chicken cheese pizza",
    costPrice: 500,
    price: 700,
    category: "Pizza",
    skuCode: "18343020",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 47,
    isAvailable: true,
    createdAt: "2026-09-03T12:56:33.079Z",
    updatedAt: "2026-09-04T06:48:47.793Z",
  },
  {
    id: "prod_ff_2",
    module: "fastfood",
    name: "Double Cheese Burger",
    description: "Two beef patties with double cheddar cheese",
    costPrice: 450,
    price: 720,
    category: "Burger",
    skuCode: "SKU-61339903",
    rackLocation: "Kitchen A-02",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 39,
    imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    createdAt: "2026-09-01T11:58:10.650Z",
    updatedAt: "2026-09-04T06:48:47.809Z",
  },
  {
    id: "prod_1788263921165",
    module: "fastfood",
    name: "Neon Grilled Burger",
    description: "Flame grilled chicken patty with secret spicy sauce",
    costPrice: 380,
    price: 650,
    category: "Burger",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 30,
    isAvailable: true,
    createdAt: "2026-09-01T11:58:41.392Z",
    updatedAt: "2026-09-01T11:58:41.392Z",
  },
  {
    id: "prod_ff_fries",
    module: "fastfood",
    name: "Crispy Masala Fries",
    description: "Golden fries tossed in spicy peri-peri masala",
    costPrice: 150,
    price: 320,
    category: "Fries",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 60,
    isAvailable: true,
    createdAt: "2026-09-01T11:58:41.392Z",
    updatedAt: "2026-09-01T11:58:41.392Z",
  },
  {
    id: "prod_ff_drink",
    module: "fastfood",
    name: "Chilled Soft Drink (Can)",
    description: "330ml chilled carbonated beverage",
    costPrice: 85,
    price: 130,
    category: "Beverages",
    unit: "PCS",
    minThreshold: 20,
    openingStock: 120,
    isAvailable: true,
    createdAt: "2026-09-01T11:58:41.392Z",
    updatedAt: "2026-09-01T11:58:41.392Z",
  },

  // Minimart Products
  {
    id: "prod_mm_toy",
    module: "minimart",
    name: "Barbie Doll Toy",
    description: "Fashion Doll toy set for kids",
    costPrice: 350,
    price: 550,
    category: "Toys",
    skuCode: "SKU-44920192",
    rackLocation: "Rack B-04",
    unit: "PCS",
    minThreshold: 5,
    openingStock: 40,
    imageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    createdAt: "2026-09-01T12:06:41.889Z",
    updatedAt: "2026-09-03T05:06:19.267Z",
  },
  {
    id: "prod_1788365698088",
    module: "minimart",
    name: "Cooking Oil (Refill / Loose)",
    description: "Pure edible premium vegetable oil",
    costPrice: 410,
    price: 480,
    category: "Grocery",
    skuCode: "SKU-OIL-01",
    rackLocation: "Aisle 2",
    unit: "Liter",
    minThreshold: 10,
    openingStock: 50,
    isAvailable: true,
    createdAt: "2026-09-02T16:14:58.538Z",
    updatedAt: "2026-09-02T16:14:58.538Z",
  },
  {
    id: "prod_1788365698094",
    module: "minimart",
    name: "Farm Fresh Red Onions (Pyaz)",
    description: "A-Grade crisp red cooking onions",
    costPrice: 90,
    price: 140,
    category: "Vegetables",
    skuCode: "SKU-ONION-01",
    rackLocation: "Fresh Veg Rack",
    unit: "KG",
    minThreshold: 20,
    openingStock: 78,
    isAvailable: true,
    createdAt: "2026-09-02T16:15:03.991Z",
    updatedAt: "2026-09-03T12:01:21.045Z",
  },
  {
    id: "prod_mm_milk",
    module: "minimart",
    name: "Fresh Milk (1 Liter)",
    description: "Pasteurized full cream milk",
    costPrice: 210,
    price: 270,
    category: "Dairy",
    skuCode: "SKU-10294827",
    rackLocation: "Chiller-01",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 33,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    createdAt: "2026-09-01T12:06:41.889Z",
    updatedAt: "2026-09-03T12:17:38.191Z",
  },
  {
    id: "prod_1788365660478",
    module: "minimart",
    name: "Super Basmati Rice (Loose)",
    description: "Extra long grain aged basmati rice",
    costPrice: 240,
    price: 320,
    category: "Grocery",
    skuCode: "SKU-RICE-01",
    rackLocation: "Aisle 1",
    unit: "KG",
    minThreshold: 10,
    openingStock: 100,
    isAvailable: true,
    createdAt: "2026-09-02T16:14:20.956Z",
    updatedAt: "2026-09-02T16:14:20.956Z",
  },
  {
    id: "prod_mm_chips",
    module: "minimart",
    name: "Potato Chips (Family Pack)",
    description: "Salted crispy potato chips",
    costPrice: 100,
    price: 150,
    category: "Snacks",
    skuCode: "SKU-77291048",
    rackLocation: "Rack C-02",
    unit: "PACK",
    minThreshold: 20,
    openingStock: 58,
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    createdAt: "2026-09-01T12:06:41.889Z",
    updatedAt: "2026-09-03T12:09:47.739Z",
  },
  {
    id: "prod_mm_bags",
    module: "minimart",
    name: "Shopping Bags",
    description: "Heavy duty shopping bags",
    costPrice: 180,
    price: 250,
    category: "General",
    skuCode: "SKU-61339903",
    rackLocation: "Rack A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 148,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    isAvailable: true,
    createdAt: "2026-09-01T12:06:41.889Z",
    updatedAt: "2026-09-03T12:02:00.735Z",
  },
];

export async function ensureInitialData(): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. Ensure LocalStorage Products
  const existingProducts = storage.getList<Product>(KEYS.products);
  if (existingProducts.length === 0) {
    storage.setList(KEYS.products, INITIAL_PRODUCTS);
  }

  // 2. Ensure LocalStorage Categories
  const existingCategories = storage.getList<Category>(KEYS.categories);
  if (existingCategories.length === 0) {
    storage.setList(KEYS.categories, INITIAL_CATEGORIES);
  }

  // 3. Ensure Dexie IndexedDB has items
  try {
    const dexieCount = await offlineDb.products.count();
    if (dexieCount === 0) {
      const prodsToSeed = existingProducts.length > 0 ? existingProducts : INITIAL_PRODUCTS;
      await offlineDb.products.bulkPut(prodsToSeed);
    }

    const catCount = await offlineDb.categories.count();
    if (catCount === 0) {
      const catsToSeed = existingCategories.length > 0 ? existingCategories : INITIAL_CATEGORIES;
      await offlineDb.categories.bulkPut(catsToSeed);
    }
  } catch (err) {
    console.warn("[OfflineDB] Dexie seed check:", err);
  }
}
