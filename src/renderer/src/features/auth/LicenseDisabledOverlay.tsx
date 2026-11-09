import React, { useEffect, useState } from 'react';
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { Phone, Mail, RefreshCw, Lock } from 'lucide-react';

interface LicenseDisabledOverlayProps {
  reason: string;
  checking: boolean;
  onCheck: () => void;
}

const useStyles = makeStyles({
  backdrop: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground2,
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
    userSelect: 'none',
  },
  modalCard: {
    width: '100%',
    maxWidth: '540px',
    borderRadius: '24px',
    backgroundColor: tokens.colorNeutralBackground1,
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
    boxShadow: tokens.shadow64,
    padding: '44px 36px',
    textAlign: 'center',
    boxSizing: 'border-box',
    color: tokens.colorNeutralForeground1,
  },
  glowIconBox: {
    width: '72px',
    height: '72px',
    margin: '0 auto 20px',
    borderRadius: '20px',
    backgroundColor: tokens.colorStatusDangerBackground1,
    borderTopWidth: '1.5px',
    borderBottomWidth: '1.5px',
    borderLeftWidth: '1.5px',
    borderRightWidth: '1.5px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorStatusDangerBorder1,
    borderBottomColor: tokens.colorStatusDangerBorder1,
    borderLeftColor: tokens.colorStatusDangerBorder1,
    borderRightColor: tokens.colorStatusDangerBorder1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
  },
  lockIcon: {
    width: '32px',
    height: '32px',
    color: tokens.colorStatusDangerForeground1,
  },
  titleText: {
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    letterSpacing: '-0.02em',
  },
  reasonBox: {
    margin: '18px 0 24px',
    padding: '14px 18px',
    borderRadius: '8px',
    backgroundColor: tokens.colorStatusDangerBackground1,
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorStatusDangerBorder1,
    borderBottomColor: tokens.colorStatusDangerBorder1,
    borderLeftColor: tokens.colorStatusDangerBorder1,
    borderRightColor: tokens.colorStatusDangerBorder1,
    color: tokens.colorStatusDangerForeground1,
    fontSize: '14px',
    lineHeight: 1.5,
  },
  descText: {
    fontSize: '13.5px',
    color: tokens.colorNeutralForeground3,
    lineHeight: 1.6,
    margin: '0 auto 28px',
    maxWidth: '440px',
  },
  contactRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  contactPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
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
    color: tokens.colorNeutralForeground2,
    textDecorationLine: 'none',
    fontSize: '13px',
    fontWeight: 600,
  },
  phoneIcon: {
    width: '15px',
    height: '15px',
    color: tokens.colorStatusSuccessForeground1,
  },
  mailIcon: {
    width: '15px',
    height: '15px',
    color: tokens.colorPaletteBlueForeground2,
  },
  checkBtn: {
    height: '46px',
    padding: '0 28px',
    borderRadius: '8px',
    backgroundColor: tokens.colorBrandBackground,
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: 'none',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },
  checkBtnDisabled: {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  refreshIcon: {
    width: '16px',
    height: '16px',
  },
  refreshIconSpinning: {
    animationName: {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' },
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
});

export function LicenseDisabledOverlay({
  reason,
  checking,
  onCheck,
}: LicenseDisabledOverlayProps): React.JSX.Element {
  const styles = useStyles();
  const [phone, setPhone] = useState('+92 300 0000000');
  const [email, setEmail] = useState('support@omnipos.pk');

  useEffect(() => {
    if (window.posApi?.license?.support) {
      window.posApi.license.support().then((contact) => {
        if (contact?.phone) setPhone(contact.phone);
        if (contact?.email) setEmail(contact.email);
      }).catch(() => {});
    }
  }, []);

  return (
    <div className={styles.backdrop}>
      <div className={styles.modalCard}>
        {/* Lock / Alert Glow Icon */}
        <div className={styles.glowIconBox}>
          <Lock className={styles.lockIcon} />
        </div>

        <div className={styles.titleText}>
          Terminal License Suspended
        </div>

        <div className={styles.reasonBox}>
          {reason || 'This license has been disabled by the store administrator.'}
        </div>

        <p className={styles.descText}>
          You do not need to re-enter your license key. As soon as OmniPos administrative authority re-enables this terminal, this app will unlock automatically.
        </p>

        {/* Support Contact Pill */}
        <div className={styles.contactRow}>
          <a
            href={`tel:${phone}`}
            className={styles.contactPill}
          >
            <Phone className={styles.phoneIcon} />
            <span>{phone}</span>
          </a>

          <a
            href={`mailto:${email}`}
            className={styles.contactPill}
          >
            <Mail className={styles.mailIcon} />
            <span>{email}</span>
          </a>
        </div>

        {/* Check Status Button */}
        <button
          type="button"
          onClick={onCheck}
          disabled={checking}
          className={mergeClasses(
            styles.checkBtn,
            checking && styles.checkBtnDisabled
          )}
        >
          <RefreshCw
            className={mergeClasses(
              styles.refreshIcon,
              checking && styles.refreshIconSpinning
            )}
          />
          <span>{checking ? 'Checking Status...' : 'Check Status / Unlock Now'}</span>
        </button>
      </div>
    </div>
  );
}
