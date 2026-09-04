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
import { userStorage } from './userStorage';

export function LicensePage({ onActivated }: { onActivated: () => void }): React.JSX.Element {
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
          localStorage.setItem('omnipos_active_key', fullKey);
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
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 20%, #1a1e28 0%, #0c0d12 100%)',
        color: '#FFFFFF',
        fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
        userSelect: 'none',
        padding: '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '20px',
          background: 'rgba(20, 24, 34, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 32px rgba(229, 25, 55, 0.15)',
          padding: '40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Brand Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF1E3C 0%, #B30018 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(229, 25, 55, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <KeyRound style={{ width: '30px', height: '30px', color: '#ffffff' }} />
          </div>

          <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Omni<span style={{ color: '#FF4D63' }}>Pos</span> Activation
          </div>
          <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '6px' }}>
            Enter your enterprise license key to unlock your store terminal.
          </div>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            <ShieldAlert style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 700,
                color: '#CBD5E1',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              License Key
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(11, 14, 20, 0.8)',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '0 14px',
                height: '52px',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
            >
              <span
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#FF4D63',
                  letterSpacing: '1px',
                  marginRight: '6px',
                }}
              >
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
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '6px' }}>
              Format: OMNI-XXXX-XXXX-XXXX (e.g. OMNI-DEMO-2026-LIVE)
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !suffix.trim()}
            style={{
              height: '48px',
              borderRadius: '12px',
              background: loading || !suffix.trim()
                ? 'rgba(255, 255, 255, 0.08)'
                : 'linear-gradient(135deg, #FF1E3C 0%, #B30018 100%)',
              border: 'none',
              color: loading || !suffix.trim() ? '#64748B' : '#FFFFFF',
              fontSize: '14.5px',
              fontWeight: 700,
              cursor: loading || !suffix.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: suffix.trim() ? '0 8px 24px rgba(229, 25, 55, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <span>Verifying Terminal License...</span>
            ) : (
              <>
                <Sparkles style={{ width: '16px', height: '16px' }} />
                <span>Activate OmniPos Terminal</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Need a license key? Contact OmniPos support team at{' '}
            <span style={{ color: '#FF4D63', fontWeight: 600 }}>support@omnipos.pk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
