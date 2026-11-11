import React, { useEffect, useRef, useState } from 'react';
import {
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Button,
  Badge,
  Caption1,
  Body1,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Alert20Regular, Alert20Filled } from '@fluentui/react-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { posApi, StockAlertRow } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { useAppToast } from '@/context/AppNotificationContext';

const SEEN_KEY = 'pos.stockAlertsSeen'; // { [alertId]: level } already announced
const SUMMARY_KEY = 'pos.stockAlertsSummaryDate'; // yyyy-mm-dd of the last daily summary

const useStyles = makeStyles({
  trigger: { position: 'relative' },
  count: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    minWidth: '16px',
    height: '16px',
    padding: '0 4px',
    borderRadius: '8px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: '#FFFFFF',
    fontSize: '10px',
    fontWeight: 700,
    lineHeight: '16px',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  surface: { width: '360px', maxWidth: '92vw', padding: 0 },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  list: { maxHeight: '60vh', overflowY: 'auto' },
  item: { padding: '10px 12px', borderBottom: `1px solid ${tokens.colorNeutralStroke3}` },
  itemTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' },
  name: { fontWeight: 600 },
  muted: { color: tokens.colorNeutralForeground3, display: 'block' },
  actions: { display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' },
  empty: { padding: '24px 12px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
});

function readSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function fmt(n: number | null | undefined, unit?: string | null): string {
  if (n === null || n === undefined) return '—';
  return `${Math.round(n * 1000) / 1000}${unit ? ` ${unit}` : ''}`;
}

/** Show a Windows / OS notification when the app is not in front. */
function desktopNotify(title: string, body: string): void {
  try {
    if (typeof Notification === 'undefined') return;
    if (document.hasFocus() && !document.hidden) return; // in-app toast is enough
    if (Notification.permission === 'granted') {
      new Notification(title, { body, tag: 'omnipos-stock' });
    } else if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  } catch {
    /* ignore */
  }
}

/**
 * Low-stock bell: shows active stock alerts for users who can see inventory.
 * New or escalated alerts raise an in-app toast and, when the app is in the background, a
 * desktop notification. Once a day the first load shows a short summary.
 */
export function StockAlertBell({ className, iconClassName }: { className?: string; iconClassName?: string }): React.JSX.Element | null {
  const styles = useStyles();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const { notifyWarning, notifyInfo } = useAppToast();
  const [open, setOpen] = useState(false);
  const firstLoad = useRef(true);

  const canSee = !!user && (user.role === 'admin' || hasPermission('inventory'));

  const { data: alerts = [], isFetched } = useQuery<StockAlertRow[]>({
    queryKey: ['stock-alerts'],
    queryFn: () => posApi.fetchStockAlerts(),
    enabled: canSee,
    refetchInterval: 30000,
  });

  // Refresh as soon as stock changes anywhere in the app
  useEffect(() => {
    if (!canSee) return;
    const refresh = () => setTimeout(() => queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }), 800);
    window.addEventListener('pos_inventory_updated', refresh);
    window.addEventListener('pos_orders_updated', refresh);
    return () => {
      window.removeEventListener('pos_inventory_updated', refresh);
      window.removeEventListener('pos_orders_updated', refresh);
    };
  }, [canSee, queryClient]);

  // Announce new / escalated alerts once, and a daily summary
  useEffect(() => {
    // Wait for the first real answer, otherwise the empty placeholder would use up 'first load'
    if (!canSee || !isFetched) return;
    const seen = readSeen();
    const fresh = alerts.filter((a) => seen[a.id] !== a.level && !a.readAt);
    const isFirst = firstLoad.current;
    firstLoad.current = false;

    const today = new Date().toISOString().slice(0, 10);
    let summaryShown = false;
    if (isFirst && alerts.length > 0 && localStorage.getItem(SUMMARY_KEY) !== today) {
      const out = alerts.filter((a) => a.level === 'out').length;
      const low = alerts.length - out;
      notifyInfo('Stock summary', `${low} item(s) running low, ${out} out of stock. Open the bell to restock.`);
      try {
        localStorage.setItem(SUMMARY_KEY, today);
      } catch {
        /* ignore */
      }
      summaryShown = true;
    }

    if (!summaryShown && !isFirst) {
      for (const a of fresh.slice(0, 3)) {
        const title = a.level === 'out' ? `Out of stock: ${a.productName}` : `Stock running low: ${a.productName}`;
        const body = a.level === 'out' ? 'No stock left.' : `${fmt(a.stock, a.unit)} left (alert at ${fmt(a.limit)})`;
        notifyWarning(title, body);
        desktopNotify(title, body);
      }
      if (fresh.length > 3) notifyWarning(`${fresh.length - 3} more item(s) need restocking`);
    }

    if (fresh.length > 0) {
      const next = { ...seen };
      for (const a of alerts) next[a.id] = a.level;
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
  }, [alerts, canSee, isFetched, notifyInfo, notifyWarning]);

  if (!canSee) return null;

  const unread = alerts.filter((a) => !a.readAt).length;

  const act = async (id: string, action: 'read' | 'dismiss' | 'snooze') => {
    await posApi.stockAlertAction(id, action);
    await queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
  };

  const onOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next && unread > 0) {
      await posApi.readAllStockAlerts();
      await queryClient.invalidateQueries({ queryKey: ['stock-alerts'] });
    }
  };

  const restock = (a: StockAlertRow) => {
    setOpen(false);
    navigate('/inventory/stock-in', {
      state: { productId: a.productId, productName: a.productName, costPrice: a.costPrice ?? undefined, quantity: a.suggestedQty },
    });
  };

  return (
    <Popover open={open} onOpenChange={(_, d) => void onOpenChange(d.open)} positioning="above-start" withArrow>
      <PopoverTrigger disableButtonEnhancement>
        <button
          type="button"
          className={`${className || ''} ${styles.trigger}`}
          title={alerts.length ? `${alerts.length} stock alert(s)` : 'Stock alerts'}
          aria-label={alerts.length ? `${alerts.length} stock alerts, ${unread} new` : 'Stock alerts'}
        >
          {alerts.length ? <Alert20Filled className={iconClassName} /> : <Alert20Regular className={iconClassName} />}
          {alerts.length > 0 && <span className={styles.count}>{alerts.length > 99 ? '99+' : alerts.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverSurface className={styles.surface} aria-label="Stock alerts">
        <div className={styles.head}>
          <Body1 className={styles.name}>Stock alerts</Body1>
          <Button size="small" appearance="subtle" onClick={() => { setOpen(false); navigate('/inventory/dashboard'); }}>
            Inventory
          </Button>
        </div>
        <div className={styles.list}>
          {alerts.length === 0 ? (
            <div className={styles.empty}>All items are above their alert limits.</div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <span className={styles.name}>{a.productName}</span>
                  <Badge appearance="filled" color={a.level === 'out' ? 'danger' : 'warning'} size="small">
                    {a.level === 'out' ? 'Out' : 'Low'}
                  </Badge>
                </div>
                <Caption1 className={styles.muted}>
                  {a.level === 'out' ? 'No stock left' : `${fmt(a.stock, a.unit)} left`} · alert at {fmt(a.limit)} · reorder ~{a.suggestedQty}
                </Caption1>
                <div className={styles.actions}>
                  <Button size="small" appearance="primary" onClick={() => restock(a)}>
                    Restock
                  </Button>
                  <Button size="small" onClick={() => void act(a.id, 'snooze')} title="Hide for 24 hours">
                    Snooze 1 day
                  </Button>
                  <Button size="small" appearance="subtle" onClick={() => void act(a.id, 'dismiss')} title="Hide until it is restocked">
                    Dismiss
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverSurface>
    </Popover>
  );
}
