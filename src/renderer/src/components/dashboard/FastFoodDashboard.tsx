"use client";

import { useState } from "react";
import {
  UtensilsCrossed,
  DollarSign,
  ShoppingBag,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  ChevronRight,
  Flame,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Order, OrderStage } from "@/lib/types";
import { formatPKR } from "@/lib/utils";
import {
  calculateModuleMetrics,
  filterOrdersByTimeframe,
  TimeframeFilter,
  useOrders,
} from "@/lib/useOrders";

export function FastFoodDashboard() {
  const { orders, updateOrderStatus } = useOrders("fastfood");
  const [timeframe, setTimeframe] = useState<TimeframeFilter>("today");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = filterOrdersByTimeframe(orders, timeframe);
  const metrics = calculateModuleMetrics(filteredOrders);

  // Active Kitchen Pipeline orders (KOT & Billed)
  const activeKitchenOrders = orders.filter(
    (o) => o.stage === "kot" || o.stage === "billed"
  );

  // Stage indicator badge styling
  const stageBadges: Record<OrderStage, { label: string; bg: string; text: string }> = {
    cart: { label: "Cart", bg: "bg-surface-2", text: "text-text-muted" },
    kot: { label: "In Kitchen (KOT)", bg: "bg-fastfood-soft", text: "text-fastfood" },
    billed: { label: "Billed", bg: "bg-amber-950/60", text: "text-amber-400" },
    paid: { label: "Paid", bg: "bg-emerald-950/60", text: "text-emerald-400" },
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-fastfood-soft text-fastfood">
              <UtensilsCrossed size={20} />
            </span>
            <div>
              <h2 className="font-display text-2xl">Fast Food Dashboard</h2>
              <p className="text-text-muted text-xs">
                Live Kitchen KOT Pipeline, Revenue Analytics &amp; Order Stream
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border">
          {(["today", "week", "month", "all"] as TimeframeFilter[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                timeframe === tf
                  ? "bg-fastfood text-[#1a1300] font-semibold"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {tf === "today" ? "Today" : tf === "week" ? "7 Days" : tf === "month" ? "30 Days" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-fastfood relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Fast Food Revenue
            </span>
            <span className="p-2 rounded-lg bg-fastfood-soft text-fastfood">
              <DollarSign size={18} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-mono text-2xl font-bold">{formatPKR(metrics.totalRevenue)}</h3>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> {metrics.paidOrdersCount} Paid Transactions
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Active KOT Orders
            </span>
            <span className="p-2 rounded-lg bg-amber-950/50 text-amber-400 relative">
              <Flame size={18} />
              {activeKitchenOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-fastfood animate-ping" />
              )}
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-mono text-2xl font-bold">{activeKitchenOrders.length}</h3>
            <p className="text-xs text-text-muted mt-1">
              {metrics.activeKOTCount} Kitchen &middot; {metrics.activeBilledCount} Pending Bill
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Total Fast Food Orders
            </span>
            <span className="p-2 rounded-lg bg-sky-950/50 text-sky-400">
              <ShoppingBag size={18} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-mono text-2xl font-bold">{filteredOrders.length}</h3>
            <p className="text-xs text-text-muted mt-1">
              {timeframe} order volume
            </p>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
              Average Order Value (AOV)
            </span>
            <span className="p-2 rounded-lg bg-emerald-950/50 text-emerald-400">
              <Clock size={18} />
            </span>
          </div>
          <div className="mt-3">
            <h3 className="font-mono text-2xl font-bold">{formatPKR(metrics.averageOrderValue)}</h3>
            <p className="text-xs text-text-muted mt-1">per ticket average</p>
          </div>
        </Card>
      </div>

      {/* Live Kitchen KOT Active Pipeline */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-fastfood animate-pulse" />
            <h3 className="font-display text-lg">Live Kitchen KOT Pipeline</h3>
          </div>
          <span className="text-xs text-text-muted font-mono">
            {activeKitchenOrders.length} Order(s) Processing
          </span>
        </div>

        {activeKitchenOrders.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-xl text-text-muted">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400/60" />
            <p className="text-sm font-medium">Kitchen is clear!</p>
            <p className="text-xs mt-1">All fast food orders have been billed &amp; settled.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeKitchenOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-border bg-surface-2 p-4 flex flex-col justify-between gap-3 relative hover:border-fastfood/50 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-fastfood">
                      #{order.id.replace("ord_ff_", "")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${stageBadges[order.stage].bg} ${stageBadges[order.stage].text}`}
                    >
                      {stageBadges[order.stage].label}
                    </span>
                  </div>

                  <p className="text-sm font-medium">
                    {order.customerName || "Walk-in Customer"}{" "}
                    <span className="text-xs text-text-muted capitalize font-normal">
                      ({order.orderType || "Dine-in"})
                    </span>
                  </p>

                  <ul className="mt-3 space-y-1 text-xs text-text-muted divide-y divide-border/40">
                    {order.lines.map((line, idx) => (
                      <li key={idx} className="pt-1 flex justify-between">
                        <span>
                          {line.quantity}x {line.name}
                        </span>
                        <span className="font-mono">{formatPKR(line.unitPrice * line.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted block">Total Bill</span>
                    <span className="font-mono text-sm font-bold">
                      {formatPKR(
                        order.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0)
                      )}
                    </span>
                  </div>

                  <Button
                    variant="fastfood"
                    className="px-3 py-1.5 text-xs"
                    onClick={() => {
                      if (order.stage === "kot") updateOrderStatus(order.id, "billed");
                      else if (order.stage === "billed") updateOrderStatus(order.id, "paid");
                    }}
                  >
                    {order.stage === "kot" ? "Mark Billed" : "Mark Paid"}
                    <ChevronRight size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Analytics Grid: Top Selling Items & Order Types */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Fast Food Items */}
        <Card className="p-5 lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg mb-1">Top Selling Fast Food Items</h3>
            <p className="text-xs text-text-muted mb-4">
              Best performing menu items ranked by total revenue
            </p>

            {metrics.topItems.length === 0 ? (
              <p className="text-xs text-text-muted py-6 text-center">No sales recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {metrics.topItems.slice(0, 5).map((item, idx) => {
                  const maxRevenue = metrics.topItems[0]?.revenue || 1;
                  const percentage = Math.round((item.revenue / maxRevenue) * 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <span className="w-5 font-mono text-text-muted">#{idx + 1}</span>
                          <span>{item.name}</span>
                          <span className="text-[10px] text-text-muted">({item.qty} sold)</span>
                        </span>
                        <span className="font-mono font-semibold">{formatPKR(item.revenue)}</span>
                      </div>
                      <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-fastfood to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Order Type Distribution */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-lg mb-1">Order Types</h3>
            <p className="text-xs text-text-muted mb-4">Dine-in vs Takeaway vs Delivery</p>

            <div className="space-y-4 my-2">
              <div className="p-3 rounded-lg bg-surface-2 border border-border flex items-center justify-between">
                <span className="text-xs font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-fastfood" /> Dine-in
                </span>
                <span className="font-mono text-sm font-bold">{metrics.orderTypes.dineIn} Orders</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 border border-border flex items-center justify-between">
                <span className="text-xs font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Takeaway
                </span>
                <span className="font-mono text-sm font-bold">{metrics.orderTypes.takeaway} Orders</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 border border-border flex items-center justify-between">
                <span className="text-xs font-medium flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Delivery
                </span>
                <span className="font-mono text-sm font-bold">{metrics.orderTypes.delivery} Orders</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Fast Food Orders History List */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg">Fast Food Orders Log</h3>
            <p className="text-xs text-text-muted">All recent Fast Food orders and receipts</p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-xs text-text-muted py-6 text-center">No orders found for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3 text-right">Items</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.map((order) => {
                  const total = order.lines.reduce(
                    (s, l) => s + l.unitPrice * l.quantity,
                    0
                  );

                  return (
                    <tr key={order.id} className="hover:bg-surface-2/60 transition">
                      <td className="py-2.5 px-3 font-mono font-medium text-fastfood">
                        #{order.id.replace("ord_ff_", "")}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        {order.customerName || "Walk-in"}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-text-muted">
                        {order.orderType || "Dine-in"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${stageBadges[order.stage].bg} ${stageBadges[order.stage].text}`}
                        >
                          {stageBadges[order.stage].label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {order.lines.reduce((s, l) => s + l.quantity, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {formatPKR(total)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded bg-surface-2 hover:bg-border text-text-muted hover:text-text transition inline-flex items-center gap-1 text-[11px]"
                        >
                          <Eye size={13} /> View
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-y-0 right-0 left-64 z-40 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-surface border border-border shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded bg-fastfood-soft text-fastfood">
                  <UtensilsCrossed size={16} />
                </span>
                <h4 className="font-display text-lg">Fast Food Ticket Receipt</h4>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-text-muted hover:text-text text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between text-text-muted">
                <span>Ticket #: {selectedOrder.id}</span>
                <span>Date: {new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer: {selectedOrder.customerName || "Walk-in"}</span>
                <span className="capitalize">Type: {selectedOrder.orderType || "Dine-in"}</span>
              </div>

              <div className="border-t border-b border-dashed border-border py-3 space-y-2">
                {selectedOrder.lines.map((l, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {l.quantity}x {l.name}
                    </span>
                    <span>{formatPKR(l.unitPrice * l.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 pt-1 text-right">
                <div className="flex justify-between font-bold text-sm">
                  <span>Total Amount</span>
                  <span className="text-fastfood">
                    {formatPKR(
                      selectedOrder.lines.reduce(
                        (s, l) => s + l.unitPrice * l.quantity,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                variant="neutral"
                className="w-full"
                onClick={() => window.print()}
              >
                <Printer size={14} /> Print Receipt
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
