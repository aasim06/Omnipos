export type ModuleKey = "fastfood" | "minimart";

export interface Product {
  id: string;
  module: ModuleKey;
  name: string;
  description?: string;
  costPrice?: number; // PKR purchase cost per unit
  price: number; // PKR retail selling price per unit
  category: string;
  skuCode?: string; // e.g. SKU-62658411
  rackLocation?: string; // e.g. Rack A-01
  unit?: string; // e.g. PCS / KG / LTR / PACK
  minThreshold?: number; // Low stock threshold e.g. 10
  openingStock?: number; // Initial stock e.g. 50
  prepTime?: number; // Minutes for kitchen timing
  displayOrder?: number; // Rank on POS screen
  tags?: string[]; // Bestseller, New, Spicy, Chef Special, Must Try
  allergens?: string[]; // Nuts, Dairy, Gluten, Egg
  isAvailable?: boolean; // Visible on POS
  imageBase64?: string;
  imageUrl?: string;
  variants?: ProductVariant[]; // e.g. Small/Medium/Large for fast food
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  label: string; // "Small", "Full", etc.
  priceDelta: number; // added to base price
}

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  variantLabel?: string;
  notes?: string;
}

export type OrderStage = "cart" | "kot" | "billed" | "paid";

export interface Order {
  id: string;
  module: ModuleKey;
  lines: CartLine[];
  discountPercent: number;
  customerName?: string;
  orderType?: "dine-in" | "takeaway" | "delivery";
  stage: OrderStage;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = "in" | "out";

export interface StockMovement {
  id: string;
  module: ModuleKey;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number; // Purchase price per unit
  unitPrice?: number; // Retail selling price per unit
  reason?: string; // for stock-out: sale / damage / waste / adjustment
  note?: string;
  date: string;
}

export interface Category {
  id: string;
  module: ModuleKey;
  name: string;
}
