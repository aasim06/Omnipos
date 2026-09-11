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
  Food24Regular,
  ShoppingBag24Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Product, StockMovement } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { vendorStorage } from './vendorStorage';
import { useLicense } from '@/features/auth/LicenseModulesContext';

import { useInventoryDashboardStyles, useStyles } from './inventoryDashboard.styles';

export function InventoryDashboardView(): React.JSX.Element {
  const styles = useInventoryDashboardStyles();
  const navigate = useNavigate();

  // Fetch Products: Offline-First Cache (<5ms)
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  // Fetch Stock Movements: Offline-First Cache (<5ms)
  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: () => posApi.fetchStockMovements(),
  });

  const vendors = vendorStorage.getVendors();
  const totalVendorPayables = vendors.reduce((acc, v) => acc + (v.openingBalance || 0), 0);

  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  // Filter tab: Store-Wide vs Fast Food Kitchen vs Retail Mini Mart
  const [inventoryTab, setInventoryTab] = React.useState<'all' | 'fastfood' | 'minimart'>(() => {
    if (hasFastFood && !hasOmnimart) return 'fastfood';
    if (!hasFastFood && hasOmnimart) return 'minimart';
    return 'all';
  });

  // Base products filtered by license
  const licensedProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (!hasFastFood && (p.module === 'fastfood' || p.itemRole === 'raw_ingredient')) return false;
      if (!hasOmnimart && (p.module === 'minimart' || p.itemRole === 'retail_product')) return false;
      return true;
    });
  }, [products, hasFastFood, hasOmnimart]);

  // Filter products based on selected tab
  const displayedProducts = React.useMemo(() => {
    if (inventoryTab === 'fastfood') {
      return licensedProducts.filter(
        (p) =>
          p.module === 'fastfood' ||
          p.itemRole === 'raw_ingredient' ||
          p.itemRole === 'food_menu' ||
          ['Burger', 'Pizza', 'Sides', 'Beverages', 'Fast Food', 'Snacks', 'Food', 'Kitchen', 'Raw Materials'].includes(p.category)
      );
    }
    if (inventoryTab === 'minimart') {
      return licensedProducts.filter(
        (p) =>
          (p.module === 'minimart' || p.itemRole === 'retail_product') &&
          p.itemRole !== 'raw_ingredient'
      );
    }
    return licensedProducts;
  }, [licensedProducts, inventoryTab]);

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
      {/* ── Inventory Department Overview Tabs ─�    <div className={styles.scopeBar}>
        <div className={styles.scopeLeft}>
          <span className={styles.scopeLabel}>
            Inventory Scope:
          </span>
          {hasFastFood && hasOmnimart ? (
            <div className={styles.scopeTabList}>
              <button
                type="button"
                onClick={() => setInventoryTab('all')}
                className={mergeClasses(styles.scopeBtn, inventoryTab === 'all' && styles.scopeBtnActive)}
              >
                <span>Store-Wide Overview</span>
                <span className={mergeClasses(styles.scopeBtnBadge, inventoryTab === 'all' && styles.scopeBtnBadgeActive)}>
                  {licensedProducts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setInventoryTab('fastfood')}
                className={mergeClasses(styles.scopeBtn, inventoryTab === 'fastfood' && styles.scopeBtnActive)}
              >
                <Food24Regular className={styles.icon15Neutral} />
                <span>Kitchen &amp; Fast Food Raw Stock</span>
                <span className={mergeClasses(styles.scopeBtnBadge, inventoryTab === 'fastfood' && styles.scopeBtnBadgeActive)}>
                  {licensedProducts.filter((p) => p.module === 'fastfood' || p.itemRole === 'raw_ingredient').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setInventoryTab('minimart')}
                className={mergeClasses(styles.scopeBtn, inventoryTab === 'minimart' && styles.scopeBtnActive)}
              >
                <ShoppingBag24Regular className={styles.icon15Neutral} />
                <span>Retail Mini Mart Goods</span>
                <span className={mergeClasses(styles.scopeBtnBadge, inventoryTab === 'minimart' && styles.scopeBtnBadgeActive)}>
                  {licensedProducts.filter((p) => (p.module === 'minimart' || p.itemRole === 'retail_product') && p.itemRole !== 'raw_ingredient').length}
                </span>
              </button>
            </div>
          ) : (
            <div className={styles.scopeSingleChip}>
              {hasFastFood ? <Food24Regular className={styles.icon15Red} /> : <ShoppingBag24Regular className={styles.icon15Blue} />}
              <span>{hasFastFood ? 'Kitchen & Fast Food Raw Stock' : 'Retail Mini Mart Goods'}</span>
              <span className={styles.scopeCountChip}>
                {licensedProducts.length} items
              </span>
            </div>
          )}
        </div>

        <div className={styles.scopeRight}>
          <span>Showing <strong>{displayedProducts.length}</strong> items in scope</span>
        </div>
      </div>  </div>

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
