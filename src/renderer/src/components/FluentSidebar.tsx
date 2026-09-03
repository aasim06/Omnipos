import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuDivider,
  Avatar,
  Button,
  Text,
} from '@fluentui/react-components';
import {
  Food24Regular,
  Food24Filled,
  BuildingRetail24Regular,
  BuildingRetail24Filled,
  BowlSalad24Regular,
  BowlSalad24Filled,
  BookContacts24Regular,
  BookContacts24Filled,
  Box24Regular,
  Box24Filled,
  Money24Regular,
  Money24Filled,
  DataTrending24Regular,
  DataTrending24Filled,
  Settings20Regular,
  WeatherMoon20Regular,
  WeatherSunny20Regular,
  LockClosed20Regular,
  CloudCheckmark16Filled,
  Tag24Regular,
  Tag24Filled,
} from '@fluentui/react-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useAppTheme } from '@/theme/AppProviders';
import { SyncStatusIndicator } from './SyncStatusIndicator';

const useStyles = makeStyles({
  // Fluent v9 NavigationView: seamless sidebar merging with app frame
  // No heavy pitch-black container — uses app frame (#F5F5F5) Mica background
  sidebar: {
    width: '64px',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Fluent NavigationView: subtle neutral EBEBEB — lighter than app frame
    // but NOT dark — seamlessly blends into the Mica surface
    backgroundColor: tokens.colorNeutralBackground3,
    // Single subtle 1px right divider (NO heavy border or box-shadow)
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: tokens.colorNeutralStroke1,
    paddingTop: '14px',
    paddingBottom: '16px',
    boxSizing: 'border-box',
    flexShrink: 0,
  },

  logoBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '8px',
  },

  // 8px corner radius on logo badge (Fluent v9 borderRadiusMedium)
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: tokens.borderRadiusMedium, // 8px Fluent standard
    backgroundColor: '#E51937', // Reserved accent for brand only
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '15px',
    letterSpacing: '-0.5px',
  },

  navGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'center',
    width: '100%',
    paddingLeft: '8px',
    paddingRight: '8px',
    boxSizing: 'border-box',
  },

  // Fluent NavigationView item: 4px-8px radius, transparent background
  navItem: {
    width: '100%',
    height: '40px',
    borderRadius: tokens.borderRadiusMedium, // 8px Fluent v9 standard
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground2,
    textDecoration: 'none',
    position: 'relative',
    transition: 'background-color 0.1s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4,
      color: tokens.colorNeutralForeground1,
    },
  },

  // Active: white card container (#FFFFFF) on Mica frame — standard NavigationView active
  navItemActive: {
    backgroundColor: tokens.colorNeutralBackground1, // #FFFFFF elevated card on #F5F5F5 frame
    color: '#E51937', // Red accent only on active icon
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0,0,0,0.04)',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1,
      color: '#E51937',
    },
  },

  // Strict Fluent v9 NavigationView left accent indicator (3px, red, 4px radius)
  activeIndicator: {
    position: 'absolute',
    left: '-8px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    borderRadius: '0 3px 3px 0',
    backgroundColor: '#E51937', // Accent strictly for indicator only
  },

  bottomGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
    paddingLeft: '8px',
    paddingRight: '8px',
    boxSizing: 'border-box',
  },

  userBtn: {
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
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
});

export function FluentSidebar(): React.JSX.Element {
  const styles = useStyles();
  const { mode, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/pos/fastfood', label: 'Fast Food POS', icon: <Food24Regular />, activeIcon: <Food24Filled /> },
    { to: '/pos/omnimart', label: 'Omnimart POS', icon: <BuildingRetail24Regular />, activeIcon: <BuildingRetail24Filled /> },
    { to: '/kitchen', label: 'Kitchen Display (KDS)', icon: <BowlSalad24Regular />, activeIcon: <BowlSalad24Filled /> },
    { to: '/khata', label: 'Khata Ledger Book', icon: <BookContacts24Regular />, activeIcon: <BookContacts24Filled /> },
    { to: '/inventory', label: 'Inventory & Stock', icon: <Box24Regular />, activeIcon: <Box24Filled /> },
    { to: '/catalog', label: 'Products & Menu Catalog', icon: <Tag24Regular />, activeIcon: <Tag24Filled /> },
    { to: '/expenses', label: 'Expenses & Cash Drawer', icon: <Money24Regular />, activeIcon: <Money24Filled /> },
    { to: '/reports', label: 'Profit & Loss Analytics', icon: <DataTrending24Regular />, activeIcon: <DataTrending24Filled /> },
  ];

  return (
    <nav className={styles.sidebar}>
      <div className={styles.navGroup}>
        {/* Brand Logo */}
        <div className={styles.logoBox}>
          <div className={styles.logoBadge}>OP</div>
        </div>

        {/* Fluent NavigationView items */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            {({ isActive }) => (
              <Tooltip content={item.label} relationship="label" positioning="after">
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isActive && <div className={styles.activeIndicator} />}
                  {isActive ? item.activeIcon : item.icon}
                </span>
              </Tooltip>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom: Sync Status & User Avatar Menu */}
      <div className={styles.bottomGroup}>
        <SyncStatusIndicator />

        <Menu positioning="after-top">
          <MenuTrigger disableButtonEnhancement>
            <Tooltip content={`${user?.name || 'Cashier'} — Account`} relationship="label" positioning="after">
              <Button className={styles.userBtn} appearance="subtle">
                <Avatar
                  name={user?.name || 'Cashier'}
                  color="colorful"
                  size={32}
                  badge={{ status: 'available' }}
                />
              </Button>
            </Tooltip>
          </MenuTrigger>

          <MenuPopover style={{ borderRadius: '8px', padding: '6px', minWidth: '230px' }}>
            <MenuList>
              {/* User Identity Header */}
              <div style={{ padding: '8px 12px 10px', borderBottom: `1px solid ${tokens.colorNeutralStroke1}`, marginBottom: '4px' }}>
                <Text weight="semibold" size={200} block>{user?.name || 'Cashier Operator'}</Text>
                <Text size={100} style={{ color: tokens.colorNeutralForeground2, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <CloudCheckmark16Filled style={{ color: '#107C41', verticalAlign: 'middle' }} />
                  {' '}{user?.role || 'staff'} — Terminal Online
                </Text>
              </div>

              <MenuItem icon={<Settings20Regular />} onClick={() => navigate('/admin')}>
                Store &amp; Admin Settings
              </MenuItem>
              <MenuItem
                icon={mode === 'dark' ? <WeatherSunny20Regular /> : <WeatherMoon20Regular />}
                onClick={toggleTheme}
              >
                {mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              </MenuItem>

              <MenuDivider />

              <MenuItem
                icon={<LockClosed20Regular style={{ color: '#E51937' }} />}
                onClick={logout}
                style={{ color: '#E51937', fontWeight: 600 }}
              >
                Lock Terminal / Log Out
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      </div>
    </nav>
  );
}
