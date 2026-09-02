import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  Plus,
  Tag,
  BarChart2,
  Settings,
  Database,
  Sun,
  RefreshCw,
  CheckCircle2,
  ShoppingBasket,
} from "lucide-react";
import { KEYS } from "@/lib/storage";
import { ensureInitialData } from "@/lib/seedData";
import { useOrders } from "@/lib/useOrders";
import { ProductsList } from "@/components/admin/ProductsList";
import { AddProductForm } from "@/components/admin/AddProductForm";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { AnalyticsView } from "@/components/admin/AnalyticsView";
import { SettingsView } from "@/components/admin/SettingsView";
import { ModuleKey } from "@/lib/types";

type AdminTab = "products" | "add-product" | "categories" | "analytics" | "settings" | "backup";

function AdminContent() {
  const { reloadOrders } = useOrders();
  const [searchParams] = useSearchParams();

  // Active module switcher: "minimart" (Fast food commented out for now)
  const [activeModule, setActiveModule] = useState<ModuleKey>("minimart");
  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const mod = searchParams?.get("module");
    if (mod === "minimart") {
      setActiveModule("minimart");
    }
  }, [searchParams]);

  function handleResetData() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS.products);
    localStorage.removeItem(KEYS.orders);
    localStorage.removeItem(KEYS.stockMovements);
    ensureInitialData();
    reloadOrders();
    showNotice("Demo data reset successfully!");
  }

  function showNotice(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="w-full bg-[#0c0e12] min-h-screen text-[#f3f4f6] p-4 sm:p-6 lg:p-8 font-sans space-y-6 no-scrollbar">
      {message && (
        <div className="p-3.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {message}
        </div>
      )}

      {/* Top Header & Navigation Tabs Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              Mini Mart Store Admin Console
            </h1>
            <p className="text-xs text-[#8b92a0]">
              Management for Mini Mart Store catalog &amp; operations
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* SEPARATE MODULE SELECTOR SWITCHER */}
            <div className="flex items-center gap-1 bg-[#161822] p-1 rounded-md border border-[#232734]">
              <button
                type="button"
                onClick={() => setActiveModule("minimart")}
                className="px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition bg-[#00c9a7] text-[#00201a] shadow-sm"
              >
                <ShoppingBasket size={14} /> Mini Mart Store
              </button>
            </div>

            <button
              onClick={() => setActiveTab("add-product")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 shadow-md ${
                activeModule === "fastfood" ? "bg-[#ff6b00] text-white hover:bg-[#e05e00]" : "bg-[#00c9a7] text-[#00201a] hover:bg-[#00b093]"
              }`}
            >
              <Plus size={14} /> Add Product
            </button>
            <button
              onClick={handleResetData}
              className="p-2 rounded-md bg-[#161822] text-[#8b92a0] hover:text-white border border-[#232734] transition"
              title="Restore Demo Data"
            >
              <RefreshCw size={14} />
            </button>
            <span className="p-2 rounded-md bg-[#161822] text-[#8b92a0] border border-[#232734]">
              <Sun size={16} />
            </span>
          </div>
        </div>

        {/* Sub-nav Tabs Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-[#232734]">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-3.5 py-2 rounded-t-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "products"
                ? activeModule === "fastfood"
                  ? "bg-[#ff6b00] text-white shadow-sm"
                  : "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Package size={14} /> Products
          </button>

          <button
            onClick={() => setActiveTab("add-product")}
            className={`px-3.5 py-2 rounded-t-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "add-product"
                ? activeModule === "fastfood"
                  ? "bg-[#ff6b00] text-white shadow-sm"
                  : "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Plus size={14} /> Add Product
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-3.5 py-2 rounded-t-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "categories"
                ? activeModule === "fastfood"
                  ? "bg-[#ff6b00] text-white shadow-sm"
                  : "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Tag size={14} /> Categories
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3.5 py-2 rounded-t-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "analytics"
                ? activeModule === "fastfood"
                  ? "bg-[#ff6b00] text-white shadow-sm"
                  : "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <BarChart2 size={14} /> Analytics
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 rounded-t-md text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === "settings"
                ? activeModule === "fastfood"
                  ? "bg-[#ff6b00] text-white shadow-sm"
                  : "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Settings size={14} /> Settings
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`px-3.5 py-2 rounded-t-md text-xs font-medium flex items-center gap-1.5 transition ${
              activeTab === "backup"
                ? activeModule === "fastfood"
                  ? "bg-[#ff6b00] text-white shadow-sm"
                  : "bg-[#00c9a7] text-[#00201a] font-bold shadow-sm"
                : "text-[#8b92a0] hover:text-white"
            }`}
          >
            <Database size={14} /> Backup
          </button>
        </div>
      </div>

      {/* Main Tab Content - Isolated Per Active Module */}
      {activeTab === "products" && (
        <ProductsList
          module={activeModule}
          onAddProductClick={() => setActiveTab("add-product")}
          onEditProduct={() => setActiveTab("add-product")}
        />
      )}

      {activeTab === "add-product" && (
        <AddProductForm
          initialModule={activeModule}
          onSaved={() => {
            showNotice("Product saved!");
            setActiveTab("products");
          }}
          onCancel={() => setActiveTab("products")}
        />
      )}

      {activeTab === "categories" && <CategoryManager module={activeModule} />}

      {activeTab === "analytics" && <AnalyticsView module={activeModule} />}

      {activeTab === "settings" && <SettingsView module={activeModule} />}

      {activeTab === "backup" && <SettingsView module={activeModule} />}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white font-sans text-xs">Loading Admin Panel...</div>}>
      <AdminContent />
    </Suspense>
  );
}
