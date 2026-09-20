export type ModuleKey = "fastfood" | "minimart";

export interface Product {
  id: string;
  module: ModuleKey;
  name: string;
  nameUrdu?: string;
  description?: string;
  costPrice?: number; // PKR purchase cost per unit
  price: number; // PKR retail selling price per unit
  pricingType?: string; // 'fixed' | 'smlxl' | 'halffull' | 'perkg' | 'amountse' | 'perpiece' | 'custom'
  itemRole?: 'food_menu' | 'retail_product' | 'raw_ingredient';
  isKitchenRouted?: boolean; // Send line to Kitchen Display System / KOT
  category: string;
  skuCode?: string; // e.g. SKU-62658411
  barcode?: string; // e.g. barcode scanner string
  rackLocation?: string; // e.g. Rack A-01
  unit?: string; // e.g. PCS / KG / LTR / PACK
  primaryUnit?: string; // e.g. "Carton" / "Box"
  secondaryUnit?: string; // e.g. "Piece" / "Pouch"
  conversionRate?: number; // e.g. 1 Carton = 24 Pieces
  secondaryPrice?: number; // Retail selling price per secondary unit (PKR)
  trackBatchExpiry?: boolean;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  minThreshold?: number; // Low stock threshold e.g. 10
  openingStock?: number; // Initial stock e.g. 50
  prepTime?: number; // Minutes for kitchen timing
  displayOrder?: number; // Rank on POS screen
  tags?: string[]; // Bestseller, New, Spicy, Chef Special, Must Try
  allergens?: string[]; // Nuts, Dairy, Gluten, Egg
  isAvailable?: boolean; // Visible on POS
  imageBase64?: string;
  imageUrl?: string;
  hasVariants?: boolean;
  variants?: ProductVariant[]; // e.g. Small/Medium/Large or Sizes S/M/L
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  label: string; // "Small", "S", "M", "42", "Full", etc.
  price?: number; // direct retail price for this variant
  priceDelta: number; // added to base retail price
  costDelta?: number; // added to base cost price
  stock?: number; // individual stock for this variant
  skuCode?: string; // variant-specific SKU barcode
}

export interface CartLine {
  productId: string;
  name: string;
  nameUrdu?: string;
  unitPrice: number;
  quantity: number;
  variantLabel?: string;
  selectedUnit?: string; // 'primary' | 'secondary'
  unitLabel?: string; // 'Box' | 'Pcs'
  costPrice?: number; // captured at sale time for accurate COGS
  batchNumber?: string;
  expiryDate?: string;
  notes?: string;
  imageUrl?: string;
}

export type OrderStage = "cart" | "kot" | "billed" | "paid";

export interface SplitPaymentBreakdown {
  cash?: number;
  card?: number;
  online?: number;
  khata?: number;
}

export interface Order {
  id: string;
  module: ModuleKey;
  lines: CartLine[];
  discountPercent: number;
  customerName?: string;
  customerPhone?: string;
  paymentMode?: 'cash' | 'card' | 'khata' | 'split' | string;
  splitPayments?: SplitPaymentBreakdown;
  orderType?: "dine-in" | "takeaway" | "delivery" | "khata";
  stage: OrderStage | "refunded";
  totalAmount?: number;
  refundedAmount?: number;
  tokenNo?: number | string;
  tableNo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnedLineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  variantLabel?: string;
}

export interface OrderRefund {
  id: string;
  orderId: string;
  customerName?: string;
  refundAmount: number;
  paymentMode: 'cash' | 'khata' | 'card' | string;
  reason?: string;
  items: ReturnedLineItem[] | string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  module: ModuleKey;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  lines: CartLine[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount?: number;
  totalAmount: number;
  validUntil: string;
  notes?: string;
  terms?: string;
  status: 'draft' | 'sent' | 'converted' | 'expired';
  convertedOrderId?: string;
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
  unitCost?: number | null; // Purchase price per unit
  unitPrice?: number | null; // Retail selling price per unit
  batchNumber?: string;
  expiryDate?: string;
  reason?: string; // for stock-out: sale / damage / waste / adjustment
  note?: string;
  referenceInvoice?: string;
  vendorName?: string;
  date: string;
}

export interface PurchaseBillLine {
  id: string;
  productId?: string;
  productName: string;
  variantId?: string;
  variantLabel?: string;
  quantity: number;
  unitCost: number;
  retailPrice?: number;
  batchNumber?: string;
  expiryDate?: string;
  totalCost: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  vendorId?: string;
  vendorName: string;
  vendorPhone?: string;
  billDate: string;
  lines: PurchaseBillLine[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  grandTotal: number;
  paidAmount: number;
  paymentMode: 'cash' | 'bank' | 'khata' | 'split';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CategoryProfile =
  | 'footwear'
  | 'apparel'
  | 'grocery'
  | 'cosmetics'
  | 'pharmacy'
  | 'electronics'
  | 'bakery'
  | 'food'
  | 'hardware'
  | 'electric'
  | 'cctv'
  | 'standard';

export interface Category {
  id: string;
  module: ModuleKey;
  name: string;
  profile?: CategoryProfile;
  suggestedSizes?: string[];
  suggestedUnits?: string[];
  createdAt?: string;
  updatedAt?: string;
}
