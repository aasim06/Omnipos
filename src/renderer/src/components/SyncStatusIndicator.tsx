import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  mergeClasses,
  Tooltip,
} from '@fluentui/react-components';
import { syncEngine, SyncState } from '@/lib/syncEngine';

interface SyncStatusProps {
  isCollapsed?: boolean;
}

const useStyles = makeStyles({
  collapsedBtn: {
    width: '42px',
    height: '34px',
    borderRadius: '8px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    margin: '0 auto',
    position: 'relative',
    transitionProperty: 'all',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
  },
  collapsedBadge: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    fontSize: '9px',
    fontWeight: 800,
    backgroundColor: '#E51937',
    color: '#fff',
    borderRadius: '999px',
    padding: '1px 4px',
  },
  fullContainer: {
    padding: '8px 10px',
    borderRadius: '8px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground3,
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },
  leftGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dotWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  dotCollapsed: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  dotOnline: {
    backgroundColor: '#10B981',
    boxShadow: '0 0 8px rgba(16, 185, 129, 0.7)',
  },
  dotSyncing: {
    backgroundColor: '#38BDF8',
    boxShadow: '0 0 8px rgba(56, 189, 248, 0.8)',
  },
  dotOffline: {
    backgroundColor: '#EF4444',
    boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
  },
  dotPending: {
    backgroundColor: '#F59E0B',
    boxShadow: '0 0 8px rgba(245, 158, 11, 0.8)',
  },
  textCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  titleText: {
    fontSize: '11px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    letterSpacing: '0.02em',
    lineHeight: 1.2,
  },
  subtitleText: {
    fontSize: '9.5px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 500,
  },
  statusBadge: {
    fontSize: '9.5px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    padding: '2px 6px',
    borderRadius: '4px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
  },
  badgeOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    color: '#10B981',
    borderTopColor: 'rgba(16, 185, 129, 0.25)',
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    borderLeftColor: 'rgba(16, 185, 129, 0.25)',
    borderRightColor: 'rgba(16, 185, 129, 0.25)',
  },
  badgeOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
    borderTopColor: 'rgba(239, 68, 68, 0.3)',
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
    borderLeftColor: 'rgba(239, 68, 68, 0.3)',
    borderRightColor: 'rgba(239, 68, 68, 0.3)',
  },
});

export function SyncStatusIndicator({ isCollapsed = false }: SyncStatusProps): React.JSX.Element {
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

  const isOnline = syncState.isOnline;
  const isSyncing = syncState.isSyncing;
  const pendingCount = syncState.pendingCount;

  let statusText = 'Cloud Synced';
  let subText = 'Neon PostgreSQL Live';
  let dotClass = styles.dotOnline;

  if (isSyncing) {
    statusText = 'Syncing Orders...';
    subText = 'Sending to Cloud API';
    dotClass = styles.dotSyncing;
  } else if (!isOnline) {
    statusText = 'Offline Cache';
    subText = `${pendingCount} queued in local DB`;
    dotClass = styles.dotOffline;
  } else if (pendingCount > 0) {
    statusText = 'Pending Upload';
    subText = `${pendingCount} orders ready`;
    dotClass = styles.dotPending;
  }

  if (isCollapsed) {
    return (
      <Tooltip
        content={`${statusText} — ${subText} (Click to Sync)`}
        relationship="label"
        positioning="after"
      >
        <button
          type="button"
          onClick={handleClick}
          className={styles.collapsedBtn}
        >
          <span className={mergeClasses(styles.dotCollapsed, dotClass)} />
          {pendingCount > 0 && (
            <span className={styles.collapsedBadge}>
              {pendingCount}
            </span>
          )}
        </button>
      </Tooltip>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={styles.fullContainer}
      title="Click to trigger instant cloud sync"
    >
      <div className={styles.leftGroup}>
        <div className={styles.dotWrapper}>
          <span className={mergeClasses(styles.dot, dotClass)} />
        </div>
        <div className={styles.textCol}>
          <div className={styles.titleText}>
            {statusText}
          </div>
          <div className={styles.subtitleText}>
            {subText}
          </div>
        </div>
      </div>

      <div
        className={mergeClasses(
          styles.statusBadge,
          isOnline ? styles.badgeOnline : styles.badgeOffline
        )}
      >
        {isSyncing ? 'SYNC' : isOnline ? 'ONLINE' : 'CACHED'}
      </div>
    </div>
  );
}
