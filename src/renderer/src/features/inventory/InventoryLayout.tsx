import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { vendorStorage } from './vendorStorage';
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
  Receipt20Regular,
  ClipboardCheckmark20Regular,
} from '@fluentui/react-icons';
import { PurchaseBillModal } from './PurchaseBillModal';
import { StockCountDialog } from './StockCountDialog';
import { PageHeader } from '@/components/win11';

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

  headerWrap: {
    paddingLeft: '32px',
    paddingRight: '32px',
    flexShrink: 0,
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
    padding: '0 32px 32px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  headerTitle: {
    fontWeight: 600,
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
    color: tokens.colorStatusDangerForeground1,
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
    backgroundColor: tokens.colorBrandBackground,
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '13px',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    boxShadow: 'none',
  },
});

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/inventory': {
    title: 'Inventory',
    subtitle: 'Stock value, reorder alerts and categories',
  },
  '/inventory/dashboard': {
    title: 'Inventory',
    subtitle: 'Stock value, reorder alerts and categories',
  },
  '/inventory/stock-in': {
    title: 'Stock in',
    subtitle: 'Receive stock against an invoice and review deliveries',
  },
  '/inventory/stock-out': {
    title: 'Stock out',
    subtitle: 'Record damage, waste and usage, and review deductions',
  },
  '/inventory/vendors': {
    title: 'Vendors',
    subtitle: 'Suppliers, contacts and amounts payable',
  },
  '/inventory/ledger': {
    title: 'Stock ledger',
    subtitle: 'Every stock movement in and out, newest first',
  },
};

export function InventoryLayout(): React.JSX.Element {
  const styles = useStyles();
  const location = useLocation();
  const navigate = useNavigate();

  const isStockInPage = location.pathname === '/inventory/stock-in';
  const isStockOutPage = location.pathname === '/inventory/stock-out';
  const meta = pageMeta[location.pathname] || pageMeta['/inventory/dashboard'];
  const [isPurchaseBillOpen, setIsPurchaseBillOpen] = useState(false);
  const [isStockCountOpen, setIsStockCountOpen] = useState(false);
  const queryClient = useQueryClient();
  // Bumped after vendors / ledger / bills are refreshed from the database so the
  // current screen re-reads the synchronous vendor cache.
  const [vendorDataVersion, setVendorDataVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    vendorStorage.syncWithServer().then((refreshed) => {
      if (cancelled || !refreshed) return;
      setVendorDataVersion((v) => v + 1);
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
    });
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  return (
    <div className={styles.layoutContainer}>
      {/* ── Page header (Windows 11) ── */}
      <div className={styles.headerWrap}>
        <PageHeader
          title={meta.title}
          subtitle={meta.subtitle}
          actions={
            <>
              <Button appearance="secondary" icon={<Receipt20Regular />} onClick={() => setIsPurchaseBillOpen(true)}>
                Purchase bill
              </Button>
              <Button appearance="secondary" icon={<ClipboardCheckmark20Regular />} onClick={() => setIsStockCountOpen(true)}>
                Stock count
              </Button>
              {!isStockOutPage && (
                <Button appearance="secondary" icon={<ArrowCircleUp20Regular />} onClick={() => navigate('/inventory/stock-out')}>
                  Stock out
                </Button>
              )}
              {!isStockInPage && (
                <Button appearance="primary" icon={<Add20Regular />} onClick={() => navigate('/inventory/stock-in')}>
                  Record stock in
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* ── Main Dynamic Content Area ── */}
      <div className={styles.contentArea}>
        <Outlet key={vendorDataVersion} />
      </div>

      {/* ── Physical Stock Count ── */}
      <StockCountDialog isOpen={isStockCountOpen} onClose={() => setIsStockCountOpen(false)} />

      {/* ── Global Purchase Bill Modal ── */}
      <PurchaseBillModal
        isOpen={isPurchaseBillOpen}
        onClose={() => setIsPurchaseBillOpen(false)}
      />
    </div>
  );
}
