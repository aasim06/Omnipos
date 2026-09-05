import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Button,
  Subtitle1,
  Subtitle2,
  Body1,
  Caption1,
  Badge,
} from '@fluentui/react-components';
import {
  Person20Regular,
  LockClosed20Regular,
  Eye20Regular,
  EyeOff20Regular,
  ArrowRight20Filled,
  ShieldCheckmark24Regular,
  CheckmarkCircle20Filled,
} from '@fluentui/react-icons';
import { useAuth } from './AuthContext';
import { userStorage } from './userStorage';
import { useNavigate } from 'react-router-dom';
import { CustomInput } from '@/components/ui';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground1,
    backgroundImage: `radial-gradient(circle at 50% 50%, ${tokens.colorBrandBackground2} 0%, ${tokens.colorNeutralBackground1} 100%)`,
    padding: '20px',
    boxSizing: 'border-box',
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    padding: '36px 32px',
    borderRadius: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow16,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  brandHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
  },
  logoBox: {
    width: '56px',
    height: '56px',
    borderRadius: '18px',
    backgroundColor: '#E50914',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 800,
    boxShadow: '0 8px 24px rgba(229, 9, 20, 0.35)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '8px',
  },
  quickPills: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '6px',
  },
  footerStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '12px',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: 800,
  },
  brandSubtitle: {
    color: tokens.colorNeutralForeground3,
    display: 'block',
  },
  accessHeaderBox: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    paddingTop: '16px',
  },
  accessHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accessTitle: {
    fontWeight: 700,
  },
  accessLockIcon: {
    color: tokens.colorBrandForeground1,
  },
  accessSubtitle: {
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
    display: 'block',
  },
  eyeBtn: {
    backgroundColor: 'transparent',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground3,
  },
  signInBtn: {
    width: '100%',
    height: '48px',
    fontWeight: 800,
    fontSize: '15px',
    marginTop: '10px',
    backgroundColor: '#E50914',
    borderRadius: '9999px',
    boxShadow: '0 8px 24px rgba(229, 9, 20, 0.35)',
  },
  demoLabel: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    display: 'block',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#107c41',
    display: 'inline-block',
  },
  statusText: {
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
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
      setErrorMsg('Please enter your username');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password');
      return;
    }

    const result = userStorage.verifyCredentials(username, password);
    if (!result.success || !result.user) {
      setErrorMsg(result.error || 'Invalid credentials');
      return;
    }

    login(result.user);

    // Navigate to first accessible route
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

  const handleQuickDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
    const result = userStorage.verifyCredentials(user, pass);
    if (result.success && result.user) {
      login(result.user);
      navigate(result.user.role === 'admin' || result.user.permissions.includes('pos_fastfood') ? '/pos/fastfood' : '/pos/omnimart');
    } else {
      setErrorMsg(result.error || 'Quick login failed');
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        {/* Brand Icon & Heading */}
        <div className={styles.brandHeader}>
          <div className={styles.logoBox}>OP</div>
          <div>
            <Subtitle1 className={styles.brandTitle}>OMNIPOS STORE</Subtitle1>
            <Caption1 className={styles.brandSubtitle}>
              Point of Sale & Inventory System
            </Caption1>
          </div>
        </div>

        {/* Card Title matching screenshot */}
        <div className={styles.accessHeaderBox}>
          <div className={styles.accessHeaderRow}>
            <Subtitle2 className={styles.accessTitle}>Secure Access</Subtitle2>
            <LockClosed20Regular className={styles.accessLockIcon} />
          </div>
          <Caption1 className={styles.accessSubtitle}>
            Enter your credentials to continue
          </Caption1>
        </div>

        {errorMsg && (
          <Badge appearance="tint" color="danger">
            {errorMsg}
          </Badge>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <CustomInput
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            icon={<Person20Regular />}
            required
            autoComplete="username"
          />

          <CustomInput
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            icon={<LockClosed20Regular />}
            required
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.eyeBtn}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff20Regular /> : <Eye20Regular />}
              </button>
            }
          />

          <Button
            type="submit"
            appearance="primary"
            size="large"
            icon={<ArrowRight20Filled />}
            iconPosition="after"
            className={styles.signInBtn}
          >
            Sign In to Dashboard
          </Button>
        </form>

        {/* Quick Demo Sign In Pills */}
        <div>
          <Caption1 className={styles.demoLabel}>
            Quick Demo Login:
          </Caption1>
          <div className={styles.quickPills}>
            <Button
              size="small"
              appearance="secondary"
              onClick={() => handleQuickDemo('admin', '1234')}
            >
              Manager (Admin)
            </Button>
          </div>
        </div>

        {/* Connected Indicator footer matching screenshot */}
        <div className={styles.footerStatus}>
          <span className={styles.statusDot} />
          <Caption1 className={styles.statusText}>
            Connected to Local SQLite Database (Offline-Ready)
          </Caption1>
        </div>
      </Card>
    </div>
  );
}
