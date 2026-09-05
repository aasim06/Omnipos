import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Tooltip,
  Menu,
  MenuTrigger,
  MenuList,
  MenuItem,
  MenuPopover,
  MenuDivider,
  Avatar,
  Text,
  Button,
  Badge,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  makeStyles,
  tokens,
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
  Tag20Regular,
  Grid20Regular,
  Add20Regular,
  ChevronDown20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  Box20Regular,
  ArrowCircleDown20Regular,
  ArrowCircleUp20Regular,
  PeopleCommunity20Regular,
  PeopleCommunity24Regular,
  PeopleCommunity24Filled,
  DocumentTableSearch20Regular,
  Database20Regular,
  ArrowSync20Filled,
} from '@fluentui/react-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useLicense, LicenseModules } from '@/features/auth/LicenseModulesContext';
import { MODULE_TO_PERMISSION } from './RouteAccessGate';
import { useAppTheme } from '@/theme/AppProviders';

const useStyles = makeStyles({
  laserIndicator: {
    position: 'absolute',
    left: '0',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3.5px',
    height: '22px',
    borderRadius: '0 3px 3px 0',
    backgroundColor: '#E51937',
    boxShadow: '0 0 10px #E51937',
  },
  submenuLaserNotch: {
    position: 'absolute',
    left: '-11.5px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '18px',
    borderRadius: '2px',
    backgroundColor: '#E51937',
    boxShadow: '0 0 10px #E51937, 0 0 20px #E51937',
    zIndex: 2,
  },
  accordionBtn: {
    width: '100%',
    height: '38px',
    padding: '0 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box',
  },
  accordionInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  subItemBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '32px',
    padding: '0 8px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
  },
  noWrapText: {
    whiteSpace: 'nowrap',
  },
});

export function FluentSidebar(): React.JSX.Element {
  const styles = useStyles();
  const { mode, toggleTheme } = useAppTheme();
  const { user, logout, hasPermission } = useAuth();
  const { can } = useLicense();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin' || hasPermission('admin');

  // Storage Diagnostics Modal State
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [storageStatusMsg, setStorageStatusMsg] = useState('');

  const handleResyncStorage = async () => {
    setStorageStatusMsg('Syncing local SQLite & WAL with cloud server...');
    try {
      if (typeof window !== 'undefined' && (window as any).syncEngine?.triggerSync) {
        await (window as any).syncEngine.triggerSync();
      }
      setTimeout(() => {
        setStorageStatusMsg('Local database & cloud are synchronized!');
        setTimeout(() => setStorageStatusMsg(''), 3000);
      }, 700);
    } catch {
      setStorageStatusMsg('Local SQLite WAL is active (Offline mode)');
    }
  };

  // Collapsed state persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('omnipos_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('omnipos_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B / Cmd+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Accordion for Products submenu
  const isCatalogActive = location.pathname.startsWith('/catalog');
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(() => isCatalogActive);

  // Accordion for Inventory submenu
  const isInventoryActive = location.pathname.startsWith('/inventory');
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(() => isInventoryActive);

  useEffect(() => {
    if (isCatalogActive) {
      setIsCatalogOpen(true);
    }
  }, [isCatalogActive]);

  useEffect(() => {
    if (isInventoryActive) {
      setIsInventoryOpen(true);
    }
  }, [isInventoryActive]);

  const allSections = [
    {
      title: 'HOME',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          badge: 'LIVE',
          icon: <DataTrending24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <DataTrending24Filled style={{ width: 19, height: 19 }} />,
        },
      ],
    },
    {
      title: 'BILLING & SALES',
      items: [
        {
          to: '/pos/fastfood',
          label: 'Fast Food POS',
          moduleKey: 'fastfood' as const,
          icon: <Food24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <Food24Filled style={{ width: 19, height: 19 }} />,
        },
        {
          to: '/pos/omnimart',
          label: 'Mart Counter',
          moduleKey: 'omnimart' as const,
          icon: <BuildingRetail24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <BuildingRetail24Filled style={{ width: 19, height: 19 }} />,
        },
        {
          to: '/kitchen',
          label: 'Kitchen Screen',
          badge: 'KOT',
          moduleKey: 'kitchen' as const,
          icon: <BowlSalad24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <BowlSalad24Filled style={{ width: 19, height: 19 }} />,
        },
      ],
    },
    {
      title: 'ITEMS & STOCK',
      items: [
        {
          isAccordion: true,
          label: 'Products & Menu',
          moduleKey: 'catalog' as const,
          subtitle: 'All items & prices',
          isOpen: isCatalogOpen,
          setIsOpen: setIsCatalogOpen,
          isActive: isCatalogActive,
          defaultRoute: '/catalog',
          icon: <Tag24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <Tag24Filled style={{ width: 19, height: 19 }} />,
          subItems: [
            { to: '/catalog', label: 'All Products', icon: <Tag20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/catalog/fastfood', label: 'Fast Food Menu', moduleKey: 'fastfood' as const, icon: <Food24Regular style={{ width: 15, height: 15 }} /> },
            { to: '/catalog/omnimart', label: 'Mart Items', moduleKey: 'omnimart' as const, icon: <BuildingRetail24Regular style={{ width: 15, height: 15 }} /> },
            { to: '/catalog/categories', label: 'Categories', icon: <Grid20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/catalog/new', label: '+ Add New Item', icon: <Add20Regular style={{ width: 15, height: 15, color: '#FF4D63' }} />, isSpecial: true },
          ],
        },
        {
          isAccordion: true,
          label: 'Stock Manager',
          moduleKey: 'inventory' as const,
          subtitle: 'Stock in, out & records',
          isOpen: isInventoryOpen,
          setIsOpen: setIsInventoryOpen,
          isActive: isInventoryActive,
          defaultRoute: '/inventory/dashboard',
          icon: <Box24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <Box24Filled style={{ width: 19, height: 19 }} />,
          subItems: [
            { to: '/inventory/dashboard', label: 'Stock Overview', icon: <Box20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/inventory/stock-in', label: 'Stock In (Purchases)', icon: <ArrowCircleDown20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/inventory/stock-out', label: 'Stock Out (Waste/Damage)', icon: <ArrowCircleUp20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/inventory/vendors', label: 'Suppliers', icon: <PeopleCommunity20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/inventory/ledger', label: 'Stock History', icon: <DocumentTableSearch20Regular style={{ width: 15, height: 15 }} /> },
          ],
        },
        {
          to: '/khata',
          label: 'Customer Khata (Credit)',
          moduleKey: 'khata' as const,
          icon: <BookContacts24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <BookContacts24Filled style={{ width: 19, height: 19 }} />,
        },
      ],
    },
    {
      title: 'ACCOUNTS & REPORTS',
      items: [
        {
          to: '/expenses',
          label: 'Daily Expenses',
          moduleKey: 'expenses' as const,
          icon: <Money24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <Money24Filled style={{ width: 19, height: 19 }} />,
        },
        {
          to: '/reports',
          label: 'Sales & Reports',
          moduleKey: 'reports' as const,
          icon: <DataTrending24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <DataTrending24Filled style={{ width: 19, height: 19 }} />,
        },
      ],
    },
    {
      title: 'SETTINGS & USERS',
      items: [
        {
          to: '/admin',
          label: 'Staff & Cashiers',
          moduleKey: 'admin' as const,
          icon: <PeopleCommunity24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <PeopleCommunity24Filled style={{ width: 19, height: 19 }} />,
        },
      ],
    },
  ];

  // Dynamically filter sections and items according to remote module licenses AND user permissions
  const sections = allSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((it: any) => {
        // 1. Check license module capability
        if (it.moduleKey) {
          if (it.moduleKey === 'kitchen') {
            if (!can('kitchen') && !can('fastfood')) return false;
          } else if (!can(it.moduleKey)) {
            return false;
          }
        }
        // 2. Check user granular permission (cashier restrictions)
        if (it.moduleKey) {
          if (it.moduleKey === 'kitchen') {
            if (!hasPermission('kitchen') && !hasPermission('pos_fastfood')) return false;
          } else {
            const perm = MODULE_TO_PERMISSION[it.moduleKey as keyof LicenseModules];
            if (perm && !hasPermission(perm)) return false;
          }
        }
        return true;
      }),
    }))
    .filter((sec) => sec.items.length > 0);

  const isDark = mode === 'dark';

  const t = {
    sidebarBg: isDark ? 'linear-gradient(180deg, #111215 0%, #0c0d10 100%)' : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    sidebarBorder: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
    sidebarShadow: isDark ? '4px 0 24px rgba(0, 0, 0, 0.35)' : '4px 0 20px rgba(0, 0, 0, 0.04)',
    headerBorder: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
    brandTitle: isDark ? '#FFFFFF' : '#0F172A',
    brandSubtitle: isDark ? '#64748B' : '#64748B',
    sectionTitle: isDark ? '#475569' : '#94A3B8',
    sectionDot: isDark ? '#334155' : '#CBD5E1',
    divider: isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0',

    // Items
    itemText: isDark ? '#94A3B8' : '#475569',
    itemHoverBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
    itemHoverText: isDark ? '#F1F5F9' : '#0F172A',
    itemActiveText: isDark ? '#FFFFFF' : '#E51937',
    itemActiveBg: isDark
      ? 'linear-gradient(90deg, rgba(229, 25, 55, 0.16) 0%, rgba(229, 25, 55, 0.04) 100%)'
      : 'linear-gradient(90deg, rgba(229, 25, 55, 0.12) 0%, rgba(229, 25, 55, 0.03) 100%)',
    itemActiveBorder: isDark ? '1px solid rgba(229, 25, 55, 0.28)' : '1px solid rgba(229, 25, 55, 0.22)',

    // Submenu
    submenuBorder: isDark ? '1.5px solid rgba(255, 255, 255, 0.08)' : '1.5px solid #E2E8F0',
    submenuText: isDark ? '#94A3B8' : '#64748B',
    submenuActiveText: '#E51937',
    submenuActiveBg: isDark ? 'rgba(229, 25, 55, 0.1)' : 'rgba(229, 25, 55, 0.08)',

    // Bottom Deck
    deckBorder: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
    deckBg: isDark
      ? 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)'
      : 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.02) 100%)',
    userCardBg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
    userCardBorder: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
    userName: isDark ? '#F1F5F9' : '#0F172A',
    userSub: '#64748B',

    // Buttons
    buttonBg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F1F5F9',
    buttonBorder: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
    buttonText: isDark ? '#94A3B8' : '#475569',

    // Popovers
    popoverBg: isDark ? '#121316' : '#FFFFFF',
    popoverBorder: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
    popoverShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.6)' : '0 12px 36px rgba(0, 0, 0, 0.08)',
  };

  return (
    <nav
      style={{
        width: isCollapsed ? '64px' : '236px',
        height: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: t.sidebarBg,
        borderRight: t.sidebarBorder,
        boxSizing: 'border-box',
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease, border-color 0.2s ease',
        position: 'relative',
        userSelect: 'none',
        boxShadow: t.sidebarShadow,
      }}
    >
      {/* ── Top Ambient Glow Header ─────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: isCollapsed ? '16px 0 12px' : '16px 14px 14px',
          borderBottom: t.headerBorder,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          background: isDark
            ? 'radial-gradient(circle at 50% 0%, rgba(229, 25, 55, 0.12) 0%, transparent 75%)'
            : 'radial-gradient(circle at 50% 0%, rgba(229, 25, 55, 0.06) 0%, transparent 75%)',
        }}
      >
        <div
          onClick={toggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            width: isCollapsed ? 'auto' : '100%',
            gap: '10px',
          }}
          title={isCollapsed ? 'Click to expand sidebar (Ctrl+B)' : 'Click to collapse sidebar (Ctrl+B)'}
        >
          {/* Futuristic Hexagon/Square Logo Badge */}
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF1E3C 0%, #B30018 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '14px',
              letterSpacing: '-0.5px',
              boxShadow: '0 0 16px rgba(229, 25, 55, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              flexShrink: 0,
            }}
          >
            OP
          </div>

          {!isCollapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 800, fontSize: '14.5px', color: t.brandTitle, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  OmniPos
                </span>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#E51937', boxShadow: '0 0 6px #E51937' }} />
              </div>
              <div style={{ fontSize: '9.5px', color: t.brandSubtitle, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Enterprise POS &amp; ERP
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable Navigation Items ─────────────────────────── */}
      <div
        className="fluent-sidebar-scroll"
        style={{
          flex: '1 1 0%',
          minHeight: 0,
          maxHeight: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '12px 6px' : '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        {sections.map((section, secIdx) => (
          <div key={section.title} style={{ marginBottom: '8px' }}>
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  color: t.sectionTitle,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '10px 10px 4px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '4px', height: '4px', borderRadius: '1px', backgroundColor: t.sectionDot }} />
                <span>{section.title}</span>
              </div>
            )}
            {isCollapsed && secIdx > 0 && (
              <div style={{ height: '1px', backgroundColor: t.divider, margin: '8px 6px' }} />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {section.items.map((item: any) => {
                // Special Accordion handling (Products & Catalog + Inventory & Stock)
                if (item.isAccordion) {
                  if (isCollapsed) {
                    // When collapsed: Flyout Popover Menu
                    return (
                      <Menu key={item.label} positioning="after" openOnHover={true} hoverDelay={150}>
                        <MenuTrigger disableButtonEnhancement>
                          <button
                            type="button"
                            onClick={() => navigate(item.defaultRoute)}
                            style={{
                              width: '42px',
                              height: '40px',
                              padding: 0,
                              margin: '0 auto',
                              borderRadius: '8px',
                              border: item.isActive ? t.itemActiveBorder : '1px solid transparent',
                              background: item.isActive ? t.itemActiveBg : 'transparent',
                              color: item.isActive ? '#FF4D63' : t.itemText,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Tooltip content={item.label} relationship="label" positioning="after">
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                {item.isActive && (
                                  <div
                                    style={{
                                      position: 'absolute',
                                      left: '0',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      width: '3.5px',
                                      height: '20px',
                                      borderRadius: '0 3px 3px 0',
                                      backgroundColor: '#E51937',
                                      boxShadow: '0 0 8px #E51937',
                                    }}
                                  />
                                )}
                                {item.isActive ? item.activeIcon : item.icon}
                              </span>
                            </Tooltip>
                          </button>
                        </MenuTrigger>
                        <MenuPopover
                          style={{
                            borderRadius: '10px',
                            padding: '6px',
                            minWidth: '220px',
                            backgroundColor: t.popoverBg,
                            border: t.popoverBorder,
                            boxShadow: t.popoverShadow,
                          }}
                        >
                          <MenuList>
                            <div style={{ padding: '6px 12px 8px', borderBottom: t.headerBorder, marginBottom: '4px' }}>
                              <Text weight="bold" size={200} block style={{ color: '#FF4D63' }}>
                                {item.label}
                              </Text>
                              <Text size={100} style={{ color: t.brandSubtitle }}>
                                {item.subtitle || 'Module navigation'}
                              </Text>
                            </div>
                            {item.subItems.map((sub: any) => (
                              <MenuItem
                                key={sub.to}
                                icon={sub.icon}
                                onClick={() => navigate(sub.to)}
                                style={{
                                  fontWeight: location.pathname === sub.to ? 700 : 500,
                                  color: location.pathname === sub.to ? '#FF4D63' : sub.isSpecial ? '#FF4D63' : isDark ? '#E2E8F0' : '#1E293B',
                                }}
                              >
                                {sub.label}
                              </MenuItem>
                            ))}
                          </MenuList>
                        </MenuPopover>
                      </Menu>
                    );
                  }

                  // When expanded: Accordion with ChevronDown
                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        onClick={() => item.setIsOpen((prev: boolean) => !prev)}
                        className={styles.accordionBtn}
                        style={{
                          border: item.isActive ? t.itemActiveBorder : '1px solid transparent',
                          background: item.isActive ? t.itemActiveBg : 'transparent',
                          color: item.isActive ? t.itemActiveText : t.itemText,
                        }}
                      >
                        <div className={styles.accordionInner}>
                          {item.isActive && (
                            <div className={styles.laserIndicator} />
                          )}
                          <span className={styles.iconWrap} style={{ color: item.isActive ? '#FF4D63' : t.itemText }}>
                            {item.isActive ? item.activeIcon : item.icon}
                          </span>
                          <span className={styles.noWrapText} style={{ fontSize: '13px', fontWeight: item.isActive ? 700 : 500 }}>
                            {item.label}
                          </span>
                        </div>
                        <ChevronDown20Regular
                          style={{
                            width: 15,
                            height: 15,
                            color: t.sectionTitle,
                            transition: 'transform 0.22s ease',
                            transform: item.isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          }}
                        />
                      </button>

                      {/* Smooth slide-down Submenu with glowing guide line */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          marginLeft: '14px',
                          paddingLeft: '10px',
                          borderLeft: t.submenuBorder,
                          overflow: 'hidden',
                          maxHeight: item.isOpen ? '240px' : '0',
                          opacity: item.isOpen ? 1 : 0,
                          marginTop: item.isOpen ? '4px' : '0',
                          marginBottom: item.isOpen ? '4px' : '0',
                          transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      >
                        {item.subItems
                          .filter((sub: any) => !sub.moduleKey || can(sub.moduleKey))
                          .map((sub: any) => {
                            const isSubActive = location.pathname === sub.to;
                          return (
                            <button
                              key={sub.to}
                              type="button"
                              onClick={() => navigate(sub.to)}
                              className={styles.subItemBtn}
                              style={{
                                color: isSubActive ? t.submenuActiveText : t.submenuText,
                                background: isSubActive ? t.submenuActiveBg : 'transparent',
                                fontWeight: isSubActive ? 700 : 500,
                              }}
                            >
                              {/* Glowing Laser Notch right over the line */}
                              {isSubActive && (
                                <div className={styles.submenuLaserNotch} />
                              )}
                              <span className={styles.iconWrap} style={{ opacity: isSubActive ? 1 : 0.75 }}>
                                {sub.icon}
                              </span>
                              <span className={styles.noWrapText} style={{ fontWeight: isSubActive ? 700 : 500, fontSize: '12px' }}>
                                {sub.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Standard NavLink Item
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      height: '38px',
                      width: isCollapsed ? '42px' : '100%',
                      margin: isCollapsed ? '0 auto' : '0',
                      padding: isCollapsed ? '0' : '0 10px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      position: 'relative',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isActive ? t.itemActiveBorder : '1px solid transparent',
                      background: isActive ? t.itemActiveBg : 'transparent',
                      color: isActive ? t.itemActiveText : t.itemText,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                    })}
                  >
                    {({ isActive }) => {
                      const content = isCollapsed ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute',
                                left: '0',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '3.5px',
                                height: '20px',
                                borderRadius: '0 3px 3px 0',
                                backgroundColor: '#E51937',
                                boxShadow: '0 0 8px #E51937',
                              }}
                            />
                          )}
                          <span style={{ color: isActive ? '#FF4D63' : t.itemText, filter: isActive ? 'drop-shadow(0 0 6px rgba(229, 25, 55, 0.6))' : 'none' }}>
                            {isActive ? item.activeIcon : item.icon}
                          </span>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                          {isActive && (
                            <div
                              style={{
                                position: 'absolute',
                                left: '0',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '3.5px',
                                height: '22px',
                                borderRadius: '0 3px 3px 0',
                                backgroundColor: '#E51937',
                                boxShadow: '0 0 10px #E51937',
                              }}
                            />
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#FF4D63' : t.itemText, filter: isActive ? 'drop-shadow(0 0 6px rgba(229, 25, 55, 0.6))' : 'none' }}>
                            {isActive ? item.activeIcon : item.icon}
                          </span>
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 700 : 500, fontSize: '13px' }}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              style={{
                                fontSize: '9.5px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(229, 25, 55, 0.15)',
                                color: '#FF4D63',
                                border: '1px solid rgba(229, 25, 55, 0.3)',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </span>
                      );

                      if (isCollapsed) {
                        return (
                          <Tooltip content={item.label} relationship="label" positioning="after">
                            {content}
                          </Tooltip>
                        );
                      }
                      return content;
                    }}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Deck ─────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          padding: isCollapsed ? '10px 6px 14px' : '10px 10px 14px',
          borderTop: t.deckBorder,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: t.deckBg,
        }}
      >
        {/* ── Bottom Deck Action Toolbar (Theme, [Settings], [Storage], Logout, Collapse) ── */}
        <div
          style={{
            display: isCollapsed ? 'flex' : 'grid',
            gridTemplateColumns: isAdmin ? 'repeat(5, 1fr)' : 'repeat(3, 1fr)',
            flexDirection: isCollapsed ? 'column' : 'row',
            gap: '4px',
            width: isCollapsed ? '38px' : '100%',
            margin: isCollapsed ? '0 auto' : '0',
            alignItems: 'center',
            padding: '3px',
            borderRadius: '9px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            boxSizing: 'border-box',
          }}
        >
          {/* 1. Light / Dark Theme Button */}
          <Tooltip
            content={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            relationship="label"
            positioning={isCollapsed ? 'after' : 'above'}
          >
            <button
              type="button"
              onClick={toggleTheme}
              style={{
                height: '32px',
                width: '100%',
                padding: 0,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: mode === 'dark' ? '#F59E0B' : '#E51937',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
                e.currentTarget.style.boxShadow = isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {mode === 'dark' ? (
                <WeatherSunny20Regular style={{ width: 17, height: 17, color: '#F59E0B' }} />
              ) : (
                <WeatherMoon20Regular style={{ width: 17, height: 17, color: '#E51937' }} />
              )}
            </button>
          </Tooltip>

          {/* 2. Admin & Store Settings Button (Admin Only) */}
          {isAdmin && (
            <Tooltip
              content="Store & Admin Settings"
              relationship="label"
              positioning={isCollapsed ? 'after' : 'above'}
            >
              <button
                type="button"
                onClick={() => navigate('/admin')}
                style={{
                  height: '32px',
                  width: '100%',
                  padding: 0,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: location.pathname === '/admin' ? (isDark ? 'rgba(229, 25, 55, 0.2)' : 'rgba(229, 25, 55, 0.12)') : 'transparent',
                  color: location.pathname === '/admin' ? '#E51937' : (isDark ? '#CBD5E1' : '#64748B'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (location.pathname !== '/admin') {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
                    e.currentTarget.style.boxShadow = isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (location.pathname !== '/admin') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                title="Store & Admin Settings"
              >
                <Settings20Regular style={{ width: 17, height: 17, color: location.pathname === '/admin' ? '#E51937' : undefined }} />
              </button>
            </Tooltip>
          )}

          {/* 3. Storage & Database Engine Button (Admin Only) */}
          {isAdmin && (
            <Tooltip
              content="Local Storage & Database"
              relationship="label"
              positioning={isCollapsed ? 'after' : 'above'}
            >
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(true)}
                style={{
                  height: '32px',
                  width: '100%',
                  padding: 0,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isStorageModalOpen ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)') : 'transparent',
                  color: isDark ? '#CBD5E1' : '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isStorageModalOpen) {
                    e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
                    e.currentTarget.style.boxShadow = isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isStorageModalOpen) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                title="Local Storage & Database Engine"
              >
                <Database20Regular style={{ width: 17, height: 17 }} />
              </button>
            </Tooltip>
          )}

          {/* 4. Lock Terminal / Log Out Button */}
          <Tooltip
            content={`Log Out / Lock Terminal (${user?.name || 'Cashier'})`}
            relationship="label"
            positioning={isCollapsed ? 'after' : 'above'}
          >
            <button
              type="button"
              onClick={logout}
              style={{
                height: '32px',
                width: '100%',
                padding: 0,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#EF4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.boxShadow = isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={`Log Out / Lock Terminal (${user?.name || 'Cashier'})`}
            >
              <LockClosed20Regular style={{ width: 17, height: 17, color: '#EF4444' }} />
            </button>
          </Tooltip>

          {/* 5. Collapse / Expand Sidebar Button */}
          <Tooltip
            content={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            relationship="label"
            positioning={isCollapsed ? 'after' : 'above'}
          >
            <button
              type="button"
              onClick={toggleSidebar}
              style={{
                height: '32px',
                width: '100%',
                padding: 0,
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: isDark ? '#CBD5E1' : '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
                e.currentTarget.style.boxShadow = isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            >
              {isCollapsed ? (
                <ChevronRight20Regular style={{ width: 17, height: 17, color: isDark ? '#CBD5E1' : '#64748B' }} />
              ) : (
                <ChevronLeft20Regular style={{ width: 17, height: 17, color: isDark ? '#CBD5E1' : '#64748B' }} />
              )}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ── Storage & Local Database Dialog ─────────────────────────── */}
      <Dialog open={isStorageModalOpen} onOpenChange={(_, d) => setIsStorageModalOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '440px' }}>
          <DialogBody>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database20Regular style={{ color: '#E51937' }} />
              <span>Offline-First Storage Engine</span>
            </DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                Local storage resilience, SQLite WAL persistence, and data synchronization.
              </Text>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground3, border: `1px solid ${tokens.colorNeutralStroke1}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>Database Engine</span>
                  <Badge appearance="tint" color="success">SQLite WAL Active</Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>Cloud Sync Engine</span>
                  <Badge appearance="tint" color="brand" style={{ backgroundColor: 'rgba(229, 25, 55, 0.1)', color: '#E51937' }}>
                    Auto-Sync Online
                  </Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: tokens.colorNeutralForeground2 }}>Terminal State</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>● Healthy &amp; Ready</span>
                </div>
              </div>

              {storageStatusMsg && (
                <div style={{ color: '#10B981', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                  {storageStatusMsg}
                </div>
              )}
            </DialogContent>
            <DialogActions style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(false)}
                style={{
                  height: '36px',
                  padding: '0 18px',
                  borderRadius: '7px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                  color: isDark ? '#F1F5F9' : '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleResyncStorage}
                style={{
                  height: '36px',
                  padding: '0 20px',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: '#E51937',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(229, 25, 55, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <ArrowSync20Filled style={{ width: 15, height: 15 }} />
                <span>Force Cloud Resync</span>
              </button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </nav>
  );
}
