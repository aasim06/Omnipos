import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  makeStyles,
  tokens,
  Subtitle1,
  Caption1,
  Badge,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  mergeClasses,
  Input,
} from '@fluentui/react-components';
import {
  Search20Regular,
  Receipt20Regular,
  Receipt24Regular,
  Print20Regular,
  DocumentPdf20Regular,
  ArrowRepeatAll20Regular,
  Calendar20Regular,
  Money20Regular,
  Filter20Regular,
  ArrowDownload20Regular,
  Copy20Regular,
  Dismiss20Regular,
  BuildingRetail20Regular,
  Food20Regular,
} from '@fluentui/react-icons';
import { Order } from '@shared/types';
import { offlineDb } from '@/lib/offlineDb';
import { posApi } from '@/lib/api';
import { formatPKR } from '@/lib/utils';
import { printCustomerReceipt } from '@/lib/receiptPrinter';
import { generateBarcodeDataUrl } from '@/lib/barcodeGenerator';
import { storage, KEYS } from '@/lib/storage';
import { StoreSettings } from '@/features/admin/AdminSettingsView';
import { A4InvoiceTemplate } from '@/components/print/A4InvoiceTemplate';
import { useAppToast } from '@/context/AppNotificationContext';
import { Pager, usePaged } from '@/components/common/Pager';

const useStyles = makeStyles({
  container: {
    padding: '24px 32px',
    height: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '12px',
  },
  kpiCard: {
    padding: '16px',
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  tableCard: {
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  filterBar: {
    padding: '14px 18px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left',
  },
  th: {
    padding: '10px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  tr: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    transition: 'background-color 0.12s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  td: {
    padding: '12px 16px',
    verticalAlign: 'middle',
  },
});

export function OrdersDirectoryView(): React.JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { notifySuccess, notifyWarning } = useAppToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [filterModule, setFilterModule] = useState<'all' | 'fastfood' | 'minimart'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'cash' | 'card' | 'khata' | 'split'>('all');

  // Preview & Print Dialog States
  const [selectedOrderForPreview, setSelectedOrderForPreview] = useState<Order | null>(null);
  const [selectedOrderForA4, setSelectedOrderForA4] = useState<Order | null>(null);

  const storeSettings = useMemo(() => {
    return storage.getItem<StoreSettings>(KEYS.storeSettings, {} as any);
  }, []);

  // Fetch all orders from local Dexie offline-first, fallback to remote
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['all-orders-history'],
    queryFn: async () => {
      try {
        const local = await offlineDb.orders.toArray();
        if (local && local.length > 0) {
          return local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        const remote = await posApi.fetchOrders();
        return (remote || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } catch {
        return (await offlineDb.orders.toArray()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    },
    staleTime: 5000,
  });

  // Filter orders according to user criteria
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 7 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((o) => {
      const time = new Date(o.createdAt).getTime();

      // Period filter
      if (filterPeriod === 'today' && time < todayStart) return false;
      if (filterPeriod === 'yesterday' && (time < yesterdayStart || time >= todayStart)) return false;
      if (filterPeriod === 'week' && time < weekStart) return false;
      if (filterPeriod === 'month' && time < monthStart) return false;

      // Module filter
      if (filterModule !== 'all') {
        if (o.module !== filterModule) return false;
      }

      // Payment filter
      if (filterPayment !== 'all' && (o.paymentMode || 'cash') !== filterPayment) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = o.id.toLowerCase().includes(q);
        const custMatch = (o.customerName || '').toLowerCase().includes(q);
        const phoneMatch = (o.customerPhone || '').toLowerCase().includes(q);
        const itemMatch = o.lines?.some((l) => l.name.toLowerCase().includes(q));
        if (!idMatch && !custMatch && !phoneMatch && !itemMatch) return false;
      }

      return true;
    });
  }, [orders, filterPeriod, filterModule, filterPayment, searchQuery]);

  // KPIs
  const totalBillsCount = filteredOrders.length;
  const totalGrossSales = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const cashSales = filteredOrders
    .filter((o) => (o.paymentMode || 'cash') === 'cash')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const khataSales = filteredOrders
    .filter((o) => o.paymentMode === 'khata')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Pagination (25 items per page)
  const { pageItems, page, setPage, pageCount, total, from, to } = usePaged(filteredOrders, 25);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    notifySuccess(`Copied Bill ID #${id}`);
  };

  const handlePrintThermal = async (order: Order) => {
    try {
      await printCustomerReceipt(order, { storeSettings });
      notifySuccess(`✓ Thermal receipt sent for Bill #${order.id.slice(-6).toUpperCase()}!`);
    } catch (e: any) {
      notifyWarning('Print failed: ' + (e?.message || 'Check printer'));
    }
  };

  const handleLoadToPos = (order: Order) => {
    const targetRoute = order.module === 'fastfood' ? '/pos/fastfood' : '/pos/omnimart';
    navigate(targetRoute, { state: { loadOrderLines: order.lines, loadDiscount: order.discountPercent } });
    notifySuccess(`Loading Bill #${order.id.slice(-6).toUpperCase()} into POS cart…`);
  };

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt24Regular style={{ color: '#E51937' }} />
            <Subtitle1 style={{ fontWeight: 800 }}>Bills & Invoices / بلز اور انوائسز</Subtitle1>
          </div>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, marginTop: '2px', display: 'block' }}>
            Complete history of completed customer sales bills, thermal receipts, and tax invoices
          </Caption1>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            appearance="subtle"
            icon={<ArrowRepeatAll20Regular />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            appearance="primary"
            icon={<Receipt20Regular />}
            onClick={() => navigate('/pos/omnimart')}
            style={{ backgroundColor: '#E51937' }}
          >
            New Sale (POS)
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Bills</Caption1>
          <div style={{ fontSize: '22px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
            {totalBillsCount}
          </div>
          <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
            Filtered period sales count
          </div>
        </div>

        <div className={styles.kpiCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Sales Volume</Caption1>
          <div style={{ fontSize: '22px', fontWeight: 800, color: tokens.colorNeutralForeground1 }}>
            {formatPKR(totalGrossSales)}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
            Revenue realized
          </div>
        </div>

        <div className={styles.kpiCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Cash Received</Caption1>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>
            {formatPKR(cashSales)}
          </div>
          <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
            Immediate cash drawer intake
          </div>
        </div>

        <div className={styles.kpiCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Khata / Credit Bills</Caption1>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#F59E0B' }}>
            {formatPKR(khataSales)}
          </div>
          <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
            Debited to customer accounts
          </div>
        </div>
      </div>

      {/* ── Main Bills Table Card ── */}
      <div className={styles.tableCard}>
        {/* Filter and Search Bar */}
        <div className={styles.filterBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
            <Input
              value={searchQuery}
              onChange={(_, d) => setSearchQuery(d.value)}
              contentBefore={<Search20Regular />}
              placeholder="Search by Bill ID, Customer, Phone, or Item..."
              style={{ width: '100%' }}
            />
            {searchQuery && (
              <Button
                appearance="subtle"
                icon={<Dismiss20Regular />}
                size="small"
                onClick={() => setSearchQuery('')}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Period Pills */}
            <div style={{ display: 'flex', gap: '4px', background: tokens.colorNeutralBackground2, padding: '3px', borderRadius: '6px' }}>
              {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setFilterPeriod(period)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: filterPeriod === period ? '#E51937' : 'transparent',
                    color: filterPeriod === period ? '#FFF' : tokens.colorNeutralForeground1,
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {period === 'today' ? 'Today' : period === 'yesterday' ? 'Yesterday' : period === 'week' ? '7 Days' : period === 'month' ? 'This Month' : 'All'}
                </button>
              ))}
            </div>

            {/* Module Filter */}
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value as any)}
              style={{
                height: '32px',
                padding: '0 8px',
                borderRadius: '6px',
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
                fontSize: '12px',
                color: tokens.colorNeutralForeground1,
              }}
            >
              <option value="all">All Departments</option>
              <option value="minimart">Mart Only</option>
              <option value="fastfood">Fast Food Only</option>
            </select>

            {/* Payment Filter */}
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as any)}
              style={{
                height: '32px',
                padding: '0 8px',
                borderRadius: '6px',
                border: `1px solid ${tokens.colorNeutralStroke2}`,
                backgroundColor: tokens.colorNeutralBackground1,
                fontSize: '12px',
                color: tokens.colorNeutralForeground1,
              }}
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash Only</option>
              <option value="card">Card Only</option>
              <option value="khata">Khata Only</option>
              <option value="split">Split Only</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto', minHeight: '340px' }}>
          {isLoading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              Loading bills directory…
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              <Receipt24Regular style={{ width: 36, height: 36, marginBottom: '8px', opacity: 0.5 }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>No bills found</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Try adjusting your search query or date range filters.</div>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Bill # / ID</th>
                  <th className={styles.th}>Date & Time</th>
                  <th className={styles.th}>Department</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Items Breakdown</th>
                  <th className={styles.th}>Payment</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Total Amount</th>
                  <th className={styles.th} style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((order: Order) => {
                  const totalQty = (order.lines || []).reduce((sum: number, l: any) => sum + (l.quantity || 1), 0);
                  const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const orderTime = new Date(order.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={order.id} className={styles.tr}>
                      {/* Bill ID */}
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '13px', color: '#E51937' }}>
                            #{order.id.slice(-6).toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(order.id)}
                            title={`Copy full ID: ${order.id}`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: tokens.colorNeutralForeground3,
                              padding: '2px',
                            }}
                          >
                            <Copy20Regular style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                        <div style={{ fontSize: '10px', color: tokens.colorNeutralForeground3, fontFamily: 'monospace' }}>
                          {order.id.slice(0, 14)}…
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className={styles.td}>
                        <div style={{ fontWeight: 600 }}>{orderDate}</div>
                        <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>{orderTime}</div>
                      </td>

                      {/* Department */}
                      <td className={styles.td}>
                        <Badge
                          appearance="tint"
                          color={order.module === 'fastfood' ? 'warning' : 'success'}
                          size="small"
                        >
                          {order.module === 'fastfood' ? 'Fast Food' : 'Mart'}
                        </Badge>
                      </td>

                      {/* Customer */}
                      <td className={styles.td}>
                        <div style={{ fontWeight: 600 }}>{order.customerName || 'Walk-In Customer'}</div>
                        {order.customerPhone && (
                          <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                            {order.customerPhone}
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td className={styles.td} style={{ maxWidth: '240px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600 }}>
                          {totalQty} {totalQty === 1 ? 'item' : 'items'}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: tokens.colorNeutralForeground3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={order.lines?.map((l: any) => `${l.quantity}x ${l.name}`).join(', ')}
                        >
                          {order.lines && order.lines.length > 0
                            ? order.lines.map((l: any) => `${l.quantity}x ${l.name}`).join(', ')
                            : '—'}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className={styles.td}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor:
                              order.paymentMode === 'khata'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : order.paymentMode === 'card'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)',
                            color:
                              order.paymentMode === 'khata'
                                ? '#D97706'
                                : order.paymentMode === 'card'
                                ? '#2563EB'
                                : '#059669',
                          }}
                        >
                          {order.paymentMode || 'Cash'}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '14.5px', color: tokens.colorNeutralForeground1 }}>
                          {formatPKR(order.totalAmount || 0)}
                        </div>
                        {order.discountPercent ? (
                          <div style={{ fontSize: '10.5px', color: '#10B981' }}>
                            {order.discountPercent}% off applied
                          </div>
                        ) : null}
                      </td>

                      {/* Actions */}
                      <td className={styles.td}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Button
                            appearance="subtle"
                            icon={<Receipt20Regular />}
                            size="small"
                            title="View Thermal Bill"
                            onClick={() => setSelectedOrderForPreview(order)}
                          >
                            View
                          </Button>

                          <Button
                            appearance="subtle"
                            icon={<Print20Regular />}
                            size="small"
                            title="Print Thermal Receipt"
                            onClick={() => handlePrintThermal(order)}
                          />

                          <Button
                            appearance="subtle"
                            icon={<DocumentPdf20Regular />}
                            size="small"
                            title="A4 Invoice"
                            onClick={() => setSelectedOrderForA4(order)}
                          />

                          <Button
                            appearance="subtle"
                            icon={<ArrowRepeatAll20Regular style={{ color: '#E51937' }} />}
                            size="small"
                            title="Load items into POS Cart"
                            onClick={() => handleLoadToPos(order)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {pageCount > 1 && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${tokens.colorNeutralStroke2}` }}>
            <Pager page={page} pageCount={pageCount} setPage={setPage} total={total} from={from} to={to} noun="bills" />
          </div>
        )}
      </div>

      {/* ── Bill Thermal Preview Dialog ── */}
      {selectedOrderForPreview && (
        <Dialog open onOpenChange={() => setSelectedOrderForPreview(null)}>
          <DialogSurface style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '15px' }}>
                Bill #{selectedOrderForPreview.id.slice(-6).toUpperCase()}
              </div>
              <Button appearance="subtle" icon={<Dismiss20Regular />} size="small" onClick={() => setSelectedOrderForPreview(null)} />
            </div>

            <DialogContent style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Thermal paper lookalike preview */}
              <div style={{ background: '#FFF', color: '#000', padding: '16px', borderRadius: '6px', border: '1px solid #CBD5E1', fontFamily: 'monospace', fontSize: '12px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px' }}>
                  {storeSettings.storeName || 'Omnipos Store'}
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#555', marginTop: '2px' }}>
                  {storeSettings.address || ''} {storeSettings.phone ? `· Tel: ${storeSettings.phone}` : ''}
                </div>
                <div style={{ margin: '8px 0', borderBottom: '1px dashed #000' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Bill #: {selectedOrderForPreview.id.slice(-6).toUpperCase()}</span>
                  <span>{new Date(selectedOrderForPreview.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: '10px', color: '#555' }}>
                  ID: {selectedOrderForPreview.id}
                </div>
                <div style={{ margin: '6px 0', borderBottom: '1px dashed #000' }} />

                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left', paddingBottom: '3px' }}>Item</th>
                      <th style={{ textAlign: 'center', paddingBottom: '3px' }}>Qty</th>
                      <th style={{ textAlign: 'right', paddingBottom: '3px' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrderForPreview.lines || []).map((l: any, i: number) => (
                      <tr key={i}>
                        <td style={{ padding: '3px 0' }}>{l.name}</td>
                        <td style={{ textAlign: 'center' }}>{l.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{(l.unitPrice * l.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ margin: '8px 0', borderBottom: '1px dashed #000' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                  <span>NET TOTAL:</span>
                  <span>PKR {(selectedOrderForPreview.totalAmount || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '3px', textTransform: 'capitalize' }}>
                  <span>Payment:</span>
                  <span>{selectedOrderForPreview.paymentMode || 'Cash'}</span>
                </div>

                {/* Barcode inside preview */}
                <div style={{ marginTop: '14px', paddingTop: '8px', borderTop: '1px dashed #000', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}>BILL BARCODE</div>
                  {(() => {
                    const bUrl = generateBarcodeDataUrl(selectedOrderForPreview.id, { width: 1.4, height: 32, displayValue: false });
                    return bUrl ? <img src={bUrl} alt="Bill Barcode" style={{ maxWidth: '85%', height: '32px', margin: '4px auto 2px', display: 'block' }} /> : null;
                  })()}
                  <div style={{ fontSize: '9px', fontFamily: 'monospace' }}>{selectedOrderForPreview.id}</div>
                </div>
              </div>
            </DialogContent>

            <DialogActions style={{ padding: '12px 20px', borderTop: `1px solid ${tokens.colorNeutralStroke2}`, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                appearance="subtle"
                icon={<ArrowRepeatAll20Regular />}
                onClick={() => {
                  handleLoadToPos(selectedOrderForPreview);
                  setSelectedOrderForPreview(null);
                }}
              >
                Load to POS Cart
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button appearance="secondary" onClick={() => setSelectedOrderForPreview(null)}>
                  Close
                </Button>
                <Button
                  appearance="primary"
                  icon={<Print20Regular />}
                  onClick={() => handlePrintThermal(selectedOrderForPreview)}
                  style={{ backgroundColor: '#E51937' }}
                >
                  Print Receipt
                </Button>
              </div>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      )}

      {/* ── A4 Invoice Dialog ── */}
      {selectedOrderForA4 && (
        <A4InvoiceTemplate
          order={selectedOrderForA4}
          storeSettings={storeSettings}
          paymentMode={selectedOrderForA4.paymentMode}
          onClose={() => setSelectedOrderForA4(null)}
        />
      )}
    </div>
  );
}
