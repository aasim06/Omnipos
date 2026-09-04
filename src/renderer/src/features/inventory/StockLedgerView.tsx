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
import { CustomInput, CustomSelect } from '@/components/ui';

const TIME_FILTER_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

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

  // All-time totals for Top KPI cards
  const totalInUnits = movements.filter((m) => m.type === 'in').reduce((acc, m) => acc + (m.quantity || 0), 0);
  const totalOutUnits = movements.filter((m) => m.type === 'out').reduce((acc, m) => acc + (m.quantity || 0), 0);
  const netUnits = totalInUnits - totalOutUnits;

  // Calculate totals for filtered view & print report
  const currentInUnits = filteredMovements.filter((m) => m.type === 'in').reduce((acc, m) => acc + (m.quantity || 0), 0);
  const currentOutUnits = filteredMovements.filter((m) => m.type === 'out').reduce((acc, m) => acc + (m.quantity || 0), 0);
  const currentNetUnits = currentInUnits - currentOutUnits;
  const currentTotalInCost = filteredMovements.filter((m) => m.type === 'in').reduce((acc, m) => acc + (m.unitCost || 0) * (m.quantity || 1), 0);
  const currentTotalOutCost = filteredMovements.filter((m) => m.type === 'out').reduce((acc, m) => acc + (m.unitCost || 0) * (m.quantity || 1), 0);

  const handlePrint = () => {
    const docNo = `SML-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const generatedTime = new Date().toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const typeLabel = typeTab === 'all' ? 'All Movements (In & Out)' : typeTab === 'in' ? 'Stock Inflow (Procurement Only)' : 'Stock Outflow (Deductions Only)';
    const periodLabel = timeFilter === 'all' ? 'All Recorded Dates' : timeFilter === 'today' ? "Today's Movements" : timeFilter === 'week' ? 'Past 7 Days' : 'This Month';

    const rowsHtml = filteredMovements.map((mov, idx) => {
      const dt = new Date(mov.date);
      const isIn = mov.type === 'in';
      const lineCost = (mov.unitCost || 0) * (mov.quantity || 0);

      return `
        <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: center; color: #6b7280;">${idx + 1}</td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
            <div style="font-weight: 600; color: #111827;">${dt.toLocaleDateString()}</div>
            <div style="font-size: 9.5px; color: #6b7280;">${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-weight: 700; font-size: 9.5px; letter-spacing: 0.5px; ${
              isIn
                ? 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;'
                : 'background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5;'
            }">
              ${isIn ? 'STOCK IN' : 'STOCK OUT'}
            </span>
          </td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; font-weight: 600; color: #111827;">
            ${mov.productName}
          </td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px; color: #4b5563;">
            <div>${mov.reason || (isIn ? 'Supplier Procurement' : 'General Deduction')}</div>
            ${mov.note ? `<div style="font-size: 9.5px; color: #9ca3af; font-style: italic;">${mov.note}</div>` : ''}
          </td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: right; color: #374151;">
            ${mov.unitCost ? formatPKR(mov.unitCost) : '—'}
          </td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11px; text-align: center; font-weight: 700; color: ${isIn ? '#15803d' : '#b91c1c'};">
            ${isIn ? '+' : '-'}${mov.quantity}
          </td>
          <td style="padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 11.5px; text-align: right; font-weight: 700; color: ${isIn ? '#15803d' : '#b91c1c'};">
            ${lineCost > 0 ? `${isIn ? '+' : '-'}${formatPKR(lineCost)}` : '—'}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Stock Movement Audit Ledger - ${docNo}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 14mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #E51937;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .brand-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .logo-badge {
            width: 36px;
            height: 36px;
            background: #E51937;
            color: #ffffff;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 16px;
            letter-spacing: -0.5px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 800;
            color: #111827;
            letter-spacing: -0.02em;
            line-height: 1.1;
          }
          .brand-sub {
            font-size: 10px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
            margin-top: 2px;
          }
          .invoice-meta {
            text-align: right;
          }
          .invoice-meta h2 {
            font-size: 16px;
            font-weight: 800;
            color: #E51937;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .invoice-meta p {
            font-size: 10.5px;
            color: #4b5563;
            margin-top: 3px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #94a3b8;
            padding: 8px 10px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #334155;
            letter-spacing: 0.4px;
          }
          .tfoot-total td {
            padding: 9px 10px;
            background: #f8fafc;
            border-top: 2px solid #0f172a;
            border-bottom: 2px solid #0f172a;
            font-size: 11.5px;
            font-weight: 800;
            color: #0f172a;
          }
          .footer-sign {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 28px;
            padding-top: 14px;
            border-top: 1px dashed #cbd5e1;
            page-break-inside: avoid;
          }
          .sign-block {
            text-align: center;
            width: 180px;
          }
          .sign-line {
            border-top: 1px solid #475569;
            margin-bottom: 4px;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
          }
          .disclaimer {
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="brand-wrap">
            <div class="logo-badge">OP</div>
            <div>
              <div class="brand-title">OmniPos</div>
              <div class="brand-sub">Enterprise POS &amp; Inventory Management</div>
            </div>
          </div>
          <div class="invoice-meta">
            <h2>STOCK MOVEMENT LEDGER</h2>
            <p><strong>Ref:</strong> ${docNo}</p>
            <p><strong>Date:</strong> ${generatedTime}</p>
          </div>
        </div>

        <!-- Main Ledger Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 32px; text-align: center;">#</th>
              <th style="width: 90px; text-align: left;">Date &amp; Time</th>
              <th style="width: 85px; text-align: left;">Type</th>
              <th style="text-align: left;">Product / Food Item</th>
              <th style="text-align: left;">Reason / Supplier</th>
              <th style="width: 80px; text-align: right;">Unit Cost</th>
              <th style="width: 65px; text-align: center;">Qty</th>
              <th style="width: 95px; text-align: right;">Impact (PKR)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `
              <tr>
                <td colspan="8" style="text-align: center; padding: 28px; color: #9ca3af; font-size: 12px;">
                  No stock movement records found for the selected criteria.
                </td>
              </tr>
            `}
          </tbody>
          <tfoot>
            <tr class="tfoot-total">
              <td colspan="5" style="text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">
                Summary Totals (Inflow vs Outflow):
              </td>
              <td style="text-align: right; font-size: 10px; color: #64748b;">
                ${filteredMovements.length} Items
              </td>
              <td style="text-align: center; color: ${currentNetUnits >= 0 ? '#15803d' : '#b91c1c'};">
                ${currentNetUnits >= 0 ? `+${currentNetUnits}` : currentNetUnits}
              </td>
              <td style="text-align: right; color: #0f172a;">
                ${formatPKR(currentTotalInCost - currentTotalOutCost)}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Signatures & Authority -->
        <div class="footer-sign">
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Prepared By (Clerk)</div>
          </div>
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Stock Auditor / Inspector</div>
          </div>
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Authorized Store Seal</div>
          </div>
        </div>

        <div class="disclaimer">
          OmniPos Enterprise Cloud &amp; Local Node Sync · System-generated audit invoice · Verified authentic record
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    // Use invisible iframe to print cleanly without affecting or printing the main app window
    let printFrame = document.getElementById('ledger-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'ledger-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();
    } else {
      const printWindow = window.open('', '_blank', 'width=950,height=800');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
    }
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
            <div style={{ minWidth: '240px' }}>
              <CustomInput
                placeholder="Search product, reason, or notes..."
                leftIcon={<Search20Regular />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <TabList
              selectedValue={typeTab}
              onTabSelect={(_, d) => setTypeTab(d.value as any)}
            >
              <Tab value="all">All Movements</Tab>
              <Tab value="in">Stock In</Tab>
              <Tab value="out">Stock Out</Tab>
            </TabList>

            <div style={{ minWidth: '140px' }}>
              <CustomSelect
                value={timeFilter}
                onChange={(val) => setTimeFilter(val as any)}
                options={TIME_FILTER_OPTIONS}
              />
            </div>

            <Button
              appearance="primary"
              icon={<Print20Regular />}
              onClick={handlePrint}
              style={{
                backgroundColor: '#E51937',
                color: '#ffffff',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
                borderRadius: '6px',
              }}
            >
              Print Ledger Statement
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
