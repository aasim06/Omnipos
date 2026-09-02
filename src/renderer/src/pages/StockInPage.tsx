import { useState } from "react";
import {
  Boxes,
  Package,
  Plus,
  ArrowDownToLine,
  CheckCircle2,
  Tag,
  TrendingUp,
} from "lucide-react";
import { ProductsList } from "@/components/admin/ProductsList";
import { AddProductForm } from "@/components/admin/AddProductForm";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { StockForm } from "@/components/stock/StockForm";
import { useStock } from "@/lib/useStock";
import { useProducts } from "@/lib/useProducts";
import { KEYS, storage } from "@/lib/storage";
import { Product } from "@/lib/types";
import { nowISO, uid } from "@/lib/utils";

type StockInTab = "products" | "stock-entry" | "add-product" | "categories";

export default function StockInPage() {
  const { record } = useStock();
  const { products } = useProducts("minimart");

  const [activeTab, setActiveTab] = useState<StockInTab>("products");
  const [toast, setToast] = useState<string | null>(null);

  // Compute live inventory valuation metrics
  const totalItemsCount = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.openingStock || 0), 0);
  const totalPurchaseCost = products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.openingStock || 1), 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + (p.price || 0) * (p.openingStock || 1), 0);

  function handleStockInSubmit(data: {
    module: "fastfood" | "minimart";
    productName: string;
    category?: string;
    quantity: number;
    unitCost?: number;
    unitPrice?: number;
    note?: string;
  }) {
    // 1. Record stock movement entry
    record({
      module: "minimart",
      productId: uid("item_"),
      productName: data.productName,
      type: "in",
      quantity: data.quantity,
      unitCost: data.unitCost,
      unitPrice: data.unitPrice,
      note: data.note,
    });

    // 2. Update/Create Product in storage catalog
    if (typeof window !== "undefined") {
      const allProducts = storage.getList<Product>(KEYS.products);
      const existingIndex = allProducts.findIndex(
        (p) => p.module === "minimart" && p.name.toLowerCase() === data.productName.toLowerCase()
      );

      if (existingIndex !== -1) {
        const existing = allProducts[existingIndex];
        const newStock = (existing.openingStock || 0) + data.quantity;
        allProducts[existingIndex] = {
          ...existing,
          openingStock: newStock,
          costPrice: data.unitCost !== undefined && data.unitCost > 0 ? data.unitCost : existing.costPrice,
          price: data.unitPrice !== undefined && data.unitPrice > 0 ? data.unitPrice : existing.price,
          category: data.category || existing.category,
          updatedAt: nowISO(),
        };
      } else {
        const newProduct: Product = {
          id: uid("prod_"),
          module: "minimart",
          name: data.productName,
          category: data.category || "General",
          costPrice: data.unitCost || 0,
          price: data.unitPrice || (data.unitCost ? Math.round(data.unitCost * 1.3) : 100),
          openingStock: data.quantity,
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        allProducts.push(newProduct);
      }

      storage.setList(KEYS.products, allProducts);
      window.dispatchEvent(new Event("pos_orders_updated"));
    }

    showNotice(`Successfully Stocked In: ${data.quantity} units of "${data.productName}"`);
    setActiveTab("products");
  }

  function showNotice(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="w-full bg-[#0c0e12] min-h-screen text-[#f3f4f6] p-4 sm:p-6 lg:p-8 font-sans space-y-6 no-scrollbar">
      {toast && (
        <div className="p-3.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Top Header & Quick Action Buttons */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[#00c9a7] text-xs uppercase tracking-wider font-bold">
              Inventory &amp; Stock Control
            </p>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight flex items-center gap-2 mt-0.5">
              <Boxes size={24} className="text-[#00c9a7]" /> Stock In
            </h1>
            <p className="text-xs text-[#8b92a0]">
              Manage store inventory items, record incoming stock, add products &amp; track retail valuation.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("stock-entry")}
              className="px-3.5 py-2 rounded-md bg-[#00c9a7] text-[#00201a] text-xs font-bold transition flex items-center gap-1.5 shadow-md hover:bg-[#00b093]"
            >
              <ArrowDownToLine size={15} /> Record Stock Entry
            </button>

            <button
              onClick={() => setActiveTab("add-product")}
              className="px-3.5 py-2 rounded-md bg-[#161822] hover:bg-[#232734] border border-[#232734] text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus size={15} className="text-[#00c9a7]" /> Add New Product
            </button>
          </div>
        </div>

        {/* 4 Inventory Valuation KPI Cards matching Dashboard Hero Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: TOTAL STORE ITEMS */}
          <div className="rounded-2xl border border-[#262b37] bg-gradient-to-br from-[#121926] via-[#161821] to-[#161821] p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#00c9a7]/15 border border-[#00c9a7]/30 flex items-center justify-center text-[#00c9a7]">
                <Package size={20} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a0]">
                TOTAL STORE ITEMS
              </span>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-mono font-extrabold text-white tracking-tight">
                {totalItemsCount}
              </h2>
              <div className="flex items-center gap-1 text-xs text-[#00c9a7] font-medium mt-1">
                <span>{totalItemsCount} products active</span>
              </div>
            </div>
          </div>

          {/* Card 2: TOTAL STOCK QUANTITY */}
          <div className="rounded-2xl border border-[#262b37] bg-gradient-to-br from-[#121926] via-[#161821] to-[#161821] p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Boxes size={20} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a0]">
                TOTAL STOCK QUANTITY
              </span>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-mono font-extrabold text-white tracking-tight">
                {totalStockUnits}
              </h2>
              <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium mt-1">
                <span>{totalStockUnits} total units in stock</span>
              </div>
            </div>
          </div>

          {/* Card 3: PURCHASE INVESTMENT */}
          <div className="rounded-2xl border border-[#262b37] bg-gradient-to-br from-[#1b1712] via-[#161821] to-[#161821] p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center text-[#ff6b00] font-bold text-lg">
                Rs
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a0]">
                PURCHASE INVESTMENT
              </span>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-mono font-extrabold text-white tracking-tight">
                {totalPurchaseCost.toLocaleString()}
              </h2>
              <div className="flex items-center gap-1 text-xs text-[#ff6b00] font-medium mt-1">
                <span>Wholesale purchase cost</span>
              </div>
            </div>
          </div>

          {/* Card 4: RETAIL VALUATION */}
          <div className="rounded-2xl border border-[#262b37] bg-gradient-to-br from-[#102219] via-[#161821] to-[#161821] p-5 shadow-lg relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a0]">
                RETAIL VALUATION
              </span>
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-mono font-extrabold text-emerald-400 tracking-tight">
                {totalRetailValuation.toLocaleString()}
              </h2>
              <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-1">
                <span>Potential selling value</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-nav Pill Bar */}
        <div className="flex items-center gap-2 border-b border-[#232734] pb-1 no-scrollbar overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-t-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "products"
                ? "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Package size={14} /> Store Products &amp; Stock Table ({totalItemsCount})
          </button>

          <button
            onClick={() => setActiveTab("stock-entry")}
            className={`px-4 py-2 rounded-t-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "stock-entry"
                ? "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <ArrowDownToLine size={14} /> Record Incoming Stock Batch
          </button>

          <button
            onClick={() => setActiveTab("add-product")}
            className={`px-4 py-2 rounded-t-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "add-product"
                ? "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Plus size={14} /> Add New Store Product
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-t-md text-xs font-semibold flex items-center gap-2 transition ${
              activeTab === "categories"
                ? "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Tag size={14} /> Category Manager
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "products" && (
        <ProductsList
          module="minimart"
          onAddProductClick={() => setActiveTab("add-product")}
          onEditProduct={() => setActiveTab("add-product")}
        />
      )}

      {activeTab === "stock-entry" && (
        <div className="w-full">
          <StockForm type="in" onSubmit={handleStockInSubmit} />
        </div>
      )}

      {activeTab === "add-product" && (
        <AddProductForm
          initialModule="minimart"
          onSaved={() => {
            showNotice("Product created & added to store inventory!");
            setActiveTab("products");
          }}
          onCancel={() => setActiveTab("products")}
        />
      )}

      {activeTab === "categories" && <CategoryManager module="minimart" />}
    </div>
  );
}
