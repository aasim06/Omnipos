"use client";

import { useState, useEffect } from "react";
import { Settings, CheckCircle2, Check } from "lucide-react";
import { ModuleKey } from "@/lib/types";

export interface SystemSettingsData {
  restaurantName: string;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
}

interface SettingsViewProps {
  module?: ModuleKey;
}

export function SettingsView({ module = "minimart" }: SettingsViewProps) {
  const isFastFood = module === "fastfood";

  const [restaurantName, setRestaurantName] = useState(
    isFastFood ? "Signature Pizza & Burger" : "Mini Mart Retail Store"
  );
  const [currency, setCurrency] = useState("PKR — Pakistani Rupee");
  const [receiptHeader, setReceiptHeader] = useState(
    isFastFood ? "Fast Food POS Register" : "Mini Mart Counter Register"
  );
  const [receiptFooter, setReceiptFooter] = useState(
    isFastFood ? "Taste of Tradition & BBQ Delight" : "Thank you for shopping with us!"
  );
  const [toast, setToast] = useState<string | null>(null);

  const storageKey = `pos_system_settings_${module}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed: SystemSettingsData = JSON.parse(saved);
        setRestaurantName(parsed.restaurantName);
        setCurrency(parsed.currency);
        setReceiptHeader(parsed.receiptHeader);
        setReceiptFooter(parsed.receiptFooter);
      } catch (e) {
        // Fallback
      }
    }
  }, [module, storageKey]);

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const data: SystemSettingsData = {
      restaurantName: restaurantName.trim(),
      currency: currency.trim(),
      receiptHeader: receiptHeader.trim(),
      receiptFooter: receiptFooter.trim(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(data));
      window.dispatchEvent(new Event("pos_orders_updated"));
    }

    setToast(`System settings for ${module} saved successfully!`);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="w-full text-white font-sans space-y-6 no-scrollbar">
      {toast && (
        <div className="p-3.5 rounded-md bg-emerald-950 border border-emerald-500 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="w-full bg-[#141720] border border-[#232734] rounded-lg p-6 lg:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#232734] pb-3">
          <h2 className="font-bold text-white text-base">
            {isFastFood ? "Fast Food System Settings" : "Mini Mart Store Settings"}
          </h2>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
            isFastFood ? "bg-[#ff6b00]/20 text-[#ff6b00]" : "bg-[#00c9a7]/20 text-[#00c9a7]"
          }`}>
            {module} module
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs text-[#8b92a0] font-medium block">
                {isFastFood ? "Restaurant Name" : "Store Name"}
              </label>
              <input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Business Name"
                className="w-full bg-[#090a0e] border border-[#232734] focus:border-[#ff6b00] rounded-md px-3.5 py-3 text-sm text-white outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#8b92a0] font-medium block">
                Currency
              </label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="PKR — Pakistani Rupee"
                className="w-full bg-[#090a0e] border border-[#232734] focus:border-[#ff6b00] rounded-md px-3.5 py-3 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs text-[#8b92a0] font-medium block">
                Receipt Header
              </label>
              <input
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                placeholder="Receipt Header"
                className="w-full bg-[#090a0e] border border-[#232734] focus:border-[#ff6b00] rounded-md px-3.5 py-3 text-sm text-white outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[#8b92a0] font-medium block">
                Receipt Footer
              </label>
              <input
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Receipt Footer Message"
                className="w-full bg-[#090a0e] border border-[#232734] focus:border-[#ff6b00] rounded-md px-3.5 py-3 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="py-2.5 px-5 rounded-md bg-[#ff6b00] hover:bg-[#e05e00] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md active:scale-98"
            >
              <Check size={16} /> Save {module} Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
