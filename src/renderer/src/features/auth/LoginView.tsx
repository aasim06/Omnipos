import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Badge,
} from '@fluentui/react-components';
import {
  Person20Regular,
  LockClosed20Regular,
  Eye20Regular,
  EyeOff20Regular,
  ArrowRight20Filled,
  ShieldCheckmark20Regular,
  Flash20Regular,
  Receipt20Regular,
  CheckmarkCircle20Filled,
} from '@fluentui/react-icons';
import { useAuth } from './AuthContext';
import { userStorage } from './userStorage';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent', // Mica / theme frame shows through
    padding: '24px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  splitCard: {
    display: 'flex',
    width: '100%',
    maxWidth: '860px',
    minHeight: '520px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow28,
    overflow: 'hidden',
    position: 'relative',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      maxWidth: '440px',
      minHeight: 'auto',
    },
  },

  /* Left Brand Showcase Banner */
  leftBanner: {
    width: '42%',
    backgroundColor: tokens.colorBrandBackground, // flat brand panel,
    padding: '48px 36px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    color: '#ffffff',
    boxSizing: 'border-box',
    '@media (max-width: 768px)': {
      width: '100%',
      padding: '32px 24px',
    },
  },
  ambientGlowCircle: {
    position: 'absolute',
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    display: 'none', // no decorative glow in Win11,
    top: '-60px',
    left: '-60px',
    pointerEvents: 'none',
  },
  ambientGlowBottom: {
    position: 'absolute',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    display: 'none', // no decorative glow in Win11,
    bottom: '-100px',
    right: '-100px',
    pointerEvents: 'none',
  },
  brandContentWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '18px',
    position: 'relative',
    zIndex: 2,
    margin: 'auto 0',
  },
  brandTitle: {
    fontSize: '30px',
    fontWeight: 600,
    letterSpacing: '-0.03em',
    color: '#ffffff',
    margin: 0,
    lineHeight: 1.1,
  },
  brandTaglineBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(255, 255, 255, 0.25)', borderBottomColor: 'rgba(255, 255, 255, 0.25)', borderLeftColor: 'rgba(255, 255, 255, 0.25)', borderRightColor: 'rgba(255, 255, 255, 0.25)',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#FFE4E6',
  },
  brandDescription: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 1.45,
    maxWidth: '240px',
    margin: 0,
    fontWeight: 400,
  },
  bannerFeatureRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    position: 'relative',
    zIndex: 2,
    marginTop: '20px',
  },
  bannerFeaturePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10.5px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    padding: '3px 9px',
    borderRadius: '8px',
  },

  /* Right Form Container */
  rightFormCol: {
    width: '58%',
    padding: '44px 44px 36px 44px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: tokens.colorNeutralBackground1,
    boxSizing: 'border-box',
    position: 'relative',
    '@media (max-width: 768px)': {
      width: '100%',
      padding: '32px 24px',
    },
  },
  formHeader: {
    marginBottom: '24px',
  },
  formHeading: {
    fontSize: '28px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  formSubheading: {
    fontSize: '13.5px',
    color: tokens.colorNeutralForeground2,
    marginTop: '6px',
    margin: 0,
    lineHeight: 1.4,
  },

  /* Input Styling */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  fieldHelperLink: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: tokens.colorBrandForeground1,
    background: 'none',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    padding: 0,
    cursor: 'pointer',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2, borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
    borderRadius: '8px',
    padding: '0 14px',
    height: '46px',
    backgroundColor: tokens.colorNeutralBackground2,
    transition: 'all 0.2s ease',
    ':focus-within': {
      borderTopColor: tokens.colorCompoundBrandStroke, borderBottomColor: tokens.colorCompoundBrandStroke, borderLeftColor: tokens.colorCompoundBrandStroke, borderRightColor: tokens.colorCompoundBrandStroke,
      backgroundColor: tokens.colorNeutralBackground1,
      boxShadow: 'none',
    },
  },
  inputField: {
    flex: 1,
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    background: 'transparent',
    outlineStyle: 'none',
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
    width: '100%',
    fontFamily: 'inherit',
    '::placeholder': {
      color: tokens.colorNeutralForeground3,
    },
  },
  inputIcon: {
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    alignItems: 'center',
  },
  eyeBtn: {
    backgroundColor: 'transparent',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
    outlineStyle: 'none',
    ':hover': {
      color: tokens.colorNeutralForeground1,
    },
  },

  /* Buttons Row matching Flipkart style */
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '6px',
    alignItems: 'center',
  },
  loginBtnPrimary: {
    flex: 1,
    height: '46px',
    borderRadius: '8px',
    backgroundColor: tokens.colorBrandBackground,
    color: '#ffffff',
    fontSize: '14.5px',
    fontWeight: 600,
    boxShadow: 'none',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#CC0825',
      boxShadow: 'none',
      transform: 'translateY(-1px)',
    },
  },
  quickAdminBtnOutline: {
    flex: 1,
    height: '46px',
    borderRadius: '8px',
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2, borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
    color: tokens.colorNeutralForeground2,
    fontSize: '13.5px',
    fontWeight: 600,
    backgroundColor: tokens.colorNeutralBackground1,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
      borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
      color: tokens.colorNeutralForeground1,
    },
  },

  /* Footer Note */
  formFooter: {
    marginTop: '20px',
    paddingTop: '16px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    color: tokens.colorNeutralForeground2,
  },
  sqlitePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    color: tokens.colorStatusSuccessForeground1,
    fontWeight: 600,
  },
  pulsingDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: tokens.colorStatusSuccessBackground3,
    boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.25)',
  },
});

export function LoginView(): React.JSX.Element {
  const styles = useStyles();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your username / cashier ID');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    const result = userStorage.verifyCredentials(username, password);
    if (!result.success || !result.user) {
      setErrorMsg(result.error || 'Invalid username or password');
      return;
    }

    login(result.user);

    // Route to user permission destination
    if (result.user.role === 'admin' || result.user.permissions.includes('pos_fastfood')) {
      navigate('/pos/fastfood');
    } else if (result.user.permissions.includes('pos_omnimart')) {
      navigate('/pos/omnimart');
    } else if (result.user.permissions.includes('kitchen')) {
      navigate('/kitchen');
    } else if (result.user.permissions.includes('catalog')) {
      navigate('/catalog');
    } else if (result.user.permissions.includes('inventory')) {
      navigate('/inventory');
    } else if (result.user.permissions.includes('khata')) {
      navigate('/khata');
    } else if (result.user.permissions.includes('expenses')) {
      navigate('/expenses');
    } else if (result.user.permissions.includes('reports')) {
      navigate('/reports');
    } else {
      navigate('/pos/fastfood');
    }
  };

  const fillAdminCredentials = () => {
    setUsername('admin');
    setPassword('admin123');
    setErrorMsg('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.splitCard}>
        
        {/* ── LEFT PANEL: BRAND SHOWCASE WITH ROTATING LIGHT BEAM LOGO ── */}
        <div className={styles.leftBanner}>
          <div className={styles.ambientGlowCircle} />
          <div className={styles.ambientGlowBottom} />

          <div className={styles.brandContentWrap}>
            {/* Logo Orbit with Rotating Glowing Laser Beam */}
            <div
              style={{
                position: 'relative',
                width: '124px',
                height: '124px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Animated Rotating Laser Beam SVG */}
              <svg
                viewBox="0 0 120 120"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  {/* Fading tail gradient (transparent to pure luminous white) */}
                  <linearGradient id="orbitLaserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="45%" stopColor="#ffffff" stopOpacity="0.2" />
                    <stop offset="75%" stopColor="#ffffff" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                  </linearGradient>

                  {/* Intense Neon Light Glow Filter for the leading head tip */}
                  <filter id="lightenHeadGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="3.5" result="blurCore" />
                    <feGaussianBlur stdDeviation="7" result="blurHalo" />
                    <feMerge>
                      <feMergeNode in="blurHalo" />
                      <feMergeNode in="blurCore" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Subtle dashed orbit guide track */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="3 4"
                />

                {/* Rotating Beam Group with Continuous 360-degree Spin */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 60 60"
                    to="360 60 60"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />

                  {/* Fading Arc Tail (approx 90 degrees) */}
                  <path
                    d="M 60 8 A 52 52 0 0 1 112 60"
                    fill="none"
                    stroke="url(#orbitLaserGrad)"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />

                  {/* LIGHTENED FRONT TIP (Agla Sira) — Radiant Glowing Beacon */}
                  <circle
                    cx="112"
                    cy="60"
                    r="6.5"
                    fill="#ffffff"
                    opacity="0.5"
                    filter="url(#lightenHeadGlow)"
                  />
                  <circle
                    cx="112"
                    cy="60"
                    r="4"
                    fill="#ffffff"
                    filter="url(#lightenHeadGlow)"
                  />
                  <circle
                    cx="112"
                    cy="60"
                    r="2.5"
                    fill="#ffffff"
                  />
                </g>
              </svg>

              {/* Central Round Brand Emblem */}
              <div
                style={{
                  width: '82px',
                  height: '82px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'none',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    backgroundColor: '#E51937',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '28px',
                    letterSpacing: '-0.02em',
                    boxShadow: 'inset 0 2px 8px rgba(255, 255, 255, 0.35)',
                  }}
                >
                  OP
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h1 className={styles.brandTitle}>OmniPos</h1>
              <div style={{ marginTop: '8px' }}>
                <span className={styles.brandTaglineBadge}>Enterprise POS &amp; ERP</span>
              </div>
            </div>

            <p className={styles.brandDescription}>
              Smart Restaurant &amp; Retail POS Management System
            </p>
          </div>

          {/* Bottom Security / Offline Highlights */}
          <div className={styles.bannerFeatureRow}>
            <span className={styles.bannerFeaturePill}>
              <Flash20Regular style={{ width: 13, height: 13 }} /> Fast Billing
            </span>
            <span className={styles.bannerFeaturePill}>
              <ShieldCheckmark20Regular style={{ width: 13, height: 13 }} /> Offline SQLite
            </span>
            <span className={styles.bannerFeaturePill}>
              <Receipt20Regular style={{ width: 13, height: 13 }} /> Dual Modules
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL: LOGIN FORM (FLIPKART DESIGN STRATEGY) ── */}
        <div className={styles.rightFormCol}>
          <div>
            {/* Header */}
            <div className={styles.formHeader}>
              <h2 className={styles.formHeading}>Login</h2>
              <p className={styles.formSubheading}>
                Get access to your POS Register, Kitchen Screen and Store ERP
              </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div style={{ marginBottom: '16px' }}>
                <Badge appearance="tint" color="danger" size="large" style={{ width: '100%', padding: '8px 12px' }}>
                  {errorMsg}
                </Badge>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Username Input */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldHeaderRow}>
                  <label htmlFor="login-username" className={styles.fieldLabel}>
                    Enter Username / Staff ID
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or cashier"
                    required
                    autoComplete="username"
                    autoFocus
                    className={styles.inputField}
                  />
                  <div className={styles.inputIcon}>
                    <Person20Regular style={{ width: 18, height: 18 }} />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className={styles.fieldGroup}>
                <div className={styles.fieldHeaderRow}>
                  <label htmlFor="login-password" className={styles.fieldLabel}>
                    Enter Password
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoComplete="current-password"
                    className={styles.inputField}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.eyeBtn}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff20Regular style={{ width: 18, height: 18 }} />
                    ) : (
                      <Eye20Regular style={{ width: 18, height: 18 }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Two Action Buttons (Flipkart Strategy: Login & Secondary) */}
              <div className={styles.btnRow}>
                <Button
                  type="submit"
                  appearance="primary"
                  icon={<ArrowRight20Filled />}
                  iconPosition="after"
                  className={styles.loginBtnPrimary}
                >
                  Login
                </Button>

                <Button
                  type="button"
                  appearance="outline"
                  onClick={fillAdminCredentials}
                  className={styles.quickAdminBtnOutline}
                >
                  Quick Admin
                </Button>
              </div>
            </form>
          </div>

          {/* Connected SQLite Engine Telemetry */}
          <div className={styles.formFooter}>
            <div className={styles.sqlitePill}>
              <span className={styles.pulsingDot} />
              <span>Local SQLite Engine Live</span>
            </div>
            <span>Offline-Ready POS</span>
          </div>

        </div>

      </div>
    </div>
  );
}
