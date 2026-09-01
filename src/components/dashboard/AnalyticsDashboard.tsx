"use client";

import { useState } from "react";
import {
  TrendingUp,
  ClipboardList,
  LineChart,
  Flame,
  Download,
  Sun,
  Moon,
  ChevronRight,
  ArrowUpRight,
  Utensils,
  ShoppingBag,
  Layers,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Order } from "@/lib/types";
import { formatPKR } from "@/lib/utils";
import { KEYS, storage } from "@/lib/storage";
import {
  calculateModuleMetrics,
  filterOrdersByTimeframe,
  TimeframeFilter,
  useOrders,
} from "@/lib/useOrders";
import { useProducts } from "@/lib/useProducts";

interface AnalyticsDashboardProps {
  moduleFilter?: "fastfood" | "minimart" | "all";
}

export function AnalyticsDashboard({ moduleFilter = "minimart" }: AnalyticsDashboardProps) {
  const { orders } = useOrders(moduleFilter === "all" ? undefined : moduleFilter);
  const { products: ffProducts } = useProducts("fastfood");
  const { products: mmProducts } = useProducts("minimart");
  
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("today");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = filterOrdersByTimeframe(orders, timeframe);
  const metrics = calculateModuleMetrics(filteredOrders);

  // Calculate Total Items Sold
  const totalItemsSold = filteredOrders
    .flatMap((o) => o.lines)
    .reduce((sum, l) => sum + l.quantity, 0);

  // Calculate Hourly Sales Breakdown (0:00 to 23:00)
  const hourlyData: { hour: string; sales: number; orderCount: number }[] = Array.from(
    { length: 12 },
    (_, i) => {
      const h = i + 10; // 10:00 AM to 9:00 PM peak range
      const label = `${h}:00`;
      return { hour: label, sales: 0, orderCount: 0 };
    }
  );

  filteredOrders.forEach((o) => {
    const d = new Date(o.createdAt);
    const h = d.getHours();
    const matchIndex = hourlyData.findIndex((hd) => parseInt(hd.hour) === h);
    if (matchIndex !== -1) {
      const orderTotal = o.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      hourlyData[matchIndex].sales += orderTotal;
      hourlyData[matchIndex].orderCount += 1;
    }
  });

  const maxHourlySales = Math.max(...hourlyData.map((h) => h.sales), 1);

  // Category Breakdown Calculation
  const allProducts = [...ffProducts, ...mmProducts];
  const categoryMap: Record<string, { name: string; count: number; revenue: number; icon: string }> = {};

  filteredOrders.forEach((o) => {
    o.lines.forEach((l) => {
      const prod = allProducts.find((p) => p.id === l.productId);
      const cat = prod?.category || "General";

      if (!categoryMap[cat]) {
        let icon = "📦";
        if (cat.toLowerCase().includes("burger")) icon = "🍔";
        else if (cat.toLowerCase().includes("pizza") || cat.toLowerCase().includes("starter")) icon = "🏳";
        else if (cat.toLowerCase().includes("beverage") || cat.toLowerCase().includes("drink")) icon = "🥤";
        else if (cat.toLowerCase().includes("snack") || cat.toLowerCase().includes("fries")) icon = "🍟";
        else if (cat.toLowerCase().includes("grocery") || cat.toLowerCase().includes("dairy")) icon = "🥛";

        categoryMap[cat] = { name: cat, count: 0, revenue: 0, icon };
      }

      categoryMap[cat].count += l.quantity;
      categoryMap[cat].revenue += l.unitPrice * l.quantity;
    });
  });

  const categories = Object.values(categoryMap).sort((a, b) => b.count - a.count);
  const totalCatItems = categories.reduce((sum, c) => sum + c.count, 0) || 1;

  // Colors for Category progress bars
  const categoryColors = [
    "from-orange-500 to-amber-500",
    "from-blue-500 to-indigo-500",
    "from-emerald-500 to-teal-500",
    "from-purple-500 to-pink-500",
    "from-rose-500 to-red-500",
  ];

  // CSV Export Handler
  function exportCSV() {
    if (filteredOrders.length === 0) return;
    const headers = ["Order ID", "Module", "Stage", "Customer", "Date", "Total PKR"];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.module,
      o.stage,
      o.customerName || "Walk-in",
      new Date(o.createdAt).toLocaleString(),
      o.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pos_analytics_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="bg-[#0e1015] text-[#f3f4f6] min-h-screen p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Analytics Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">
            Showing {timeframe === "today" ? "Today's" : timeframe === "week" ? "This Week's" : timeframe === "month" ? "This Month's" : "All Time"} data
          </p>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#161922] p-1 rounded-xl border border-[#232734]">
            <button
              onClick={() => setTimeframe("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                timeframe === "today"
                  ? "bg-[#ff6b00] text-white font-semibold shadow-sm"
                  : "text-[#8b92a0] hover:text-white"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe("week")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                timeframe === "week"
                  ? "bg-[#ff6b00] text-white font-semibold shadow-sm"
                  : "text-[#8b92a0] hover:text-white"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                timeframe === "month"
                  ? "bg-[#ff6b00] text-white font-semibold shadow-sm"
                  : "text-[#8b92a0] hover:text-white"
              }`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161922] border border-[#232734] text-xs font-medium text-[#8b92a0] hover:text-white hover:border-[#343a4a] transition"
          >
            <Download size={14} /> Export
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm("Reset all sales and order history data to zero (0)?")) {
                storage.setList(KEYS.orders, []);
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new Event("pos_orders_updated"));
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-semibold text-red-400 hover:bg-red-900/60 transition"
            title="Reset all sales and order history to 0"
          >
            <RotateCcw size={14} /> Reset Sales Data (0)
          </button>
        </div>
      </div>

      {/* Row 1: 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL SALES */}
        <div className="rounded-2xl border border-[#262b37] bg-gradient-to-br from-[#1b1712] via-[#161821] to-[#161821] p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center text-[#ff6b00] font-bold text-lg">
              ₨
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a0]">
              TOTAL SALES
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-mono font-extrabold text-white tracking-tight">
              {metrics.totalRevenue.toLocaleString()}
            </h2>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-1">
              <TrendingUp size={13} />
              <span>▲ 0% vs last period</span>
            </div>
          </div>
        </div>

        {/* Card 2: TOTAL ORDERS */}
        <div className="rounded-2xl border border-[#262b37] bg-gradient-to-br from-[#121926] via-[#161821] to-[#161821] p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ClipboardList size={20} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a0]">
              TOTAL ORDERS
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-mono font-extrabold text-white tracking-tight">
              {filteredOrders.length}
            </h2>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium mt-1">
              <TrendingUp size={13} />
              <span>▲ 0% orders</span>
            </div>
          </div>
        </div>

        {/* Card 3: AVG ORDER VALUE */}
        <div className="rounded-2xl border border-[#262b37] bg-gradient-to-br from-[#102219] via-[#161821] to-[#161821] p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LineChart size={20} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a0]">
              AVG ORDER VALUE
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-mono font-extrabold text-white tracking-tight">
              {metrics.averageOrderValue.toLocaleString()}
            </h2>
            <p className="text-xs text-[#8b92a0] mt-1 font-medium">PKR per order</p>
          </div>
        </div>

        {/* Card 4: ITEMS SOLD */}
        <div className="rounded-2xl border border-[#262b37] bg-gradient-to-br from-[#1f1226] via-[#161821] to-[#161821] p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Flame size={20} />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8b92a0]">
              ITEMS SOLD
            </span>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-mono font-extrabold text-white tracking-tight">
              {totalItemsSold}
            </h2>
            <p className="text-xs text-[#8b92a0] mt-1 font-medium">Total items across all orders</p>
          </div>
        </div>
      </div>

      {/* Row 2: Sales Overview Chart & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Bar Chart */}
        <div className="rounded-2xl border border-[#262b37] bg-[#161821] p-6 lg:col-span-2 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-bold text-white">Sales Overview</h3>
            <span className="text-xs text-[#8b92a0] font-mono">Hourly breakdown</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-[#232734] pb-2 px-2">
            {hourlyData.map((item, idx) => {
              const heightPercent = Math.max(15, Math.round((item.sales / maxHourlySales) * 100));
              const isActive = item.sales > 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="w-full bg-[#1e2330] rounded-t-md h-full flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isActive
                          ? "bg-gradient-to-t from-[#ff6b00] to-[#ff8c38] shadow-lg shadow-[#ff6b00]/20"
                          : "bg-[#252b3b] group-hover:bg-[#ff6b00]/40"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#8b92a0] group-hover:text-white">
                    {item.hour}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="rounded-2xl border border-[#262b37] bg-[#161821] p-6 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="font-display text-lg font-bold text-white mb-4">Category Breakdown</h3>

            {categories.length === 0 ? (
              <p className="text-xs text-[#8b92a0] py-8 text-center">No categories recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {categories.map((cat, idx) => {
                  const percent = ((cat.count / totalCatItems) * 100).toFixed(1);
                  const colorClass = categoryColors[idx % categoryColors.length];

                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium">
                          <span>{cat.icon}</span>
                          <span>{cat.name}</span>
                        </span>
                        <span className="font-mono text-[#8b92a0]">
                          {cat.count} items ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#1e2330] rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-700`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top Selling Items & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="rounded-2xl border border-[#262b37] bg-[#161821] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <span>🔥</span> Top Selling Items
            </h3>
          </div>

          {metrics.topItems.length === 0 ? (
            <p className="text-xs text-[#8b92a0] py-8 text-center">No item sales recorded.</p>
          ) : (
            <div className="space-y-4">
              {metrics.topItems.slice(0, 5).map((item, idx) => {
                const maxQty = metrics.topItems[0]?.qty || 1;
                const barWidth = Math.max(20, Math.round((item.qty / maxQty) * 100));

                return (
                  <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-mono text-[#8b92a0] text-[11px] font-bold w-4">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{item.name}</p>
                        <p className="text-[11px] font-mono text-[#8b92a0]">
                          {formatPKR(item.revenue)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-36 shrink-0">
                      <div className="h-2 flex-1 bg-[#1e2330] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#ff6b00] rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-white w-4 text-right">
                        {item.qty}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders List */}
        <div className="rounded-2xl border border-[#262b37] bg-[#161821] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-white">Recent Orders</h3>
            <button
              onClick={() => setTimeframe("all")}
              className="text-xs text-[#8b92a0] hover:text-white transition font-medium"
            >
              View All
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="text-xs text-[#8b92a0] py-8 text-center">No recent orders found.</p>
          ) : (
            <div className="space-y-3">
              {filteredOrders.slice(0, 4).map((order) => {
                const total = order.lines.reduce(
                  (s, l) => s + l.unitPrice * l.quantity,
                  0
                );
                const itemCount = order.lines.reduce((s, l) => s + l.quantity, 0);
                const shortId = order.id.replace("ord_", "");

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="p-3.5 rounded-xl bg-[#1a1d28] border border-[#242938] hover:border-[#353d54] transition flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded bg-[#252b3d] text-white font-mono text-[10px] font-bold">
                        {shortId}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {order.customerName || "Walk-in Customer"}
                        </p>
                        <p className="text-[10px] text-[#8b92a0]">
                          {itemCount} Items &middot; Table — {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs font-bold text-white shrink-0">
                      {formatPKR(total)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
