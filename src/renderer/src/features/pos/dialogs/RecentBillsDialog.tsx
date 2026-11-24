import React, { useState, useMemo } from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { Order } from '@shared/types';
import { offlineDb } from '@/lib/offlineDb';
import { posApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import {
  Dismiss20Regular,
  Search20Regular,
  Receipt20Regular,
  Print20Regular,
  ArrowRepeatAll20Regular,
  Calendar20Regular,
  CheckmarkCircle20Filled,
} from '@fluentui/react-icons';
import { DIALOG_SHADOW, DIALOG_SMOKE, useEscapeToClose } from '@/features/pos/posDialog';
import { printCustomerReceipt } from '@/lib/receiptPrinter';
import { formatPKR } from '@/lib/utils';
import { useAppToast } from '@/context/AppNotificationContext';

export function RecentBillsDialog({ pos }: { pos: PosCounterState }) {
  const {
    isDark,
    F,
    showRecentBillsModal,
    setShowRecentBillsModal,
    setLastOrder,
    setShowReceiptModal,
    setCart,
    setDiscountMode,
    setDiscountValue,
    setDiscountInput,
    setPaymentMode,
    storeSettings,
    modalReceiptLang,
  } = pos;

  const { notifySuccess, notifyWarning } = useAppToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'yesterday' | 'all'>('today');

  useEscapeToClose(showRecentBillsModal, () => setShowRecentBillsModal(false));

  const { data: allOrders = [], isLoading, refetch } = useQuery({
    queryKey: ['pos-recent-bills'],
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
    enabled: showRecentBillsModal,
    staleTime: 5000,
  });

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;

    return allOrders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();

      if (filterPeriod === 'today' && orderTime < todayStart) return false;
      if (filterPeriod === 'yesterday' && (orderTime < yesterdayStart || orderTime >= todayStart)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const idMatch = o.id.toLowerCase().includes(q);
      const custMatch = (o.customerName || '').toLowerCase().includes(q);
      const phoneMatch = (o.customerPhone || '').toLowerCase().includes(q);
      const itemMatch = o.lines?.some((l) => l.name.toLowerCase().includes(q));

      return idMatch || custMatch || phoneMatch || itemMatch;
    });
  }, [allOrders, filterPeriod, searchQuery]);

  const handleOpenInvoice = (order: Order) => {
    setLastOrder(order);
    setShowRecentBillsModal(false);
    setShowReceiptModal(true);
  };

  const handleLoadToCart = (order: Order) => {
    if (!order.lines || order.lines.length === 0) {
      notifyWarning('This bill has no items to load.');
      return;
    }
    setCart(order.lines);
    if (order.discountPercent) {
      setDiscountMode('percent');
      setDiscountValue(order.discountPercent);
      setDiscountInput(String(order.discountPercent));
    }
    if (order.paymentMode && (order.paymentMode === 'cash' || order.paymentMode === 'card' || order.paymentMode === 'khata' || order.paymentMode === 'split')) {
      setPaymentMode(order.paymentMode as any);
    }
    setShowRecentBillsModal(false);
    notifySuccess(`✓ Bill #${order.id.slice(-6).toUpperCase()} items loaded into cart!`);
  };

  const handleReprintReceipt = async (order: Order) => {
    try {
      await printCustomerReceipt(order, {
        storeSettings,
        language: modalReceiptLang,
      });
      notifySuccess(`Reprinting receipt for Bill #${order.id.slice(-6).toUpperCase()}…`);
    } catch (err: any) {
      notifyWarning('Print failed: ' + (err?.message || 'Check printer'));
    }
  };

  if (!showRecentBillsModal) return null;

  return (
    <div
      onClick={() => setShowRecentBillsModal(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: DIALOG_SMOKE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '760px',
          maxWidth: '94vw',
          maxHeight: '90vh',
          backgroundColor: F.bgCard,
          borderRadius: '10px',
          boxShadow: DIALOG_SHADOW,
          border: `1px solid ${F.border}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.18s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${F.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(229, 25, 55, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: F.accentRed,
              }}
            >
              <Receipt20Regular />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: F.textPrimary }}>
                Bills & Order History / بلز ہسٹری
              </div>
              <div style={{ fontSize: '11.5px', color: F.textMuted }}>
                Search past customer receipts, reprint, or load bill items to cart
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowRecentBillsModal(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: F.textMuted,
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Dismiss20Regular />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: `1px solid ${F.border}`,
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: '220px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '34px',
              padding: '0 10px',
              borderRadius: '6px',
              border: `1px solid ${F.border}`,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
            }}
          >
            <Search20Regular style={{ color: F.textMuted, width: 16, height: 16 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Bill ID, Customer, Phone, or Item..."
              style={{
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                width: '100%',
                fontSize: '12.5px',
                color: F.textPrimary,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['today', 'yesterday', 'all'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setFilterPeriod(period)}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${filterPeriod === period ? F.accentRed : F.border}`,
                  backgroundColor: filterPeriod === period ? (isDark ? 'rgba(229,25,55,0.2)' : 'rgba(229,25,55,0.08)') : 'transparent',
                  color: filterPeriod === period ? F.accentRed : F.textPrimary,
                  textTransform: 'capitalize',
                }}
              >
                {period === 'today' ? 'Today' : period === 'yesterday' ? 'Yesterday' : 'All Bills'}
              </button>
            ))}
          </div>
        </div>

        {/* Bills List Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', minHeight: '300px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: F.textMuted, fontSize: '13px' }}>
              Loading bills history...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: F.textMuted, fontSize: '13px' }}>
              No bills found for the selected period or search query.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredOrders.map((order) => {
                const totalQty = (order.lines || []).reduce((sum, l) => sum + (l.quantity || 1), 0);
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
                  <div
                    key={order.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: `1px solid ${F.border}`,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Left: Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: F.accentRed,
                          }}
                        >
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: order.module === 'fastfood' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                            color: order.module === 'fastfood' ? '#F59E0B' : '#10B981',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                          }}
                        >
                          {order.module === 'fastfood' ? 'Fast Food' : 'Mart'}
                        </span>
                        <span style={{ fontSize: '11px', color: F.textMuted }}>
                          {orderDate} · {orderTime}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', fontWeight: 600, color: F.textPrimary, marginTop: '3px' }}>
                        {order.customerName || 'Walk-In Customer'}
                        {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: F.textMuted,
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {order.lines && order.lines.length > 0
                          ? order.lines.map((l) => `${l.quantity}x ${l.name}`).join(', ')
                          : `${totalQty} items`}
                      </div>
                    </div>

                    {/* Middle: Amount & Payment */}
                    <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: '8px' }}>
                      <div style={{ fontSize: '14.5px', fontWeight: 900, color: F.textPrimary }}>
                        {formatPKR(order.totalAmount || 0)}
                      </div>
                      <div style={{ fontSize: '11px', color: F.textMuted, textTransform: 'capitalize', marginTop: '2px' }}>
                        {order.paymentMode || 'Cash'} · {totalQty} items
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(order)}
                        title="View Full Bill & Invoice Modal"
                        style={{
                          height: '32px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: `1px solid ${F.border}`,
                          backgroundColor: isDark ? '#262626' : '#F1F5F9',
                          color: F.textPrimary,
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Receipt20Regular style={{ width: 15, height: 15 }} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLoadToCart(order)}
                        title="Load items to active cart for re-order or edit"
                        style={{
                          height: '32px',
                          padding: '0 10px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'rgba(229, 25, 55, 0.1)',
                          color: F.accentRed,
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ArrowRepeatAll20Regular style={{ width: 15, height: 15 }} />
                        <span>Load to Cart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReprintReceipt(order)}
                        title="Reprint thermal receipt"
                        style={{
                          height: '32px',
                          width: '32px',
                          borderRadius: '6px',
                          border: `1px solid ${F.border}`,
                          backgroundColor: 'transparent',
                          color: F.textPrimary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Print20Regular style={{ width: 16, height: 16 }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: `1px solid ${F.border}`,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F8FAFC',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: F.textMuted,
          }}
        >
          <span>Showing {filteredOrders.length} bills</span>
          <button
            type="button"
            onClick={() => setShowRecentBillsModal(false)}
            style={{
              padding: '0 16px',
              height: '30px',
              borderRadius: '6px',
              border: `1px solid ${F.border}`,
              backgroundColor: isDark ? '#262626' : '#FFFFFF',
              color: F.textPrimary,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
