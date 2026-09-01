"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  UtensilsCrossed,
  ShoppingBasket,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { Button } from "@/components/ui/Button";

type ModuleTab = "all" | "fastfood" | "minimart";

export function CombinedDashboard() {
  const [activeTab, setActiveTab] = useState<ModuleTab>("minimart");

  return (
    <div className="bg-[#0e1015] min-h-screen text-[#f3f4f6]">
      {/* Module Switcher Bar */}
      <div className="px-6 pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#161922] p-1.5 rounded-2xl border border-[#232734] shadow-sm">
          <button
            onClick={() => setActiveTab("minimart")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition bg-[#33c9a8] text-[#00201a] shadow-sm font-bold"
          >
            <ShoppingBasket size={15} /> Mini Mart Store Analytics
          </button>

          {/* Fast Food analytics commented out for now
          <button
            onClick={() => setActiveTab("fastfood")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === "fastfood"
                ? "bg-[#f2a93b] text-[#1a1300] shadow-sm"
                : "text-[#8b92a0] hover:text-[#f2a93b]"
            }`}
          >
            <UtensilsCrossed size={15} /> Fast Food Analytics
          </button> */}
        </div>

        <div className="flex items-center gap-3">
          {/* <Link href="/fastfood">
            <Button variant="fastfood" className="text-xs px-3 py-2">
              <UtensilsCrossed size={14} /> Open Fast Food Till
            </Button>
          </Link> */}
          <Link href="/minimart">
            <Button variant="minimart" className="text-xs px-3.5 py-2 font-bold shadow-md">
              <ShoppingBasket size={14} /> Open Mini Mart Register
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard moduleFilter={activeTab} />
    </div>
  );
}
