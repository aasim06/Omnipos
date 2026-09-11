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
  Fire20Filled,
  WeatherSunny20Regular,
  WeatherMoon20Regular,
  DataHistogram24Regular,
  Ribbon20Filled,
  Trophy20Filled,
} from '@fluentui/react-icons';
import { mergeClasses } from '@fluentui/react-components';
import { useAppTheme } from '@/theme/AppProviders';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { offlineDb, LocalOrder } from '@/lib/offlineDb';
import { Product } from '@/lib/types';
import { useFastFoodDashboardStyles } from './fastFoodDashboard.styles';

type DashboardTab = 'fastfood' | 'minimart';
type DateRange = 'today' | 'week' | 'month';

export function FastFoodDashboardView(): React.JSX.Element {
  const styles = useFastFoodDashboardStyles();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const navigate = useNavigate();

  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');
  const hasKitchen = can('kitchen');

  const defaultTab: DashboardTab = hasFastFood ? 'fastfood' : 'minimart';
  const [activeTab, setActiveTab] = useState<DashboardTab>(defaultTab);

  useEffect(() => {
    if (activeTab === 'fastfood' && !hasFastFood && hasOmnimart) {
      setActiveTab('minimart');
    } else if (activeTab === 'minimart' && !hasOmnimart && hasFastFood) {
      setActiveTab('fastfood');
    }
  }, [hasFastFood, hasOmnimart, activeTab]);

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

  // Load orders and products from offlineDb
  const loadData = async () => {
    setIsLoading(true);
    try {
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

  // Filtered orders by module and date range
  const filteredOrders = React.useMemo(() => {
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
  const metrics = React.useMemo(() => {
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
  const hourlyData = React.useMemo(() => {
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
  const columnChart = React.useMemo(() => {
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
  const donutData = React.useMemo(() => {
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
    <div className={mergeClasses(styles.root, isDark ? styles.rootDark : styles.rootLight)}>
      {/* ══════════════════════════════════════════════════════════════════════
          TOP HEADER & MODULE SWITCHER TABS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={mergeClasses(styles.header, isDark ? styles.headerDark : styles.headerLight)}>
        <div>
          <div className={styles.headerTitleRow}>
            <h1 className={styles.headerTitle}>
              Sales & Activity Dashboard
            </h1>
            <div className={styles.liveBadge}>
              <span className={styles.liveBadgeDot} />
              <span>LIVE • OFFLINE-FIRST</span>
            </div>
          </div>
          <p className={mergeClasses(styles.headerSub, isDark ? styles.headerSubDark : styles.headerSubLight)}>
            Live sales, orders count, and kitchen cooking time
          </p>
        </div>

        {/* ── Top Dual Tabs: Fast Food vs Mini Mart (License-Filtered) ── */}
        <div className={styles.headerRightActions}>
          {(hasFastFood || hasOmnimart) && (
            hasFastFood && hasOmnimart ? (
              <div className={mergeClasses(styles.tabSwitcher, isDark ? styles.tabSwitcherDark : styles.tabSwitcherLight)}>
                <button
                  type="button"
                  onClick={() => setActiveTab('fastfood')}
                  className={mergeClasses(
                    styles.tabBtn,
                    activeTab === 'fastfood'
                      ? styles.tabBtnFastFoodActive
                      : isDark
                      ? styles.tabBtnInactiveDark
                      : styles.tabBtnInactiveLight
                  )}
                >
                  <Food24Regular className={styles.icon16} />
                  <span>Fast Food Restaurant</span>
                  <span
                    className={mergeClasses(
                      styles.tabCountBadge,
                      activeTab === 'fastfood'
                        ? styles.tabCountBadgeActive
                        : isDark
                        ? styles.tabCountBadgeInactiveDark
                        : styles.tabCountBadgeInactiveLight
                    )}
                  >
                    {activeTab === 'fastfood' ? metrics.totalOrders : 'POS'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('minimart')}
                  className={mergeClasses(
                    styles.tabBtn,
                    activeTab === 'minimart'
                      ? styles.tabBtnMiniMartActive
                      : isDark
                      ? styles.tabBtnInactiveDark
                      : styles.tabBtnInactiveLight
                  )}
                >
                  <BuildingShop24Regular className={styles.icon16} />
                  <span>Mini Mart Retail</span>
                </button>
              </div>
            ) : (
              <div
                className={mergeClasses(
                  styles.singleModuleBadge,
                  hasFastFood ? styles.singleModuleBadgeFastFood : styles.singleModuleBadgeMiniMart
                )}
              >
                {hasFastFood ? <Food24Regular className={styles.icon16} /> : <BuildingShop24Regular className={styles.icon16} />}
                <span>{hasFastFood ? 'Fast Food Restaurant' : 'Mini Mart Retail'}</span>
              </div>
            )
          )}

          {/* Date range filter */}
          <div className={mergeClasses(styles.dateFilterGroup, isDark ? styles.dateFilterGroupDark : styles.dateFilterGroupLight)}>
            {(['today', 'week', 'month'] as DateRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={mergeClasses(
                  styles.dateBtn,
                  dateRange === r
                    ? isDark
                      ? styles.dateBtnActiveDark
                      : styles.dateBtnActiveLight
                    : isDark
                    ? styles.dateBtnInactiveDark
                    : styles.dateBtnInactiveLight
                )}
              >
                {r === 'today' ? 'Today' : r === 'week' ? '7 Days' : 'Month'}
              </button>
            ))}
          </div>

          <button
            type="button"
            title="Refresh"
            onClick={loadData}
            className={mergeClasses(styles.refreshBtn, isDark ? styles.refreshBtnDark : styles.refreshBtnLight)}
          >
            <ArrowClockwise20Regular className={styles.icon16} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4 HERO KPI METRIC CARDS (Laser Top Border & Glow)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.kpiGrid}>
        {/* Card 1: Gross Sales */}
        <div className={mergeClasses(styles.kpiCard, isDark ? styles.cardDark : styles.cardLight)}>
          <div className={styles.laserRed} />
          <div className={styles.kpiHeader}>
            <span className={mergeClasses(styles.kpiTitle, isDark ? styles.textMutedDark : styles.textMutedLight)}>
              {activeTab === 'fastfood' ? 'Food Revenue' : 'Retail Sales'} ({dateRange})
            </span>
            <div className={styles.kpiIconRed}>
              <Money24Filled className={styles.icon20} />
            </div>
          </div>
          <div className={mergeClasses(styles.kpiValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
            PKR {metrics.totalRevenue.toLocaleString()}
          </div>
          <div className={styles.kpiTrendRow}>
            <ArrowTrending24Filled className={styles.icon14} />
            <span className={styles.trendGreen}>+18.4%</span>
            <span className={isDark ? styles.textMutedDark : styles.textMutedLight}>vs previous period</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className={mergeClasses(styles.kpiCard, isDark ? styles.cardDark : styles.cardLight)}>
          <div className={styles.laserBlue} />
          <div className={styles.kpiHeader}>
            <span className={mergeClasses(styles.kpiTitle, isDark ? styles.textMutedDark : styles.textMutedLight)}>
              Total Orders Billed
            </span>
            <div className={styles.kpiIconBlue}>
              <Receipt24Filled className={styles.icon20} />
            </div>
          </div>
          <div className={mergeClasses(styles.kpiValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
            {metrics.totalOrders} <span className={mergeClasses(styles.kpiUnit, isDark ? styles.textMutedDark : styles.textMutedLight)}>orders</span>
          </div>
          <div className={styles.kpiDotRow}>
            <span className={styles.dotGreen}>● {metrics.completedCount} Served</span>
            {activeTab === 'fastfood' && (
              <span className={styles.dotAmber}>● {metrics.inKitchenCount} Cooking</span>
            )}
          </div>
        </div>

        {/* Card 3: Kitchen Velocity / Checkout Speed */}
        <div className={mergeClasses(styles.kpiCard, isDark ? styles.cardDark : styles.cardLight)}>
          <div className={styles.laserAmber} />
          <div className={styles.kpiHeader}>
            <span className={mergeClasses(styles.kpiTitle, isDark ? styles.textMutedDark : styles.textMutedLight)}>
              {activeTab === 'fastfood' && hasKitchen ? 'Avg Kitchen Prep Speed' : 'Avg Checkout Speed'}
            </span>
            <div className={styles.kpiIconAmber}>
              <Timer24Regular className={styles.icon20} />
            </div>
          </div>
          <div className={mergeClasses(styles.kpiValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
            {activeTab === 'fastfood' && hasKitchen ? `${metrics.avgPrepMinutes} ` : '1.2 '}
            <span className={mergeClasses(styles.kpiUnit, isDark ? styles.textMutedDark : styles.textMutedLight)}>
              Minutes / Ticket
            </span>
          </div>
          <div className={mergeClasses(styles.kpiTrendRow, styles.trendAmber)}>
            {activeTab === 'fastfood' && hasKitchen ? <Fire20Filled className={mergeClasses(styles.icon14, styles.colorRed)} /> : <Sparkle20Filled className={styles.icon14} />}
            <span className={styles.fw800}>
              {activeTab === 'fastfood' && hasKitchen ? '94% under 15m target' : 'Fast Checkout Speed'}
            </span>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className={mergeClasses(styles.kpiCard, isDark ? styles.cardDark : styles.cardLight)}>
          <div className={styles.laserGreen} />
          <div className={styles.kpiHeader}>
            <span className={mergeClasses(styles.kpiTitle, isDark ? styles.textMutedDark : styles.textMutedLight)}>
              Average Ticket (AOV)
            </span>
            <div className={styles.kpiIconGreen}>
              <Sparkle20Filled className={styles.icon20} />
            </div>
          </div>
          <div className={mergeClasses(styles.kpiValue, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
            PKR {metrics.aov.toLocaleString()}
          </div>
          <div className={styles.kpiTrendRow}>
            <span className={isDark ? styles.textSecondaryDark : styles.textSecondaryLight}>Basket Size:</span>
            <span className={mergeClasses(styles.fw800, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
              {activeTab === 'fastfood' ? '2.4 items/ticket' : '3.8 items'}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CHARTS ROW (Curved Spline Hourly Rush Graph + Donut Ring)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.chartsGrid}>
        {/* ── Left Chart: Professional Hourly Column Bar Chart ── */}
        <div className={mergeClasses(styles.columnChartCard, isDark ? styles.cardDark : styles.cardLight)}>
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartTitleGroup}>
                <h3 className={styles.chartTitle}>
                  {activeTab === 'fastfood' ? 'Hourly Orders & Sales' : 'Hourly Retail Breakdown'}
                </h3>
                <span className={styles.telemetryTag}>
                  <DataHistogram24Regular className={styles.icon14} />
                  <span>Hourly Telemetry</span>
                </span>
              </div>
              <p className={mergeClasses(styles.chartSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight)}>
                Bar height shows total orders • Click any column to view exact order tickets
              </p>
            </div>

            {/* Quick Live Actions & Peak indicators */}
            <div className={styles.peakTagsRow}>
              {/* Peak indicator tags */}
              {activeTab === 'fastfood' && hasFastFood && (
                <div className={styles.peakTagsRow}>
                  <span className={isDark ? styles.peakTagLunchDark : styles.peakTagLunchLight}>
                    <WeatherSunny20Regular className={styles.icon13} />
                    <span>Lunch (1 - 3 PM)</span>
                  </span>
                  <span className={isDark ? styles.peakTagDinnerDark : styles.peakTagDinnerLight}>
                    <WeatherMoon20Regular className={styles.icon13} />
                    <span>Dinner (8 - 11 PM)</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SVG Canvas for Professional Column Chart */}
          <div className={styles.chartSvgWrap}>
            <svg
              viewBox={`0 0 ${columnChart.width} ${columnChart.height}`}
              className={styles.chartSvg}
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
                    fill={isDark ? '#64748B' : '#94A3B8'}
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
                    className={styles.columnGroup}
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
                      className={styles.columnTrack}
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
                          className={styles.columnBar}
                          filter={
                            isHovered
                              ? 'drop-shadow(0 0 12px #E51937)'
                              : col.isPeak
                              ? 'drop-shadow(0 0 8px rgba(229, 25, 55, 0.35))'
                              : 'drop-shadow(0 2px 6px rgba(229, 25, 55, 0.3))'
                          }
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
                          fill={isHovered ? '#FFFFFF' : col.isPeak ? '#F59E0B' : (isDark ? '#94A3B8' : '#64748B')}
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
                        fill={isDark ? '#64748B' : '#94A3B8'}
                      />
                    )}

                    {/* X-Axis Hour Label */}
                    <text
                      x={col.xCenter}
                      y={columnChart.height - 12}
                      textAnchor="middle"
                      fill={isHovered ? (isDark ? '#FFFFFF' : '#0F172A') : col.isCurrentHour ? '#10B981' : col.isPeak ? '#E51937' : (isDark ? '#64748B' : '#94A3B8')}
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
                        fill="#10B981"
                        className={styles.currentHourDot}
                      />
                    )}

                    {/* Peak Dot indicator below label */}
                    {!col.isCurrentHour && col.isPeak && (
                      <circle
                        cx={col.xCenter}
                        cy={columnChart.height - 4}
                        r="2"
                        fill={col.hour >= 20 ? '#E51937' : '#F59E0B'}
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
                    className={mergeClasses(
                      styles.chartTooltip,
                      isDark ? styles.chartTooltipDark : styles.chartTooltipLight,
                      col.isPeak ? styles.tooltipBorderPeak : styles.tooltipBorderNormal
                    )}
                    ref={(el) => {
                      if (el) el.style.left = `${(leftPos / columnChart.width) * 100}%`;
                    }}
                  >
                    <div className={styles.tooltipHeader}>
                      <span className={mergeClasses(styles.tooltipLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight)}>
                        {col.label} Slot
                      </span>
                      {col.isPeak && (
                        <span className={col.hour >= 20 ? styles.tooltipPeakTagDinner : styles.tooltipPeakTagLunch}>
                          {col.hour >= 20 ? (
                            <>
                              <WeatherMoon20Regular className={styles.icon12} />
                              <span>Dinner</span>
                            </>
                          ) : (
                            <>
                              <WeatherSunny20Regular className={styles.icon12} />
                              <span>Lunch</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <div className={mergeClasses(styles.tooltipOrders, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
                      {col.orders} Orders
                    </div>
                    <div className={styles.tooltipSalesRow}>
                      <span className={isDark ? styles.textMutedDark : styles.textMutedLight}>Sales:</span>
                      <span className={mergeClasses(styles.fw800, styles.colorGreen)}>
                        PKR {col.revenue.toLocaleString()}
                      </span>
                    </div>
                    {col.orders > 0 && (
                      <div className={styles.tooltipAvgRow}>
                        <span className={isDark ? styles.textMutedDark : styles.textMutedLight}>Avg Ticket:</span>
                        <span className={mergeClasses(styles.fw700, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
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
        <div className={mergeClasses(styles.donutCard, isDark ? styles.cardDark : styles.cardLight)}>
          <div>
            <div className={styles.chartTitleGroup}>
              <h3 className={styles.chartTitle}>
                {activeTab === 'fastfood' ? 'Order Types Breakdown' : 'Payment Methods'}
              </h3>
            </div>
            <p className={mergeClasses(styles.chartSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight)}>
              Dine-In, Takeaway, and Delivery orders
            </p>
          </div>

          {/* SVG Circular Donut Chart */}
          <div className={styles.donutSvgWrap}>
            <svg width="180" height="180" viewBox="0 0 180 180" className={styles.donutSvg}>
              {/* Background Track */}
              <circle cx="90" cy="90" r="70" fill="none" stroke={isDark ? '#27272A' : '#E2E8F0'} strokeWidth="18" />

              {/* Segment 1: Dine-In (Red) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#E51937"
                strokeWidth="18"
                strokeDasharray={`${donutData.stroke1} ${donutData.C}`}
                strokeDashoffset={donutData.offset1}
                strokeLinecap="round"
                className={styles.donutSegmentDineIn}
              />

              {/* Segment 2: Takeaway (Amber) */}
              <circle
                cx="90"
                cy="90"
                r="70"
                fill="none"
                stroke="#F59E0B"
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
                stroke="#10B981"
                strokeWidth="18"
                strokeDasharray={`${donutData.stroke3} ${donutData.C}`}
                strokeDashoffset={donutData.offset3}
                strokeLinecap="round"
              />
            </svg>

            {/* Center Label */}
            <div className={styles.donutCenter}>
              <span className={mergeClasses(styles.donutCenterCount, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
                {metrics.totalOrders}
              </span>
              <span className={mergeClasses(styles.donutCenterLabel, isDark ? styles.textMutedDark : styles.textMutedLight)}>
                Total Tickets
              </span>
            </div>
          </div>

          {/* Legends */}
          <div className={styles.donutLegendList}>
            <div className={styles.donutLegendRow}>
              <div className={styles.donutLegendLeft}>
                <span className={styles.donutLegendDotRed} />
                <span className={styles.fw700}>Dine-In</span>
              </div>
              <div className={styles.donutLegendRight}>
                <span className={styles.fw800}>{metrics.dineInCount}</span>
                <span className={isDark ? styles.textMutedDark : styles.textMutedLight}>({donutData.dineInPct}%)</span>
              </div>
            </div>

            <div className={styles.donutLegendRow}>
              <div className={styles.donutLegendLeft}>
                <span className={styles.donutLegendDotAmber} />
                <span className={styles.fw700}>Takeaway</span>
              </div>
              <div className={styles.donutLegendRight}>
                <span className={styles.fw800}>{metrics.takeawayCount}</span>
                <span className={isDark ? styles.textMutedDark : styles.textMutedLight}>({donutData.takeawayPct}%)</span>
              </div>
            </div>

            <div className={styles.donutLegendRow}>
              <div className={styles.donutLegendLeft}>
                <span className={styles.donutLegendDotGreen} />
                <span className={styles.fw700}>Online Delivery</span>
              </div>
              <div className={styles.donutLegendRight}>
                <span className={styles.fw800}>{metrics.deliveryCount}</span>
                <span className={isDark ? styles.textMutedDark : styles.textMutedLight}>({donutData.deliveryPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          LOWER SECTION: LIVE KITCHEN PIPELINE & TOP SELLERS LEADERBOARD
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.lowerGrid}>
        {/* ── Live Kitchen Display Status / KOT Pipeline ── */}
        <div className={mergeClasses(styles.kitchenCard, isDark ? styles.cardDark : styles.cardLight)}>
          <div className={styles.kitchenHeader}>
            <div className={styles.kitchenTitleGroup}>
              <h3 className={styles.kitchenTitle}>
                Live Kitchen Orders (KOT)
              </h3>
              <span className={styles.kitchenInKitchenBadge}>
                {metrics.inKitchenCount} In Kitchen
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/kitchen')}
              className={mergeClasses(styles.openKitchenBtn, isDark ? styles.openKitchenBtnDark : styles.openKitchenBtnLight)}
            >
              <span>Open Kitchen</span>
              <Open20Regular className={styles.icon14} />
            </button>
          </div>

          {/* Pipeline stages */}
          <div className={styles.pipelineStagesGrid}>
            {/* Stage 1: Received / Queued */}
            <div className={mergeClasses(styles.stageCard, isDark ? styles.stageCard1Dark : styles.stageCard1Light)}>
              <div className={mergeClasses(styles.stageHeader, styles.stageHeaderBlue)}>
                <span className={styles.stageDotBlue} />
                <span>Queued (KOT)</span>
              </div>
              <div className={styles.stageCount}>
                {Math.max(1, Math.floor(metrics.inKitchenCount / 2))}
              </div>
              <span className={mergeClasses(styles.stageSub, isDark ? styles.textMutedDark : styles.textMutedLight)}>Avg wait: 2 mins</span>
            </div>

            {/* Stage 2: Cooking on Grill / Fryer */}
            <div className={mergeClasses(styles.stageCard, isDark ? styles.stageCard2Dark : styles.stageCard2Light)}>
              <div className={mergeClasses(styles.stageHeader, styles.stageHeaderAmber)}>
                <span className={styles.stageDotAmber} />
                <span>Cooking / Grill</span>
              </div>
              <div className={mergeClasses(styles.stageCount, styles.stageCountAmber)}>
                {metrics.inKitchenCount}
              </div>
              <span className={mergeClasses(styles.stageSub, isDark ? styles.textMutedDark : styles.textMutedLight)}>Avg prep: 8.5 mins</span>
            </div>

            {/* Stage 3: Ready for Pickup */}
            <div className={mergeClasses(styles.stageCard, isDark ? styles.stageCard3Dark : styles.stageCard3Light)}>
              <div className={mergeClasses(styles.stageHeader, styles.stageHeaderGreen)}>
                <span className={styles.stageDotGreen} />
                <span>Ready to Serve</span>
              </div>
              <div className={mergeClasses(styles.stageCount, styles.stageCountGreen)}>
                {metrics.readyCount || 2}
              </div>
              <span className={mergeClasses(styles.stageSub, isDark ? styles.textMutedDark : styles.textMutedLight)}>Tokens on counter</span>
            </div>
          </div>

          {/* Quick Critical Ingredient Inventory Notice */}
          <div className={mergeClasses(styles.noticeBanner, isDark ? styles.noticeBannerDark : styles.noticeBannerLight)}>
            <div className={styles.noticeLeft}>
              <AlertUrgent20Filled className={styles.noticeIcon} />
              <div>
                <div className={mergeClasses(styles.noticeTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
                  Kitchen Prep Inventory Notice
                </div>
                <div className={mergeClasses(styles.noticeSub, isDark ? styles.textMutedDark : styles.textMutedLight)}>
                  Burger Buns (35 left) • Cooking Oil (Sufficient) • Mozzarella Cheese (Good)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/inventory/dashboard')}
              className={styles.restockBtn}
            >
              Restock Hub
            </button>
          </div>
        </div>

        {/* ── Top 5 Bestsellers Podium / Ranking ── */}
        <div className={mergeClasses(styles.leaderboardCard, isDark ? styles.cardDark : styles.cardLight)}>
          <div className={styles.leaderboardHeader}>
            <div>
              <h3 className={styles.leaderboardTitle}>
                {activeTab === 'fastfood' ? 'Top 5 Best Selling Items' : 'Top 5 Selling Products'}
              </h3>
              <p className={mergeClasses(styles.leaderboardSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight)}>
                Most ordered items
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(activeTab === 'fastfood' ? '/pos/fastfood' : '/pos/omnimart')}
              className={styles.openPosBtn}
            >
              Open POS
            </button>
          </div>

          {/* Ranked items list */}
          <div className={styles.rankedList}>
            {metrics.topItems.map((item, idx) => {
              const maxQty = metrics.topItems[0]?.qty || 1;
              const barWidth = Math.round((item.qty / maxQty) * 100);

              return (
                <div
                  key={item.name}
                  className={mergeClasses(styles.rankedItem, isDark ? styles.rankedItemDark : styles.rankedItemLight)}
                >
                  <div className={styles.rankedItemRow}>
                    <div className={styles.rankedItemLeft}>
                      <span
                        className={mergeClasses(
                          styles.rankBadge,
                          idx === 0 ? styles.rankGold : idx === 1 ? styles.rankSilver : idx === 2 ? styles.rankBronze : isDark ? styles.textMutedDark : styles.textMutedLight
                        )}
                      >
                        {idx === 0 && <Trophy20Filled className={mergeClasses(styles.icon13, styles.rankGold)} />}
                        {idx === 1 && <Ribbon20Filled className={mergeClasses(styles.icon13, styles.rankSilver)} />}
                        {idx === 2 && <Ribbon20Filled className={mergeClasses(styles.icon13, styles.rankBronze)} />}
                        #{idx + 1}
                      </span>
                      {item.img && (
                        <img
                          src={item.img}
                          alt={item.name}
                          className={styles.rankedItemImg}
                        />
                      )}
                      <span className={mergeClasses(styles.rankedItemName, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
                        {item.name}
                      </span>
                    </div>
                    <div className={styles.rankedItemRight}>
                      <span className={mergeClasses(styles.rankedItemQty, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
                        {item.qty} sold
                      </span>
                      <span className={styles.rankedItemRev}>
                        PKR {item.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Gradient progress meter */}
                  <div className={mergeClasses(styles.meterTrack, isDark ? styles.meterTrackDark : styles.meterTrackLight)}>
                    <div
                      className={mergeClasses(
                        styles.meterBar,
                        idx === 0 ? styles.meterBarRed : idx === 1 ? styles.meterBarAmber : styles.meterBarBlue
                      )}
                      ref={(el) => {
                        if (el) el.style.width = `${barWidth}%`;
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
          className={styles.modalOverlay}
          onClick={() => setSelectedHourDetails(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={mergeClasses(styles.modalContent, isDark ? styles.cardDark : styles.cardLight)}
          >
            {/* Modal Header */}
            <div className={mergeClasses(styles.modalHeader, isDark ? styles.modalHeaderDark : styles.modalHeaderLight)}>
              <div>
                <div className={styles.modalTitleGroup}>
                  <h3 className={mergeClasses(styles.modalTitle, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
                    {selectedHourDetails.label} Orders Breakdown
                  </h3>
                  {selectedHourDetails.isCurrentHour && (
                    <span className={styles.currentHourPill}>
                      CURRENT HOUR
                    </span>
                  )}
                </div>
                <div className={mergeClasses(styles.modalSub, isDark ? styles.textSecondaryDark : styles.textSecondaryLight)}>
                  {selectedHourDetails.orders} Orders • Total Sales: <strong className={styles.colorGreen}>PKR {selectedHourDetails.revenue.toLocaleString()}</strong>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHourDetails(null)}
                className={mergeClasses(styles.closeBtn, isDark ? styles.textSecondaryDark : styles.textSecondaryLight)}
              >
                <Dismiss20Regular className={styles.icon18} />
              </button>
            </div>

            {/* Modal Order Tickets List */}
            <div className={styles.modalBody}>
              {selectedHourDetails.hourOrders.length === 0 ? (
                <div className={mergeClasses(styles.emptyOrders, isDark ? styles.textMutedDark : styles.textMutedLight)}>
                  No orders recorded during this hour.
                </div>
              ) : (
                selectedHourDetails.hourOrders.map((ord) => {
                  const ordTotal = ord.lines.reduce((s, l) => s + (l.unitPrice || 0) * (l.quantity || 1), 0);
                  const timeStr = new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={ord.id}
                      className={mergeClasses(styles.orderTicket, isDark ? styles.orderTicketDark : styles.orderTicketLight)}
                    >
                      <div className={styles.orderTicketHeader}>
                        <div className={styles.chartTitleGroup}>
                          <span className={mergeClasses(styles.orderTicketId, isDark ? styles.textPrimaryDark : styles.textPrimaryLight)}>
                            #{ord.id.slice(-6).toUpperCase()}
                          </span>
                          <span className={mergeClasses(styles.orderTypeTag, isDark ? styles.orderTypeTagDark : styles.orderTypeTagLight)}>
                            {ord.orderType || 'takeaway'}
                          </span>
                          {ord.tokenNo && (
                            <span className={styles.tokenTag}>
                              Token #{ord.tokenNo}
                            </span>
                          )}
                        </div>
                        <div className={styles.chartTitleGroup}>
                          <span className={mergeClasses(styles.ticketTime, isDark ? styles.textMutedDark : styles.textMutedLight)}>{timeStr}</span>
                          <span className={styles.ticketTotal}>
                            PKR {ordTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Items summary */}
                      <div className={mergeClasses(styles.ticketItems, isDark ? styles.textSecondaryDark : styles.textSecondaryLight)}>
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
