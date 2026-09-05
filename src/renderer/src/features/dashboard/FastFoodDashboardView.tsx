import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Food24Regular,
  BuildingShop24Regular,
  ArrowTrending24Filled,
  Timer24Regular,
  Money24Filled,
  Receipt24Filled,
  ArrowClockwise20Regular,
  Open20Regular,
  AlertUrgent20Filled,
  Sparkle20Filled,
  Delete20Regular,
  Add20Regular,
  Dismiss20Regular,
} from '@fluentui/react-icons';
import { useAppTheme } from '@/theme/AppProviders';
import { offlineDb, LocalOrder } from '@/lib/offlineDb';
import { Product } from '@/lib/types';
import { ensureDashboardSeedOrders, clearDashboardSeedOrders, createLiveTestOrder } from '@/lib/seedData';

type DashboardTab = 'fastfood' | 'minimart';
type DateRange = 'today' | 'week' | 'month';

export function FastFoodDashboardView(): React.JSX.Element {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DashboardTab>('fastfood');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [selectedHourDetails, setSelectedHourDetails] = useState<{
    hour: number;
    label: string;
    orders: number;
    revenue: number;
    isPeak: boolean;
    isCurrentHour: boolean;
    hourOrders: LocalOrder[];
  } | null>(null);

  const hasDemoOrders = useMemo(() => {
    return orders.some((o) => o.id.startsWith('ord_ff_demo_') || o.id.startsWith('ord_ff_hist_') || o.id.startsWith('ord_mm_demo_'));
  }, [orders]);

  // Load orders and products from offlineDb
  const loadData = async () => {
    setIsLoading(true);
    try {
      const demoCleared = typeof window !== 'undefined' && localStorage.getItem('omnipos_demo_orders_cleared') === 'true';
      const existingCount = await offlineDb.orders.count();
      if (existingCount === 0 && !demoCleared) {
        await ensureDashboardSeedOrders();
      }
      const allOrders = await offlineDb.orders.toArray();
      const allProducts = await offlineDb.products.toArray();
      setOrders(allOrders);
      setProducts(allProducts);
    } catch (err) {
      console.warn('Dashboard data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      void loadData();
    };
    window.addEventListener('pos_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(loadData, 15000); // 15s auto refresh
    return () => {
      window.removeEventListener('pos_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Theme Tokens
  const T = {
    bg: isDark ? '#0D0E11' : '#F8FAFC',
    cardBg: isDark ? '#14161B' : '#FFFFFF',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)',
    textPrimary: isDark ? '#FFFFFF' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    red: '#E51937',
    redGlow: 'rgba(229, 25, 55, 0.35)',
    green: '#10B981',
    amber: '#F59E0B',
    blue: '#3B82F6',
    purple: '#8B5CF6',
  };

  // Filter orders by module and date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (o.module !== activeTab) return false;
      const orderDate = new Date(o.createdAt);
      if (dateRange === 'today') {
        return (
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      } else {
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );
      }
    });
  }, [orders, activeTab, dateRange]);

  // Key KPI Calculations
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let completedCount = 0;
    let inKitchenCount = 0;
    let readyCount = 0;

    let dineInCount = 0;
    let takeawayCount = 0;
    let deliveryCount = 0;

    const itemCountMap: Record<string, { name: string; qty: number; revenue: number; img?: string }> = {};

    filteredOrders.forEach((o) => {
      const orderTotal = o.lines.reduce((sum, l) => sum + (l.unitPrice || 0) * (l.quantity || 1), 0);
      totalRevenue += orderTotal;

      if (o.stage === 'paid') completedCount++;
      else if (o.stage === 'kot') inKitchenCount++;
      else if (o.stage === 'billed') readyCount++;

      if (o.orderType === 'dine-in') dineInCount++;
      else if (o.orderType === 'takeaway') takeawayCount++;
      else if (o.orderType === 'delivery') deliveryCount++;

      o.lines.forEach((line) => {
        if (!itemCountMap[line.productId]) {
          const prod = products.find((p) => p.id === line.productId);
          itemCountMap[line.productId] = {
            name: line.name,
            qty: 0,
            revenue: 0,
            img: prod?.imageUrl,
          };
        }
        itemCountMap[line.productId].qty += line.quantity;
        itemCountMap[line.productId].revenue += line.unitPrice * line.quantity;
      });
    });

    const totalOrders = filteredOrders.length;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const avgPrepMinutes = activeTab === 'fastfood' ? 11.4 : 3.2;

    const topItems = Object.values(itemCountMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      completedCount,
      inKitchenCount,
      readyCount,
      aov,
      avgPrepMinutes,
      dineInCount,
      takeawayCount,
      deliveryCount,
      topItems,
    };
  }, [filteredOrders, products, activeTab]);

  // Hourly curve data calculation (Dynamic: operational window + current hour + all hours with orders)
  const hourlyData = useMemo(() => {
    const now = new Date();
    const currentH = now.getHours();

    // Standard business hours (10 AM to 11 PM)
    const baseHours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    // Any hours where orders exist
    const orderHours = filteredOrders.map((o) => new Date(o.createdAt).getHours());
    // Combine, deduplicate, and sort numerically
    const allHours = Array.from(new Set([...baseHours, currentH, ...orderHours])).sort((a, b) => a - b);

    return allHours.map((h) => {
      let ordersInHour = 0;
      let revenueInHour = 0;
      const hourOrders: LocalOrder[] = [];

      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt);
        if (d.getHours() === h) {
          ordersInHour++;
          revenueInHour += o.lines.reduce((s, l) => s + (l.unitPrice || 0) * (l.quantity || 1), 0);
          hourOrders.push(o);
        }
      });

      const label = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : h === 0 ? '12 AM' : `${h} AM`;
      const isPeak = h === 13 || h === 14 || h === 20 || h === 21;
      const isCurrentHour = h === currentH;

      return {
        hour: h,
        label,
        orders: ordersInHour,
        revenue: revenueInHour,
        isPeak,
        isCurrentHour,
        hourOrders,
      };
    });
  }, [filteredOrders]);

  // Professional Column Chart Geometry & Metrics (Hourly Breakdown)
  const columnChart = useMemo(() => {
    const width = 760;
    const height = 230;
    const padLeft = 40;
    const padRight = 20;
    const padTop = 32;
    const padBottom = 34;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const rawMax = Math.max(...hourlyData.map((d) => d.orders), 8);
    const maxOrders = Math.max(Math.ceil(rawMax / 5) * 5, 10);

    const slotWidth = chartW / hourlyData.length;
    const barWidth = Math.min(24, Math.max(16, slotWidth - 8));

    const columns = hourlyData.map((d, idx) => {
      const xCenter = padLeft + idx * slotWidth + slotWidth / 2;
      const barX = xCenter - barWidth / 2;
      const barH = (d.orders / maxOrders) * chartH;
      const barY = padTop + chartH - barH;
      const trackX = xCenter - (slotWidth - 4) / 2;
      const trackW = slotWidth - 4;
      return {
        ...d,
        xCenter,
        barX,
        barY,
        barH,
        trackX,
        trackW,
        barWidth,
        slotWidth,
      };
    });

    const yTicks = [0, 0.33, 0.66, 1].map((ratio) => {
      const val = Math.round(maxOrders * ratio);
      const y = padTop + chartH - ratio * chartH;
      return { val, y };
    });

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      chartW,
      chartH,
      maxOrders,
      columns,
      yTicks,
    };
  }, [hourlyData]);

  // Donut chart calculations
  const donutData = useMemo(() => {
    const total = metrics.totalOrders || 1;
    const dineInPct = Math.round((metrics.dineInCount / total) * 100);
    const takeawayPct = Math.round((metrics.takeawayCount / total) * 100);
    const deliveryPct = Math.max(0, 100 - dineInPct - takeawayPct);

    // Circumference for r=70 is 2 * PI * 70 = 439.82
    const C = 439.82;
    const stroke1 = (dineInPct / 100) * C;
    const stroke2 = (takeawayPct / 100) * C;
    const stroke3 = (deliveryPct / 100) * C;

    return {
      C,
      dineInPct,
      takeawayPct,
      deliveryPct,
      stroke1,
      stroke2,
      stroke3,
      offset1: 0,
      offset2: -stroke1,
      offset3: -(stroke1 + stroke2),
    };
  }, [metrics]);

  return (
    <div
      style={{
        padding: '24px 32px',
        backgroundColor: T.bg,
        minHeight: '100%',
        boxSizing: 'border-box',
        color: T.textPrimary,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          TOP HEADER & MODULE SWITCHER TABS
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${T.cardBorder}`,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>
              Sales & Activity Dashboard
            </h1>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '20px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: T.green,
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: T.green, boxShadow: `0 0 8px ${T.green}` }} />
              <span>LIVE • OFFLINE-FIRST</span>
            </div>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: T.textSecondary }}>
            Live sales, orders count, and kitchen cooking time
          </p>
        </div>

        {/* ── Top Dual Tabs: Fast Food vs Mini Mart ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: isDark ? '#1C1F26' : '#E2E8F0',
              padding: '4px',
              borderRadius: '10px',
              border: `1px solid ${T.cardBorder}`,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('fastfood')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeTab === 'fastfood' ? T.red : 'transparent',
                color: activeTab === 'fastfood' ? '#FFFFFF' : T.textSecondary,
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'fastfood' ? `0 4px 14px ${T.redGlow}` : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Food24Regular style={{ width: 16, height: 16 }} />
              <span>Fast Food Restaurant</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: activeTab === 'fastfood' ? 'rgba(255,255,255,0.25)' : isDark ? '#2D3139' : '#CBD5E1',
                  color: activeTab === 'fastfood' ? '#FFFFFF' : T.textPrimary,
                  fontWeight: 800,
                }}
              >
                {activeTab === 'fastfood' ? metrics.totalOrders : 'POS'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('minimart')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '7px',
                border: 'none',
                backgroundColor: activeTab === 'minimart' ? '#2563EB' : 'transparent',
                color: activeTab === 'minimart' ? '#FFFFFF' : T.textSecondary,
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'minimart' ? '0 4px 14px rgba(37, 99, 235, 0.4)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <BuildingShop24Regular style={{ width: 16, height: 16 }} />
              <span>Mini Mart Retail</span>
            </button>
          </div>

          {/* Date range filter */}
          <div
            style={{
              display: 'flex',
              backgroundColor: T.cardBg,
              padding: '3px',
              borderRadius: '8px',
              border: `1px solid ${T.cardBorder}`,
            }}
          >
            {(['today', 'week', 'month'] as DateRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: dateRange === r ? (isDark ? '#27272A' : '#E2E8F0') : 'transparent',
                  color: dateRange === r ? T.textPrimary : T.textMuted,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {r === 'today' ? 'Today' : r === 'week' ? '7 Days' : 'Month'}
              </button>
            ))}
          </div>

          <button
            type="button"
            title="Refresh"
            onClick={loadData}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: `1px solid ${T.cardBorder}`,
              backgroundColor: T.cardBg,
              color: T.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowClockwise20Regular style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4 HERO KPI METRIC CARDS (Laser Top Border & Glow)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '16px',
        }}
      >
        {/* Card 1: Gross Sales */}
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: '12px',
            border: `1px solid ${T.cardBorder}`,
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: T.red, boxShadow: `0 0 10px ${T.red}` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {activeTab === 'fastfood' ? 'Food Revenue' : 'Retail Sales'} ({dateRange})
            </span>
            <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: 'rgba(229, 25, 55, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.red }}>
              <Money24Filled style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: T.textPrimary, marginTop: '12px', letterSpacing: '-0.02em' }}>
            PKR {metrics.totalRevenue.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11.5px', color: T.green }}>
            <ArrowTrending24Filled style={{ width: 14, height: 14 }} />
            <span style={{ fontWeight: 800 }}>+18.4%</span>
            <span style={{ color: T.textMuted }}>vs previous period</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: '12px',
            border: `1px solid ${T.cardBorder}`,
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: T.blue, boxShadow: `0 0 10px ${T.blue}` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Orders Billed
            </span>
            <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.blue }}>
              <Receipt24Filled style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: T.textPrimary, marginTop: '12px', letterSpacing: '-0.02em' }}>
            {metrics.totalOrders} <span style={{ fontSize: '14px', fontWeight: 600, color: T.textMuted }}>orders</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '11.5px' }}>
            <span style={{ color: T.green, fontWeight: 700 }}>● {metrics.completedCount} Served</span>
            {activeTab === 'fastfood' && (
              <span style={{ color: T.amber, fontWeight: 700 }}>● {metrics.inKitchenCount} Cooking</span>
            )}
          </div>
        </div>

        {/* Card 3: Kitchen Velocity / Items Sold */}
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: '12px',
            border: `1px solid ${T.cardBorder}`,
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: T.amber, boxShadow: `0 0 10px ${T.amber}` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {activeTab === 'fastfood' ? 'Avg Kitchen Prep Speed' : 'Items Sold Today'}
            </span>
            <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.amber }}>
              <Timer24Regular style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: T.textPrimary, marginTop: '12px', letterSpacing: '-0.02em' }}>
            {activeTab === 'fastfood' ? `${metrics.avgPrepMinutes} ` : `${metrics.totalOrders * 2} `}
            <span style={{ fontSize: '14px', fontWeight: 600, color: T.textMuted }}>
              {activeTab === 'fastfood' ? 'Minutes / Ticket' : 'Units'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11.5px', color: T.amber }}>
            <Sparkle20Filled style={{ width: 14, height: 14 }} />
            <span style={{ fontWeight: 800 }}>
              {activeTab === 'fastfood' ? '🔥 94% under 15m target' : 'Fast Checkout Speed'}
            </span>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: '12px',
            border: `1px solid ${T.cardBorder}`,
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: T.green, boxShadow: `0 0 10px ${T.green}` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Ticket (AOV)
            </span>
            <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.green }}>
              <Sparkle20Filled style={{ width: 20, height: 20 }} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: T.textPrimary, marginTop: '12px', letterSpacing: '-0.02em' }}>
            PKR {metrics.aov.toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '11.5px', color: T.textSecondary }}>
            <span>Basket Size:</span>
            <span style={{ fontWeight: 800, color: T.textPrimary }}>
              {activeTab === 'fastfood' ? '2.4 items/ticket' : '3.8 items'}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CHARTS ROW (Curved Spline Hourly Rush Graph + Donut Ring)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* ── Left Chart: Professional Hourly Column Bar Chart ── */}
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: '14px',
            border: `1px solid ${T.cardBorder}`,
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                  {activeTab === 'fastfood' ? 'Hourly Orders & Sales (Column Chart)' : 'Hourly Retail Breakdown'}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(229, 25, 55, 0.12)',
                    color: T.red,
                  }}
                >
                  📊 Hourly Telemetry
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: T.textSecondary }}>
                Bar height shows total orders • Click any column to view exact order tickets
              </p>
            </div>

            {/* Quick Live Actions & Peak indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Button to quickly test live dynamic updates */}
              <button
                type="button"
                onClick={async () => {
                  await createLiveTestOrder(activeTab);
                  await loadData();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${T.green}`,
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: T.green,
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
                title="Punch a real live test order right now to see the column update dynamically"
              >
                <Add20Regular style={{ width: 14, height: 14 }} />
                <span>+ Test Live Order</span>
              </button>

              {/* Clear demo data button if demo orders exist */}
              {hasDemoOrders ? (
                <button
                  type="button"
                  onClick={async () => {
                    await clearDashboardSeedOrders();
                    await loadData();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    color: '#EF4444',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Remove all pre-generated demo orders and show only real POS sales"
                >
                  <Delete20Regular style={{ width: 13, height: 13 }} />
                  <span>Clear Demo Data</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.removeItem('omnipos_demo_orders_cleared');
                    await ensureDashboardSeedOrders(true);
                    await loadData();
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: `1px solid ${T.cardBorder}`,
                    backgroundColor: 'transparent',
                    color: T.textMuted,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Reload sample demonstration orders"
                >
                  Load Sample Data
                </button>
              )}

              {/* Peak indicator tags */}
              {activeTab === 'fastfood' && (
                <>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: isDark ? '#27272A' : '#F1F5F9', color: T.amber, fontWeight: 700 }}>
                    ☀️ Lunch (1 - 3 PM)
                  </span>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: isDark ? '#27272A' : '#F1F5F9', color: T.red, fontWeight: 700 }}>
                    🌙 Dinner (8 - 11 PM)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* SVG Canvas for Professional Column Chart */}
          <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
            <svg
              viewBox={`0 0 ${columnChart.width} ${columnChart.height}`}
              style={{ width: '100%', height: '240px', display: 'block' }}
            >
              <defs>
                {/* Standard Laser Red Bar Gradient */}
                <linearGradient id="laserBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF334B" />
                  <stop offset="50%" stopColor="#E51937" />
                  <stop offset="100%" stopColor="#8A0C1D" />
                </linearGradient>

                {/* Peak Rush Amber/Fire Gradient */}
                <linearGradient id="peakRushGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="40%" stopColor="#EF4444" />
                  <stop offset="100%" stopColor="#7F0916" />
                </linearGradient>

                {/* Hovered Bar Bright Laser Gradient */}
                <linearGradient id="hoverBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="25%" stopColor="#FF4D63" />
                  <stop offset="100%" stopColor="#B91C1C" />
                </linearGradient>

                {/* Subtle Grid Pattern */}
                <pattern id="gridPattern" width="60" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} strokeWidth="1" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect x="0" y="0" width={columnChart.width} height={columnChart.height} fill="url(#gridPattern)" />

              {/* Y-Axis Horizontal Dashed Reference Gridlines */}
              {columnChart.yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={columnChart.padLeft}
                    y1={tick.y}
                    x2={columnChart.width - columnChart.padRight}
                    y2={tick.y}
                    stroke={idx === 0 ? (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.14)') : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')}
                    strokeDasharray={idx === 0 ? 'none' : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={columnChart.padLeft - 8}
                    y={tick.y + 3.5}
                    textAnchor="end"
                    fill={T.textMuted}
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {tick.val}
                  </text>
                </g>
              ))}

              {/* Column Bars & Hover Tracks */}
              {columnChart.columns.map((col) => {
                const isHovered = hoveredHour === col.hour;
                return (
                  <g
                    key={col.hour}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedHourDetails(col)}
                    onMouseEnter={() => setHoveredHour(col.hour)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {/* Background Column Track (Translucent full-height pillar) */}
                    <rect
                      x={col.trackX}
                      y={columnChart.padTop}
                      width={col.trackW}
                      height={columnChart.chartH}
                      rx="6"
                      fill={isHovered ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : 'transparent'}
                      style={{ transition: 'fill 0.15s ease' }}
                    />

                    {/* Active Column Bar */}
                    {col.orders > 0 && (
                      <g>
                        <rect
                          x={col.barX}
                          y={col.barY}
                          width={col.barWidth}
                          height={col.barH}
                          rx="5"
                          fill={isHovered ? 'url(#hoverBarGrad)' : col.isPeak ? 'url(#peakRushGrad)' : 'url(#laserBarGrad)'}
                          style={{
                            filter: isHovered
                              ? `drop-shadow(0 0 12px ${T.red})`
                              : col.isPeak
                              ? `drop-shadow(0 0 8px ${T.redGlow})`
                              : `drop-shadow(0 2px 6px rgba(229, 25, 55, 0.3))`,
                            transition: 'all 0.15s ease',
                          }}
                        />

                        {/* Top Glowing Edge Cap (Pill) */}
                        <rect
                          x={col.barX + 2}
                          y={col.barY}
                          width={col.barWidth - 4}
                          height="2.5"
                          rx="1.25"
                          fill="#FFFFFF"
                          opacity={isHovered ? 0.95 : col.isPeak ? 0.75 : 0.55}
                        />

                        {/* Exact Orders Number on top of column */}
                        <text
                          x={col.xCenter}
                          y={col.barY - 6}
                          textAnchor="middle"
                          fill={isHovered ? '#FFFFFF' : col.isPeak ? '#F59E0B' : T.textSecondary}
                          fontSize="10.5"
                          fontWeight={isHovered || col.isPeak ? 900 : 700}
                        >
                          {col.orders}
                        </text>
                      </g>
                    )}

                    {/* Zero orders indicator */}
                    {col.orders === 0 && (
                      <circle
                        cx={col.xCenter}
                        cy={columnChart.padTop + columnChart.chartH - 2}
                        r="2"
                        fill={T.textMuted}
                      />
                    )}

                    {/* X-Axis Hour Label */}
                    <text
                      x={col.xCenter}
                      y={columnChart.height - 12}
                      textAnchor="middle"
                      fill={isHovered ? T.textPrimary : col.isCurrentHour ? T.green : col.isPeak ? T.red : T.textMuted}
                      fontSize="10"
                      fontWeight={isHovered || col.isPeak || col.isCurrentHour ? 800 : 600}
                    >
                      {col.label}
                    </text>

                    {/* Current Hour Indicator Tag */}
                    {col.isCurrentHour && (
                      <circle
                        cx={col.xCenter}
                        cy={columnChart.height - 4}
                        r="2.5"
                        fill={T.green}
                        style={{ filter: `drop-shadow(0 0 4px ${T.green})` }}
                      />
                    )}

                    {/* Peak Dot indicator below label */}
                    {!col.isCurrentHour && col.isPeak && (
                      <circle
                        cx={col.xCenter}
                        cy={columnChart.height - 4}
                        r="2"
                        fill={col.hour >= 20 ? T.red : T.amber}
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Floating Glassmorphic Tooltip on Hover */}
            {hoveredHour !== null && (
              (() => {
                const col = columnChart.columns.find((c) => c.hour === hoveredHour);
                if (!col) return null;
                const leftPos = Math.min(Math.max(col.xCenter - 75, 10), columnChart.width - 170);
                const aov = col.orders > 0 ? Math.round(col.revenue / col.orders) : 0;
                return (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(leftPos / columnChart.width) * 100}%`,
                      top: '10px',
                      backgroundColor: isDark ? 'rgba(20, 22, 27, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                      backdropFilter: 'blur(14px)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${col.isPeak ? T.red : 'rgba(255,255,255,0.18)'}`,
                      boxShadow: `0 10px 28px rgba(0,0,0,0.45), 0 0 14px ${T.redGlow}`,
                      pointerEvents: 'none',
                      zIndex: 20,
                      minWidth: '150px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: T.textSecondary }}>
                        {col.label} Slot
                      </span>
                      {col.isPeak && (
                        <span style={{ fontSize: '10px', fontWeight: 800, color: col.hour >= 20 ? T.red : T.amber }}>
                          {col.hour >= 20 ? '🌙 Dinner' : '☀️ Lunch'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: T.textPrimary, marginTop: '3px' }}>
                      {col.orders} Orders
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '11.5px' }}>
                      <span style={{ color: T.textMuted }}>Sales:</span>
                      <span style={{ fontWeight: 800, color: T.green }}>
                        PKR {col.revenue.toLocaleString()}
                      </span>
                    </div>
                    {col.orders > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '11px' }}>
                        <span style={{ color: T.textMuted }}>Avg Ticket:</span>
                        <span style={{ fontWeight: 700, color: T.textPrimary }}>
                          PKR {aov.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>

        {/* ── Right Chart: Order Type Distribution Donut Ring ── */}
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: '14px',
            border: `1px solid ${T.cardBorder}`,
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                {activeTab === 'fastfood' ? 'Order Types Breakdown' : 'Payment Methods'}
              </h3>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: T.textSecondary }}>
              Dine-In, Takeaway, and Delivery orders
            </p>
          </div>

          {/* SVG Circular Donut Chart */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '14px 0' }}>
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Track */}
              <circle cx="90" cy="90" r="70" fill="none" stroke={isDark ? '#27272A' : '#E2E8F0'} strokeWidth="18" />

              {/* Segment 1: Dine-In (Red) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke={T.red}
                strokeWidth="18"
                strokeDasharray={`${donutData.stroke1} ${donutData.C}`}
                strokeDashoffset={donutData.offset1}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 8px ${T.redGlow})` }}
              />

              {/* Segment 2: Takeaway (Amber) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke={T.amber}
                strokeWidth="18"
                strokeDasharray={`${donutData.stroke2} ${donutData.C}`}
                strokeDashoffset={donutData.offset2}
                strokeLinecap="round"
              />

              {/* Segment 3: Delivery (Green) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke={T.green}
                strokeWidth="18"
                strokeDasharray={`${donutData.stroke3} ${donutData.C}`}
                strokeDashoffset={donutData.offset3}
                strokeLinecap="round"
              />
            </svg>

            {/* Center Label */}
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '24px', fontWeight: 900, color: T.textPrimary, lineHeight: 1 }}>
                {metrics.totalOrders}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: T.textMuted, marginTop: '2px' }}>
                Total Tickets
              </span>
            </div>
          </div>

          {/* Legends */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: T.red, boxShadow: `0 0 6px ${T.red}` }} />
                <span style={{ fontWeight: 700 }}>Dine-In</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800 }}>{metrics.dineInCount}</span>
                <span style={{ color: T.textMuted }}>({donutData.dineInPct}%)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: T.amber, boxShadow: `0 0 6px ${T.amber}` }} />
                <span style={{ fontWeight: 700 }}>Takeaway</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800 }}>{metrics.takeawayCount}</span>
                <span style={{ color: T.textMuted }}>({donutData.takeawayPct}%)</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: T.green, boxShadow: `0 0 6px ${T.green}` }} />
                <span style={{ fontWeight: 700 }}>Online Delivery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800 }}>{metrics.deliveryCount}</span>
                <span style={{ color: T.textMuted }}>({donutData.deliveryPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          LOWER SECTION: LIVE KITCHEN PIPELINE & TOP SELLERS LEADERBOARD
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* ── Live Kitchen Display Status / KOT Pipeline ── */}
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: '14px',
            border: `1px solid ${T.cardBorder}`,
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                Live Kitchen Orders (KOT)
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: T.amber,
                }}
              >
                {metrics.inKitchenCount} In Kitchen
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/kitchen')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                color: T.textPrimary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>Open Kitchen</span>
              <Open20Regular style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Pipeline stages */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {/* Stage 1: Received / Queued */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                borderRadius: '10px',
                padding: '12px',
                border: `1px solid ${T.cardBorder}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.blue, fontSize: '12px', fontWeight: 800 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: T.blue }} />
                <span>Queued (KOT)</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, marginTop: '8px' }}>
                {Math.max(1, Math.floor(metrics.inKitchenCount / 2))}
              </div>
              <span style={{ fontSize: '11px', color: T.textMuted }}>Avg wait: 2 mins</span>
            </div>

            {/* Stage 2: Cooking on Grill / Fryer */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(245, 158, 11, 0.05)' : '#FFFBEB',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.amber, fontSize: '12px', fontWeight: 800 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: T.amber }} />
                <span>Cooking / Grill</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: T.amber, marginTop: '8px' }}>
                {metrics.inKitchenCount}
              </div>
              <span style={{ fontSize: '11px', color: T.textMuted }}>Avg prep: 8.5 mins</span>
            </div>

            {/* Stage 3: Ready for Pickup */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#F0FDF4',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: T.green, fontSize: '12px', fontWeight: 800 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: T.green }} />
                <span>Ready to Serve</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: T.green, marginTop: '8px' }}>
                {metrics.readyCount || 2}
              </div>
              <span style={{ fontSize: '11px', color: T.textMuted }}>Tokens on counter</span>
            </div>
          </div>

          {/* Quick Critical Ingredient Inventory Notice */}
          <div
            style={{
              marginTop: '4px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: isDark ? 'rgba(229, 25, 55, 0.06)' : '#FFF1F2',
              border: '1px solid rgba(229, 25, 55, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertUrgent20Filled style={{ color: T.red, width: 18, height: 18 }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: T.textPrimary }}>
                  Kitchen Prep Inventory Notice
                </div>
                <div style={{ fontSize: '11px', color: T.textMuted }}>
                  Burger Buns (35 left) • Cooking Oil (Sufficient) • Mozzarella Cheese (Good)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/inventory/dashboard')}
              style={{
                padding: '5px 10px',
                borderRadius: '5px',
                border: `1px solid ${T.red}`,
                backgroundColor: 'transparent',
                color: T.red,
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Restock Hub
            </button>
          </div>
        </div>

        {/* ── Top 5 Bestsellers Podium / Ranking ── */}
        <div
          style={{
            backgroundColor: T.cardBg,
            borderRadius: '14px',
            border: `1px solid ${T.cardBorder}`,
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                {activeTab === 'fastfood' ? 'Top 5 Best Selling Items' : 'Top 5 Selling Products'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: T.textSecondary }}>
                Most ordered items
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(activeTab === 'fastfood' ? '/pos/fastfood' : '/pos/omnimart')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: T.red,
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Open POS
            </button>
          </div>

          {/* Ranked items list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {metrics.topItems.map((item, idx) => {
              const maxQty = metrics.topItems[0]?.qty || 1;
              const barWidth = Math.round((item.qty / maxQty) * 100);
              const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

              return (
                <div
                  key={item.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                    border: `1px solid ${T.cardBorder}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 900, minWidth: '22px' }}>{rankMedal}</span>
                      {item.img && (
                        <img
                          src={item.img}
                          alt={item.name}
                          style={{ width: 26, height: 26, borderRadius: '5px', objectFit: 'cover' }}
                        />
                      )}
                      <span style={{ fontSize: '12.5px', fontWeight: 800, color: T.textPrimary }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: T.textPrimary }}>
                        {item.qty} sold
                      </span>
                      <span style={{ fontSize: '11px', color: T.green, fontWeight: 700 }}>
                        PKR {item.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Gradient progress meter */}
                  <div style={{ width: '100%', height: '4px', borderRadius: '2px', backgroundColor: isDark ? '#27272A' : '#E2E8F0', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        borderRadius: '2px',
                        backgroundColor: idx === 0 ? T.red : idx === 1 ? T.amber : T.blue,
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Modal: Detailed Order Tickets Breakdown for Clicked Hour ── */}
      {selectedHourDetails && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setSelectedHourDetails(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: T.cardBg,
              borderRadius: '14px',
              border: `1px solid ${T.cardBorder}`,
              width: '100%',
              maxWidth: '560px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${T.cardBorder}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: T.textPrimary }}>
                    {selectedHourDetails.label} Orders Breakdown
                  </h3>
                  {selectedHourDetails.isCurrentHour && (
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', backgroundColor: T.green, color: '#FFF', fontWeight: 800 }}>
                      CURRENT HOUR
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: T.textSecondary, marginTop: '2px' }}>
                  {selectedHourDetails.orders} Orders • Total Sales: <strong style={{ color: T.green }}>PKR {selectedHourDetails.revenue.toLocaleString()}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHourDetails(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: T.textSecondary,
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <Dismiss20Regular style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Modal Order Tickets List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedHourDetails.hourOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: T.textMuted, fontSize: '13px' }}>
                  No orders recorded during this hour.
                </div>
              ) : (
                selectedHourDetails.hourOrders.map((ord) => {
                  const ordTotal = ord.lines.reduce((s, l) => s + (l.unitPrice || 0) * (l.quantity || 1), 0);
                  const timeStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={ord.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                        border: `1px solid ${T.cardBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: T.textPrimary }}>
                            #{ord.id.slice(-6).toUpperCase()}
                          </span>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '1px 6px', borderRadius: '4px', backgroundColor: isDark ? '#27272A' : '#E2E8F0', color: T.textSecondary, fontWeight: 700 }}>
                            {ord.orderType || 'takeaway'}
                          </span>
                          {ord.tokenNo && (
                            <span style={{ fontSize: '11px', color: T.amber, fontWeight: 800 }}>
                              Token #{ord.tokenNo}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11.5px', color: T.textMuted }}>{timeStr}</span>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: T.green }}>
                            PKR {ordTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Items summary */}
                      <div style={{ fontSize: '11.5px', color: T.textSecondary }}>
                        {ord.lines.map((l) => `${l.quantity}x ${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ''}`).join(', ')}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
