import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { useAppToast } from '@/context/AppNotificationContext';

/**
 * Background catch-up: a few seconds after sign-in (and whenever the connection comes back),
 * sales saved only on this computer are sent to the backend together with their refunds.
 * Renders nothing; tells the user once when it caught anything up.
 */
export function PendingSalesResync(): null {
  const queryClient = useQueryClient();
  const { notifyInfo, notifyWarning } = useAppToast();

  useEffect(() => {
    let running = false;
    const run = async () => {
      if (running) return;
      running = true;
      try {
        const r = await posApi.resyncPendingOrders();
        if (r.sent > 0) {
          const returns = r.refunds ? ` and ${r.refunds} return(s)` : '';
          notifyInfo('Sales synced', `${r.sent} earlier sale(s)${returns} sent to the store database; stock and reports are updated.`);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['products'] }),
            queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
            queryClient.invalidateQueries({ queryKey: ['orders'] }),
            queryClient.invalidateQueries({ queryKey: ['stock-alerts'] }),
          ]);
        } else if (r.failed > 0) {
          notifyWarning('Some sales are not synced yet', `${r.failed} sale(s) could not be sent; the app will retry.`);
        }
      } finally {
        running = false;
      }
    };
    const timer = setTimeout(run, 4000);
    window.addEventListener('online', run);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', run);
    };
  }, [queryClient, notifyInfo, notifyWarning]);

  return null;
}
