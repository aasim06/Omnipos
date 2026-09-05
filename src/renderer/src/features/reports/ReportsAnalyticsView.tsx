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
  headerTitleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: '20px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
    display: 'block',
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
    margin: 0,
    display: 'block',
    fontSize: '13px',
  },
  metricHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  salesIcon: {
    color: '#0078D4',
  },
  cogsIcon: {
    color: '#881798',
  },
  expenseIcon: {
    color: '#D13438',
  },
  netProfitIconSuccess: {
    color: '#107C41',
  },
  netProfitIconDanger: {
    color: '#D13438',
  },
  metricLabel: {
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
  },
  netProfitLabelSuccess: {
    fontWeight: 600,
    color: '#107C41',
  },
  netProfitLabelDanger: {
    fontWeight: 600,
    color: '#D13438',
  },
  salesValue: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#0078D4',
    display: 'block',
  },
  cogsValue: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#881798',
    display: 'block',
  },
  expenseValue: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#D13438',
    display: 'block',
  },
  netProfitValueSuccess: {
    fontSize: '30px',
    fontWeight: 800,
    color: '#107C41',
    display: 'block',
  },
  netProfitValueDanger: {
    fontSize: '30px',
    fontWeight: 800,
    color: '#D13438',
    display: 'block',
  },
  metricSubtext: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    marginTop: '4px',
  },
  netProfitCardSuccess: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#107C41', borderBottomColor: '#107C41', borderLeftColor: '#107C41', borderRightColor: '#107C41',
  },
  netProfitCardDanger: {
    borderTopWidth: '2px', borderBottomWidth: '2px', borderLeftWidth: '2px', borderRightWidth: '2px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#D13438', borderBottomColor: '#D13438', borderLeftColor: '#D13438', borderRightColor: '#D13438',
  },
  sectionTitleRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    paddingBottom: '12px',
  },
  sectionTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  emptyText: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: '24px',
    display: 'block',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  rankMetaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  rankItemName: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  rankItemRevenue: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
  },
  ratioStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  ratioHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  ratioLabel: {
    color: tokens.colorNeutralForeground1,
  },
  ratioValueDefault: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  ratioValueSuccess: {
    fontWeight: 600,
    color: '#107C41',
  },
  ratioValueDanger: {
    fontWeight: 600,
    color: '#D13438',
  },
  formulaBox: {
    padding: '12px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  formulaText: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
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
            Sales minus COGS minus Expenses
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
