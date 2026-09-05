import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Subtitle1,
  Caption1,
  Button,
} from '@fluentui/react-components';
import {
  ArrowCircleUp20Regular,
  Add20Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  layoutContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    boxSizing: 'border-box',
    overflow: 'hidden',
  },

  viewTopBar: {
    padding: '18px 28px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  },

  contentArea: {
    flex: 1,
    minHeight: 0,
    padding: '24px 28px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  headerTitle: {
    fontWeight: 800,
    fontSize: '20px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  arrowUpIcon: {
    color: '#D13438',
  },
  stockOutBtn: {
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
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
  stockInBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '13px',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
  },
});

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/inventory': {
    title: 'Inventory Dashboard',
    subtitle: 'Real-time stock valuation, reorder alerts, and category distribution',
  },
  '/inventory/dashboard': {
    title: 'Inventory Dashboard',
    subtitle: 'Real-time stock valuation, reorder alerts, and category distribution',
  },
  '/inventory/stock-in': {
    title: 'Stock In',
    subtitle: 'Record Stock In (Receiving Invoice) and audit shipment logs',
  },
  '/inventory/stock-out': {
    title: 'Stock Out',
    subtitle: 'Record Stock Out (Damage, Waste & Usage) and audit deduction logs',
  },
  '/inventory/vendors': {
    title: 'Vendors & Suppliers Management',
    subtitle: 'Supplier directory, procurement contacts, and account payables',
  },
  '/inventory/ledger': {
    title: 'Stock Movement Ledger',
    subtitle: 'Complete chronological audit ledger of all inventory inflows and outflows',
  },
};

export function InventoryLayout(): React.JSX.Element {
  const styles = useStyles();
  const location = useLocation();
  const navigate = useNavigate();

  const isStockInPage = location.pathname === '/inventory/stock-in';
  const isStockOutPage = location.pathname === '/inventory/stock-out';
  const meta = pageMeta[location.pathname] || pageMeta['/inventory/dashboard'];

  return (
    <div className={styles.layoutContainer}>
      {/* ── Sleek Top Header Bar ── */}
      <div className={styles.viewTopBar}>
        <div className={styles.headerLeft}>
          <Subtitle1 as="h1" className={styles.headerTitle}>
            {meta.title}
          </Subtitle1>
          <Caption1 className={styles.headerSubtitle}>
            {meta.subtitle}
          </Caption1>
        </div>

        {/* Top Bar Quick Action Buttons */}
        <div className={styles.headerActions}>
          {!isStockOutPage && (
            <Button
              appearance="subtle"
              icon={<ArrowCircleUp20Regular className={styles.arrowUpIcon} />}
              onClick={() => navigate('/inventory/stock-out')}
              className={styles.stockOutBtn}
            >
              Stock Out
            </Button>
          )}
          {!isStockInPage && (
            <Button
              appearance="primary"
              icon={<Add20Regular />}
              onClick={() => navigate('/inventory/stock-in')}
              className={styles.stockInBtn}
            >
              + Record Stock In
            </Button>
          )}
        </div>
      </div>

      {/* ── Main Dynamic Content Area ── */}
      <div className={styles.contentArea}>
        <Outlet />
      </div>
    </div>
  );
}
