import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Subtitle1,
  Subtitle2,
  Body1,
  Caption1,
  Badge,
  Button,
  Input,
  Select,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  DocumentTableSearch24Regular,
  Search20Regular,
  ArrowCircleDown20Regular,
  ArrowCircleUp20Regular,
  Print20Regular,
  ArrowDownload20Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { resolveApiUrl } from '@/lib/api';
import { StockMovement } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    padding: '18px 20px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  card: {
    borderRadius: tokens.borderRadiusMedium,
    padding: '22px 24px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  th: {
    padding: '12px 14px',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontSize: '12px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  td: {
    padding: '13px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
  tableRow: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
});

export function StockLedgerView(): React.JSX.Element {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeTab, setTypeTab] = useState<'all' | 'in' | 'out'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Fetch Stock Movements
  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/stock-movements`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredMovements = movements.filter((m) => {
    // Type Filter
    if (typeTab === 'in' && m.type !== 'in') return false;
    if (typeTab === 'out' && m.type !== 'out') return false;

    // Time Filter
    const mTime = new Date(m.date).getTime();
    if (timeFilter === 'today' && mTime < startOfToday) return false;
    if (timeFilter === 'week' && mTime < startOfWeek) return false;
    if (timeFilter === 'month' && mTime < startOfMonth) return false;

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        m.productName.toLowerCase().includes(q) ||
        (m.reason && m.reason.toLowerCase().includes(q)) ||
        (m.note && m.note.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  // Calculate totals
  const totalInUnits = movements.filter((m) => m.type === 'in').reduce((acc, m) => acc + (m.quantity || 0), 0);
  const totalOutUnits = movements.filter((m) => m.type === 'out').reduce((acc, m) => acc + (m.quantity || 0), 0);
  const netUnits = totalInUnits - totalOutUnits;
  const totalInCost = movements.filter((m) => m.type === 'in').reduce((acc, m) => acc + (m.unitCost || 0) * (m.quantity || 1), 0);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading && movements.length === 0) {
    return <TablePageSkeleton title="Stock Movement Ledger" hasMetrics={true} />;
  }

  return (
    <div className={styles.container}>
      {/* ── Summary KPI Cards ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Ledger Records</Caption1>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: tokens.colorNeutralForeground1, display: 'block' }}>
            {movements.length} logs
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px', display: 'block' }}>All time movements recorded</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Inflow Units</Caption1>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#107C41', display: 'block' }}>
            +{totalInUnits.toLocaleString()} units
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px', display: 'block' }}>Procured &amp; received</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Outflow Units</Caption1>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#D13438', display: 'block' }}>
            -{totalOutUnits.toLocaleString()} units
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px', display: 'block' }}>Consumed, waste &amp; damaged</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Net Movement Balance</Caption1>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#0078D4', display: 'block' }}>
            {netUnits >= 0 ? `+${netUnits.toLocaleString()}` : netUnits.toLocaleString()} units
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px', display: 'block' }}>Inflow vs Outflow variance</Caption1>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className={styles.card}>
        <div className={styles.filterBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DocumentTableSearch24Regular style={{ color: '#E51937' }} />
            <Subtitle2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
              Complete Stock Movement Audit Ledger
            </Subtitle2>
            <Badge appearance="tint" color="brand" style={{ backgroundColor: 'rgba(229, 25, 55, 0.12)', color: '#E51937' }}>
              {filteredMovements.length} entries
            </Badge>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              appearance="outline"
              placeholder="Search product, reason, or notes..."
              contentBefore={<Search20Regular style={{ color: tokens.colorNeutralForeground3 }} />}
              value={searchQuery}
              onChange={(_, d) => setSearchQuery(d.value)}
              style={{ minWidth: '240px' }}
            />

            <TabList
              selectedValue={typeTab}
              onTabSelect={(_, d) => setTypeTab(d.value as any)}
            >
              <Tab value="all">All Movements</Tab>
              <Tab value="in">Stock In</Tab>
              <Tab value="out">Stock Out</Tab>
            </TabList>

            <Select
              appearance="outline"
              value={timeFilter}
              onChange={(_, d) => setTimeFilter(d.value as any)}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>

            <Button
              appearance="subtle"
              icon={<Print20Regular />}
              onClick={handlePrint}
              style={{ border: `1px solid ${tokens.colorNeutralStroke1}` }}
            >
              Print Ledger
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Date &amp; Time</th>
                <th className={styles.th}>Movement Type</th>
                <th className={styles.th}>Product / Food Item</th>
                <th className={styles.th}>Reason / Source</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Unit Cost</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>Quantity</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Impact Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    No stock movements found matching current search criteria.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const dt = new Date(mov.date);
                  const lineCost = (mov.unitCost || 0) * (mov.quantity || 0);
                  const isIn = mov.type === 'in';

                  return (
                    <tr key={mov.id} className={styles.tableRow}>
                      <td className={styles.td}>
                        <div style={{ fontWeight: 600 }}>{dt.toLocaleDateString()}</div>
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                          {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Caption1>
                      </td>

                      <td className={styles.td}>
                        <Badge
                          appearance="filled"
                          color={isIn ? 'success' : 'danger'}
                          icon={isIn ? <ArrowCircleDown20Regular /> : <ArrowCircleUp20Regular />}
                          size="medium"
                          style={{ fontWeight: 700 }}
                        >
                          {isIn ? 'STOCK IN' : 'STOCK OUT'}
                        </Badge>
                      </td>

                      <td className={styles.td}>
                        <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>
                          {mov.productName}
                        </Body1>
                      </td>

                      <td className={styles.td}>
                        <Body1 style={{ fontSize: '13px', color: tokens.colorNeutralForeground1, display: 'block' }}>
                          {mov.reason || (isIn ? 'Purchase / Supply' : 'General Deduction')}
                        </Body1>
                        {mov.note ? (
                          <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                            {mov.note}
                          </Caption1>
                        ) : null}
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 600 }}>
                        {mov.unitCost ? formatPKR(mov.unitCost) : '—'}
                      </td>

                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: isIn ? '#107C41' : '#D13438',
                            fontSize: '14px',
                          }}
                        >
                          {isIn ? '+' : '-'}{mov.quantity} units
                        </span>
                      </td>

                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 700, color: isIn ? '#107C41' : '#D13438' }}>
                        {lineCost > 0 ? `${isIn ? '+' : '-'}${formatPKR(lineCost)}` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
