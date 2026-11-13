import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import {
  Add20Regular,
  BoxMultiple20Regular,
  CalendarClock20Regular,
  Money20Regular,
  Warning20Regular,
  ArrowTrendingLines20Regular,
  ArchiveClock20Regular,
  ClipboardTaskListLtr20Regular,
  ChevronRight16Regular,
} from '@fluentui/react-icons';
import { KpiTile, PageHeader } from '@/components/win11';
import { posApi } from '@/lib/api';
import type { Order, OrderRefund, Product } from '@shared/types';
import { getStockStatus, lowStockLimit } from '@/lib/stockStatus';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { resolveStoreModules } from '@/lib/categoryProfiles';
import { formatPKR } from '@/lib/utils';
import { expiryRisk } from '@/lib/inventoryInsights';

/**
 * Catalog overview: what needs attention in the product list (restock, expiry, dead stock,
 * missing data) and what it is worth. The product list itself lives on the department pages.
 */

const DAY = 86_400_000;
const LIST_LIMIT = 6;

const useStyles = makeStyles({
  // The app's main area does not scroll; each page scrolls itself
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px 32px 32px',
    minWidth: 0,
    height: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '12px' },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    minWidth: 0,
  },
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  cardSub: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 6px',
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    ':hover': { backgroundColor: tokens.colorSubtleBackgroundHover },
  },
  rowMain: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  rowName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowMeta: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  rowRight: { display: 'flex', alignItems: 'center', gap: '8px', color: tokens.colorNeutralForeground2, whiteSpace: 'nowrap' },
  empty: { padding: '18px 6px', color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  more: { alignSelf: 'flex-start' },
  catRow: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) 60px 70px minmax(0, 1fr)', alignItems: 'center', gap: '10px', padding: '6px' },
  barTrack: { height: '8px', borderRadius: '4px', backgroundColor: tokens.colorNeutralBackground4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: tokens.colorBrandBackground, borderRadius: '4px' },
  num: { textAlign: 'right', color: tokens.colorNeutralForeground2, fontVariantNumeric: 'tabular-nums' },
  deptBar: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  danger: { color: tokens.colorPaletteRedForeground1 },
  warn: { color: tokens.colorPaletteMarigoldForeground1 },
});

interface Row {
  key: string;
  productId: string;
  name: string;
  meta: string;
  right: React.ReactNode;
}

function AttentionCard({
  title,
  subtitle,
  icon,
  rows,
  emptyText,
  action,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  rows: Row[];
  emptyText: string;
  action?: React.ReactNode;
}) {
  const styles = useStyles();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, LIST_LIMIT);
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}>
            {icon}
            {title}
            {rows.length > 0 && (
              <Badge appearance="tint" size="small">
                {rows.length}
              </Badge>
            )}
          </div>
          <div className={styles.cardSub}>{subtitle}</div>
        </div>
        {action}
      </div>
      {rows.length === 0 ? (
        <div className={styles.empty}>{emptyText}</div>
      ) : (
        <div>
          {shown.map((r) => (
            <div
              key={r.key}
              className={styles.row}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/catalog/products/${r.productId}`, { state: { from: '/catalog' } })}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/catalog/products/${r.productId}`, { state: { from: '/catalog' } })}
            >
              <div className={styles.rowMain}>
                <span className={styles.rowName}>{r.name}</span>
                <span className={styles.rowMeta}>{r.meta}</span>
              </div>
              <div className={styles.rowRight}>
                {r.right}
                <ChevronRight16Regular />
              </div>
            </div>
          ))}
        </div>
      )}
      {rows.length > LIST_LIMIT && (
        <Button size="small" appearance="subtle" className={styles.more} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `Show all ${rows.length}`}
        </Button>
      )}
    </section>
  );
}

const fmtQty = (n: number) => Number(n.toFixed(3)).toLocaleString();

export function CatalogDashboardView(): React.JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const { can, businessProfiles = ['standard', 'food'] } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');
  const storeMod = useMemo(() => resolveStoreModules(hasFastFood, hasOmnimart, businessProfiles), [hasFastFood, hasOmnimart, businessProfiles]);
  const retailLabel = storeMod.shortRetailLabel === 'Mart' ? 'Mart' : storeMod.shortRetailLabel;
  const [dept, setDept] = useState<'all' | 'fastfood' | 'minimart'>('all');

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => posApi.fetchProducts() });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ['orders'], queryFn: () => posApi.fetchOrders() });
  const { data: refunds = [] } = useQuery<OrderRefund[]>({ queryKey: ['refunds'], queryFn: () => posApi.fetchRefunds() });
  const { data: batches = [] } = useQuery({ queryKey: ['open-batches'], queryFn: () => posApi.fetchOpenBatches() });

  const view = useMemo(() => {
    const now = Date.now();
    const allowed = products.filter(
      (p) =>
        (p.module === 'fastfood' ? hasFastFood : hasOmnimart) &&
        (dept === 'all' || p.module === dept) &&
        (p as any).isActive !== false
    );
    const byId = new Map(allowed.map((p) => [p.id, p]));

    // Sales per product: last sale date, units and revenue in the last 30 days (returns taken off)
    const lastSold = new Map<string, number>();
    const sold30 = new Map<string, { qty: number; revenue: number }>();
    const since30 = now - 30 * DAY;
    for (const o of orders) {
      if (o.stage === 'cart' || o.stage === 'kot') continue;
      const t = new Date(o.createdAt).getTime();
      const factor =
        (o.lines || []).reduce((s, l) => s + Number(l.unitPrice || 0) * Number(l.quantity || 0), 0) > 0
          ? Number(o.totalAmount || 0) / (o.lines || []).reduce((s, l) => s + Number(l.unitPrice || 0) * Number(l.quantity || 0), 0)
          : 1;
      for (const l of o.lines || []) {
        if (!l.productId || !byId.has(l.productId)) continue;
        lastSold.set(l.productId, Math.max(lastSold.get(l.productId) || 0, t));
        if (t >= since30) {
          const e = sold30.get(l.productId) || { qty: 0, revenue: 0 };
          e.qty += Number(l.quantity || 0);
          e.revenue += Number(l.unitPrice || 0) * Number(l.quantity || 0) * factor;
          sold30.set(l.productId, e);
        }
      }
    }
    for (const r of refunds) {
      if (new Date(r.createdAt).getTime() < since30) continue;
      let items: any[] = [];
      try {
        items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items || [];
      } catch {
        items = [];
      }
      for (const it of items) {
        const e = it?.productId && sold30.get(it.productId);
        if (e) {
          e.qty = Math.max(0, e.qty - Number(it.quantity || 0));
          e.revenue = Math.max(0, e.revenue - Number(it.unitPrice || 0) * Number(it.quantity || 0));
        }
      }
    }

    // Value and stock health
    let units = 0;
    let costValue = 0;
    let retailValue = 0;
    let missingCostUnits = 0;
    const out: Product[] = [];
    const low: Product[] = [];
    for (const p of allowed) {
      const status = getStockStatus(p);
      if (status === 'untracked') continue;
      const stock = Math.max(0, Number(p.openingStock) || 0);
      units += stock;
      retailValue += stock * Number(p.price || 0);
      if (Number(p.costPrice) > 0) costValue += stock * Number(p.costPrice);
      else if (stock > 0) missingCostUnits += stock;
      if (status === 'out') out.push(p);
      if (status === 'low') low.push(p);
    }
    const margin = retailValue > 0 && costValue > 0 ? Math.round(((retailValue - costValue) / retailValue) * 100) : null;

    const lastSoldText = (id: string) => {
      const t = lastSold.get(id);
      if (!t) return 'never sold';
      const d = Math.floor((now - t) / DAY);
      return d === 0 ? 'sold today' : `last sold ${d}d ago`;
    };

    const restock: Row[] = [...out, ...low].map((p) => ({
      key: p.id,
      productId: p.id,
      name: p.name,
      meta: `${p.category} · ${lastSoldText(p.id)}`,
      right: (
        <span className={getStockStatus(p) === 'out' ? styles.danger : styles.warn}>
          {getStockStatus(p) === 'out' ? 'Out of stock' : `${fmtQty(Number(p.openingStock))} left · alert ${fmtQty(lowStockLimit(p))}`}
        </span>
      ),
    }));

    // Expiry: batch by batch (same rule as the Inventory Dashboard)
    const exp = expiryRisk(allowed, batches, 90, now);
    const expired = exp.filter((e) => e.days < 0);
    const expiringValue = exp.filter((e) => e.days <= 30).reduce((s, e) => s + e.value, 0);
    const expiryRows: Row[] = exp.map((e) => ({
      key: e.key,
      productId: e.productId,
      name: e.name,
      meta: `${e.batch ? `Batch ${e.batch} · ` : ''}${fmtQty(e.qty)} units`,
      right: (
        <Badge appearance="tint" color={e.days < 0 ? 'danger' : e.days <= 30 ? 'warning' : 'informative'}>
          {e.days < 0 ? `Expired ${Math.abs(e.days)}d ago` : e.days === 0 ? 'Expires today' : `${e.days} days left`}
        </Badge>
      ),
    }));

    // Top sellers (30 days)
    const top: Row[] = Array.from(sold30.entries())
      .filter(([, v]) => v.qty > 0)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([id, v]) => {
        const p = byId.get(id)!;
        return {
          key: id,
          productId: id,
          name: p.name,
          meta: `${fmtQty(v.qty)} sold · ${fmtQty(Math.max(0, Number(p.openingStock) || 0))} in stock`,
          right: <span>{formatPKR(Math.round(v.revenue))}</span>,
        };
      });

    // Dead stock: in stock, nothing sold for 60 days (items newer than 60 days are left out)
    const since60 = now - 60 * DAY;
    const dead: Row[] = allowed
      .filter((p) => Number(p.openingStock) > 0 && (lastSold.get(p.id) || 0) < since60 && new Date(p.createdAt || 0).getTime() < since60)
      .map((p) => ({ p, value: Number(p.openingStock) * Number(p.costPrice || p.price || 0) }))
      .sort((a, b) => b.value - a.value)
      .map(({ p, value }) => ({
        key: p.id,
        productId: p.id,
        name: p.name,
        meta: `${fmtQty(Number(p.openingStock))} units · ${lastSoldText(p.id)}`,
        right: <span>{formatPKR(Math.round(value))}</span>,
      }));

    // Missing data that breaks costing, scanning or alerts
    const gaps: Row[] = allowed
      .map((p) => {
        const missing: string[] = [];
        if (!(Number(p.price) > 0)) missing.push('price');
        if (getStockStatus(p) !== 'untracked' && !(Number(p.costPrice) > 0)) missing.push('cost price');
        if (p.module === 'minimart' && !p.barcode && !p.skuCode) missing.push('barcode / SKU');
        if (!p.category || p.category === 'General') missing.push('category');
        return { p, missing };
      })
      .filter((x) => x.missing.length > 0)
      .map(({ p, missing }) => ({
        key: p.id,
        productId: p.id,
        name: p.name,
        meta: `Missing ${missing.join(', ')}`,
        right: <Badge appearance="tint" color="warning">{missing.length}</Badge>,
      }));

    // Categories by stock value at cost
    const cats = new Map<string, { items: number; units: number; value: number }>();
    for (const p of allowed) {
      const c = cats.get(p.category || 'General') || { items: 0, units: 0, value: 0 };
      c.items += 1;
      const stock = Math.max(0, Number(p.openingStock) || 0);
      c.units += stock;
      c.value += stock * Number(p.costPrice || p.price || 0);
      cats.set(p.category || 'General', c);
    }
    const catRows = Array.from(cats.entries()).sort((a, b) => b[1].value - a[1].value);
    const maxCat = Math.max(1, ...catRows.map(([, c]) => c.value));

    return {
      count: allowed.length,
      tracked: allowed.filter((p) => getStockStatus(p) !== 'untracked').length,
      units,
      costValue,
      retailValue,
      missingCostUnits,
      margin,
      outCount: out.length,
      lowCount: low.length,
      restock,
      expiryRows,
      expiredCount: expired.length,
      expiringValue,
      top,
      dead,
      gaps,
      catRows,
      maxCat,
    };
  }, [products, orders, refunds, batches, dept, hasFastFood, hasOmnimart, styles]);

  const listRoute = dept === 'fastfood' || (!hasOmnimart && hasFastFood) ? '/catalog/fastfood' : '/catalog/omnimart';

  return (
    <div className={styles.page}>
      <PageHeader
        title="Catalog overview"
        subtitle="Stock value, restocking, expiry and product data that needs attention"
        actions={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button appearance="secondary" icon={<BoxMultiple20Regular />} onClick={() => navigate(listRoute)}>
              Product list
            </Button>
            <Button appearance="primary" icon={<Add20Regular />} onClick={() => navigate('/catalog/new')}>
              Add product
            </Button>
          </div>
        }
      />

      {hasFastFood && hasOmnimart && (
        <div className={styles.deptBar}>
          {(
            [
              ['all', 'All departments'],
              ['minimart', retailLabel],
              ['fastfood', storeMod.fastfoodLabel],
            ] as const
          ).map(([k, label]) => (
            <Button key={k} size="small" appearance={dept === k ? 'primary' : 'secondary'} onClick={() => setDept(k)}>
              {label}
            </Button>
          ))}
        </div>
      )}

      <div className={styles.kpis}>
        <KpiTile
          label="Products"
          value={view.count}
          icon={<BoxMultiple20Regular />}
          footer={<span>{view.tracked} stock-tracked · {fmtQty(view.units)} units on hand</span>}
        />
        <KpiTile
          label="Stock value (cost)"
          value={formatPKR(Math.round(view.costValue))}
          icon={<Money20Regular />}
          footer={
            <span>
              Retail {formatPKR(Math.round(view.retailValue))}
              {view.margin !== null ? ` · ${view.margin}% margin` : ''}
              {view.missingCostUnits > 0 ? ` · ${fmtQty(view.missingCostUnits)} units without cost` : ''}
            </span>
          }
        />
        <KpiTile
          label="Restock needed"
          value={view.outCount + view.lowCount}
          tone={view.outCount > 0 ? 'danger' : view.lowCount > 0 ? 'warning' : 'success'}
          icon={<Warning20Regular />}
          footer={<span>{view.outCount} out of stock · {view.lowCount} low</span>}
        />
        <KpiTile
          label="Expiry risk"
          value={view.expiryRows.length}
          tone={view.expiredCount > 0 ? 'danger' : view.expiryRows.length > 0 ? 'warning' : 'success'}
          icon={<CalendarClock20Regular />}
          footer={
            <span>
              {view.expiredCount} expired · {formatPKR(Math.round(view.expiringValue))} at cost within 30 days
            </span>
          }
        />
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>
                <Warning20Regular />
                Stock to act on
              </div>
              <div className={styles.cardSub}>Reordering and expiring batches are handled on the Inventory Dashboard</div>
            </div>
            <Button size="small" appearance="primary" onClick={() => navigate('/inventory/dashboard')}>
              Open Inventory Dashboard
            </Button>
          </div>
          <div className={styles.row} role="button" tabIndex={0} onClick={() => navigate('/inventory/dashboard')}>
            <div className={styles.rowMain}>
              <span className={styles.rowName}>Reorder</span>
              <span className={styles.rowMeta}>{view.outCount} out of stock · {view.lowCount} at the alert limit</span>
            </div>
            <div className={styles.rowRight}>
              <Badge appearance="tint" color={view.outCount > 0 ? 'danger' : view.lowCount > 0 ? 'warning' : 'success'}>
                {view.outCount + view.lowCount}
              </Badge>
              <ChevronRight16Regular />
            </div>
          </div>
          <div className={styles.row} role="button" tabIndex={0} onClick={() => navigate('/inventory/dashboard')}>
            <div className={styles.rowMain}>
              <span className={styles.rowName}>Expiring batches (90 days)</span>
              <span className={styles.rowMeta}>
                {view.expiredCount} expired · {formatPKR(Math.round(view.expiringValue))} at cost within 30 days
              </span>
            </div>
            <div className={styles.rowRight}>
              <Badge appearance="tint" color={view.expiredCount > 0 ? 'danger' : view.expiryRows.length > 0 ? 'warning' : 'success'}>
                {view.expiryRows.length}
              </Badge>
              <ChevronRight16Regular />
            </div>
          </div>
        </section>
        <AttentionCard
          title="Top sellers"
          subtitle="Last 30 days by sales value, returns taken off"
          icon={<ArrowTrendingLines20Regular />}
          rows={view.top}
          emptyText="No sales in the last 30 days."
        />
        <AttentionCard
          title="Dead stock"
          subtitle="In stock but not sold for 60 days (value at cost)"
          icon={<ArchiveClock20Regular />}
          rows={view.dead}
          emptyText="Every item in stock has sold in the last 60 days."
        />
        <AttentionCard
          title="Incomplete product data"
          subtitle="Missing price, cost, barcode or category: affects billing, profit and alerts"
          icon={<ClipboardTaskListLtr20Regular />}
          rows={view.gaps}
          emptyText="All products have their key details."
        />

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <div className={styles.cardTitle}>
                <BoxMultiple20Regular />
                Categories
              </div>
              <div className={styles.cardSub}>Stock value at cost per category</div>
            </div>
            <Button size="small" appearance="secondary" onClick={() => navigate('/catalog/categories')}>
              Manage
            </Button>
          </div>
          {view.catRows.length === 0 ? (
            <div className={styles.empty}>No products yet.</div>
          ) : (
            view.catRows.map(([name, c]) => (
              <div key={name} className={styles.catRow}>
                <span className={styles.rowName}>{name}</span>
                <span className={mergeClasses(styles.num, styles.rowMeta)}>{c.items} items</span>
                <span className={mergeClasses(styles.num, styles.rowMeta)}>{fmtQty(c.units)} units</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div className={styles.barTrack} style={{ flex: 1 }}>
                    <div className={styles.barFill} style={{ width: `${Math.max(2, (c.value / view.maxCat) * 100)}%` }} />
                  </div>
                  <span className={styles.num} style={{ minWidth: 80 }}>{formatPKR(Math.round(c.value))}</span>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
