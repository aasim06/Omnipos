import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Subtitle1,
  Subtitle2,
  Body1,
  Caption1,
  Badge,
  Button,
  ProgressBar,
} from '@fluentui/react-components';
import {
  Box24Regular,
  ArrowCircleDown24Regular,
  ArrowCircleUp24Regular,
  PeopleCommunity24Regular,
  DocumentTableSearch24Regular,
  Warning20Filled,
  ArrowRight16Regular,
  Add20Regular,
  Money20Regular,
  Food24Regular,
  ShoppingBag24Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { resolveApiUrl } from '@/lib/api';
import { Product, StockMovement } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { vendorStorage } from './vendorStorage';

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
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  sectionCard: {
    padding: '20px 24px',
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
  quickLinksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  quickLinkCard: {
    padding: '18px 20px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      borderTopColor: '#E51937', borderBottomColor: '#E51937',
      borderLeftColor: '#E51937', borderRightColor: '#E51937',
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
    gap: '20px',
  },
  movementRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    marginBottom: '8px',
  },
  alertItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    marginBottom: '8px',
    borderLeft: '3px solid #D13438',
  },
});

export function InventoryDashboardView(): React.JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();

  // Fetch Products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/products`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Stock Movements
  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/stock-movements`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const vendors = vendorStorage.getVendors();
  const totalVendorPayables = vendors.reduce((acc, v) => acc + (v.openingBalance || 0), 0);

  // Filter tab: Store-Wide vs Fast Food Kitchen vs Retail Mini Mart
  const [inventoryTab, setInventoryTab] = React.useState<'all' | 'fastfood' | 'minimart'>('all');

  // Filter products based on selected tab
  const displayedProducts = React.useMemo(() => {
    if (inventoryTab === 'fastfood') {
      return products.filter(
        (p) =>
          p.module === 'fastfood' ||
          p.itemRole === 'raw_ingredient' ||
          p.itemRole === 'food_menu' ||
          ['Burger', 'Pizza', 'Sides', 'Beverages', 'Fast Food', 'Snacks', 'Food', 'Kitchen', 'Raw Materials'].includes(p.category)
      );
    }
    if (inventoryTab === 'minimart') {
      return products.filter(
        (p) =>
          (p.module === 'minimart' || p.itemRole === 'retail_product') &&
          p.itemRole !== 'raw_ingredient'
      );
    }
    return products;
  }, [products, inventoryTab]);

  // Valuations based on displayed products
  const totalStockItems = displayedProducts.length;
  const totalUnitsInStock = displayedProducts.reduce((acc, p) => acc + (p.openingStock || 0), 0);
  const totalPurchaseValue = displayedProducts.reduce((acc, p) => acc + (p.costPrice || 0) * (p.openingStock || 1), 0);
  const totalRetailValue = displayedProducts.reduce((acc, p) => acc + (p.price || 0) * (p.openingStock || 1), 0);
  const estimatedProfit = Math.max(0, totalRetailValue - totalPurchaseValue);
  const profitMarginPercent = totalRetailValue > 0 ? Math.round((estimatedProfit / totalRetailValue) * 100) : 0;

  // Low Stock Items (threshold <= 10 or minThreshold)
  const lowStockProducts = displayedProducts
    .filter((p) => (p.openingStock || 0) <= (p.minThreshold ?? 10))
    .sort((a, b) => (a.openingStock || 0) - (b.openingStock || 0));

  // Category Breakdown
  const categoryMap = displayedProducts.reduce<Record<string, { count: number; units: number }>>((acc, p) => {
    const cat = p.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { count: 0, units: 0 };
    acc[cat].count += 1;
    acc[cat].units += p.openingStock || 0;
    return acc;
  }, {});

  if (isLoadingProducts && products.length === 0) {
    return <TablePageSkeleton title="Inventory Dashboard" hasMetrics={true} />;
  }

  return (
    <div className={styles.container}>
      {/* ── Inventory Department Overview Tabs ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: tokens.borderRadiusMedium,
          backgroundColor: tokens.colorNeutralBackground1,
          border: `1px solid ${tokens.colorNeutralStroke1}`,
          boxShadow: tokens.shadow2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Inventory Scope:
          </span>
          <div style={{ display: 'inline-flex', backgroundColor: tokens.colorNeutralBackground3, padding: '3px', borderRadius: '8px', gap: '4px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
            <button
              type="button"
              onClick={() => setInventoryTab('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: inventoryTab === 'all' ? '#E51937' : 'transparent',
                color: inventoryTab === 'all' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                fontWeight: inventoryTab === 'all' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              <span>Store-Wide Overview</span>
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', backgroundColor: inventoryTab === 'all' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setInventoryTab('fastfood')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: inventoryTab === 'fastfood' ? '#E51937' : 'transparent',
                color: inventoryTab === 'fastfood' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                fontWeight: inventoryTab === 'fastfood' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              <Food24Regular style={{ width: 15, height: 15 }} />
              <span>Kitchen & Fast Food Raw Stock</span>
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', backgroundColor: inventoryTab === 'fastfood' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                {products.filter((p) => p.module === 'fastfood' || p.itemRole === 'raw_ingredient').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setInventoryTab('minimart')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: inventoryTab === 'minimart' ? '#E51937' : 'transparent',
                color: inventoryTab === 'minimart' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                fontWeight: inventoryTab === 'minimart' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              <ShoppingBag24Regular style={{ width: 15, height: 15 }} />
              <span>Retail Mini Mart Goods</span>
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', backgroundColor: inventoryTab === 'minimart' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                {products.filter((p) => (p.module === 'minimart' || p.itemRole === 'retail_product') && p.itemRole !== 'raw_ingredient').length}
              </span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
          <span>Showing <strong>{displayedProducts.length}</strong> items in scope</span>
        </div>
      </div>

      {/* ── KPI Metrics Row (5 Connected Cards) ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Catalog Items</Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: tokens.colorNeutralForeground1 }}>
            {totalStockItems}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>Products in database</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Units in Stock</Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#0078D4' }}>
            {totalUnitsInStock.toLocaleString()}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>Live units physically available</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Purchase Cost</Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: tokens.colorNeutralForeground1 }}>
            {formatPKR(totalPurchaseValue)}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>Procurement investment</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Retail Selling Valuation</Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: '#107C41' }}>
            {formatPKR(totalRetailValue)}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
            Estimated margin: <strong>{profitMarginPercent}%</strong>
          </Caption1>
        </div>

        <div className={styles.metricCard} onClick={() => navigate('/inventory/vendors')} style={{ cursor: 'pointer' }}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>Total Vendor Payables</Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: totalVendorPayables > 0 ? '#E51937' : '#107C41' }}>
            {formatPKR(totalVendorPayables)}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
            {vendors.filter((v) => (v.openingBalance || 0) > 0).length} suppliers pending &rarr;
          </Caption1>
        </div>
      </div>

      {/* ── Quick Hub Links ── */}
      <div className={styles.quickLinksGrid}>
        <div className={styles.quickLinkCard} onClick={() => navigate('/inventory/stock-in')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#107C41', backgroundColor: 'rgba(16, 124, 65, 0.1)', padding: '10px', borderRadius: '8px' }}>
              <ArrowCircleDown24Regular />
            </span>
            <div>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Stock In (Receiving)</Body1>
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>Receive purchases &amp; vendor deliveries</Caption1>
            </div>
          </div>
          <ArrowRight16Regular style={{ color: tokens.colorNeutralForeground3 }} />
        </div>

        <div className={styles.quickLinkCard} onClick={() => navigate('/inventory/stock-out')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#D13438', backgroundColor: 'rgba(209, 52, 56, 0.1)', padding: '10px', borderRadius: '8px' }}>
              <ArrowCircleUp24Regular />
            </span>
            <div>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Stock Out (Waste/Usage)</Body1>
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>Log kitchen usage, damage, or expiry</Caption1>
            </div>
          </div>
          <ArrowRight16Regular style={{ color: tokens.colorNeutralForeground3 }} />
        </div>

        <div className={styles.quickLinkCard} onClick={() => navigate('/inventory/vendors')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#0078D4', backgroundColor: 'rgba(0, 120, 212, 0.1)', padding: '10px', borderRadius: '8px' }}>
              <PeopleCommunity24Regular />
            </span>
            <div>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Vendors &amp; Suppliers</Body1>
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>{vendors.length} registered suppliers</Caption1>
            </div>
          </div>
          <ArrowRight16Regular style={{ color: tokens.colorNeutralForeground3 }} />
        </div>

        <div className={styles.quickLinkCard} onClick={() => navigate('/inventory/ledger')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#E51937', backgroundColor: 'rgba(229, 25, 55, 0.1)', padding: '10px', borderRadius: '8px' }}>
              <DocumentTableSearch24Regular />
            </span>
            <div>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Movement Ledger</Body1>
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>{movements.length} audit logs recorded</Caption1>
            </div>
          </div>
          <ArrowRight16Regular style={{ color: tokens.colorNeutralForeground3 }} />
        </div>
      </div>

      {/* ── Two Column: Low Stock Alerts & Recent Movements ── */}
      <div className={styles.twoColGrid}>
        {/* Left: Low Stock Critical Alerts */}
        <div className={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Warning20Filled style={{ color: '#D13438' }} />
              <Subtitle2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
                Low Stock Reorder Alerts
              </Subtitle2>
              <Badge appearance="filled" color="danger" size="small">
                {lowStockProducts.length} items
              </Badge>
            </div>
            <Button
              appearance="subtle"
              size="small"
              icon={<Add20Regular />}
              onClick={() => navigate('/inventory/stock-in')}
              style={{ fontWeight: 600, color: '#E51937' }}
            >
              Reorder All
            </Button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              All inventory levels are healthy. No items below threshold.
            </div>
          ) : (
            lowStockProducts.slice(0, 5).map((prod) => (
              <div key={prod.id} className={styles.alertItem}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Body1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>{prod.name}</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                    Category: {prod.category} • Cost: {formatPKR(prod.costPrice || 0)}
                  </Caption1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Badge appearance="tint" color="danger" style={{ fontWeight: 700 }}>
                    {prod.openingStock || 0} units left
                  </Badge>
                  <Button
                    appearance="primary"
                    size="small"
                    onClick={() => navigate('/inventory/stock-in', { state: { productName: prod.name, productId: prod.id, costPrice: prod.costPrice } })}
                    style={{ backgroundColor: '#E51937', color: '#fff', fontSize: '11px', padding: '4px 10px', height: '26px' }}
                  >
                    Restock
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Recent Stock Movements Snapshot */}
        <div className={styles.sectionCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <Subtitle2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
              Recent Stock Movements
            </Subtitle2>
            <Button
              appearance="subtle"
              size="small"
              onClick={() => navigate('/inventory/ledger')}
              style={{ fontWeight: 600, color: tokens.colorNeutralForeground2 }}
            >
              View Full Ledger &rarr;
            </Button>
          </div>

          {movements.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
              No recent movements recorded yet.
            </div>
          ) : (
            movements.slice(0, 5).map((mov) => {
              const isIn = mov.type === 'in';
              return (
                <div
                  key={mov.id}
                  className={styles.movementRow}
                  onClick={() => navigate('/inventory/ledger')}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Badge
                      appearance="filled"
                      color={isIn ? 'success' : 'danger'}
                      size="medium"
                      style={{ fontWeight: 700 }}
                    >
                      {isIn ? `+${mov.quantity}` : `-${mov.quantity}`}
                    </Badge>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Body1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, fontSize: '13px' }}>
                        {mov.productName}
                      </Body1>
                      <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
                        {new Date(mov.date).toLocaleDateString()} • {mov.reason || (isIn ? 'Stock In' : 'Damage/Waste')}
                      </Caption1>
                    </div>
                  </div>
                  {mov.unitCost && (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: isIn ? '#107C41' : '#D13438' }}>
                      {formatPKR(mov.quantity * mov.unitCost)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Category Stock Distribution ── */}
      <div className={styles.sectionCard}>
        <Subtitle2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, marginBottom: '16px', display: 'block' }}>
          Category Stock Distribution
        </Subtitle2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {Object.entries(categoryMap).map(([catName, data]) => {
            const percent = totalUnitsInStock > 0 ? Math.round((data.units / totalUnitsInStock) * 100) : 0;
            return (
              <div
                key={catName}
                style={{
                  padding: '14px',
                  borderRadius: '8px',
                  backgroundColor: tokens.colorNeutralBackground3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Body1 style={{ fontWeight: 700, fontSize: '13px', color: tokens.colorNeutralForeground1 }}>{catName}</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2, fontWeight: 600 }}>{data.units} units</Caption1>
                </div>
                <ProgressBar value={percent / 100} color={percent > 20 ? 'brand' : 'warning'} style={{ height: '4px' }} />
                <Caption1 style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
                  {data.count} items ({percent}%)
                </Caption1>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
