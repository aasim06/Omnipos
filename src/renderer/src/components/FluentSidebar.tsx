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
  DocumentTableSearch20Regular,
} from '@fluentui/react-icons';
import { useAuth } from '@/features/auth/AuthContext';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { useAppTheme } from '@/theme/AppProviders';
import { SyncStatusIndicator } from './SyncStatusIndicator';

export function FluentSidebar(): React.JSX.Element {
  const { mode, toggleTheme } = useAppTheme();
  const { user, logout } = useAuth();
  const { can } = useLicense();
  const navigate = useNavigate();
  const location = useLocation();

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
      title: 'POS TERMINALS',
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
          label: 'Omnimart POS',
          moduleKey: 'omnimart' as const,
          icon: <BuildingRetail24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <BuildingRetail24Filled style={{ width: 19, height: 19 }} />,
        },
        {
          to: '/kitchen',
          label: 'Kitchen Display',
          badge: 'KDS',
          moduleKey: 'kitchen' as const,
          icon: <BowlSalad24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <BowlSalad24Filled style={{ width: 19, height: 19 }} />,
        },
      ],
    },
    {
      title: 'INVENTORY & CATALOG',
      items: [
        {
          isAccordion: true,
          label: 'Products & Catalog',
          moduleKey: 'catalog' as const,
          subtitle: 'Store inventory & menus',
          isOpen: isCatalogOpen,
          setIsOpen: setIsCatalogOpen,
          isActive: isCatalogActive,
          defaultRoute: '/catalog',
          icon: <Tag24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <Tag24Filled style={{ width: 19, height: 19 }} />,
          subItems: [
            { to: '/catalog', label: 'All Store Items', icon: <Tag20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/catalog/fastfood', label: 'Fast Food Menu', icon: <Food24Regular style={{ width: 15, height: 15 }} /> },
            { to: '/catalog/omnimart', label: 'Omnimart Goods', icon: <BuildingRetail24Regular style={{ width: 15, height: 15 }} /> },
            { to: '/catalog/categories', label: 'Categories Manager', icon: <Grid20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/catalog/new', label: '+ Add Product', icon: <Add20Regular style={{ width: 15, height: 15, color: '#FF4D63' }} />, isSpecial: true },
          ],
        },
        {
          isAccordion: true,
          label: 'Inventory & Stock',
          moduleKey: 'inventory' as const,
          subtitle: 'Stock levels & movements',
          isOpen: isInventoryOpen,
          setIsOpen: setIsInventoryOpen,
          isActive: isInventoryActive,
          defaultRoute: '/inventory/dashboard',
          icon: <Box24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <Box24Filled style={{ width: 19, height: 19 }} />,
          subItems: [
            { to: '/inventory/dashboard', label: 'Inventory Dashboard', icon: <Box20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/inventory/stock-in', label: 'Stock In', icon: <ArrowCircleDown20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/inventory/stock-out', label: 'Stock Out', icon: <ArrowCircleUp20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/inventory/vendors', label: 'Vendors & Suppliers', icon: <PeopleCommunity20Regular style={{ width: 15, height: 15 }} /> },
            { to: '/inventory/ledger', label: 'Stock Movement Ledger', icon: <DocumentTableSearch20Regular style={{ width: 15, height: 15 }} /> },
          ],
        },
        {
          to: '/khata',
          label: 'Khata Ledger Book',
          moduleKey: 'khata' as const,
          icon: <BookContacts24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <BookContacts24Filled style={{ width: 19, height: 19 }} />,
        },
      ],
    },
    {
      title: 'FINANCE & AUDIT',
      items: [
        {
          to: '/expenses',
          label: 'Expenses & Cash',
          moduleKey: 'expenses' as const,
          icon: <Money24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <Money24Filled style={{ width: 19, height: 19 }} />,
        },
        {
          to: '/reports',
          label: 'Profit & Loss Analytics',
          moduleKey: 'reports' as const,
          icon: <DataTrending24Regular style={{ width: 19, height: 19 }} />,
          activeIcon: <DataTrending24Filled style={{ width: 19, height: 19 }} />,
        },
      ],
    },
  ];

  // Dynamically filter sections and items according to remote module licenses
  const sections = allSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((it: any) => !it.moduleKey || can(it.moduleKey)),
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
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 10px',
                          borderRadius: '8px',
                          border: item.isActive ? t.itemActiveBorder : '1px solid transparent',
                          background: item.isActive ? t.itemActiveBg : 'transparent',
                          color: item.isActive ? t.itemActiveText : t.itemText,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                          boxSizing: 'border-box',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {item.isActive && (
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
                          <span style={{ display: 'flex', alignItems: 'center', color: item.isActive ? '#FF4D63' : t.itemText }}>
                            {item.isActive ? item.activeIcon : item.icon}
                          </span>
                          <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: item.isActive ? 700 : 500 }}>
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
                        {item.subItems.map((sub: any) => {
                          const isSubActive = location.pathname === sub.to;
                          return (
                            <button
                              key={sub.to}
                              type="button"
                              onClick={() => navigate(sub.to)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                height: '32px',
                                padding: '0 8px',
                                borderRadius: '6px',
                                color: isSubActive ? t.submenuActiveText : t.submenuText,
                                background: isSubActive ? t.submenuActiveBg : 'transparent',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: isSubActive ? 700 : 500,
                                cursor: 'pointer',
                                width: '100%',
                                boxSizing: 'border-box',
                                textAlign: 'left',
                                position: 'relative',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {/* Glowing Laser Notch right over the line */}
                              {isSubActive && (
                                <div
                                  style={{
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
                                  }}
                                />
                              )}
                              <span style={{ display: 'flex', alignItems: 'center', opacity: isSubActive ? 1 : 0.75 }}>
                                {sub.icon}
                              </span>
                              <span style={{ whiteSpace: 'nowrap' }}>
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
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        {/* Cloud Sync Indicator */}
        <SyncStatusIndicator isCollapsed={isCollapsed} />

        {/* User Identity Card */}
        <Menu positioning={isCollapsed ? 'after-bottom' : 'above'}>
          <MenuTrigger disableButtonEnhancement>
            <button
              type="button"
              style={{
                height: '46px',
                width: isCollapsed ? '42px' : '100%',
                margin: isCollapsed ? '0 auto' : '0',
                padding: isCollapsed ? '0' : '6px 8px',
                borderRadius: '9px',
                border: t.userCardBorder,
                backgroundColor: t.userCardBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Avatar
                  name={user?.name || 'Cashier'}
                  color="colorful"
                  size={32}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    right: '0',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 6px #10B981',
                    border: isDark ? '1.5px solid #111215' : '1.5px solid #FFFFFF',
                  }}
                />
              </div>

              {!isCollapsed && (
                <div style={{ marginLeft: '10px', textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: t.userName, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name || 'Store Manager'}
                    </div>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(229, 25, 55, 0.15)',
                        color: '#FF4D63',
                        border: '1px solid rgba(229, 25, 55, 0.3)',
                      }}
                    >
                      {user?.role?.toUpperCase() || 'ADMIN'}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: t.userSub, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                    Online Terminal
                  </div>
                </div>
              )}
            </button>
          </MenuTrigger>

          <MenuPopover
            style={{
              borderRadius: '12px',
              padding: '6px',
              minWidth: '240px',
              backgroundColor: t.popoverBg,
              border: t.popoverBorder,
              boxShadow: t.popoverShadow,
            }}
          >
            <MenuList>
              <div style={{ padding: '8px 12px 10px', borderBottom: t.headerBorder, marginBottom: '4px' }}>
                <Text weight="semibold" size={200} block style={{ color: t.userName }}>{user?.name || 'Store Manager'}</Text>
                <Text size={100} style={{ color: t.userSub, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <CloudCheckmark16Filled style={{ color: '#10B981' }} />
                  {' '}{user?.role || 'staff'} — Terminal Active
                </Text>
              </div>

              <MenuItem icon={<Settings20Regular style={{ color: t.buttonText }} />} onClick={() => navigate('/admin')}>
                Store &amp; Admin Settings
              </MenuItem>
              <MenuItem
                icon={mode === 'dark' ? <WeatherSunny20Regular style={{ color: '#F59E0B' }} /> : <WeatherMoon20Regular style={{ color: '#E51937' }} />}
                onClick={toggleTheme}
              >
                {mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              </MenuItem>
              <MenuDivider />
              <MenuItem
                icon={<LockClosed20Regular style={{ color: '#FF4D63' }} />}
                onClick={logout}
                style={{ color: '#FF4D63', fontWeight: 600 }}
              >
                Lock Terminal / Log Out
              </MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>

        {/* ── Theme Quick Toggle & Collapse Sidebar Row ── */}
        <div style={{ display: 'flex', gap: '6px', width: isCollapsed ? '42px' : '100%', margin: isCollapsed ? '0 auto' : '0', alignItems: 'center' }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              height: '34px',
              width: '34px',
              minWidth: '34px',
              padding: 0,
              borderRadius: '7px',
              border: t.buttonBorder,
              backgroundColor: t.buttonBg,
              color: mode === 'dark' ? '#F59E0B' : '#E51937',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {mode === 'dark' ? (
              <WeatherSunny20Regular style={{ width: 16, height: 16, color: '#F59E0B' }} />
            ) : (
              <WeatherMoon20Regular style={{ width: 16, height: 16, color: '#E51937' }} />
            )}
          </button>

          <button
            type="button"
            onClick={toggleSidebar}
            style={{
              height: '34px',
              flex: 1,
              width: isCollapsed ? '34px' : 'auto',
              minWidth: 0,
              padding: isCollapsed ? '0' : '0 10px',
              borderRadius: '7px',
              border: t.buttonBorder,
              backgroundColor: t.buttonBg,
              color: t.buttonText,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isCollapsed ? 'center' : 'space-between',
              transition: 'all 0.15s ease',
            }}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            {isCollapsed ? (
              <Tooltip content="Expand sidebar (Ctrl+B)" relationship="label" positioning="after">
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight20Regular style={{ width: 16, height: 16, color: t.buttonText }} />
                </span>
              </Tooltip>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ChevronLeft20Regular style={{ width: 15, height: 15, color: t.buttonText }} />
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: t.buttonText }}>Collapse Sidebar</span>
                </div>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                    color: t.buttonText,
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
                  }}
                >
                  Ctrl+B
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
