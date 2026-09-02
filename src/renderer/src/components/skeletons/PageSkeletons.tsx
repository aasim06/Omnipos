import React from 'react';
import {
  makeStyles,
  tokens,
  Skeleton,
  SkeletonItem,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  fullContainer: {
    padding: '28px 32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  cardContainer: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: '20px',
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
  rowItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
  },
});

/* ── 1. POS Counter Page Skeleton (Fastfood & Minimart) ─────────────── */
export function PosCounterSkeleton({ module = 'fastfood' }: { module?: 'fastfood' | 'minimart' }): React.JSX.Element {
  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', backgroundColor: tokens.colorNeutralBackground2 }}>
      {/* Left / Center Catalog Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Category Header & Search */}
        <div style={{ padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${tokens.colorNeutralStroke1}` }}>
          <Skeleton animation="wave" style={{ display: 'flex', gap: '10px' }}>
            <SkeletonItem shape="rectangle" style={{ width: '60px', height: '32px', borderRadius: '16px' }} />
            <SkeletonItem shape="rectangle" style={{ width: '80px', height: '32px', borderRadius: '16px' }} />
            <SkeletonItem shape="rectangle" style={{ width: '90px', height: '32px', borderRadius: '16px' }} />
            <SkeletonItem shape="rectangle" style={{ width: '75px', height: '32px', borderRadius: '16px' }} />
          </Skeleton>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" style={{ width: '240px', height: '36px', borderRadius: '8px' }} />
          </Skeleton>
        </div>

        {/* Catalog Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Fast Food Hero Card Skeleton */}
          {module === 'fastfood' && (
            <div style={{ backgroundColor: tokens.colorNeutralBackground1, borderRadius: '8px', padding: '24px 28px', display: 'flex', gap: '24px', boxShadow: tokens.shadow4, border: `1px solid ${tokens.colorNeutralStroke1}` }}>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" style={{ width: '110px', height: '110px', borderRadius: '8px' }} />
              </Skeleton>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Skeleton animation="wave" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <SkeletonItem shape="rectangle" style={{ width: '220px', height: '24px', borderRadius: '4px' }} />
                  <SkeletonItem shape="rectangle" style={{ width: '80px', height: '24px', borderRadius: '4px' }} />
                </Skeleton>
                <Skeleton animation="wave" style={{ display: 'flex', gap: '12px' }}>
                  <SkeletonItem shape="rectangle" style={{ width: '120px', height: '32px', borderRadius: '6px' }} />
                  <SkeletonItem shape="rectangle" style={{ width: '180px', height: '32px', borderRadius: '6px' }} />
                </Skeleton>
              </div>
            </div>
          )}

          {/* Product Cards Grid Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: tokens.colorNeutralBackground1,
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: tokens.shadow2,
                  border: `1px solid ${tokens.colorNeutralStroke1}`,
                }}
              >
                <Skeleton animation="wave">
                  <SkeletonItem shape="rectangle" style={{ width: '100%', height: '110px', borderRadius: '6px' }} />
                </Skeleton>
                <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <SkeletonItem shape="rectangle" style={{ width: '85%', height: '16px', borderRadius: '4px' }} />
                  <SkeletonItem shape="rectangle" style={{ width: '50%', height: '12px', borderRadius: '4px' }} />
                </Skeleton>
                <Skeleton animation="wave" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <SkeletonItem shape="rectangle" style={{ width: '60px', height: '16px', borderRadius: '4px' }} />
                  <SkeletonItem shape="circle" size={28} />
                </Skeleton>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Cart / Order Panel Skeleton */}
      <div style={{ width: '380px', borderLeft: `1px solid ${tokens.colorNeutralStroke1}`, backgroundColor: tokens.colorNeutralBackground1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <Skeleton animation="wave" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <SkeletonItem shape="rectangle" style={{ width: '120px', height: '24px', borderRadius: '4px' }} />
          <SkeletonItem shape="rectangle" style={{ width: '50px', height: '20px', borderRadius: '10px' }} />
        </Skeleton>

        {/* Cart Item Placeholders */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: '12px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <SkeletonItem shape="rectangle" style={{ width: '120px', height: '14px', borderRadius: '3px' }} />
                <SkeletonItem shape="rectangle" style={{ width: '70px', height: '12px', borderRadius: '3px' }} />
              </Skeleton>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" style={{ width: '50px', height: '16px', borderRadius: '3px' }} />
              </Skeleton>
            </div>
          ))}
        </div>

        {/* Bill Breakdown & Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: `1px solid ${tokens.colorNeutralStroke1}`, paddingTop: '16px' }}>
          <Skeleton animation="wave" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonItem shape="rectangle" style={{ width: '80px', height: '14px', borderRadius: '3px' }} />
            <SkeletonItem shape="rectangle" style={{ width: '60px', height: '14px', borderRadius: '3px' }} />
          </Skeleton>
          <Skeleton animation="wave" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SkeletonItem shape="rectangle" style={{ width: '100px', height: '20px', borderRadius: '4px' }} />
            <SkeletonItem shape="rectangle" style={{ width: '80px', height: '20px', borderRadius: '4px' }} />
          </Skeleton>
          <Skeleton animation="wave" style={{ marginTop: '8px' }}>
            <SkeletonItem shape="rectangle" style={{ width: '100%', height: '44px', borderRadius: '8px' }} />
          </Skeleton>
        </div>
      </div>
    </div>
  );
}

/* ── 2. Table / Ledger Page Skeleton (Inventory, Khata, Catalog) ─────── */
export function TablePageSkeleton({
  title = 'Loading Data...',
  hasMetrics = true,
  columns = 5,
}: {
  title?: string;
  hasMetrics?: boolean;
  columns?: number;
}): React.JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.fullContainer}>
      {/* Header */}
      <div className={styles.headerRow}>
        <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <SkeletonItem shape="rectangle" style={{ width: '220px', height: '24px', borderRadius: '4px' }} />
          <SkeletonItem shape="rectangle" style={{ width: '340px', height: '14px', borderRadius: '3px' }} />
        </Skeleton>
        <Skeleton animation="wave">
          <SkeletonItem shape="rectangle" style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
        </Skeleton>
      </div>

      {/* Optional Metrics Cards */}
      {hasMetrics && (
        <div className={styles.metricsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.cardContainer} style={{ padding: '16px 20px', gap: '8px' }}>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" style={{ width: '110px', height: '14px', borderRadius: '3px' }} />
              </Skeleton>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" style={{ width: '140px', height: '28px', borderRadius: '4px', marginTop: '4px' }} />
              </Skeleton>
            </div>
          ))}
        </div>
      )}

      {/* Main Table Card */}
      <div className={styles.cardContainer}>
        {/* Search / Filter bar skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton animation="wave" style={{ display: 'flex', gap: '12px' }}>
            <SkeletonItem shape="rectangle" style={{ width: '280px', height: '34px', borderRadius: '6px' }} />
            <SkeletonItem shape="rectangle" style={{ width: '140px', height: '34px', borderRadius: '6px' }} />
          </Skeleton>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" style={{ width: '120px', height: '16px', borderRadius: '3px' }} />
          </Skeleton>
        </div>

        {/* Rows skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.rowItem}>
              <Skeleton animation="wave" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <SkeletonItem shape="square" size={36} style={{ borderRadius: '6px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <SkeletonItem shape="rectangle" style={{ width: '160px', height: '15px', borderRadius: '3px' }} />
                  <SkeletonItem shape="rectangle" style={{ width: '90px', height: '11px', borderRadius: '3px' }} />
                </div>
              </Skeleton>
              <Skeleton animation="wave" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <SkeletonItem shape="rectangle" style={{ width: '80px', height: '14px', borderRadius: '3px' }} />
                <SkeletonItem shape="rectangle" style={{ width: '70px', height: '22px', borderRadius: '11px' }} />
                <SkeletonItem shape="circle" size={28} />
              </Skeleton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 3. Kitchen KDS Page Skeleton ───────────────────────────────────── */
export function KitchenPageSkeleton(): React.JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.fullContainer}>
      <div className={styles.headerRow}>
        <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <SkeletonItem shape="rectangle" style={{ width: '260px', height: '24px', borderRadius: '4px' }} />
          <SkeletonItem shape="rectangle" style={{ width: '320px', height: '14px', borderRadius: '3px' }} />
        </Skeleton>
        <Skeleton animation="wave" style={{ display: 'flex', gap: '10px' }}>
          <SkeletonItem shape="rectangle" style={{ width: '90px', height: '28px', borderRadius: '14px' }} />
          <SkeletonItem shape="rectangle" style={{ width: '90px', height: '28px', borderRadius: '14px' }} />
        </Skeleton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.cardContainer} style={{ minHeight: '260px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <SkeletonItem shape="rectangle" style={{ width: '90px', height: '18px', borderRadius: '4px' }} />
                <SkeletonItem shape="rectangle" style={{ width: '60px', height: '12px', borderRadius: '3px' }} />
              </Skeleton>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" style={{ width: '80px', height: '22px', borderRadius: '11px' }} />
              </Skeleton>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" style={{ width: '100%', height: '32px', borderRadius: '4px' }} />
              </Skeleton>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" style={{ width: '100%', height: '32px', borderRadius: '4px' }} />
              </Skeleton>
            </div>

            <Skeleton animation="wave">
              <SkeletonItem shape="rectangle" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
            </Skeleton>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 4. Reports & Analytics Page Skeleton ────────────────────────────── */
export function ReportsPageSkeleton(): React.JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.fullContainer}>
      <div className={styles.headerRow}>
        <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <SkeletonItem shape="rectangle" style={{ width: '280px', height: '24px', borderRadius: '4px' }} />
          <SkeletonItem shape="rectangle" style={{ width: '380px', height: '14px', borderRadius: '3px' }} />
        </Skeleton>
        <Skeleton animation="wave">
          <SkeletonItem shape="rectangle" style={{ width: '130px', height: '28px', borderRadius: '14px' }} />
        </Skeleton>
      </div>

      <div className={styles.metricsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.cardContainer} style={{ padding: '20px' }}>
            <Skeleton animation="wave" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SkeletonItem shape="circle" size={24} />
              <SkeletonItem shape="rectangle" style={{ width: '110px', height: '14px', borderRadius: '3px' }} />
            </Skeleton>
            <Skeleton animation="wave">
              <SkeletonItem shape="rectangle" style={{ width: '150px', height: '30px', borderRadius: '4px', marginTop: '6px' }} />
            </Skeleton>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className={styles.cardContainer}>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" style={{ width: '180px', height: '20px', borderRadius: '4px' }} />
          </Skeleton>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.rowItem}>
                <Skeleton animation="wave">
                  <SkeletonItem shape="rectangle" style={{ width: '140px', height: '14px', borderRadius: '3px' }} />
                </Skeleton>
                <Skeleton animation="wave">
                  <SkeletonItem shape="rectangle" style={{ width: '70px', height: '14px', borderRadius: '3px' }} />
                </Skeleton>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cardContainer}>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" style={{ width: '200px', height: '20px', borderRadius: '4px' }} />
          </Skeleton>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonItem shape="rectangle" style={{ width: '100%', height: '14px', borderRadius: '3px' }} />
              <SkeletonItem shape="rectangle" style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
            </Skeleton>
            <Skeleton animation="wave" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonItem shape="rectangle" style={{ width: '100%', height: '14px', borderRadius: '3px' }} />
              <SkeletonItem shape="rectangle" style={{ width: '100%', height: '8px', borderRadius: '4px' }} />
            </Skeleton>
          </div>
        </div>
      </div>
    </div>
  );
}
