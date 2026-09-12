import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  ProgressBar,
  Text,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowDownload20Regular,
  ArrowSync20Regular,
  CheckmarkCircle20Filled,
  Dismiss16Regular,
} from '@fluentui/react-icons';
import { useUpdate } from '@/context/UpdateContext';

const useStyles = makeStyles({
  bannerContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 99999,
    width: '380px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    animationDuration: '250ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    backdropFilter: 'blur(16px)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  iconBoxReady: {
    backgroundColor: '#DCFCE7',
    color: '#16A34A',
  },
  title: {
    fontWeight: '700',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  dismissBtn: {
    minWidth: '24px',
    height: '24px',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      color: tokens.colorNeutralForeground1,
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  infoText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '18px',
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  },
  installBtn: {
    backgroundColor: '#16A34A !important',
    color: '#FFFFFF !important',
    fontWeight: '600',
    borderRadius: '6px',
    '&:hover': {
      backgroundColor: '#15803D !important',
    },
  },
});

export function UpdateBanner(): React.JSX.Element | null {
  const styles = useStyles();
  const { isReady, isDownloading, progress, progressInfo, installUpdate, formatSpeed } = useUpdate();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isReady) {
      setDismissed(false);
    }
  }, [isReady]);

  if (dismissed || (!isReady && !isDownloading)) return null;

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={isReady ? `${styles.iconBox} ${styles.iconBoxReady}` : styles.iconBox}>
            {isReady ? (
              <CheckmarkCircle20Filled />
            ) : (
              <ArrowDownload20Regular />
            )}
          </div>
          <div>
            <div className={styles.title}>
              {isReady ? 'Update Ready to Install' : 'Downloading Update…'}
            </div>
            <Text className={styles.infoText}>
              {isReady
                ? 'A new version of Omnipos is downloaded.'
                : progressInfo.label || 'Downloading latest release...'}
            </Text>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={styles.dismissBtn}
          title="Dismiss banner"
        >
          <Dismiss16Regular />
        </button>
      </div>

      {isDownloading && (
        <>
          <ProgressBar
            value={progress / 100}
            color="brand"
            thickness="medium"
          />
          <div className={styles.progressRow}>
            <span>
              {progressInfo.bytesPerSecond > 0 ? formatSpeed(progressInfo.bytesPerSecond) : 'Downloading...'}
            </span>
            <span style={{ fontWeight: 600 }}>{progress}%</span>
          </div>
        </>
      )}

      {isReady && (
        <div className={styles.actionsRow}>
          <Button
            size="small"
            appearance="secondary"
            onClick={() => setDismissed(true)}
          >
            Later
          </Button>
          <Button
            size="small"
            appearance="primary"
            icon={<ArrowSync20Regular />}
            onClick={installUpdate}
            className={styles.installBtn}
          >
            Restart &amp; Install Update
          </Button>
        </div>
      )}
    </div>
  );
}
