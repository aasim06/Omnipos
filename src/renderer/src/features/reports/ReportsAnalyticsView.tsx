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
} from '@fluentui/react-components';
import {
  ArrowTrendingLines24Regular,
  Money24Regular,
  ShoppingBag24Regular,
  Receipt24Regular,
  ArrowClockwise20Regular,
  BuildingShop24Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { resolveApiUrl } from '@/lib/api';
import { formatPKR } from '@/lib/utils';
import { ReportsPageSkeleton } from '@/components/skeletons/PageSkeletons';

const useStyles = makeStyles({
  container: {
    padding: '28px 32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2, // Mica app frame
    overflowY: 'auto',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  pnlGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
  },
  sectionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
  },
  sectionCard: {
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rankRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
});

export function ReportsAnalyticsView(): React.JSX.Element {
  const styles = useStyles();

  const { data: report, isLoading } = useQuery({
    queryKey: ['analytics-report'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/reports/analytics`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  const grossSales = report?.totalGrossSales || 0;
  const cogs = report?.estimatedCOGS || 0;
  const expenses = report?.totalExpenses || 0;
  const netProfit = report?.netProfit || 0;
  const totalOrders = report?.totalOrdersCount || 0;
  const topItems = report?.topSellingItems || [];

  if (isLoading) {
    return <ReportsPageSkeleton />;
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Subtitle1
            as="h1"
            style={{ fontWeight: 700, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Profit &amp; Loss Financial Analytics
          </Subtitle1>
          <Caption1
            as="p"
            style={{ color: tokens.colorNeutralForeground2, margin: 0, display: 'block', fontSize: '13px' }}
          >
            Live revenue, inventory cost of goods, daily expenses, and net earnings
          </Caption1>
        </div>
        <Badge appearance="tint" color={netProfit >= 0 ? 'success' : 'danger'} size="large">
          Net Status: {netProfit >= 0 ? 'Profitable' : 'Loss'}
        </Badge>
      </div>

      {/* P&L Statement Grid */}
      <div className={styles.pnlGrid}>
        <div className={styles.metricCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShoppingBag24Regular style={{ color: '#0078D4' }} />
            <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Gross Sales</Caption1>
          </div>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, color: '#0078D4', display: 'block' }}>
            {formatPKR(grossSales)}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginTop: '4px' }}>
            From {totalOrders} completed orders
          </Caption1>
        </div>

        <div className={styles.metricCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <BuildingShop24Regular style={{ color: '#881798' }} />
            <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Cost of Goods (COGS)</Caption1>
          </div>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, color: '#881798', display: 'block' }}>
            - {formatPKR(cogs)}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginTop: '4px' }}>
            Direct raw material / wholesale cost
          </Caption1>
        </div>

        <div className={styles.metricCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Money24Regular style={{ color: '#D13438' }} />
            <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Operational Expenses</Caption1>
          </div>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, color: '#D13438', display: 'block' }}>
            - {formatPKR(expenses)}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginTop: '4px' }}>
            Rent, utilities, staff &amp; petty cash
          </Caption1>
        </div>

        <div className={styles.metricCard} style={{ border: `2px solid ${netProfit >= 0 ? '#107C41' : '#D13438'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ArrowTrendingLines24Regular style={{ color: netProfit >= 0 ? '#107C41' : '#D13438' }} />
            <Caption1 style={{ fontWeight: 600, color: netProfit >= 0 ? '#107C41' : '#D13438' }}>
              Clean Net Profit (Earnings)
            </Caption1>
          </div>
          <Subtitle1 style={{ fontSize: '30px', fontWeight: 800, color: netProfit >= 0 ? '#107C41' : '#D13438', display: 'block' }}>
            {formatPKR(netProfit)}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginTop: '4px' }}>
            Sales minus COGS minus Expenses
          </Caption1>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className={styles.sectionGrid}>
        {/* Top Selling Items */}
        <div className={styles.sectionCard}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: `1px solid ${tokens.colorNeutralStroke1}`, paddingBottom: '12px' }}>
            <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowTrendingLines24Regular /> Top 5 Best Selling Items
            </Body1>
          </div>

          {topItems.length === 0 ? (
            <Body1 style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '24px', display: 'block' }}>
              No items sold yet.
            </Body1>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topItems.map((item: any, i: number) => (
                <div key={i} className={styles.rankRow}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <Body1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, display: 'block' }}>#{i + 1} {item.name}</Body1>
                    <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: `1px solid ${tokens.colorNeutralStroke1}`, paddingBottom: '12px' }}>
            <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt24Regular /> Profit Margin Efficiency
            </Body1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <Caption1 style={{ color: tokens.colorNeutralForeground1 }}>Gross Margin (Sales vs COGS)</Caption1>
                <Caption1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>
                  {grossSales > 0 ? Math.round(((grossSales - cogs) / grossSales) * 100) : 0}%
                </Caption1>
              </div>
              <ProgressBar
                value={grossSales > 0 ? Math.min(1, Math.max(0, (grossSales - cogs) / grossSales)) : 0}
                color="brand"
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <Caption1 style={{ color: tokens.colorNeutralForeground1 }}>Net Profit Margin (Final Take Home)</Caption1>
                <Caption1 style={{ fontWeight: 600, color: netProfit >= 0 ? '#107C41' : '#D13438' }}>
                  {grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0}%
                </Caption1>
              </div>
              <ProgressBar
                value={grossSales > 0 ? Math.min(1, Math.max(0, netProfit / grossSales)) : 0}
                color={netProfit >= 0 ? 'success' : 'error'}
              />
            </div>

            <div style={{ padding: '12px', borderRadius: tokens.borderRadiusSmall, backgroundColor: tokens.colorNeutralBackground3 }}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block' }}>
                Formula: Net Profit = Total Gross Sales ({formatPKR(grossSales)}) - Estimated Product Cost ({formatPKR(cogs)}) - Operational Expenses ({formatPKR(expenses)}).
              </Caption1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
