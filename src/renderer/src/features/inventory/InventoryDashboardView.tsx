import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import {
  ArrowCircleDown20Regular,
  ArrowCircleUp20Regular,
  ArrowRight16Regular,
  CalendarClock20Regular,
  DocumentTableSearch20Regular,
  PeopleCommunity20Regular,
  ShoppingBag20Regular,
  Warning20Regular,
  ArrowTrendingDown20Regular,
  History20Regular,
  ChevronRight16Regular,
} from '@fluentui/react-icons';
import { KpiTile } from '@/components/win11';
import { posApi } from '@/lib/api';
import type { OrderRefund, Product, StockMovement } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { getAlertLimit, getStockStatus } from '@/lib/stockStatus';
import {
  expiryRisk,
  isLiveMovement,
  netSoldSince,
  startOfMonth,
  startOfToday,
  stockFlowsSince,
  suggestedReorderQty,
} from '@/lib/inventoryInsights';
import { vendorStorage } from './vendorStorage';

/**
 * Inventory Dashboard: the day-to-day stock work. What to reorder (and how much), which batches are
 * about to expire, what was lost this month, what was bought, what is owed to suppliers and what
 * moved today. Product-level health (value, margins, dead stock, data gaps) is on Catalog Overview.
 */

const DAY = 86_400_000;
const LOOKBACK_DAYS = 30;
const COVER_DAYS = 14;
const LIST_LIMIT = 8;

const useStyles = makeStyles({
  page: { display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 },
  deptBar: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' },
  actions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' },
  action: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    cursor: 'pointer',
    color: tokens.colorNeutralForeground1,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  actionText: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 },
  actionTitle: { fontWeight: tokens.fontWeightSemibold },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '12px' },
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
  cardHead: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground1,
  },
  sub: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 6px',
    borderRadius: tokens.borderRadiusMedium,
    ':hover': { backgroundColor: tokens.colorSubtleBackgroundHover },
  },
  clickable: { cursor: 'pointer' },
  rowMain: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  name: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  right: { display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', color: tokens.colorNeutralForeground2 },
  empty: { padding: '18px 6px', color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  danger: { color: tokens.colorPaletteRedForeground1 },
  warn: { color: tokens.colorPaletteMarigoldForeground1 },
  success: { color: tokens.colorPaletteGreenForeground1 },
  summaryLine: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    padding: '6px',
    color: tokens.colorNeutralForeground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
});

const fmtQ = (n: number) => Number((Number(n) || 0).toFixed(3)).toLocaleString();

function Section({
  title,
  subtitle,
  icon,
  count,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const styles = useStyles();
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.cardTitle}>
            {icon}
            {title}
            {!!count && (
              <Badge appearance="tint" size="small">
                {count}
              </Badge>
            )}
          </div>
          <div className={styles.sub}>{subtitle}</div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ShowMore({ total, expanded, onToggle }: { total: number; expanded: boolean; onToggle: () => void }) {
  if (total <= LIST_LIMIT) return null;
  return (
    <Button size="small" appearance="subtle" style={{ alignSelf: 'flex-start' }} onClick={onToggle}>
      {expanded ? 'Show less' : `Show all ${total}`}
    </Button>
  );
}

export function InventoryDashboardView(): React.JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');
  const [dept, setDept] = useState<'all' | 'fastfood' | 'minimart'>('all');
  const [showAllReorder, setShowAllReorder] = useState(false);
  const [showAllExpiry, setShowAllExpiry] = useState(false);

  const { data: products = [], isLoading } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => posApi.fetchProducts() });
  const { data: movements = [] } = useQuery<StockMovement[]>({ queryKey: ['stock-movements'], queryFn: () => posApi.fetchStockMovements() });
  const { data: refunds = [] } = useQuery<OrderRefund[]>({ queryKey: ['refunds'], queryFn: () => posApi.fetchRefunds() });
  const { data: batches = [] } = useQuery({ queryKey: ['open-batches'], queryFn: () => posApi.fetchOpenBatches() });
  // The layout refreshes this cache from the backend and re-mounts the page afterwards
  const vendors = vendorStorage.getVendors();

  const view = useMemo(() => {
    const now = Date.now();
    const inScope = (module?: string) =>
      (module === 'fastfood' ? hasFastFood : hasOmnimart) && (dept === 'all' || (dept === 'fastfood' ? module === 'fastfood' : module !== 'fastfood'));
    const scoped = products.filter((p) => inScope(p.module));
    const ids = new Set(scoped.map((p) => p.id));
    const scopedMoves = movements.filter((m) => ids.has(m.productId) || inScope(m.module));

    // Reorder: out / low items with how much to order for COVER_DAYS of sales
    const sold = netSoldSince(scopedMoves, refunds, now - LOOKBACK_DAYS * DAY);
    const reorder = scoped
      .filter((p) => {
        const s = getStockStatus(p);
        return s === 'out' || s === 'low';
      })
      .map((p) => {
        const soldQty = sold.get(p.id) || 0;
        const stock = Math.max(0, Number(p.openingStock) || 0);
        const daily = soldQty / LOOKBACK_DAYS;
        return {
          p,
          stock,
          limit: getAlertLimit(p) ?? 0,
          daily,
          daysLeft: daily > 0 ? Math.floor(stock / daily) : null,
          order: suggestedReorderQty(p, soldQty, LOOKBACK_DAYS, COVER_DAYS),
        };
      })
      .sort((a, b) => (a.stock === 0 ? -1 : 0) - (b.stock === 0 ? -1 : 0) || (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999));
    const reorderCost = reorder.reduce((s, r) => s + r.order * Number(r.p.costPrice || 0), 0);

    const expiry = expiryRisk(scoped, batches, 90, now);
    const expired = expiry.filter((e) => e.days < 0);
    const soon30 = expiry.filter((e) => e.days >= 0 && e.days <= 30);

    const month = stockFlowsSince(scopedMoves, startOfMonth());
    const today = startOfToday();
    const todayMoves = scopedMoves.filter((m) => isLiveMovement(m) && new Date(m.date).getTime() >= today);
    const todayIn = todayMoves.filter((m) => m.type === 'in').reduce((s, m) => s + (Number(m.quantity) || 0) * Number(m.unitCost || 0), 0);
    const todayOut = todayMoves.filter((m) => m.type === 'out').reduce((s, m) => s + (Number(m.quantity) || 0) * Number(m.unitCost || 0), 0);
    const recent = [...scopedMoves].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    return {
      reorder,
      reorderCost,
      outCount: reorder.filter((r) => r.stock === 0).length,
      expiry,
      expiredCount: expired.length,
      expiredValue: expired.reduce((s, e) => s + e.value, 0),
      soon30Value: soon30.reduce((s, e) => s + e.value, 0),
      month,
      todayMoves,
      todayIn,
      todayOut,
      recent,
      unitOf: (id: string) => products.find((p) => p.id === id)?.unit || 'units',
    };
  }, [products, movements, refunds, batches, dept, hasFastFood, hasOmnimart]);

  const owed = vendors
    .map((v) => ({ v, balance: vendorStorage.getBalance(v) }))
    .filter((x) => x.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const totalOwed = owed.reduce((s, x) => s + x.balance, 0);

  if (isLoading && products.length === 0) {
    return <TablePageSkeleton title="Inventory Dashboard" hasMetrics={true} />;
  }

  const shrinkPct = view.month.purchasesValue > 0 ? Math.round((view.month.lossValue / view.month.purchasesValue) * 1000) / 10 : null;
  const reorderRows = showAllReorder ? view.reorder : view.reorder.slice(0, LIST_LIMIT);
  const expiryRows = showAllExpiry ? view.expiry : view.expiry.slice(0, LIST_LIMIT);
  const openProduct = (id: string) => navigate(`/catalog/products/${id}`, { state: { from: location.pathname } });

  return (
    <div className={styles.page}>
      {hasFastFood && hasOmnimart && (
        <div className={styles.deptBar}>
          {(
            [
              ['all', 'All departments'],
              ['minimart', 'Retail'],
              ['fastfood', 'Kitchen & Fast Food'],
            ] as const
          ).map(([k, label]) => (
            <Button key={k} size="small" appearance={dept === k ? 'primary' : 'secondary'} onClick={() => setDept(k)}>
              {label}
            </Button>
          ))}
        </div>
      )}

      {/* ── Key numbers ── */}
      <div className={styles.kpis}>
        <KpiTile
          label="Reorder now"
          value={view.reorder.length}
          tone={view.outCount > 0 ? 'danger' : view.reorder.length > 0 ? 'warning' : 'success'}
          icon={<Warning20Regular />}
          footer={<span>{view.outCount} out of stock · about {formatPKR(Math.round(view.reorderCost))} to restock</span>}
        />
        <KpiTile
          label="Expiry risk"
          value={view.expiry.length}
          tone={view.expiredCount > 0 ? 'danger' : view.expiry.length > 0 ? 'warning' : 'success'}
          icon={<CalendarClock20Regular />}
          footer={
            <span>
              {view.expiredCount} expired ({formatPKR(Math.round(view.expiredValue))}) · {formatPKR(Math.round(view.soon30Value))} within 30 days
            </span>
          }
        />
        <KpiTile
          label="Purchases this month"
          value={formatPKR(Math.round(view.month.purchasesValue))}
          icon={<ShoppingBag20Regular />}
          footer={<span>{view.month.purchasesEntries} receipts at cost</span>}
        />
        <KpiTile
          label="Stock lost this month"
          value={formatPKR(Math.round(view.month.lossValue + view.month.countLossValue))}
          tone={view.month.lossValue + view.month.countLossValue > 0 ? 'danger' : 'success'}
          icon={<ArrowTrendingDown20Regular />}
          footer={<span>{shrinkPct !== null ? `${shrinkPct}% of purchases · ` : ''}damage, expiry, missing</span>}
        />
        <KpiTile
          label="Owed to suppliers"
          value={formatPKR(Math.round(totalOwed))}
          tone={totalOwed > 0 ? 'warning' : 'success'}
          icon={<PeopleCommunity20Regular />}
          footer={<span>{owed.length} supplier{owed.length === 1 ? '' : 's'} with a balance</span>}
        />
      </div>

      {/* ── Quick actions ── */}
      <div className={styles.actions}>
        {(
          [
            ['/inventory/stock-in', <ArrowCircleDown20Regular key="i" className={styles.success} />, 'Stock in', 'Receive a delivery'],
            ['/inventory/stock-out', <ArrowCircleUp20Regular key="o" className={styles.danger} />, 'Stock out', 'Damage, expiry, returns'],
            ['/inventory/vendors', <PeopleCommunity20Regular key="v" />, 'Suppliers', `${vendors.length} registered`],
            ['/inventory/ledger', <DocumentTableSearch20Regular key="l" />, 'Movement ledger', 'Every entry with balance'],
          ] as const
        ).map(([to, icon, title, sub]) => (
          <div key={to} className={styles.action} role="button" tabIndex={0} onClick={() => navigate(to)} onKeyDown={(e) => e.key === 'Enter' && navigate(to)}>
            {icon}
            <div className={styles.actionText}>
              <span className={styles.actionTitle}>{title}</span>
              <span className={styles.sub}>{sub}</span>
            </div>
            <ArrowRight16Regular />
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Reorder */}
        <Section
          title="Reorder now"
          subtitle={`Out or at the alert limit. Order covers ${COVER_DAYS} days of the last ${LOOKBACK_DAYS} days' sales plus the alert level.`}
          icon={<Warning20Regular />}
          count={view.reorder.length}
        >
          {view.reorder.length === 0 ? (
            <div className={styles.empty}>Nothing to reorder: every item is above its alert limit.</div>
          ) : (
            <>
              {reorderRows.map((r) => (
                <div key={r.p.id} className={styles.row}>
                  <div className={mergeClasses(styles.rowMain, styles.clickable)} onClick={() => openProduct(r.p.id)}>
                    <span className={styles.name}>{r.p.name}</span>
                    <span className={styles.sub}>
                      <span className={r.stock === 0 ? styles.danger : styles.warn}>
                        {r.stock === 0 ? 'Out of stock' : `${fmtQ(r.stock)} ${r.p.unit || 'units'} left`}
                      </span>
                      {' · '}alert {fmtQ(r.limit)}
                      {r.daily > 0 ? ` · sells ${fmtQ(Math.round(r.daily * 10) / 10)}/day` : ' · no recent sales'}
                      {r.daysLeft !== null && r.stock > 0 ? ` · ~${r.daysLeft}d left` : ''}
                    </span>
                  </div>
                  <div className={styles.right}>
                    <Button
                      size="small"
                      appearance="primary"
                      onClick={() =>
                        navigate('/inventory/stock-in', {
                          state: { productName: r.p.name, productId: r.p.id, costPrice: r.p.costPrice, quantity: r.order },
                        })
                      }
                    >
                      Order {fmtQ(r.order)}
                    </Button>
                  </div>
                </div>
              ))}
              <ShowMore total={view.reorder.length} expanded={showAllReorder} onToggle={() => setShowAllReorder((v) => !v)} />
            </>
          )}
        </Section>

        {/* Expiry */}
        <Section
          title="Expiring stock"
          subtitle="Batches in stock that expire within 90 days, or already have. Sell first, return to supplier, or write off."
          icon={<CalendarClock20Regular />}
          count={view.expiry.length}
          action={
            <Button size="small" appearance="secondary" onClick={() => navigate('/inventory/stock-out')}>
              Stock out
            </Button>
          }
        >
          {view.expiry.length === 0 ? (
            <div className={styles.empty}>Nothing in stock expires in the next 90 days.</div>
          ) : (
            <>
              {expiryRows.map((e) => (
                <div key={e.key} className={mergeClasses(styles.row, styles.clickable)} onClick={() => openProduct(e.productId)}>
                  <div className={styles.rowMain}>
                    <span className={styles.name}>{e.name}</span>
                    <span className={styles.sub}>
                      {e.batch ? `Batch ${e.batch} · ` : ''}
                      {fmtQ(e.qty)} {view.unitOf(e.productId)} · {formatPKR(Math.round(e.value))} at cost
                    </span>
                  </div>
                  <div className={styles.right}>
                    <Badge appearance="tint" color={e.days < 0 ? 'danger' : e.days <= 30 ? 'warning' : 'informative'}>
                      {e.days < 0 ? `Expired ${Math.abs(e.days)}d ago` : e.days === 0 ? 'Expires today' : `${e.days} days left`}
                    </Badge>
                    <ChevronRight16Regular />
                  </div>
                </div>
              ))}
              <ShowMore total={view.expiry.length} expanded={showAllExpiry} onToggle={() => setShowAllExpiry((v) => !v)} />
            </>
          )}
        </Section>

        {/* This month */}
        <Section title="This month at cost" subtitle="What came in and what left the shelf other than sales" icon={<ShoppingBag20Regular />}>
          <div className={styles.row}>
            <span>Purchases received</span>
            <span className={styles.success}>+{formatPKR(Math.round(view.month.purchasesValue))}</span>
          </div>
          <div className={styles.row}>
            <span>Customer returns back on the shelf</span>
            <span className={styles.success}>+{formatPKR(Math.round(view.month.customerReturnsValue))}</span>
          </div>
          <div className={styles.row}>
            <span>Cost of goods sold</span>
            <span>-{formatPKR(Math.round(view.month.salesCostValue))}</span>
          </div>
          <div className={styles.row}>
            <span>Returned to suppliers</span>
            <span>-{formatPKR(Math.round(view.month.vendorReturnsValue))}</span>
          </div>
          <div className={styles.row}>
            <span>Internal use (store use, samples…)</span>
            <span>-{formatPKR(Math.round(view.month.usageValue))}</span>
          </div>
          <div className={styles.row}>
            <span>Stock count corrections</span>
            <span>
              {view.month.countGainValue > 0 ? <span className={styles.success}>+{formatPKR(Math.round(view.month.countGainValue))} </span> : null}
              <span className={view.month.countLossValue > 0 ? styles.danger : undefined}>-{formatPKR(Math.round(view.month.countLossValue))}</span>
            </span>
          </div>
          <div className={styles.summaryLine}>
            <strong>Loss / write-off</strong>
            <strong className={view.month.lossValue > 0 ? styles.danger : undefined}>-{formatPKR(Math.round(view.month.lossValue))}</strong>
          </div>
          {view.month.losses.map((l) => (
            <div key={l.reason} className={styles.row}>
              <span className={styles.sub}>
                {l.label} · {l.entries} entr{l.entries === 1 ? 'y' : 'ies'} · {fmtQ(l.units)} units
              </span>
              <span className={styles.danger}>-{formatPKR(Math.round(l.value))}</span>
            </div>
          ))}
        </Section>

        {/* Today + suppliers */}
        <Section
          title="Today"
          subtitle={`${view.todayMoves.length} stock entr${view.todayMoves.length === 1 ? 'y' : 'ies'} · in ${formatPKR(Math.round(view.todayIn))} · out ${formatPKR(Math.round(view.todayOut))} at cost`}
          icon={<History20Regular />}
          action={
            <Button size="small" appearance="secondary" onClick={() => navigate('/inventory/ledger')}>
              Ledger
            </Button>
          }
        >
          {view.recent.length === 0 ? (
            <div className={styles.empty}>No stock movements yet.</div>
          ) : (
            view.recent.map((m) => {
              const isIn = m.type === 'in';
              const d = new Date(m.date);
              const isToday = d.getTime() >= startOfToday();
              return (
                <div key={m.id} className={mergeClasses(styles.row, styles.clickable)} onClick={() => navigate('/inventory/ledger')}>
                  <div className={styles.rowMain}>
                    <span className={styles.name}>{m.productName}</span>
                    <span className={styles.sub}>
                      {m.reason || (isIn ? 'Stock in' : 'Stock out')}
                      {' · '}
                      {isToday ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString()}
                      {m.reversedAt ? ' · reversed' : ''}
                    </span>
                  </div>
                  <div className={styles.right}>
                    <span className={isIn ? styles.success : styles.danger}>
                      {isIn ? '+' : '-'}
                      {fmtQ(Number(m.quantity) || 0)} {view.unitOf(m.productId)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {owed.length > 0 && (
            <>
              <div className={styles.summaryLine}>
                <strong>Owed to suppliers</strong>
                <strong>{formatPKR(Math.round(totalOwed))}</strong>
              </div>
              {owed.slice(0, 4).map(({ v, balance }) => (
                <div key={v.id} className={mergeClasses(styles.row, styles.clickable)} onClick={() => navigate('/inventory/vendors')}>
                  <span className={styles.name}>{v.companyName || v.name}</span>
                  <span className={styles.warn}>{formatPKR(Math.round(balance))}</span>
                </div>
              ))}
            </>
          )}
        </Section>
      </div>
    </div>
  );
}
