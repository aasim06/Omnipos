import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

function formatSuffix(raw: string): string {
  let cleaned = raw.toUpperCase().replace(/^OMNI-?/i, '');
  cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
  cleaned = cleaned.slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    parts.push(cleaned.slice(i, i + 4));
  }
  return parts.join('-');
}

import { getOrCreateBrowserHwid, getBrowserDeviceName, getWebLicenseApiBase } from '@/lib/webLicense';
import { clearAllLocalData } from '@/lib/offlineDb';
import { resetTenantMeta } from '@/lib/api';
import { userStorage } from './userStorage';
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  fullPage: {
    minHeight: '100%',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Mica / theme frame
    color: tokens.colorNeutralForeground1,
    fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
    userSelect: 'none',
    padding: '24px',
    boxSizing: 'border-box',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    borderRadius: '20px',
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
    boxShadow: tokens.shadow28,
    padding: '40px',
    boxSizing: 'border-box',
  },
  headerBox: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  keyIconBox: {
    width: '64px',
    height: '64px',
    margin: '0 auto 16px',
    borderRadius: '8px',
    backgroundColor: tokens.colorBrandBackground,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  keyIcon: {
    width: '30px',
    height: '30px',
    color: '#ffffff',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    color: tokens.colorNeutralForeground1,
  },
  brandRedText: {
    color: tokens.colorBrandForeground1,
  },
  subtitle: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    marginTop: '6px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
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
    fontSize: '13px',
    marginBottom: '20px',
  },
  shieldIcon: {
    width: '18px',
    height: '18px',
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '8px',
  },
  inputBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1.5px',
    borderBottomWidth: '1.5px',
    borderLeftWidth: '1.5px',
    borderRightWidth: '1.5px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    borderRadius: '8px',
    padding: '0 14px',
    height: '52px',
    boxSizing: 'border-box',
    transitionProperty: 'border-color',
    transitionDuration: '0.2s',
  },
  prefix: {
    fontSize: '15px',
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    letterSpacing: '1px',
    marginRight: '6px',
  },
  keyInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    outlineStyle: 'none',
    color: tokens.colorNeutralForeground1,
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'monospace',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  helperText: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground2,
    marginTop: '6px',
  },
  submitBtn: {
    height: '48px',
    borderRadius: '8px',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    fontSize: '14.5px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
  },
  submitBtnActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: '#FFFFFF',
    cursor: 'pointer',
    boxShadow: 'none',
  },
  submitBtnDisabled: {
    backgroundColor: tokens.colorNeutralBackgroundDisabled,
    color: tokens.colorNeutralForeground2,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  sparklesIcon: {
    width: '16px',
    height: '16px',
  },
  footer: {
    marginTop: '28px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    paddingTop: '18px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  supportEmail: {
    color: tokens.colorBrandForeground1,
    fontWeight: 600,
  },
});

export function LicensePage({ onActivated, initialNotice }: { onActivated: () => void; initialNotice?: string }): React.JSX.Element {
  const styles = useStyles();
  const [suffix, setSuffix] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fullKey = suffix ? `OMNI-${suffix}` : '';

  async function handleActivate(e?: React.FormEvent): Promise<void> {
    if (e) e.preventDefault();
    if (!suffix.trim()) {
      setError('Please enter your license key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (window.posApi?.license?.activate) {
        const result = await window.posApi.license.activate(fullKey);
        if (result.ok) {
          const prevKey = localStorage.getItem('omnipos_active_key');
          if (prevKey !== fullKey) {
            await clearAllLocalData();
            resetTenantMeta();
          }
          localStorage.setItem('omnipos_active_key', fullKey);
          if (result.schemaId) {
            localStorage.setItem('omnipos_active_schema', result.schemaId);
          }
          if ((result as any).businessProfiles) {
            localStorage.setItem('omnipos_business_profiles', JSON.stringify((result as any).businessProfiles));
          }
          userStorage.initAdminForLicense(fullKey, (result as any).adminUser || { name: (result as any).userName });
          onActivated();
        } else {
          setError(result.error || 'Invalid or disabled license key.');
        }
      } else {
        // WEB BROWSER MODE: activate directly with backend API
        const hwid = getOrCreateBrowserHwid();
        const deviceName = getBrowserDeviceName();
        const apiBase = getWebLicenseApiBase();

        const res = await fetch(`${apiBase}/license/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: fullKey, hwid, deviceName }),
        });

        const data = await res.json();
        if (data.ok) {
          const prevKey = localStorage.getItem('omnipos_active_key');
          if (prevKey !== fullKey) {
            await clearAllLocalData();
            resetTenantMeta();
          }
          localStorage.setItem('omnipos_active_key', fullKey);
          if (data.schemaId) {
            localStorage.setItem('omnipos_active_schema', data.schemaId);
          }
          if (data.modules) {
            localStorage.setItem('omnipos_cached_modules', JSON.stringify(data.modules));
          }
          if (data.businessProfiles) {
            localStorage.setItem('omnipos_business_profiles', JSON.stringify(data.businessProfiles));
          }
          userStorage.initAdminForLicense(fullKey, data.adminUser || { name: data.userName });
          onActivated();
        } else {
          setError(data.error || 'Invalid or disabled license key.');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to license server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.fullPage}>
      <div className={styles.card}>
        {/* Brand Icon Header */}
        <div className={styles.headerBox}>
          <div className={styles.keyIconBox}>
            <KeyRound className={styles.keyIcon} />
          </div>

          <div className={styles.title}>
            Omni<span className={styles.brandRedText}>Pos</span> Activation
          </div>
          <div className={styles.subtitle}>
            Enter your enterprise license key to unlock your store terminal.
          </div>
        </div>

        {(error || initialNotice) && (
          <div className={styles.errorBox}>
            <ShieldAlert className={styles.shieldIcon} />
            <span>{error || initialNotice}</span>
          </div>
        )}

        <form onSubmit={handleActivate} className={styles.form}>
          <div>
            <label className={styles.label}>
              License Key
            </label>
            <div className={styles.inputBox}>
              <span className={styles.prefix}>
                OMNI-
              </span>
              <input
                type="text"
                autoFocus
                placeholder="XXXX-XXXX-XXXX"
                value={suffix}
                onChange={(e) => setSuffix(formatSuffix(e.target.value))}
                disabled={loading}
                maxLength={35}
                className={styles.keyInput}
              />
            </div>
            <div className={styles.helperText}>
              Format: OMNI-XXXX-XXXX-XXXX (e.g. OMNI-DEMO-2026-LIVE)
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !suffix.trim()}
            className={mergeClasses(
              styles.submitBtn,
              loading || !suffix.trim() ? styles.submitBtnDisabled : styles.submitBtnActive
            )}
          >
            {loading ? (
              <span>Verifying Terminal License...</span>
            ) : (
              <>
                <Sparkles className={styles.sparklesIcon} />
                <span>Activate OmniPos Terminal</span>
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <div className={styles.footerText}>
            Need a license key? Contact OmniPos support team at{' '}
            <span className={styles.supportEmail}>support@omnipos.pk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
