import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Subtitle1,
  Body1,
  Caption1,
  Badge,
  ProgressBar,
  mergeClasses,
  Button,
} from '@fluentui/react-components';
import {
  ArrowTrendingLines24Regular,
  Money24Regular,
  ShoppingBag24Regular,
  Receipt24Regular,
  ArrowClockwise20Regular,
  BuildingShop24Regular,
  ArrowCounterclockwise24Regular,
  Tag24Regular,
  Calendar20Regular,
  ArrowDownload20Regular,
  CheckmarkCircle20Filled,
  Info16Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { resolveApiUrl } from '@/lib/api';
import { offlineDb } from '@/lib/offlineDb';
import { formatPKR } from '@/lib/utils';
import { ReportsPageSkeleton } from '@/components/skeletons/PageSkeletons';

import { useReportsAnalyticsStyles, useStyles } from './reportsAnalytics.styles';

export type DateFilterType = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all' | 'custom';

function getDateRange(filter: DateFilterType, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  if (filter === 'yesterday') {
    start.setDate(start.getDate() - 1);
    const yesterdayEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59, 999);
    return { start, end: yesterdayEnd };
  } else if (filter === 'week') {
    start.setDate(start.getDate() - 7);
  } else if (filter === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (filter === 'last_month') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end: lastMonthEnd };
  } else if (filter === 'all') {
    start = new Date(2000, 0, 1);
  } else if (filter === 'custom' && customStart) {
    start = new Date(customStart + 'T00:00:00');
    const customEndDate = customEnd ? new Date(customEnd + 'T23:59:59') : end;
    return { start, end: customEndDate };
  }

  return { start, end };
}

export function ReportsAnalyticsView(): React.JSX.Element {
  const styles = useReportsAnalyticsStyles();
  const [dateFilter, setDateFilter] = useState<DateFilterType>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['analytics-report', dateFilter, customStart, customEnd],
    queryFn: async () => {
      const { start, end } = getDateRange(dateFilter, customStart, customEnd);
      const startMs = start.getTime();
      const endMs = end.getTime();

      try {
        const [localOrders, localExpenses, localRefunds, localProducts] = await Promise.all([
          offlineDb.orders.toArray(),
          offlineDb.expenses.toArray(),
          offlineDb.refunds.toArray(),
          offlineDb.products.toArray(),
        ]);

        // Build cost map from product catalog
        const costMap = new Map<string, number>();
        localProducts.forEach((p) => {
          if (typeof p.costPrice === 'number' && p.costPrice > 0) {
            costMap.set(p.id, p.costPrice);
            if (p.name) costMap.set(p.name.toLowerCase().trim(), p.costPrice);
          }
        });

        // Filter orders within date range
        const paidOrders = localOrders.filter((o) => {
          if (o.stage !== 'paid') return false;
          const t = new Date(o.createdAt).getTime();
          return t >= startMs && t <= endMs;
        });

        // Filter refunds within date range
        const filteredRefunds = localRefunds.filter((r) => {
          const t = new Date(r.createdAt).getTime();
          return t >= startMs && t <= endMs;
        });

        // Filter expenses within date range
        const filteredExpenses = localExpenses.filter((e) => {
          const t = new Date(e.date || (e as any).createdAt).getTime();
          return t >= startMs && t <= endMs;
        });

        let grossSales = 0;
        let totalDiscounts = 0;
        let totalSalesAfterDiscount = 0;
        let calculatedRealCOGS = 0;
        let totalUnitsSold = 0;
        let hasRealCostCount = 0;

        paidOrders.forEach((o) => {
          const sub = (o.lines || []).reduce((s, l) => s + (l.unitPrice || 0) * (l.quantity || 1), 0);
          grossSales += sub;
          const netOrd =
            typeof o.totalAmount === 'number' && o.totalAmount >= 0
              ? o.totalAmount
              : Math.max(0, sub - (sub * (o.discountPercent || 0)) / 100);
          totalSalesAfterDiscount += netOrd;
          totalDiscounts += Math.max(0, sub - netOrd);

          (o.lines || []).forEach((l) => {
            const q = Number(l.quantity || 1);
            totalUnitsSold += q;
            const cost = l.costPrice || costMap.get(l.productId) || costMap.get(l.name.toLowerCase().trim()) || 0;
            if (cost > 0) {
              hasRealCostCount += q;
              calculatedRealCOGS += cost * q;
            }
          });
        });

        const totalRefunds = filteredRefunds.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
        const netSales = Math.max(0, totalSalesAfterDiscount - totalRefunds);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        // If at least some items have real costPrice, use real COGS, else fallback to 45%
        const isRealCostUsed = calculatedRealCOGS > 0;
        const finalCOGS = isRealCostUsed ? Math.round(calculatedRealCOGS) : Math.round(netSales * 0.45);
        const grossProfit = Math.max(0, netSales - finalCOGS);
        const netProfit = grossProfit - totalExpenses;

        const itemMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();
        paidOrders.forEach((o) => {
          (o.lines || []).forEach((l) => {
            const key = l.productId || l.name;
            const cur = itemMap.get(key) || { name: l.name, quantity: 0, revenue: 0, profit: 0 };
            const q = Number(l.quantity || 1);
            const rev = Number(l.unitPrice || 0) * q;
            const cost = (l.costPrice || costMap.get(l.productId) || costMap.get(l.name.toLowerCase().trim()) || 0) * q;
            cur.quantity += q;
            cur.revenue += rev;
            cur.profit += rev - cost;
            itemMap.set(key, cur);
          });
        });

        const topSellingItems = Array.from(itemMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
          .map((item) => ({
            name: item.name,
            count: item.quantity,
            revenue: item.revenue,
            profit: item.profit,
          }));

        return {
          totalGrossSales: grossSales,
          totalDiscounts,
          totalRefunds,
          netSales,
          estimatedCOGS: finalCOGS,
          isRealCostUsed,
          totalExpenses,
          grossProfit,
          netProfit,
          totalOrdersCount: paidOrders.length,
          totalRefundsCount: filteredRefunds.length,
          topSellingItems,
        };
      } catch (err) {
        console.error('Failed to compute analytics report:', err);
        return null;
      }
    },
  });

  const grossSales = report?.totalGrossSales || 0;
  const totalDiscounts = report?.totalDiscounts || 0;
  const totalRefunds = report?.totalRefunds || 0;
  const netSales = report?.netSales ?? Math.max(0, grossSales - totalRefunds);
  const cogs = report?.estimatedCOGS || 0;
  const isRealCostUsed = report?.isRealCostUsed || false;
  const expenses = report?.totalExpenses || 0;
  const netProfit = report?.netProfit || 0;
  const totalOrders = report?.totalOrdersCount || 0;
  const totalRefundsCount = report?.totalRefundsCount || 0;
  const topItems = report?.topSellingItems || [];

  const netMarginPct = netSales > 0 ? Math.round((netProfit / netSales) * 100) : 0;
  const grossMarginPct = netSales > 0 ? Math.round(((netSales - cogs) / netSales) * 100) : 0;

  // Export CSV Handler
  const handleExportCsv = () => {
    const rows = [
      ['Omnipos Financial P&L Report'],
      ['Period', dateFilter.toUpperCase(), customStart ? `From ${customStart} to ${customEnd}` : ''],
      ['Generated At', new Date().toLocaleString()],
      [''],
      ['Metric', 'Amount (PKR)'],
      ['Total Gross Sales', grossSales],
      ['Total Discounts', totalDiscounts],
      ['Sales Returns & Refunds', totalRefunds],
      ['Net Realized Sales', netSales],
      [`Cost of Goods Sold (${isRealCostUsed ? 'Actual Cost' : 'Estimated'})`, cogs],
      ['Operational Expenses', expenses],
      ['Net Clean Profit', netProfit],
      ['Net Profit Margin %', `${netMarginPct}%`],
      ['Total Orders Completed', totalOrders],
      [''],
      ['Top Selling Products', 'Quantity Sold', 'Revenue (PKR)', 'Estimated Profit (PKR)'],
      ...topItems.map((item) => [item.name, item.count, item.revenue, item.profit]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Omnipos_PL_Report_${dateFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <ReportsPageSkeleton />;
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleCol}>
          <Subtitle1 as="h1" className={styles.headerTitle}>
            Profit &amp; Loss Financial Analytics
          </Subtitle1>
          <Caption1 as="p" className={styles.headerSubtitle}>
            Live revenue, sales returns/refunds, inventory cost of goods, daily expenses, and real profit margins
          </Caption1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            size="small"
            appearance="subtle"
            icon={<ArrowDownload20Regular />}
            onClick={handleExportCsv}
            title="Export summary to CSV Excel"
          >
            Export CSV
          </Button>
          <Badge appearance="tint" color={netProfit >= 0 ? 'success' : 'danger'} size="large">
            {netProfit >= 0 ? `Profitable (${netMarginPct}%)` : `Loss (${netMarginPct}%)`}
          </Badge>
        </div>
      </div>

      {/* ── Quick Date Range Filter Bar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          padding: '12px 16px',
          backgroundColor: tokens.colorNeutralBackground1,
          borderRadius: '10px',
          border: `1px solid ${tokens.colorNeutralStroke2}`,
          boxShadow: tokens.shadow2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <Calendar20Regular style={{ color: '#E51937', marginRight: '4px' }} />
          {[
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'week', label: 'Last 7 Days' },
            { key: 'month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'all', label: 'All Time' },
            { key: 'custom', label: 'Custom Range' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setDateFilter(item.key as DateFilterType)}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: `1px solid ${dateFilter === item.key ? '#E51937' : tokens.colorNeutralStroke2}`,
                backgroundColor: dateFilter === item.key ? 'rgba(229, 25, 55, 0.1)' : 'transparent',
                color: dateFilter === item.key ? '#E51937' : tokens.colorNeutralForeground1,
                fontSize: '12px',
                fontWeight: dateFilter === item.key ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                fontSize: '12px',
              }}
            />
            <span style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                fontSize: '12px',
              }}
            />
          </div>
        )}
      </div>

      {/* P&L Statement Grid */}
      <div className={styles.pnlGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <ShoppingBag24Regular className={styles.salesIcon} />
            <Caption1 className={styles.metricLabel}>Total Gross Sales</Caption1>
          </div>
          <Subtitle1 className={styles.salesValue}>{formatPKR(grossSales)}</Subtitle1>
          <Caption1 className={styles.metricSubtext}>From {totalOrders} completed orders</Caption1>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <ArrowCounterclockwise24Regular className={styles.refundIcon} />
            <Caption1 className={styles.metricLabel}>Sales Returns &amp; Refunds</Caption1>
          </div>
          <Subtitle1 className={styles.refundValue}>- {formatPKR(totalRefunds)}</Subtitle1>
          <Caption1 className={styles.metricSubtext}>{totalRefundsCount} processed returns</Caption1>
        </div>

        {totalDiscounts > 0 && (
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <Tag24Regular className={styles.refundIcon} />
              <Caption1 className={styles.metricLabel}>Discounts Granted</Caption1>
            </div>
            <Subtitle1 className={styles.refundValue}>- {formatPKR(totalDiscounts)}</Subtitle1>
            <Caption1 className={styles.metricSubtext}>Subtracted from customer gross bills</Caption1>
          </div>
        )}

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <ShoppingBag24Regular className={styles.salesIcon} />
            <Caption1 className={styles.metricLabel}>Net Realized Sales</Caption1>
          </div>
          <Subtitle1 className={styles.salesValue}>{formatPKR(netSales)}</Subtitle1>
          <Caption1 className={styles.metricSubtext}>Gross sales minus returns</Caption1>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <BuildingShop24Regular className={styles.cogsIcon} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Caption1 className={styles.metricLabel}>Cost of Goods (COGS)</Caption1>
              <Badge size="extra-small" appearance="tint" color={isRealCostUsed ? 'success' : 'informative'}>
                {isRealCostUsed ? 'Exact Cost' : 'Est. 45%'}
              </Badge>
            </div>
          </div>
          <Subtitle1 className={styles.cogsValue}>- {formatPKR(cogs)}</Subtitle1>
          <Caption1 className={styles.metricSubtext}>
            {isRealCostUsed ? 'Calculated from product cost prices' : 'Direct raw material / wholesale estimate'}
          </Caption1>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <Money24Regular className={styles.expenseIcon} />
            <Caption1 className={styles.metricLabel}>Operational Expenses</Caption1>
          </div>
          <Subtitle1 className={styles.expenseValue}>- {formatPKR(expenses)}</Subtitle1>
          <Caption1 className={styles.metricSubtext}>Rent, utilities, staff &amp; petty cash</Caption1>
        </div>

        <div
          className={mergeClasses(
            styles.metricCard,
            netProfit >= 0 ? styles.netProfitCardSuccess : styles.netProfitCardDanger
          )}
        >
          <div className={styles.metricHeader}>
            <ArrowTrendingLines24Regular
              className={netProfit >= 0 ? styles.netProfitIconSuccess : styles.netProfitIconDanger}
            />
            <Caption1 className={netProfit >= 0 ? styles.netProfitLabelSuccess : styles.netProfitLabelDanger}>
              Clean Net Profit (Earnings)
            </Caption1>
          </div>
          <Subtitle1 className={netProfit >= 0 ? styles.netProfitValueSuccess : styles.netProfitValueDanger}>
            {formatPKR(netProfit)}
          </Subtitle1>
          <Caption1 className={styles.metricSubtext}>
            Net Margin: <strong>{netMarginPct}%</strong> take-home
          </Caption1>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className={styles.sectionGrid}>
        {/* Top Selling Items */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitleRow}>
            <Body1 className={styles.sectionTitle}>
              <ArrowTrendingLines24Regular /> Top 5 Best Selling Items &amp; Profit
            </Body1>
          </div>

          {topItems.length === 0 ? (
            <Body1 className={styles.emptyText}>No items sold in this date period.</Body1>
          ) : (
            <div className={styles.rankingList}>
              {topItems.map((item: any, i: number) => (
                <div key={i} className={styles.rankRow}>
                  <div className={styles.rankMetaCol}>
                    <Body1 className={styles.rankItemName}>
                      #{i + 1} {item.name}
                    </Body1>
                    <Caption1 className={styles.rankItemRevenue}>
                      Volume: {formatPKR(item.revenue)} {item.profit > 0 ? `• Profit: ${formatPKR(item.profit)}` : ''}
                    </Caption1>
                  </div>
                  <Badge appearance="filled" color="brand" size="large">
                    {item.count} Sold
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Flow Ratio */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitleRow}>
            <Body1 className={styles.sectionTitle}>
              <Receipt24Regular /> Profit Margin Efficiency
            </Body1>
          </div>

          <div className={styles.ratioStack}>
            <div>
              <div className={styles.ratioHeaderRow}>
                <Caption1 className={styles.ratioLabel}>Gross Margin (Sales vs COGS)</Caption1>
                <Caption1 className={styles.ratioValueDefault}>{grossMarginPct}%</Caption1>
              </div>
              <ProgressBar
                value={netSales > 0 ? Math.min(1, Math.max(0, (netSales - cogs) / netSales)) : 0}
                color="brand"
              />
            </div>

            <div>
              <div className={styles.ratioHeaderRow}>
                <Caption1 className={styles.ratioLabel}>Net Profit Margin (Final Take Home)</Caption1>
                <Caption1 className={netProfit >= 0 ? styles.ratioValueSuccess : styles.ratioValueDanger}>
                  {netMarginPct}%
                </Caption1>
              </div>
              <ProgressBar
                value={netSales > 0 ? Math.min(1, Math.max(0, netProfit / netSales)) : 0}
                color={netProfit >= 0 ? 'success' : 'error'}
              />
            </div>

            <div className={styles.formulaBox}>
              <Caption1 className={styles.formulaText}>
                Formula: Net Profit = Net Realized Sales ({formatPKR(netSales)}) - {isRealCostUsed ? 'Actual' : 'Estimated'} COGS ({formatPKR(cogs)}) - Expenses ({formatPKR(expenses)}).
              </Caption1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
