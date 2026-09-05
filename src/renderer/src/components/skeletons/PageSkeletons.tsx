import React from 'react';
import {
  makeStyles,
  tokens,
  Skeleton,
  SkeletonItem,
  mergeClasses,
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
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
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

  /* ── Layout & Flex Helpers ── */
  flexRowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexRow: {
    display: 'flex',
    alignItems: 'center',
  },
  flexCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  flex1Col: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  flex1Hidden: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  gap4: { gap: '4px' },
  gap6: { gap: '6px' },
  gap8: { gap: '8px' },
  gap10: { gap: '10px' },
  gap12: { gap: '12px' },
  gap14: { gap: '14px' },
  gap16: { gap: '16px' },
  gap20: { gap: '20px' },
  gap24: { gap: '24px' },
  mtAuto: { marginTop: 'auto' },
  mt4: { marginTop: '4px' },
  mt6: { marginTop: '6px' },
  mt8: { marginTop: '8px' },
  mt12: { marginTop: '12px' },
  mb24: { marginBottom: '24px' },

  /* ── POS Counter Specific ── */
  posContainer: {
    display: 'flex',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  posCategoryHeader: {
    padding: '16px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  posCatalogBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  posHeroCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    padding: '24px 28px',
    display: 'flex',
    gap: '24px',
    boxShadow: tokens.shadow4,
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
  },
  posProductGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
    gap: '16px',
  },
  posProductCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: tokens.shadow2,
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
  },
  posCartPanel: {
    width: '380px',
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
  },
  posCartItemsCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  posCartItem: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  posBillBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    paddingTop: '16px',
  },

  /* ── Metric / Card Variants ── */
  metricCardPad: {
    padding: '16px 20px',
    gap: '8px',
  },
  kitchenGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  kitchenCard: {
    minHeight: '260px',
    justifyContent: 'space-between',
  },
  reportsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
  },

  /* ── Sizing Utilities for Skeleton Items ── */
  w100: { width: '100%' },
  w85p: { width: '85%' },
  w50p: { width: '50%' },
  h8: { height: '8px' },
  h11: { height: '11px' },
  h12: { height: '12px' },
  h14: { height: '14px' },
  h15: { height: '15px' },
  h16: { height: '16px' },
  h18: { height: '18px' },
  h20: { height: '20px' },
  h22: { height: '22px' },
  h24: { height: '24px' },
  h28: { height: '28px' },
  h30: { height: '30px' },
  h32: { height: '32px' },
  h34: { height: '34px' },
  h36: { height: '36px' },
  h44: { height: '44px' },
  h110: { height: '110px' },

  w50: { width: '50px' },
  w60: { width: '60px' },
  w70: { width: '70px' },
  w75: { width: '75px' },
  w80: { width: '80px' },
  w90: { width: '90px' },
  w100px: { width: '100px' },
  w110: { width: '110px' },
  w120: { width: '120px' },
  w130: { width: '130px' },
  w140: { width: '140px' },
  w150: { width: '150px' },
  w160: { width: '160px' },
  w180: { width: '180px' },
  w200: { width: '200px' },
  w220: { width: '220px' },
  w240: { width: '240px' },
  w260: { width: '260px' },
  w280: { width: '280px' },
  w320: { width: '320px' },
  w340: { width: '340px' },
  w380: { width: '380px' },

  r3: { borderRadius: '3px' },
  r4: { borderRadius: '4px' },
  r6: { borderRadius: '6px' },
  r8: { borderRadius: '8px' },
  r10: { borderRadius: '10px' },
  r11: { borderRadius: '11px' },
  r14: { borderRadius: '14px' },
  r16: { borderRadius: '16px' },
});

/* ── 1. POS Counter Page Skeleton (Fastfood & Minimart) ─────────────── */
export function PosCounterSkeleton({ module = 'fastfood' }: { module?: 'fastfood' | 'minimart' }): React.JSX.Element {
  const styles = useStyles();

  return (
    <div className={styles.posContainer}>
      {/* Left / Center Catalog Area */}
      <div className={styles.flex1Hidden}>
        {/* Category Header & Search */}
        <div className={styles.posCategoryHeader}>
          <Skeleton animation="wave" className={mergeClasses(styles.flexRow, styles.gap10)}>
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w60, styles.h32, styles.r16)} />
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w80, styles.h32, styles.r16)} />
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w90, styles.h32, styles.r16)} />
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w75, styles.h32, styles.r16)} />
          </Skeleton>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w240, styles.h36, styles.r8)} />
          </Skeleton>
        </div>

        {/* Catalog Body */}
        <div className={styles.posCatalogBody}>
          {/* Fast Food Hero Card Skeleton */}
          {module === 'fastfood' && (
            <div className={styles.posHeroCard}>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w110, styles.h110, styles.r8)} />
              </Skeleton>
              <div className={mergeClasses(styles.flex1Col, styles.gap14)}>
                <Skeleton animation="wave" className={styles.flexRowBetween}>
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w220, styles.h24, styles.r4)} />
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w80, styles.h24, styles.r4)} />
                </Skeleton>
                <Skeleton animation="wave" className={mergeClasses(styles.flexRow, styles.gap12)}>
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w120, styles.h32, styles.r6)} />
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w180, styles.h32, styles.r6)} />
                </Skeleton>
              </div>
            </div>
          )}

          {/* Product Cards Grid Skeleton */}
          <div className={styles.posProductGrid}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={styles.posProductCard}>
                <Skeleton animation="wave">
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h110, styles.r6)} />
                </Skeleton>
                <Skeleton animation="wave" className={mergeClasses(styles.flexCol, styles.gap6)}>
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w85p, styles.h16, styles.r4)} />
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w50p, styles.h12, styles.r4)} />
                </Skeleton>
                <Skeleton animation="wave" className={mergeClasses(styles.flexRowBetween, styles.mtAuto)}>
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w60, styles.h16, styles.r4)} />
                  <SkeletonItem shape="circle" size={28} />
                </Skeleton>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Cart / Order Panel Skeleton */}
      <div className={styles.posCartPanel}>
        <Skeleton animation="wave" className={mergeClasses(styles.flexRowBetween, styles.mb24)}>
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w120, styles.h24, styles.r4)} />
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w50, styles.h20, styles.r10)} />
        </Skeleton>

        {/* Cart Item Placeholders */}
        <div className={styles.posCartItemsCol}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.posCartItem}>
              <Skeleton animation="wave" className={mergeClasses(styles.flexCol, styles.gap6)}>
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w120, styles.h14, styles.r3)} />
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w70, styles.h12, styles.r3)} />
              </Skeleton>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w50, styles.h16, styles.r3)} />
              </Skeleton>
            </div>
          ))}
        </div>

        {/* Bill Breakdown & Button */}
        <div className={styles.posBillBreakdown}>
          <Skeleton animation="wave" className={styles.flexRowBetween}>
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w80, styles.h14, styles.r3)} />
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w60, styles.h14, styles.r3)} />
          </Skeleton>
          <Skeleton animation="wave" className={styles.flexRowBetween}>
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100px, styles.h20, styles.r4)} />
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w80, styles.h20, styles.r4)} />
          </Skeleton>
          <Skeleton animation="wave" className={styles.mt8}>
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h44, styles.r8)} />
          </Skeleton>
        </div>
      </div>
    </div>
  );
}

/* ── 2. Table / Ledger Page Skeleton (Inventory, Khata, Catalog) ─────── */
export function TablePageSkeleton({
  hasMetrics = true,
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
        <Skeleton animation="wave" className={mergeClasses(styles.flexCol, styles.gap6)}>
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w220, styles.h24, styles.r4)} />
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w340, styles.h14, styles.r3)} />
        </Skeleton>
        <Skeleton animation="wave">
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w140, styles.h36, styles.r8)} />
        </Skeleton>
      </div>

      {/* Optional Metrics Cards */}
      {hasMetrics && (
        <div className={styles.metricsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={mergeClasses(styles.cardContainer, styles.metricCardPad)}>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w110, styles.h14, styles.r3)} />
              </Skeleton>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w140, styles.h28, styles.r4, styles.mt4)} />
              </Skeleton>
            </div>
          ))}
        </div>
      )}

      {/* Main Table Card */}
      <div className={styles.cardContainer}>
        {/* Search / Filter bar skeleton */}
        <div className={styles.flexRowBetween}>
          <Skeleton animation="wave" className={mergeClasses(styles.flexRow, styles.gap12)}>
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w280, styles.h34, styles.r6)} />
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w140, styles.h34, styles.r6)} />
          </Skeleton>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w120, styles.h16, styles.r3)} />
          </Skeleton>
        </div>

        {/* Rows skeleton */}
        <div className={mergeClasses(styles.flexCol, styles.gap10, styles.mt8)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.rowItem}>
              <Skeleton animation="wave" className={mergeClasses(styles.flexRow, styles.gap12)}>
                <SkeletonItem shape="square" size={36} className={styles.r6} />
                <div className={mergeClasses(styles.flexCol, styles.gap6)}>
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w160, styles.h15, styles.r3)} />
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w90, styles.h11, styles.r3)} />
                </div>
              </Skeleton>
              <Skeleton animation="wave" className={mergeClasses(styles.flexRow, styles.gap20)}>
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w80, styles.h14, styles.r3)} />
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w70, styles.h22, styles.r11)} />
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
        <Skeleton animation="wave" className={mergeClasses(styles.flexCol, styles.gap6)}>
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w260, styles.h24, styles.r4)} />
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w320, styles.h14, styles.r3)} />
        </Skeleton>
        <Skeleton animation="wave" className={mergeClasses(styles.flexRow, styles.gap10)}>
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w90, styles.h28, styles.r14)} />
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w90, styles.h28, styles.r14)} />
        </Skeleton>
      </div>

      <div className={styles.kitchenGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={mergeClasses(styles.cardContainer, styles.kitchenCard)}>
            <div className={styles.flexRowBetween}>
              <Skeleton animation="wave" className={mergeClasses(styles.flexCol, styles.gap4)}>
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w90, styles.h18, styles.r4)} />
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w60, styles.h12, styles.r3)} />
              </Skeleton>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w80, styles.h22, styles.r11)} />
              </Skeleton>
            </div>

            <div className={mergeClasses(styles.flexCol, styles.gap8)}>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h32, styles.r4)} />
              </Skeleton>
              <Skeleton animation="wave">
                <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h32, styles.r4)} />
              </Skeleton>
            </div>

            <Skeleton animation="wave">
              <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h36, styles.r6)} />
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
        <Skeleton animation="wave" className={mergeClasses(styles.flexCol, styles.gap6)}>
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w280, styles.h24, styles.r4)} />
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w380, styles.h14, styles.r3)} />
        </Skeleton>
        <Skeleton animation="wave">
          <SkeletonItem shape="rectangle" className={mergeClasses(styles.w130, styles.h28, styles.r14)} />
        </Skeleton>
      </div>

      <div className={styles.metricsGrid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.cardContainer}>
            <Skeleton animation="wave" className={mergeClasses(styles.flexRow, styles.gap8)}>
              <SkeletonItem shape="circle" size={24} />
              <SkeletonItem shape="rectangle" className={mergeClasses(styles.w110, styles.h14, styles.r3)} />
            </Skeleton>
            <Skeleton animation="wave">
              <SkeletonItem shape="rectangle" className={mergeClasses(styles.w150, styles.h30, styles.r4, styles.mt6)} />
            </Skeleton>
          </div>
        ))}
      </div>

      <div className={styles.reportsGrid}>
        <div className={styles.cardContainer}>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w180, styles.h20, styles.r4)} />
          </Skeleton>
          <div className={mergeClasses(styles.flexCol, styles.gap10)}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.rowItem}>
                <Skeleton animation="wave">
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w140, styles.h14, styles.r3)} />
                </Skeleton>
                <Skeleton animation="wave">
                  <SkeletonItem shape="rectangle" className={mergeClasses(styles.w70, styles.h14, styles.r3)} />
                </Skeleton>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.cardContainer}>
          <Skeleton animation="wave">
            <SkeletonItem shape="rectangle" className={mergeClasses(styles.w200, styles.h20, styles.r4)} />
          </Skeleton>
          <div className={mergeClasses(styles.flexCol, styles.gap16, styles.mt12)}>
            <Skeleton animation="wave" className={mergeClasses(styles.flexCol, styles.gap8)}>
              <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h14, styles.r3)} />
              <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h8, styles.r4)} />
            </Skeleton>
            <Skeleton animation="wave" className={mergeClasses(styles.flexCol, styles.gap8)}>
              <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h14, styles.r3)} />
              <SkeletonItem shape="rectangle" className={mergeClasses(styles.w100, styles.h8, styles.r4)} />
            </Skeleton>
          </div>
        </div>
      </div>
    </div>
  );
}
