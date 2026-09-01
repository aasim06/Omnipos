"use client";

import { useState } from "react";
import {
  Trophy,
  RotateCcw,
  Folder,
  Calendar,
  Clock,
  Search,
} from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { useOrders } from "@/lib/useOrders";
import { useProducts } from "@/lib/useProducts";
import { ModuleKey } from "@/lib/types";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface AnalyticsViewProps {
  module?: ModuleKey;
}

export function AnalyticsView({ module = "minimart" }: AnalyticsViewProps) {
  const { orders } = useOrders(module);
  const { products } = useProducts(module);

  const [timeframe, setTimeframe] = useState<"all" | "today" | "week" | "month">("all");
  const [sortBy, setSortBy] = useState<"qty" | "revenue" | "orders">("qty");
  const [priceSearch, setPriceSearch] = useState("");

  // Calculate live module metrics
  const totalRevenue = orders.reduce((sum, o) => {
    return sum + o.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  }, 0);

  const totalOrders = orders.length;

  const totalItemsSold = orders.reduce((sum, o) => {
    return sum + o.lines.reduce((s, l) => s + l.quantity, 0);
  }, 0);

  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  const formatShortRevenue = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return `${val}`;
  };

  // Compute Top Selling Products
  const productStatsMap = new Map<
    string,
    { name: string; category: string; qty: number; revenue: number; ordersCount: number }
  >();

  orders.forEach((ord) => {
    ord.lines.forEach((line) => {
      const existing = productStatsMap.get(line.name) || {
        name: line.name,
        category: "General",
        qty: 0,
        revenue: 0,
        ordersCount: 0,
      };

      const matchedProd = products.find(
        (p) => p.name.toLowerCase() === line.name.toLowerCase()
      );
      if (matchedProd) {
        existing.category = matchedProd.category;
      }

      existing.qty += line.quantity;
      existing.revenue += line.unitPrice * line.quantity;
      existing.ordersCount += 1;

      productStatsMap.set(line.name, existing);
    });
  });

  const topProductsList = Array.from(productStatsMap.values()).sort((a, b) => {
    if (sortBy === "revenue") return b.revenue - a.revenue;
    if (sortBy === "orders") return b.ordersCount - a.ordersCount;
    return b.qty - a.qty;
  });

  // Compute Revenue by Category
  const categoryRevenueMap = new Map<string, number>();
  orders.forEach((ord) => {
    ord.lines.forEach((line) => {
      const matchedProd = products.find(
        (p) => p.name.toLowerCase() === line.name.toLowerCase()
      );
      const cat = matchedProd ? matchedProd.category : "General";
      const lineTotal = line.unitPrice * line.quantity;
      categoryRevenueMap.set(cat, (categoryRevenueMap.get(cat) || 0) + lineTotal);
    });
  });

  const categoryRevenueList = Array.from(categoryRevenueMap.entries())
    .map(([cat, rev]) => ({ category: cat, revenue: rev }))
    .sort((a, b) => b.revenue - a.revenue);

  const maxCatRev = Math.max(...categoryRevenueList.map((c) => c.revenue), 1);

  // Compute Daily Revenue (Last 7 Days)
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = daysOfWeek[d.getDay()];

    const revForDay = orders
      .filter((o) => {
        const orderDate = new Date(o.createdAt);
        return (
          orderDate.getDate() === d.getDate() &&
          orderDate.getMonth() === d.getMonth() &&
          orderDate.getFullYear() === d.getFullYear()
        );
      })
      .reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0), 0);

    return { label: dayLabel, revenue: revForDay };
  });

  const maxDailyRev = Math.max(...dailyData.map((d) => d.revenue), 1);

  return (
    <div className="w-full text-white font-sans space-y-6 no-scrollbar">
      {/* Module Title Banner */}
      <div className="flex items-center justify-between border-b border-[#232734] pb-3">
        <h2 className="font-bold text-white text-base">
          {module === "fastfood" ? "Fast Food Sales Analytics" : "Mini Mart Retail Analytics"}
        </h2>
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
          module === "fastfood" ? "bg-[#ff6b00]/20 text-[#ff6b00]" : "bg-[#00c9a7]/20 text-[#00c9a7]"
        }`}>
          {module} module
        </span>
      </div>

      {/* ROW 1: 4 Analytics Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141720] border border-[#232734] rounded-lg p-6 text-center shadow-xl space-y-1">
          <h2 className="font-mono text-3xl font-extrabold text-white tracking-tight">
            {formatShortRevenue(totalRevenue)}
          </h2>
          <p className="text-xs text-[#8b92a0] font-medium">Total Revenue (PKR)</p>
        </div>

        <div className="bg-[#141720] border border-[#232734] rounded-lg p-6 text-center shadow-xl space-y-1">
          <h2 className="font-mono text-3xl font-extrabold text-white tracking-tight">
            {totalOrders}
          </h2>
          <p className="text-xs text-[#8b92a0] font-medium">Total Orders</p>
        </div>

        <div className="bg-[#141720] border border-[#232734] rounded-lg p-6 text-center shadow-xl space-y-1">
          <h2 className="font-mono text-3xl font-extrabold text-white tracking-tight">
            {totalItemsSold}
          </h2>
          <p className="text-xs text-[#8b92a0] font-medium">Items Sold</p>
        </div>

        <div className="bg-[#141720] border border-[#232734] rounded-lg p-6 text-center shadow-xl space-y-1">
          <h2 className="font-mono text-3xl font-extrabold text-white tracking-tight">
            {avgOrderValue}
          </h2>
          <p className="text-xs text-[#8b92a0] font-medium">Avg. Order Value</p>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-[#141720] border border-[#232734] rounded-lg p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232734] pb-4">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-[#f2a93b]" />
              <h3 className="font-bold text-white text-base">Top Products</h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8b92a0]">Sort by</span>
              <div className="w-36">
                <CustomSelect
                  value={sortBy}
                  onChange={(val) => setSortBy(val as any)}
                  options={[
                    { value: "qty", label: "Qty Sold" },
                    { value: "revenue", label: "Revenue" },
                    { value: "orders", label: "Orders Count" },
                  ]}
                />
              </div>

              <button
                onClick={() => {
                  setSortBy("qty");
                  setTimeframe("all");
                }}
                className="px-2.5 py-1 rounded-md border border-[#ff6b00] text-[#ff6b00] hover:bg-[#ff6b00]/10 text-xs font-semibold flex items-center gap-1 transition"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[#8b92a0] uppercase text-[10px] font-bold tracking-wider border-b border-[#232734]">
                  <th className="py-2.5 px-2 w-8">#</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232734]/60">
                {topProductsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#8b92a0]">
                      No order data recorded for {module} yet.
                    </td>
                  </tr>
                ) : (
                  topProductsList.map((item, idx) => {
                    const maxQty = Math.max(...topProductsList.map((i) => i.qty), 1);
                    const percent = Math.round((item.qty / maxQty) * 100);

                    return (
                      <tr key={item.name} className="hover:bg-[#161822] transition">
                        <td className="py-3 px-2 font-bold text-center">
                          <span className="w-5 h-5 rounded-full bg-[#232734] text-[#f2a93b] flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{item.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-[#3b2a1a] text-[#f2a93b] text-[9px] font-bold uppercase">
                                {item.category}
                              </span>
                            </div>
                            <div className="w-full bg-[#1e222d] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#ff6b00] h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          {item.qty}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-[#ff6b00]">
                          {formatPKR(item.revenue).replace("Rs.", "")}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-[#8b92a0]">
                          {item.ordersCount}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          <div className="bg-[#141720] border border-[#232734] rounded-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#232734] pb-3">
              <Folder size={18} className="text-amber-400" />
              <h3 className="font-bold text-white text-sm">Revenue by Category</h3>
            </div>

            <div className="space-y-3">
              {categoryRevenueList.length === 0 ? (
                <p className="text-xs text-[#8b92a0] py-4 text-center">No category revenue data yet.</p>
              ) : (
                categoryRevenueList.map((cat) => {
                  const percent = Math.round((cat.revenue / maxCatRev) * 100);
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1">
                          <span className="text-amber-400">🍧</span> {cat.category}
                        </span>
                        <span className="font-mono text-white font-bold">
                          {formatPKR(cat.revenue).replace("Rs.", "")} PKR
                        </span>
                      </div>
                      <div className="w-full bg-[#1e222d] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-[#141720] border border-[#232734] rounded-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#232734] pb-3">
              <Calendar size={18} className="text-indigo-400" />
              <h3 className="font-bold text-white text-sm">Daily Revenue (Last 7 Days)</h3>
            </div>

            <div className="flex items-end justify-between gap-2 h-32 pt-4">
              {dailyData.map((d, i) => {
                const heightPercent = d.revenue > 0 ? Math.max(15, Math.round((d.revenue / maxDailyRev) * 100)) : 4;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-mono text-[#8b92a0]">
                      {d.revenue > 0 ? `${d.revenue}` : "—"}
                    </span>
                    <div className="w-full bg-[#1e222d] rounded-t-sm relative flex items-end justify-center h-20">
                      <div
                        className="w-full bg-[#ff6b00] rounded-t-sm transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-[#8b92a0]">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 */}
      <div className="bg-[#141720] border border-[#232734] rounded-lg p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232734] pb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#8b92a0]" />
            <h3 className="font-bold text-white text-base">Price Change Log</h3>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-[#8b92a0]" />
            <input
              value={priceSearch}
              onChange={(e) => setPriceSearch(e.target.value)}
              placeholder="Search product..."
              className="w-full bg-[#090a0e] border border-[#232734] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#585f70] outline-none"
            />
          </div>
        </div>

        <div className="py-12 text-center text-[#8b92a0] space-y-2">
          <Clock size={32} className="mx-auto opacity-30" />
          <p className="text-xs">No price changes recorded for {module} yet.</p>
        </div>
      </div>
    </div>
  );
}
