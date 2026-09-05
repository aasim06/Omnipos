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
  mergeClasses,
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
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
    borderLeftColor: '#D13438',
  },
  cardSubtitle: {
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
  },
  cardMetricNum: {
    fontSize: '28px',
    fontWeight: 800,
    marginTop: '8px',
    color: tokens.colorNeutralForeground1,
  },
  cardMetricNumBlue: {
    fontSize: '28px',
    fontWeight: 800,
    marginTop: '8px',
    color: '#0078D4',
  },
  cardMetricNumGreen: {
    fontSize: '28px',
    fontWeight: 800,
    marginTop: '8px',
    color: '#107C41',
  },
  cardMetricNumRed: {
    fontSize: '28px',
    fontWeight: 800,
    marginTop: '8px',
    color: '#E51937',
  },
  cardHint: {
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  cursorPointer: {
    cursor: 'pointer',
  },
  quickLinkLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  quickLinkIconGreen: {
    color: '#107C41',
    backgroundColor: 'rgba(16, 124, 65, 0.1)',
    padding: '10px',
    borderRadius: '8px',
    display: 'inline-flex',
  },
  quickLinkIconRed: {
    color: '#D13438',
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    padding: '10px',
    borderRadius: '8px',
    display: 'inline-flex',
  },
  quickLinkIconBlue: {
    color: '#0078D4',
    backgroundColor: 'rgba(0, 120, 212, 0.1)',
    padding: '10px',
    borderRadius: '8px',
    display: 'inline-flex',
  },
  quickLinkIconBrand: {
    color: '#E51937',
    backgroundColor: 'rgba(229, 25, 55, 0.1)',
    padding: '10px',
    borderRadius: '8px',
    display: 'inline-flex',
  },
  quickLinkTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  quickLinkDesc: {
    color: tokens.colorNeutralForeground2,
  },
  quickLinkChevron: {
    color: tokens.colorNeutralForeground3,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  warningIcon: {
    color: '#D13438',
  },
  sectionTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  reorderAllBtn: {
    fontWeight: 600,
    color: '#E51937',
  },
  emptyText: {
    padding: '24px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  alertItemLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  alertItemTitle: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  alertItemSubtitle: {
    color: tokens.colorNeutralForeground2,
  },
  alertItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  badgeBold: {
    fontWeight: 700,
  },
  restockBtn: {
    backgroundColor: '#E51937',
    color: '#fff',
    fontSize: '11px',
    padding: '4px 10px',
    height: '26px',
  },
  viewFullBtn: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  movementItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  movementInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  movementTitle: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    fontSize: '13px',
  },
  movementMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
  },
  movementCostIn: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#107C41',
  },
  movementCostOut: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#D13438',
  },
  distributionTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    marginBottom: '16px',
    display: 'block',
  },
  distributionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  catCard: {
    padding: '14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  catCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catCardTitle: {
    fontWeight: 700,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
  catCardUnits: {
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
  },
  catProgressBar: {
    height: '4px',
  },
  catCardFooter: {
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
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

  // Valuations
  const totalStockItems = products.length;
  const totalUnitsInStock = products.reduce((acc, p) => acc + (p.openingStock || 0), 0);
  const totalPurchaseValue = products.reduce((acc, p) => acc + (p.costPrice || 0) * (p.openingStock || 1), 0);
  const totalRetailValue = products.reduce((acc, p) => acc + (p.price || 0) * (p.openingStock || 1), 0);
  const estimatedProfit = Math.max(0, totalRetailValue - totalPurchaseValue);
  const profitMarginPercent = totalRetailValue > 0 ? Math.round((estimatedProfit / totalRetailValue) * 100) : 0;

  // Low Stock Items (threshold <= 10 or minThreshold)
  const lowStockProducts = products
    .filter((p) => (p.openingStock || 0) <= (p.minThreshold ?? 10))
    .sort((a, b) => (a.openingStock || 0) - (b.openingStock || 0));

  // Category Breakdown
  const categoryMap = products.reduce<Record<string, { count: number; units: number }>>((acc, p) => {
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
      {/* ── KPI Metrics Row (5 Connected Cards) ── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <Caption1 className={styles.cardSubtitle}>Total Catalog Items</Caption1>
          <Subtitle1 className={styles.cardMetricNum}>
            {totalStockItems}
          </Subtitle1>
          <Caption1 className={styles.cardHint}>Products in database</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 className={styles.cardSubtitle}>Total Units in Stock</Caption1>
          <Subtitle1 className={styles.cardMetricNumBlue}>
            {totalUnitsInStock.toLocaleString()}
          </Subtitle1>
          <Caption1 className={styles.cardHint}>Live units physically available</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 className={styles.cardSubtitle}>Total Purchase Cost</Caption1>
          <Subtitle1 className={styles.cardMetricNum}>
            {formatPKR(totalPurchaseValue)}
          </Subtitle1>
          <Caption1 className={styles.cardHint}>Procurement investment</Caption1>
        </div>

        <div className={styles.metricCard}>
          <Caption1 className={styles.cardSubtitle}>Retail Selling Valuation</Caption1>
          <Subtitle1 className={styles.cardMetricNumGreen}>
            {formatPKR(totalRetailValue)}
          </Subtitle1>
          <Caption1 className={styles.cardHint}>
            Estimated margin: <strong>{profitMarginPercent}%</strong>
          </Caption1>
        </div>

        <div className={mergeClasses(styles.metricCard, styles.cursorPointer)} onClick={() => navigate('/inventory/vendors')}>
          <Caption1 className={styles.cardSubtitle}>Total Vendor Payables</Caption1>
          <Subtitle1 className={totalVendorPayables > 0 ? styles.cardMetricNumRed : styles.cardMetricNumGreen}>
            {formatPKR(totalVendorPayables)}
          </Subtitle1>
          <Caption1 className={styles.cardHint}>
            {vendors.filter((v) => (v.openingBalance || 0) > 0).length} suppliers pending &rarr;
          </Caption1>
        </div>
      </div>

      {/* ── Quick Hub Links ── */}
      <div className={styles.quickLinksGrid}>
        <div className={styles.quickLinkCard} onClick={() => navigate('/inventory/stock-in')}>
          <div className={styles.quickLinkLeft}>
            <span className={styles.quickLinkIconGreen}>
              <ArrowCircleDown24Regular />
            </span>
            <div>
              <Body1 className={styles.quickLinkTitle}>Stock In (Receiving)</Body1>
              <Caption1 className={styles.quickLinkDesc}>Receive purchases &amp; vendor deliveries</Caption1>
            </div>
          </div>
          <ArrowRight16Regular className={styles.quickLinkChevron} />
        </div>

        <div className={styles.quickLinkCard} onClick={() => navigate('/inventory/stock-out')}>
          <div className={styles.quickLinkLeft}>
            <span className={styles.quickLinkIconRed}>
              <ArrowCircleUp24Regular />
            </span>
            <div>
              <Body1 className={styles.quickLinkTitle}>Stock Out (Waste/Usage)</Body1>
              <Caption1 className={styles.quickLinkDesc}>Log kitchen usage, damage, or expiry</Caption1>
            </div>
          </div>
          <ArrowRight16Regular className={styles.quickLinkChevron} />
        </div>

        <div className={styles.quickLinkCard} onClick={() => navigate('/inventory/vendors')}>
          <div className={styles.quickLinkLeft}>
            <span className={styles.quickLinkIconBlue}>
              <PeopleCommunity24Regular />
            </span>
            <div>
              <Body1 className={styles.quickLinkTitle}>Vendors &amp; Suppliers</Body1>
              <Caption1 className={styles.quickLinkDesc}>{vendors.length} registered suppliers</Caption1>
            </div>
          </div>
          <ArrowRight16Regular className={styles.quickLinkChevron} />
        </div>

        <div className={styles.quickLinkCard} onClick={() => navigate('/inventory/ledger')}>
          <div className={styles.quickLinkLeft}>
            <span className={styles.quickLinkIconBrand}>
              <DocumentTableSearch24Regular />
            </span>
            <div>
              <Body1 className={styles.quickLinkTitle}>Movement Ledger</Body1>
              <Caption1 className={styles.quickLinkDesc}>{movements.length} audit logs recorded</Caption1>
            </div>
          </div>
          <ArrowRight16Regular className={styles.quickLinkChevron} />
        </div>
      </div>

      {/* ── Two Column: Low Stock Alerts & Recent Movements ── */}
      <div className={styles.twoColGrid}>
        {/* Left: Low Stock Critical Alerts */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <Warning20Filled className={styles.warningIcon} />
              <Subtitle2 className={styles.sectionTitle}>
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
              className={styles.reorderAllBtn}
            >
              Reorder All
            </Button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className={styles.emptyText}>
              All inventory levels are healthy. No items below threshold.
            </div>
          ) : (
            lowStockProducts.slice(0, 5).map((prod) => (
              <div key={prod.id} className={styles.alertItem}>
                <div className={styles.alertItemLeft}>
                  <Body1 className={styles.alertItemTitle}>{prod.name}</Body1>
                  <Caption1 className={styles.alertItemSubtitle}>
                    Category: {prod.category} • Cost: {formatPKR(prod.costPrice || 0)}
                  </Caption1>
                </div>
                <div className={styles.alertItemRight}>
                  <Badge appearance="tint" color="danger" className={styles.badgeBold}>
                    {prod.openingStock || 0} units left
                  </Badge>
                  <Button
                    appearance="primary"
                    size="small"
                    onClick={() => navigate('/inventory/stock-in', { state: { productName: prod.name, productId: prod.id, costPrice: prod.costPrice } })}
                    className={styles.restockBtn}
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
          <div className={styles.sectionHeader}>
            <Subtitle2 className={styles.sectionTitle}>
              Recent Stock Movements
            </Subtitle2>
            <Button
              appearance="subtle"
              size="small"
              onClick={() => navigate('/inventory/ledger')}
              className={styles.viewFullBtn}
            >
              View Full Ledger &rarr;
            </Button>
          </div>

          {movements.length === 0 ? (
            <div className={styles.emptyText}>
              No recent movements recorded yet.
            </div>
          ) : (
            movements.slice(0, 5).map((mov) => {
              const isIn = mov.type === 'in';
              return (
                <div
                  key={mov.id}
                  className={mergeClasses(styles.movementRow, styles.cursorPointer)}
                  onClick={() => navigate('/inventory/ledger')}
                >
                  <div className={styles.movementItemLeft}>
                    <Badge
                      appearance="filled"
                      color={isIn ? 'success' : 'danger'}
                      size="medium"
                      className={styles.badgeBold}
                    >
                      {isIn ? `+${mov.quantity}` : `-${mov.quantity}`}
                    </Badge>
                    <div className={styles.movementInfo}>
                      <Body1 className={styles.movementTitle}>
                        {mov.productName}
                      </Body1>
                      <Caption1 className={styles.movementMeta}>
                        {new Date(mov.date).toLocaleDateString()} • {mov.reason || (isIn ? 'Stock In' : 'Damage/Waste')}
                      </Caption1>
                    </div>
                  </div>
                  {mov.unitCost && (
                    <span className={isIn ? styles.movementCostIn : styles.movementCostOut}>
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
        <Subtitle2 className={styles.distributionTitle}>
          Category Stock Distribution
        </Subtitle2>
        <div className={styles.distributionGrid}>
          {Object.entries(categoryMap).map(([catName, data]) => {
            const percent = totalUnitsInStock > 0 ? Math.round((data.units / totalUnitsInStock) * 100) : 0;
            return (
              <div
                key={catName}
                className={styles.catCard}
              >
                <div className={styles.catCardHeader}>
                  <Body1 className={styles.catCardTitle}>{catName}</Body1>
                  <Caption1 className={styles.catCardUnits}>{data.units} units</Caption1>
                </div>
                <ProgressBar value={percent / 100} color={percent > 20 ? 'brand' : 'warning'} className={styles.catProgressBar} />
                <Caption1 className={styles.catCardFooter}>
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
