import React, { useEffect, useState } from 'react';
import { ShieldAlert, Phone, Mail, RefreshCw, Lock } from 'lucide-react';

interface LicenseDisabledOverlayProps {
  reason: string;
  checking: boolean;
  onCheck: () => void;
}

export function LicenseDisabledOverlay({
  reason,
  checking,
  onCheck,
}: LicenseDisabledOverlayProps): React.JSX.Element {
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(8, 9, 13, 0.94)',
        backdropFilter: 'blur(24px)',
        padding: '24px',
        boxSizing: 'border-box',
        fontFamily: 'Segoe UI, system-ui, -apple-system, sans-serif',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          borderRadius: '24px',
          backgroundColor: '#12151e',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 32px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(229, 25, 55, 0.15)',
          padding: '44px 36px',
          textAlign: 'center',
          boxSizing: 'border-box',
          color: '#FFFFFF',
        }}
      >
        {/* Lock / Alert Glow Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 20px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(229, 25, 55, 0.05) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)',
          }}
        >
          <Lock style={{ width: '32px', height: '32px', color: '#FF4D63' }} />
        </div>

        <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Terminal License Suspended
        </div>

        <div
          style={{
            margin: '18px 0 24px',
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#FCA5A5',
            fontSize: '14px',
            lineHeight: 1.5,
          }}
        >
          {reason || 'This license has been disabled by the store administrator.'}
        </div>

        <p style={{ fontSize: '13.5px', color: '#94A3B8', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: '440px' }}>
          You do not need to re-enter your license key. As soon as OmniPos administrative authority re-enables this terminal, this app will unlock automatically.
        </p>

        {/* Support Contact Pill */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          <a
            href={`tel:${phone}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#E2E8F0',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Phone style={{ width: '15px', height: '15px', color: '#10B981' }} />
            <span>{phone}</span>
          </a>

          <a
            href={`mailto:${email}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#E2E8F0',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Mail style={{ width: '15px', height: '15px', color: '#3B82F6' }} />
            <span>{email}</span>
          </a>
        </div>

        {/* Check Status Button */}
        <button
          type="button"
          onClick={onCheck}
          disabled={checking}
          style={{
            height: '46px',
            padding: '0 28px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FF1E3C 0%, #B30018 100%)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 700,
            cursor: checking ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 8px 24px rgba(229, 25, 55, 0.4)',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw
            style={{
              width: '16px',
              height: '16px',
              animation: checking ? 'spin 1s linear infinite' : 'none',
            }}
          />
          <span>{checking ? 'Checking Status...' : 'Check Status / Unlock Now'}</span>
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
