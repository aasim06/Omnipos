import React, { useState, useEffect } from 'react';
import {
  Tooltip,
  Badge,
} from '@fluentui/react-components';
import {
  CloudCheckmark20Filled,
  CloudDismiss20Filled,
  ArrowSync20Filled,
  CloudSync20Filled,
} from '@fluentui/react-icons';
import { syncEngine, SyncState } from '@/lib/syncEngine';
import { useAppTheme } from '@/theme/AppProviders';

interface SyncStatusProps {
  isCollapsed?: boolean;
}

export function SyncStatusIndicator({ isCollapsed = false }: SyncStatusProps): React.JSX.Element {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
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
  let dotColor = '#10B981'; // Neon emerald
  let dotGlow = '0 0 8px rgba(16, 185, 129, 0.7)';

  if (isSyncing) {
    statusText = 'Syncing Orders...';
    subText = 'Sending to Cloud API';
    dotColor = '#38BDF8'; // Sky blue
    dotGlow = '0 0 8px rgba(56, 189, 248, 0.8)';
  } else if (!isOnline) {
    statusText = 'Offline Cache';
    subText = `${pendingCount} queued in local DB`;
    dotColor = '#EF4444'; // Neon red
    dotGlow = '0 0 8px rgba(239, 68, 68, 0.8)';
  } else if (pendingCount > 0) {
    statusText = 'Pending Upload';
    subText = `${pendingCount} orders ready`;
    dotColor = '#F59E0B'; // Amber
    dotGlow = '0 0 8px rgba(245, 158, 11, 0.8)';
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
          style={{
            width: '42px',
            height: '34px',
            borderRadius: '8px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            margin: '0 auto',
            position: 'relative',
            transition: 'all 0.15s ease',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: dotGlow,
            }}
          />
          {pendingCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                fontSize: '9px',
                fontWeight: 800,
                backgroundColor: '#E51937',
                color: '#fff',
                borderRadius: '999px',
                padding: '1px 4px',
              }}
            >
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
      style={{
        padding: '8px 10px',
        borderRadius: '8px',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      title="Click to trigger instant cloud sync"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: dotGlow,
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', letterSpacing: '0.02em', lineHeight: 1.2 }}>
            {statusText}
          </div>
          <div style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 500 }}>
            {subText}
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '9.5px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          padding: '2px 6px',
          borderRadius: '4px',
          backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
          color: isOnline ? '#10B981' : '#EF4444',
          border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.3)'}`,
        }}
      >
        {isSyncing ? 'SYNC' : isOnline ? 'ONLINE' : 'CACHED'}
      </div>
    </div>
  );
}
