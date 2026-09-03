import { KEYS, storage } from "./storage";
import { Order, Product, StockMovement } from "./types";
import { nowISO, uid } from "./utils";

export const INITIAL_PRODUCTS: Product[] = [
  // Fast Food Products with images and cost prices
  {
    id: "prod_ff_1",
    module: "fastfood",
    name: "Crispy Zinger Burger",
    category: "Burger",
    costPrice: 320,
    price: 550,
    skuCode: "SKU-89915275",
    rackLocation: "Kitchen A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 50,
    description: "Crispy chicken fillet with Mayo & Lettuce",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_ff_2",
    module: "fastfood",
    name: "Double Cheese Burger",
    category: "Burger",
    costPrice: 450,
    price: 720,
    skuCode: "SKU-61339903",
    rackLocation: "Kitchen A-02",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 40,
    description: "Two beef patties with double cheddar cheese",
    imageUrl: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // Mini Mart Products matching exact reference screenshot fields
  {
    id: "prod_mm_1",
    module: "minimart",
    name: "seal 80*10",
    category: "General",
    costPrice: 18,
    price: 25,
    skuCode: "SKU-89915275",
    rackLocation: "Rack A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 50,
    description: "Industrial Seal 80x10",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_mm_2",
    module: "minimart",
    name: "Bags",
    category: "General",
    costPrice: 180,
    price: 250,
    skuCode: "SKU-61339903",
    rackLocation: "Rack A-01",
    unit: "PCS",
    minThreshold: 10,
    openingStock: 150,
    description: "Heavy duty shopping bags",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_mm_3",
    module: "minimart",
    name: "Barbie Doll Toy",
    category: "Toys",
    costPrice: 350,
    price: 550,
    skuCode: "SKU-44920192",
    rackLocation: "Rack B-04",
    unit: "PCS",
    minThreshold: 5,
    openingStock: 30,
    description: "Fashion Doll toy set for kids",
    imageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_mm_4",
    module: "minimart",
    name: "Fresh Milk (1 Liter)",
    category: "Dairy",
    costPrice: 210,
    price: 270,
    skuCode: "SKU-10294827",
    rackLocation: "Chiller-01",
    unit: "PCS",
    minThreshold: 15,
    openingStock: 40,
    description: "Pasteurized full cream milk",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_mm_5",
    module: "minimart",
    name: "Potato Chips (Family Pack)",
    category: "Snacks",
    costPrice: 100,
    price: 150,
    skuCode: "SKU-77291048",
    rackLocation: "Rack C-02",
    unit: "PACK",
    minThreshold: 20,
    openingStock: 60,
    description: "Salted crispy potato chips",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_mm_rice",
    module: "minimart",
    name: "Super Basmati Rice (Loose)",
    category: "Grocery",
    costPrice: 240,
    price: 320,
    skuCode: "SKU-RICE-01",
    rackLocation: "Aisle 1",
    unit: "KG",
    minThreshold: 10,
    openingStock: 100,
    description: "Premium aromatic long grain basmati rice sold by weight",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_mm_oil",
    module: "minimart",
    name: "Cooking Oil (Refill / Loose)",
    category: "Grocery",
    costPrice: 410,
    price: 480,
    skuCode: "SKU-OIL-01",
    rackLocation: "Aisle 2",
    unit: "Liter",
    minThreshold: 10,
    openingStock: 60,
    description: "Pure vegetable cooking oil sold by volume",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_mm_onion",
    module: "minimart",
    name: "Farm Fresh Red Onions (Pyaz)",
    category: "Vegetables",
    costPrice: 90,
    price: 140,
    skuCode: "SKU-ONION-01",
    rackLocation: "Fresh Veg Rack",
    unit: "KG",
    minThreshold: 15,
    openingStock: 80,
    description: "Fresh farm red onions sold by weight",
    imageUrl: "https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: "prod_mm_sugar",
    module: "minimart",
    name: "Pure White Sugar (Cheeni)",
    category: "Grocery",
    costPrice: 130,
    price: 160,
    skuCode: "SKU-SUGAR-01",
    rackLocation: "Aisle 1",
    unit: "KG",
    minThreshold: 20,
    openingStock: 120,
    description: "Refined granulated white sugar sold by weight",
    imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];

function generateSampleOrders(): Order[] {
  return [];
}

function generateSampleStock(): StockMovement[] {
  return [];
}

export function ensureInitialData() {
  if (typeof window === "undefined") return;

  const activeKey = (localStorage.getItem('omnipos_active_key') || '').toUpperCase();
  const isDemoKey = activeKey.includes('DEMO') || activeKey === 'OMNI-DEMO-2026-LIVE';

  if (!isDemoKey) {
    // For real production customer keys: NEVER seed mock products or sample data!
    return;
  }

  const existingProducts = storage.getList<Product>(KEYS.products);
  if (existingProducts.length === 0 || existingProducts.every((p) => !p.skuCode)) {
    storage.setList(KEYS.products, INITIAL_PRODUCTS);
  }

  const existingOrders = storage.getList<Order>(KEYS.orders);
  // Filter out legacy sample mock orders
  const cleanedOrders = existingOrders.filter(
    (o) => o.id !== "ord_ff_101" && o.id !== "ord_mm_201"
  );
  if (cleanedOrders.length !== existingOrders.length) {
    storage.setList(KEYS.orders, cleanedOrders);
  }

  const existingStock = storage.getList<StockMovement>(KEYS.stockMovements);
  if (existingStock.length === 0) {
    storage.setList(KEYS.stockMovements, generateSampleStock());
  }
}
