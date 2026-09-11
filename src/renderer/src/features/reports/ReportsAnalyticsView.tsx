import React from 'react';
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
} from '@fluentui/react-components';
import {
  ArrowTrendingLines24Regular,
  Money24Regular,
  ShoppingBag24Regular,
  Receipt24Regular,
  ArrowClockwise20Regular,
  BuildingShop24Regular,
  ArrowCounterclockwise24Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { resolveApiUrl } from '@/lib/api';
import { offlineDb } from '@/lib/offlineDb';
import { formatPKR } from '@/lib/utils';
import { ReportsPageSkeleton } from '@/components/skeletons/PageSkeletons';

import { useReportsAnalyticsStyles, useStyles } from './reportsAnalytics.styles';

export function ReportsAnalyticsView(): React.JSX.Element {
  const styles = useReportsAnalyticsStyles();

  const { data: report, isLoading } = useQuery({
    queryKey: ['analytics-report'],
    queryFn: async () => {
      // 1. Try remote analytics if online
      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          const base = await resolveApiUrl();
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 2500);
          const res = await fetch(`${base}/api/reports/analytics`, { signal: controller.signal });
          clearTimeout(timer);
          if (res.ok) return await res.json();
        } catch {}
      }

      // 2. Offline fallback: calculate directly from local Dexie IndexedDB orders, refunds & expenses
      try {
        const localOrders = await offlineDb.orders.toArray();
        const localExpenses = await offlineDb.expenses.toArray();
        const localRefunds = await offlineDb.refunds.toArray();
        const paidOrders = localOrders.filter((o) => o.stage === 'paid');
        const grossSales = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalRefunds = localRefunds.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
        const netSales = Math.max(0, grossSales - totalRefunds);
        const totalExpenses = localExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const estimatedCOGS = Math.round(netSales * 0.45);
        const netProfit = netSales - estimatedCOGS - totalExpenses;

        const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
        paidOrders.forEach((o) => {
          (o.lines || []).forEach((l) => {
            const key = l.productId || l.name;
            const cur = itemMap.get(key) || { name: l.name, quantity: 0, revenue: 0 };
            cur.quantity += Number(l.quantity || 1);
            cur.revenue += Number(l.unitPrice || 0) * Number(l.quantity || 1);
            itemMap.set(key, cur);
          });
        });
        const topSellingItems = Array.from(itemMap.values())
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        return {
          totalGrossSales: grossSales,
          totalRefunds,
          netSales,
          estimatedCOGS,
          totalExpenses,
          netProfit,
          totalOrdersCount: paidOrders.length,
          totalRefundsCount: localRefunds.length,
          topSellingItems,
        };
      } catch {
        return null;
      }
    },
  });

  const grossSales = report?.totalGrossSales || 0;
  const totalRefunds = report?.totalRefunds || 0;
  const netSales = report?.netSales ?? Math.max(0, grossSales - totalRefunds);
  const cogs = report?.estimatedCOGS || 0;
  const expenses = report?.totalExpenses || 0;
  const netProfit = report?.netProfit || 0;
  const totalOrders = report?.totalOrdersCount || 0;
  const totalRefundsCount = report?.totalRefundsCount || 0;
  const topItems = report?.topSellingItems || [];

  if (isLoading) {
    return <ReportsPageSkeleton />;
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleCol}>
          <Subtitle1
            as="h1"
            className={styles.headerTitle}
          >
            Profit &amp; Loss Financial Analytics
          </Subtitle1>
          <Caption1
            as="p"
            className={styles.headerSubtitle}
          >
            Live revenue, sales returns/refunds, inventory cost of goods, daily expenses, and net earnings
          </Caption1>
        </div>
        <Badge appearance="tint" color={netProfit >= 0 ? 'success' : 'danger'} size="large">
          Net Status: {netProfit >= 0 ? 'Profitable' : 'Loss'}
        </Badge>
      </div>

      {/* P&L Statement Grid */}
      <div className={styles.pnlGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <ShoppingBag24Regular className={styles.salesIcon} />
            <Caption1 className={styles.metricLabel}>Total Gross Sales</Caption1>
          </div>
          <Subtitle1 className={styles.salesValue}>
            {formatPKR(grossSales)}
          </Subtitle1>
          <Caption1 className={styles.metricSubtext}>
            From {totalOrders} completed orders
          </Caption1>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <ArrowCounterclockwise24Regular className={styles.refundIcon} />
            <Caption1 className={styles.metricLabel}>Sales Returns &amp; Refunds</Caption1>
          </div>
          <Subtitle1 className={styles.refundValue}>
            - {formatPKR(totalRefunds)}
          </Subtitle1>
          <Caption1 className={styles.metricSubtext}>
            {totalRefundsCount} processed returns
          </Caption1>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <ShoppingBag24Regular className={styles.salesIcon} />
            <Caption1 className={styles.metricLabel}>Net Realized Sales</Caption1>
          </div>
          <Subtitle1 className={styles.salesValue}>
            {formatPKR(netSales)}
          </Subtitle1>
          <Caption1 className={styles.metricSubtext}>
            Gross sales minus returns
          </Caption1>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <BuildingShop24Regular className={styles.cogsIcon} />
            <Caption1 className={styles.metricLabel}>Cost of Goods (COGS)</Caption1>
          </div>
          <Subtitle1 className={styles.cogsValue}>
            - {formatPKR(cogs)}
          </Subtitle1>
          <Caption1 className={styles.metricSubtext}>
            Direct raw material / wholesale cost
          </Caption1>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <Money24Regular className={styles.expenseIcon} />
            <Caption1 className={styles.metricLabel}>Operational Expenses</Caption1>
          </div>
          <Subtitle1 className={styles.expenseValue}>
            - {formatPKR(expenses)}
          </Subtitle1>
          <Caption1 className={styles.metricSubtext}>
            Rent, utilities, staff &amp; petty cash
          </Caption1>
        </div>

        <div className={mergeClasses(styles.metricCard, netProfit >= 0 ? styles.netProfitCardSuccess : styles.netProfitCardDanger)}>
          <div className={styles.metricHeader}>
            <ArrowTrendingLines24Regular className={netProfit >= 0 ? styles.netProfitIconSuccess : styles.netProfitIconDanger} />
            <Caption1 className={netProfit >= 0 ? styles.netProfitLabelSuccess : styles.netProfitLabelDanger}>
              Clean Net Profit (Earnings)
            </Caption1>
          </div>
          <Subtitle1 className={netProfit >= 0 ? styles.netProfitValueSuccess : styles.netProfitValueDanger}>
            {formatPKR(netProfit)}
          </Subtitle1>
          <Caption1 className={styles.metricSubtext}>
            Net Sales minus COGS minus Expenses
          </Caption1>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className={styles.sectionGrid}>
        {/* Top Selling Items */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitleRow}>
            <Body1 className={styles.sectionTitle}>
              <ArrowTrendingLines24Regular /> Top 5 Best Selling Items
            </Body1>
          </div>

          {topItems.length === 0 ? (
            <Body1 className={styles.emptyText}>
              No items sold yet.
            </Body1>
          ) : (
            <div className={styles.rankingList}>
              {topItems.map((item: any, i: number) => (
                <div key={i} className={styles.rankRow}>
                  <div className={styles.rankMetaCol}>
                    <Body1 className={styles.rankItemName}>#{i + 1} {item.name}</Body1>
                    <Caption1 className={styles.rankItemRevenue}>
                      Total Volume: {formatPKR(item.revenue)}
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
                <Caption1 className={styles.ratioValueDefault}>
                  {grossSales > 0 ? Math.round(((grossSales - cogs) / grossSales) * 100) : 0}%
                </Caption1>
              </div>
              <ProgressBar
                value={grossSales > 0 ? Math.min(1, Math.max(0, (grossSales - cogs) / grossSales)) : 0}
                color="brand"
              />
            </div>

            <div>
              <div className={styles.ratioHeaderRow}>
                <Caption1 className={styles.ratioLabel}>Net Profit Margin (Final Take Home)</Caption1>
                <Caption1 className={netProfit >= 0 ? styles.ratioValueSuccess : styles.ratioValueDanger}>
                  {grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0}%
                </Caption1>
              </div>
              <ProgressBar
                value={grossSales > 0 ? Math.min(1, Math.max(0, netProfit / grossSales)) : 0}
                color={netProfit >= 0 ? 'success' : 'error'}
              />
            </div>

            <div className={styles.formulaBox}>
              <Caption1 className={styles.formulaText}>
                Formula: Net Profit = Total Gross Sales ({formatPKR(grossSales)}) - Estimated Product Cost ({formatPKR(cogs)}) - Operational Expenses ({formatPKR(expenses)}).
              </Caption1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
