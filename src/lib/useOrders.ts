"use client";

import { useCallback, useEffect, useState } from "react";
import { KEYS, storage } from "./storage";
import { ModuleKey, Order, OrderStage } from "./types";
import { ensureInitialData } from "./seedData";
import { nowISO, uid } from "./utils";

export type TimeframeFilter = "today" | "week" | "month" | "all";

export function useOrders(module?: ModuleKey) {
  const [orders, setOrders] = useState<Order[]>([]);

  const reloadOrders = useCallback(() => {
    ensureInitialData();
    const all = storage.getList<Order>(KEYS.orders);
    setOrders(module ? all.filter((o) => o.module === module) : all);
  }, [module]);

  useEffect(() => {
    reloadOrders();

    // Listen to custom storage update events for immediate multi-tab / dynamic sync
    const handleStorageChange = () => reloadOrders();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pos_orders_updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pos_orders_updated", handleStorageChange);
    };
  }, [reloadOrders]);

  const notifyChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pos_orders_updated"));
    }
  };

  const createOrder = useCallback(
    (data: Omit<Order, "id" | "createdAt" | "updatedAt">) => {
      const all = storage.getList<Order>(KEYS.orders);
      const newOrder: Order = {
        ...data,
        id: uid("ord_"),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      const updated = [newOrder, ...all];
      storage.setList(KEYS.orders, updated);
      setOrders(module ? updated.filter((o) => o.module === module) : updated);
      notifyChange();
      return newOrder;
    },
    [module]
  );

  const updateOrderStatus = useCallback(
    (id: string, stage: OrderStage) => {
      const all = storage.getList<Order>(KEYS.orders);
      const updated = all.map((o) =>
        o.id === id ? { ...o, stage, updatedAt: nowISO() } : o
      );
      storage.setList(KEYS.orders, updated);
      setOrders(module ? updated.filter((o) => o.module === module) : updated);
      notifyChange();
    },
    [module]
  );

  const deleteOrder = useCallback(
    (id: string) => {
      const all = storage.getList<Order>(KEYS.orders);
      const updated = all.filter((o) => o.id !== id);
      storage.setList(KEYS.orders, updated);
      setOrders(module ? updated.filter((o) => o.module === module) : updated);
      notifyChange();
    },
    [module]
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
  const paidOrders = orders.filter((o) => o.stage === stagePaidOrBilled(o));

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

  // Order types breakdown (dine-in, takeaway, delivery)
  const orderTypes = {
    dineIn: orders.filter((o) => o.orderType === "dine-in").length,
    takeaway: orders.filter((o) => o.orderType === "takeaway").length,
    delivery: orders.filter((o) => o.orderType === "delivery").length,
  };

  // Active stage counts
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

function stagePaidOrBilled(order: Order) {
  // Mini mart uses paid directly; Fast Food uses paid as final
  return "paid";
}
