import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  Button,
  tokens,
  makeStyles,
  Badge,
} from '@fluentui/react-components';
import {
  CloudCheckmark20Filled,
  CloudDismiss20Filled,
  ArrowSync20Filled,
  CloudSync20Filled,
} from '@fluentui/react-icons';
import { syncEngine, SyncState } from '@/lib/syncEngine';

const useStyles = makeStyles({
  syncBtn: {
    width: '100%',
    height: '40px',
    borderRadius: tokens.borderRadiusMedium,
    minWidth: 'unset',
    padding: '0',
    backgroundColor: 'transparent',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  spinning: {
    animationName: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  badgePos: {
    position: 'absolute',
    top: '4px',
    right: '8px',
  },
});

export function SyncStatusIndicator(): React.JSX.Element {
  const styles = useStyles();
  const [syncState, setSyncState] = useState<SyncState>(syncEngine.getState());

  useEffect(() => {
    return syncEngine.subscribe((state) => {
      setSyncState(state);
    });
  }, []);

  const handleClick = () => {
    void syncEngine.syncNow();
  };

  let tooltipText = 'Cloud Sync: Online & All Synced';
  let icon = <CloudCheckmark20Filled style={{ color: '#107C41' }} />;

  if (syncState.isSyncing) {
    tooltipText = 'Syncing offline outbox with Cloud API...';
    icon = <ArrowSync20Filled className={styles.spinning} style={{ color: '#0078D4' }} />;
  } else if (!syncState.isOnline) {
    tooltipText = `Offline Mode: ${syncState.pendingCount} orders queued locally in Dexie. Click to retry.`;
    icon = <CloudDismiss20Filled style={{ color: '#D13438' }} />;
  } else if (syncState.pendingCount > 0) {
    tooltipText = `${syncState.pendingCount} orders in queue ready to sync. Click to sync now.`;
    icon = <CloudSync20Filled style={{ color: '#C19500' }} />;
  }

  return (
    <Tooltip content={tooltipText} relationship="label" positioning="after">
      <Button
        className={styles.syncBtn}
        appearance="subtle"
        onClick={handleClick}
        aria-label="Cloud Sync Status"
      >
        {icon}
        {syncState.pendingCount > 0 && !syncState.isSyncing && (
          <Badge
            className={styles.badgePos}
            size="small"
            color={syncState.isOnline ? 'warning' : 'danger'}
          >
            {syncState.pendingCount}
          </Badge>
        )}
      </Button>
    </Tooltip>
  );
}
