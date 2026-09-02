"use client";

import { useCallback, useEffect, useState } from "react";
import { ModuleKey, Order, OrderStage } from "./types";
import { offlineDb, LocalOrder } from "./offlineDb";
import { posApi } from "./api";
import { nowISO, uid } from "./utils";

export type TimeframeFilter = "today" | "week" | "month" | "all";

export function useOrders(module?: ModuleKey) {
  const [orders, setOrders] = useState<Order[]>([]);

  const reloadOrders = useCallback(async () => {
    try {
      let local: LocalOrder[] = [];
      if (module) {
        local = await offlineDb.orders.where("module").equals(module).reverse().sortBy("createdAt");
      } else {
        local = await offlineDb.orders.reverse().sortBy("createdAt");
      }
      setOrders(local);
    } catch {
      // Fallback to posApi fetch
      const fetched = await posApi.fetchOrders(module);
      setOrders(fetched);
    }
  }, [module]);

  useEffect(() => {
    void reloadOrders();

    const handleUpdate = () => {
      void reloadOrders();
    };

    window.addEventListener("pos_orders_updated", handleUpdate);
    return () => {
      window.removeEventListener("pos_orders_updated", handleUpdate);
    };
  }, [reloadOrders]);

  const notifyChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pos_orders_updated"));
    }
  };

  const createOrder = useCallback(
    async (data: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
      const newOrder: Order = {
        ...data,
        id: uid("ord_"),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };

      await posApi.saveOrder(newOrder);
      await reloadOrders();
      notifyChange();
      return newOrder;
    },
    [reloadOrders]
  );

  const updateOrderStatus = useCallback(
    async (id: string, stage: OrderStage) => {
      try {
        await offlineDb.orders.update(id, { stage, updatedAt: nowISO(), synced: 0 });
      } catch {
        /* Ignore */
      }
      await reloadOrders();
      notifyChange();
    },
    [reloadOrders]
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      try {
        await offlineDb.orders.delete(id);
      } catch {
        /* Ignore */
      }
      await reloadOrders();
      notifyChange();
    },
    [reloadOrders]
  );

  return {
    orders,
    reloadOrders,
    createOrder,
    updateOrderStatus,
    deleteOrder,
  };
}

export function filterOrdersByTimeframe(orders: Order[], timeframe: TimeframeFilter) {
  if (timeframe === "all") return orders;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (timeframe === "today") {
    return orders.filter((o) => new Date(o.createdAt).getTime() >= startOfDay);
  }

  if (timeframe === "week") {
    const startOfWeek = startOfDay - 6 * 24 * 3600 * 1000;
    return orders.filter((o) => new Date(o.createdAt).getTime() >= startOfWeek);
  }

  if (timeframe === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return orders.filter((o) => new Date(o.createdAt).getTime() >= startOfMonth);
  }

  return orders;
}

export function calculateModuleMetrics(orders: Order[]) {
  const paidOrders = orders.filter((o) => o.stage === "paid" || o.stage === "billed");

  const totalRevenue = paidOrders.reduce((sum, order) => {
    const subtotal = order.lines.reduce((lSum, l) => lSum + l.unitPrice * l.quantity, 0);
    const discount = (subtotal * (order.discountPercent || 0)) / 100;
    return sum + (subtotal - discount);
  }, 0);

  const totalOrdersCount = orders.length;
  const paidOrdersCount = paidOrders.length;
  const averageOrderValue = paidOrdersCount > 0 ? Math.round(totalRevenue / paidOrdersCount) : 0;

  // Items sold breakdown
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach((o) => {
    o.lines.forEach((l) => {
      if (!itemMap[l.name]) {
        itemMap[l.name] = { name: l.name, qty: 0, revenue: 0 };
      }
      itemMap[l.name].qty += l.quantity;
      itemMap[l.name].revenue += l.unitPrice * l.quantity;
    });
  });

  const topItems = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);

  const orderTypes = {
    dineIn: orders.filter((o) => o.orderType === "dine-in").length,
    takeaway: orders.filter((o) => o.orderType === "takeaway").length,
    delivery: orders.filter((o) => o.orderType === "delivery").length,
  };

  const activeKOTCount = orders.filter((o) => o.stage === "kot").length;
  const activeBilledCount = orders.filter((o) => o.stage === "billed").length;

  return {
    totalRevenue,
    totalOrdersCount,
    paidOrdersCount,
    averageOrderValue,
    topItems,
    orderTypes,
    activeKOTCount,
    activeBilledCount,
  };
}
