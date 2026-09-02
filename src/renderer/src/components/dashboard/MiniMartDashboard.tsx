"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBasket,
  DollarSign,
  Receipt,
  AlertTriangle,
  TrendingUp,
  Boxes,
  PlusCircle,
  Eye,
  Printer,
  ShoppingBag,
  Coins,
  ArrowUpRight,
  Sparkles,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Order } from "@/lib/types";
import { formatPKR } from "@/lib/utils";
import {
  calculateModuleMetrics,
  filterOrdersByTimeframe,
  TimeframeFilter,
  useOrders,
} from "@/lib/useOrders";
import { useProducts } from "@/lib/useProducts";
import { useStock } from "@/lib/useStock";

export function MiniMartDashboard() {
  const { orders } = useOrders("minimart");
  const { products } = useProducts("minimart");
  const { movements, record } = useStock("minimart");

  const [timeframe, setTimeframe] = useState<TimeframeFilter>("today");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = filterOrdersByTimeframe(orders, timeframe);
  const metrics = calculateModuleMetrics(filteredOrders);

  // Compute detailed Inventory Stock & Valuation per Product
  const productValuationList = products.map((prod) => {
    const prodMovements = movements.filter((m) => m.productId === prod.id || m.productName.toLowerCase() === prod.name.toLowerCase());
    
    const stockIn = prodMovements
      .filter((m) => m.type === "in")
      .reduce((sum, m) => sum + m.quantity, 0);

    const stockOut = prodMovements
      .filter((m) => m.type === "out")
      .reduce((sum, m) => sum + m.quantity, 0);

    const unitsSold = orders
      .flatMap((o) => o.lines)
      .filter((l) => l.productId === prod.id || l.name.toLowerCase() === prod.name.toLowerCase())
      .reduce((sum, l) => sum + l.quantity, 0);

    // Calculated current stock quantity (with fallback base stock of 30 if no movement recorded)
    const currentStock = Math.max(0, (stockIn || 40) - stockOut - unitsSold);

    const costPrice = prod.costPrice || Math.round(prod.price * 0.7);
    const salePrice = prod.price;

    const unitMargin = salePrice - costPrice;
    const marginPercent = salePrice > 0 ? Math.round((unitMargin / salePrice) * 100) : 0;

    const totalCostValuation = currentStock * costPrice;
    const totalRetailValuation = currentStock * salePrice;
    const totalPotentialProfit = totalRetailValuation - totalCostValuation;

    return {
      product: prod,
      currentStock,
      costPrice,
      salePrice,
      unitMargin,
      marginPercent,
      totalCostValuation,
      totalRetailValuation,
      totalPotentialProfit,
      isLowStock: currentStock <= 10,
    };
  });

  // Global Valuation Totals
  const totalProductsCount = products.length;
  const totalStockUnits = productValuationList.reduce((s, p) => s + p.currentStock, 0);
  const totalInventoryCostValuation = productValuationList.reduce((s, p) => s + p.totalCostValuation, 0);
  const totalInventoryRetailValuation = productValuationList.reduce((s, p) => s + p.totalRetailValuation, 0);
  const totalPotentialProfitSum = totalInventoryRetailValuation - totalInventoryCostValuation;

  const lowStockItems = productValuationList.filter((p) => p.isLowStock);

  // Filtered product table
  const searchFilteredProducts = productValuationList.filter(
    (p) =>
      p.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 no-scrollbar text-white">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232734] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-md bg-minimart-soft text-minimart">
              <ShoppingBasket size={20} />
            </span>
            <div>
              <h2 className="font-display text-2xl font-bold">Mini Mart Inventory &amp; Valuation Dashboard</h2>
              <p className="text-[#8b92a0] text-xs">
                Product Unit Prices, Total Stock Valuation &amp; Retail Margin Console
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/stock/in">
            <Button variant="minimart" className="text-xs font-bold rounded-md py-2">
              <Boxes size={15} /> + Stock In New Item
            </Button>
          </Link>

          <div className="flex items-center gap-1 bg-[#161822] p-1 rounded-md border border-[#232734]">
            {(["today", "week", "month", "all"] as TimeframeFilter[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition ${
                  timeframe === tf
                    ? "bg-minimart text-[#00201a]"
                    : "text-[#8b92a0] hover:text-white"
                }`}
              >
                {tf === "today" ? "Today" : tf === "week" ? "7 Days" : tf === "month" ? "30 Days" : "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: INVENTORY VALUATION HERO STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost Valuation Card (Capital Invested) */}
        <Card className="p-5 border-l-4 border-l-minimart bg-gradient-to-br from-[#12241f] via-[#161821] to-[#161821] rounded-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8b92a0]">
              TOTAL STOCK COST VALUATION
            </span>
            <span className="p-2 rounded-md bg-minimart-soft text-minimart">
              <Coins size={18} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-mono text-2xl font-extrabold text-white">
              {formatPKR(totalInventoryCostValuation)}
            </h3>
            <p className="text-xs text-minimart flex items-center gap-1 mt-1 font-medium">
              <Sparkles size={12} /> Total Capital Invested in Stock
            </p>
          </div>
        </Card>

        {/* Total Retail Valuation Card (Expected Sales Worth) */}
        <Card className="p-5 border-l-4 border-l-emerald-500 bg-gradient-to-br from-[#102419] via-[#161821] to-[#161821] rounded-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8b92a0]">
              RETAIL SELLING VALUATION
            </span>
            <span className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-mono text-2xl font-extrabold text-white">
              {formatPKR(totalInventoryRetailValuation)}
            </h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp size={12} /> Expected Revenue at Full Sale
            </p>
          </div>
        </Card>

        {/* Total Stock Units in Mart */}
        <Card className="p-5 border-l-4 border-l-cyan-500 bg-gradient-to-br from-[#0f2129] via-[#161821] to-[#161821] rounded-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8b92a0]">
              TOTAL STOCK IN MART
            </span>
            <span className="p-2 rounded-md bg-cyan-950/60 text-cyan-400">
              <Boxes size={18} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-mono text-2xl font-extrabold text-white">
              {totalStockUnits} <span className="text-xs text-[#8b92a0] font-sans">Units</span>
            </h3>
            <p className="text-xs text-cyan-400 mt-1 font-medium">
              Across {totalProductsCount} Unique Products / SKUs
            </p>
          </div>
        </Card>

        {/* Expected Gross Profit Margin */}
        <Card className="p-5 border-l-4 border-l-amber-500 bg-gradient-to-br from-[#241d10] via-[#161821] to-[#161821] rounded-md shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8b92a0]">
              POTENTIAL GROSS MARGIN
            </span>
            <span className="p-2 rounded-md bg-amber-950/60 text-amber-400">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-mono text-2xl font-extrabold text-white">
              {formatPKR(totalPotentialProfitSum)}
            </h3>
            <p className="text-xs text-amber-400 mt-1 font-medium">
              Estimated Inventory Margin Profit
            </p>
          </div>
        </Card>
      </div>

      {/* Row 2: DETAILED SINGLE PRODUCT PRICE & STOCK VALUATION TABLE */}
      <Card className="p-5 bg-[#161822] border-[#232734] rounded-md shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Boxes size={18} className="text-minimart" /> Product-by-Product Unit Prices &amp; Inventory Valuation
            </h3>
            <p className="text-xs text-[#8b92a0]">
              Ek ek product ki Purchase Cost Price, Retail Selling Price, Unit Margin aur Total Valuation
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-[#8b92a0]" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product or category..."
              className="w-full bg-[#0e1015] border border-[#232734] rounded-md pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#585f70]"
            />
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#232734] text-[#8b92a0] uppercase text-[10px] tracking-wider bg-[#10121a]">
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3 text-right">Unit Cost (Purchase)</th>
                <th className="py-3 px-3 text-right">Unit Price (Retail)</th>
                <th className="py-3 px-3 text-right">Unit Margin</th>
                <th className="py-3 px-3 text-center">Stock Quantity</th>
                <th className="py-3 px-3 text-right">Total Cost Valuation</th>
                <th className="py-3 px-3 text-right">Total Retail Valuation</th>
                <th className="py-3 px-3 text-center">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232734]/70">
              {searchFilteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#8b92a0]">
                    No Mini Mart products found.
                  </td>
                </tr>
              ) : (
                searchFilteredProducts.map(({ product, currentStock, costPrice, salePrice, unitMargin, marginPercent, totalCostValuation, totalRetailValuation, isLowStock }) => (
                  <tr key={product.id} className="hover:bg-[#1a1d2a] transition">
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-minimart-soft text-minimart text-[10px] font-semibold uppercase">
                        {product.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} className="w-7 h-7 rounded-md object-cover border border-[#232734]" />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-[#8b92a0]">
                      {formatPKR(costPrice)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatPKR(salePrice)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                      +{formatPKR(unitMargin)} <span className="text-[10px] text-[#8b92a0]">({marginPercent}%)</span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${isLowStock ? "bg-amber-950 text-amber-400 border border-amber-500/40" : "bg-[#1f2433] text-white"}`}>
                        {currentStock} units
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-minimart">
                      {formatPKR(totalCostValuation)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatPKR(totalRetailValuation)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            record({
                              module: "minimart",
                              productId: product.id,
                              productName: product.name,
                              type: "in",
                              quantity: 10,
                              unitCost: costPrice,
                              unitPrice: salePrice,
                              note: "Quick dashboard restock +10",
                            });
                          }}
                          className="px-2 py-1 rounded-md bg-[#222634] hover:bg-minimart hover:text-[#00201a] text-white text-[11px] font-semibold transition"
                          title="Restock +10 units"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => {
                            record({
                              module: "minimart",
                              productId: product.id,
                              productName: product.name,
                              type: "in",
                              quantity: 50,
                              unitCost: costPrice,
                              unitPrice: salePrice,
                              note: "Quick dashboard restock +50",
                            });
                          }}
                          className="px-2 py-1 rounded-md bg-[#222634] hover:bg-minimart hover:text-[#00201a] text-white text-[11px] font-semibold transition"
                          title="Restock +50 units"
                        >
                          +50
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Row 3: Mini Mart Checkout Log */}
      <Card className="p-5 bg-[#161822] border-[#232734] rounded-md shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Recent Mini Mart Checkout Sales</h3>
            <p className="text-xs text-[#8b92a0]">Completed POS retail register sales</p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-xs text-[#8b92a0] py-6 text-center">No retail checkout sales recorded for this period.</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#232734] text-[#8b92a0] uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Receipt ID</th>
                  <th className="py-2.5 px-3">Date &amp; Time</th>
                  <th className="py-2.5 px-3 text-right">Items Sold</th>
                  <th className="py-2.5 px-3 text-right">Total Bill</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232734]/60">
                {filteredOrders.map((order) => {
                  const total = order.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

                  return (
                    <tr key={order.id} className="hover:bg-[#1a1d2a] transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-minimart">
                        #{order.id.replace("ord_mm_", "")}
                      </td>
                      <td className="py-2.5 px-3 text-[#8b92a0]">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {order.lines.reduce((s, l) => s + l.quantity, 0)} items
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatPKR(total)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-md bg-[#222634] hover:bg-[#343a4e] text-[#8b92a0] hover:text-white transition inline-flex items-center gap-1 text-[11px]"
                        >
                          <Eye size={13} /> View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
