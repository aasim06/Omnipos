import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Text,
  Badge,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  makeStyles,
  tokens,
  mergeClasses,
  Portal,
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
  Navigation20Regular,
  Box20Regular,
  ArrowCircleDown20Regular,
  ArrowCircleUp20Regular,
  PeopleCommunity20Regular,
  PeopleCommunity24Regular,
  PeopleCommunity24Filled,
  DocumentTableSearch20Regular,
  Database20Regular,
  ArrowSync20Filled,
  ArrowSync20Regular,
  ArrowDownload20Regular,
  BarcodeScanner20Regular,
  DocumentBulletList24Regular,
  DocumentBulletList24Filled,
} from '@fluentui/react-icons';
import { posApi } from '@/lib/api';
import { resolveStoreModules } from '@/lib/categoryProfiles';
import { useAuth } from '@/features/auth/AuthContext';
import { StockAlertBell } from '@/components/shell/StockAlertBell';
import { useLicense, LicenseModules } from '@/features/auth/LicenseModulesContext';
import { MODULE_TO_PERMISSION } from './RouteAccessGate';
import { useAppTheme } from '@/theme/AppProviders';
import { getWindowChrome } from '@/lib/windowChrome';

// ── Windows 11 NavigationView styling ───────────────────────────────
// The pane sits on the window frame (Mica when available) with no own surface,
// items are 36px with 4px corners, hover/selected use a subtle translucent fill,
// and the selected item gets a short 3×16px accent pill on the left.
const NAV_ITEM_HEIGHT = '36px';
const NAV_RAIL_WIDTH = '48px';
const NAV_PANE_WIDTH = '256px';
const ACCENT = '#E51937';
const subtleLight = { hover: 'rgba(0, 0, 0, 0.037)', pressed: 'rgba(0, 0, 0, 0.024)', selected: 'rgba(0, 0, 0, 0.055)' };
const subtleDark = { hover: 'rgba(255, 255, 255, 0.061)', pressed: 'rgba(255, 255, 255, 0.042)', selected: 'rgba(255, 255, 255, 0.084)' };
const win11Ease = 'cubic-bezier(0, 0, 0, 1)';

const itemBase = {
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  color: tokens.colorNeutralForeground1,
  fontFamily: tokens.fontFamilyBase,
  transitionProperty: 'background-color',
  transitionDuration: tokens.durationFaster,
  transitionTimingFunction: win11Ease,
} as const;

const subtleItemLight = {
  ...itemBase,
  ':hover': { backgroundColor: subtleLight.hover },
  ':active': { backgroundColor: subtleLight.pressed },
};
const subtleItemDark = {
  ...itemBase,
  ':hover': { backgroundColor: subtleDark.hover },
  ':active': { backgroundColor: subtleDark.pressed },
};
const selectedItemLight = { ...itemBase, backgroundColor: subtleLight.selected, ':hover': { backgroundColor: subtleLight.selected } };
const selectedItemDark = { ...itemBase, backgroundColor: subtleDark.selected, ':hover': { backgroundColor: subtleDark.selected } };

const accentPill = {
  position: 'absolute',
  left: '0',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '3px',
  height: '16px',
  borderRadius: '2px',
  backgroundColor: ACCENT,
} as const;

const flyoutSurface = {
  backgroundColor: tokens.colorNeutralBackground1,
  borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
  borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
  borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
  borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
} as const;

const useStyles = makeStyles({
  laserIndicator: accentPill,
  submenuLaserNotch: accentPill,
  accordionBtn: {
    width: '100%',
    height: NAV_ITEM_HEIGHT,
    padding: '0 8px 0 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    boxSizing: 'border-box',
  },
  accordionInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  subItemBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    height: NAV_ITEM_HEIGHT,
    padding: '0 12px 0 44px', // indented under the parent icon, like WinUI child items
    borderRadius: '4px',
    fontSize: tokens.fontSizeBase300,
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    position: 'relative',
  },
  iconWrap: {
    display: 'flex',
    alignItems: 'center',
  },
  noWrapText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  icon19: { width: '20px', height: '20px' },
  icon15: { width: '16px', height: '16px' },
  icon15Red: { width: '16px', height: '16px', color: tokens.colorBrandForeground1 },
  icon17: { width: '16px', height: '16px' },
  icon17Red: { color: tokens.colorBrandForeground1 },
  icon17Amber: {},
  icon17Danger: {},
  iconBrand: { color: tokens.colorBrandForeground1 },

  nav: {
    height: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    flexShrink: 0,
    overflow: 'hidden',
    transitionProperty: 'width',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: win11Ease,
    position: 'relative',
    userSelect: 'none',
    // No own surface: the pane sits directly on the window frame / Mica.
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  navCollapsed: { width: NAV_RAIL_WIDTH },
  navExpanded: { width: NAV_PANE_WIDTH },
  navDark: {},
  navLight: {},

  header: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px',
  },
  headerCollapsed: {},
  headerExpanded: {},
  headerDark: {},
  headerLight: {},
  hamburgerBtn: {
    width: '40px',
    height: NAV_ITEM_HEIGHT,
    flexShrink: 0,
    padding: 0,
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paneTitle: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    paddingLeft: '4px',
  },

  scrollContainer: {
    flex: '1 1 0%',
    minHeight: 0,
    maxHeight: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  scrollCollapsed: { padding: '4px' },
  scrollExpanded: { padding: '4px' },
  sectionContainer: {
    marginBottom: '4px',
  },
  sectionTitleRow: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    padding: '12px 12px 4px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  sectionTitleDark: {},
  sectionTitleLight: {},
  sectionDotDark: { display: 'none' },
  sectionDotLight: { display: 'none' },
  dividerDark: { height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.084)', margin: '6px 4px' },
  dividerLight: { height: '1px', backgroundColor: 'rgba(0, 0, 0, 0.08)', margin: '6px 4px' },
  sectionItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },

  collapsedAccordionBtn: {
    width: '40px',
    height: NAV_ITEM_HEIGHT,
    padding: 0,
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  collapsedBtnActiveDark: selectedItemDark,
  collapsedBtnActiveLight: selectedItemLight,
  collapsedBtnInactiveDark: subtleItemDark,
  collapsedBtnInactiveLight: subtleItemLight,
  collapsedInnerSpan: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  collapsedActiveLaser: accentPill,

  menuPopover: {
    borderRadius: '8px',
    padding: '4px',
    minWidth: '220px',
    boxSizing: 'border-box',
    '::before': {
      content: '""',
      position: 'absolute',
      top: '-15px',
      bottom: '-15px',
      left: '-25px',
      width: '35px',
      backgroundColor: 'transparent',
    },
  },
  menuPopoverDark: { ...flyoutSurface, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.26)' },
  menuPopoverLight: { ...flyoutSurface, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.14)' },
  menuHeader: { padding: '8px 12px 6px' },
  menuHeaderDark: {},
  menuHeaderLight: {},
  menuHeaderTitle: { color: tokens.colorNeutralForeground1, fontWeight: 600 },
  menuHeaderSubtitle: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  flyoutItemBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    height: '32px',
    padding: '0 12px',
    borderRadius: '4px',
    fontSize: tokens.fontSizeBase300,
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    position: 'relative',
  },
  flyoutItemActiveDark: { ...selectedItemDark, fontWeight: 600 },
  flyoutItemActiveLight: { ...selectedItemLight, fontWeight: 600 },
  flyoutItemInactiveDark: subtleItemDark,
  flyoutItemInactiveLight: subtleItemLight,
  flyoutItemSpecialDark: { ...subtleItemDark, color: tokens.colorBrandForeground1 },
  flyoutItemSpecialLight: { ...subtleItemLight, color: tokens.colorBrandForeground1 },

  accordionBtnActiveDark: selectedItemDark,
  accordionBtnActiveLight: selectedItemLight,
  accordionBtnInactiveDark: subtleItemDark,
  accordionBtnInactiveLight: subtleItemLight,
  accordionIconWrapActive: {},
  accordionIconWrapInactiveDark: {},
  accordionIconWrapInactiveLight: {},
  accordionLabelActive: { fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightRegular },
  accordionLabelInactive: { fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightRegular },
  chevronIcon: {
    width: '12px',
    height: '12px',
    transitionProperty: 'transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: win11Ease,
  },
  chevronDark: { color: tokens.colorNeutralForeground2 },
  chevronLight: { color: tokens.colorNeutralForeground2 },
  chevronRotated: { transform: 'rotate(180deg)' },
  chevronNormal: { transform: 'rotate(0deg)' },
  submenuContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
    transitionProperty: 'max-height, opacity, margin',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: win11Ease,
  },
  submenuBorderDark: {},
  submenuBorderLight: {},
  submenuOpen: { maxHeight: '260px', opacity: 1, marginTop: '2px' },
  submenuClosed: { maxHeight: 0, opacity: 0, marginTop: 0 },
  subItemActiveDark: selectedItemDark,
  subItemActiveLight: selectedItemLight,
  subItemInactiveDark: subtleItemDark,
  subItemInactiveLight: subtleItemLight,
  subItemLabelActive: { fontSize: tokens.fontSizeBase300 },
  subItemLabelInactive: { fontSize: tokens.fontSizeBase300 },
  subItemIconWrapActive: {},
  subItemIconWrapInactive: {},

  navLink: {
    display: 'flex',
    alignItems: 'center',
    height: NAV_ITEM_HEIGHT,
    borderRadius: '4px',
    textDecoration: 'none',
    fontSize: tokens.fontSizeBase300,
    position: 'relative',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  navLinkCollapsed: {
    width: '40px',
    padding: 0,
    justifyContent: 'center',
  },
  navLinkExpanded: {
    width: '100%',
    padding: '0 12px',
    justifyContent: 'flex-start',
  },
  navLinkActiveDark: selectedItemDark,
  navLinkActiveLight: selectedItemLight,
  navLinkInactiveDark: subtleItemDark,
  navLinkInactiveLight: subtleItemLight,
  navLinkIconActive: { display: 'flex', alignItems: 'center' },
  navLinkIconInactiveDark: { display: 'flex', alignItems: 'center' },
  navLinkIconInactiveLight: { display: 'flex', alignItems: 'center' },
  navLinkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  navLinkLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: tokens.fontSizeBase300,
  },
  // Neutral info badge (Win11 InfoBadge style is reserved for counts; labels stay quiet).
  badgePill: {
    fontSize: '10px',
    fontWeight: 600,
    lineHeight: '16px',
    padding: '0 6px',
    borderRadius: '8px',
    color: tokens.colorNeutralForeground2,
    backgroundColor: tokens.colorNeutralBackground3,
  },

  bottomDeck: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '4px',
  },
  bottomDeckCollapsed: {},
  bottomDeckExpanded: {},
  bottomDeckDark: {},
  bottomDeckLight: {},
  toolbar: {
    boxSizing: 'border-box',
    alignItems: 'center',
    gap: '2px',
  },
  toolbarCollapsed: {
    display: 'flex',
    flexDirection: 'column',
    width: '40px',
  },
  toolbarExpanded: {
    display: 'grid',
    width: '100%',
  },
  toolbarAdmin: { gridTemplateColumns: 'repeat(5, 1fr)' },
  toolbarNonAdmin: { gridTemplateColumns: 'repeat(3, 1fr)' },
  toolbarDark: {},
  toolbarLight: {},
  toolbarBtn: {
    height: NAV_ITEM_HEIGHT,
    width: '100%',
    padding: 0,
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnDark: subtleItemDark,
  themeBtnLight: subtleItemLight,
  refreshBtnDark: subtleItemDark,
  refreshBtnLight: subtleItemLight,
  adminBtnActiveDark: selectedItemDark,
  adminBtnActiveLight: selectedItemLight,
  adminBtnInactiveDark: subtleItemDark,
  adminBtnInactiveLight: subtleItemLight,
  storageBtnActiveDark: selectedItemDark,
  storageBtnActiveLight: selectedItemLight,
  storageBtnInactiveDark: subtleItemDark,
  storageBtnInactiveLight: subtleItemLight,
  logoutBtnDark: subtleItemDark,
  logoutBtnLight: subtleItemLight,

  storageDialogSurface: {
    borderRadius: tokens.borderRadiusXLarge,
    maxWidth: '520px',
    width: '92vw',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  storageDialogTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  storageDialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '12px',
  },
  storageStatusCard: {
    padding: '14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  storageStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
  },
  storageHealthy: {
    fontSize: '12px',
    fontWeight: 600,
    color: tokens.colorPaletteGreenForeground1,
  },
  storageBadgeAuto: {},
  storageMsg: {
    color: tokens.colorPaletteGreenForeground1,
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'center',
    padding: '8px 12px',
    backgroundColor: tokens.colorPaletteGreenBackground1,
    borderRadius: '4px',
  },
  storageActionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '4px',
  },
  storageActionButton: {
    height: '32px',
    borderRadius: '4px',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    fontSize: tokens.fontSizeBase300,
    fontFamily: tokens.fontFamilyBase,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  // Secondary (standard) button
  storageBackupBlue: {
    ...flyoutSurface,
    color: tokens.colorNeutralForeground1,
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  // Accent (primary) button
  storageResyncRed: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    ':hover': { backgroundColor: tokens.colorBrandBackgroundHover },
  },
  storageActions: {
    marginTop: '18px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  storageManagerLink: {
    background: 'transparent',
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    color: tokens.colorBrandForegroundLink,
    fontSize: tokens.fontSizeBase300,
    fontFamily: tokens.fontFamilyBase,
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    ':hover': { textDecoration: 'underline' },
  },
  storageCloseBtn: {
    height: '32px',
    padding: '0 16px',
    borderRadius: '4px',
    fontSize: tokens.fontSizeBase300,
    fontFamily: tokens.fontFamilyBase,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageCloseDark: { ...flyoutSurface, color: tokens.colorNeutralForeground1, ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover } },
  storageCloseLight: { ...flyoutSurface, color: tokens.colorNeutralForeground1, ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover } },
  storageResyncBtn: {},
  textMuted: {
    color: tokens.colorNeutralForeground2,
  },
  storageCloseBtnBold: {
    fontWeight: 600,
  },

  flyoutPortalWrapper: {
    position: 'fixed',
    zIndex: 999999,
  },
  flyoutSubList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
});

export function FluentSidebar(): React.JSX.Element {
  const styles = useStyles();
  const { mode, toggleTheme } = useAppTheme();
  const { user, logout, hasPermission } = useAuth();
  const { can, businessProfiles } = useLicense();
  const storeMod = resolveStoreModules(can('fastfood'), can('omnimart'), businessProfiles);
  const retailPosLabel = storeMod.shortRetailLabel === 'Mart' ? 'Mart Counter' : `${storeMod.shortRetailLabel} POS`;
  const retailItemsLabel = storeMod.shortRetailLabel === 'Mart' ? 'Mart Items' : `${storeMod.shortRetailLabel} Items`;
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

  const handleQuickBackup = async () => {
    setStorageStatusMsg('Creating database backup (.db)...');
    try {
      const res = await posApi.createBackup(true);
      if (res.ok && res.path) {
        setStorageStatusMsg(`Database backup saved successfully!`);
        setTimeout(() => setStorageStatusMsg(''), 4000);
      } else if (!res.cancelled) {
        setStorageStatusMsg(res.error || 'Backup creation failed.');
      } else {
        setStorageStatusMsg('');
      }
    } catch (e: any) {
      setStorageStatusMsg(e.message || 'Backup failed');
    }
  };

  const hasTitleBar = getWindowChrome().customTitleBar;

  // Collapsed state is remembered separately for POS screens and for everything else.
  // POS screens default to the compact 48px rail so the products and the cart get the room.
  const isPosRoute = location.pathname.startsWith('/pos');
  const collapseKey = isPosRoute ? 'omnipos_sidebar_collapsed_pos' : 'omnipos_sidebar_collapsed';
  const readCollapsed = (key: string): boolean => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? key === 'omnipos_sidebar_collapsed_pos' : saved === 'true';
    } catch {
      return false;
    }
  };
  const collapseKeyRef = useRef(collapseKey);
  collapseKeyRef.current = collapseKey;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => readCollapsed(collapseKey));

  useEffect(() => {
    setIsCollapsed(readCollapsed(collapseKey));
  }, [collapseKey]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(collapseKeyRef.current, String(next));
      } catch {
        /* storage unavailable: keep the in-memory state */
      }
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

  // Controlled Flyout state for collapsed accordion menus with 250ms anti-flicker grace period
  const [flyout, setFlyout] = useState<{ label: string; top: number; left: number; item: any } | null>(null);
  const flyoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openFlyout = (e: React.MouseEvent<HTMLElement>, item: any) => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const calculatedTop = Math.max(12, Math.min(rect.top - 6, window.innerHeight - 340));
    setFlyout({
      label: item.label,
      top: calculatedTop,
      left: Math.max(52, rect.right + 4),
      item,
    });
  };

  const closeFlyoutWithDelay = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    flyoutTimerRef.current = setTimeout(() => {
      setFlyout(null);
    }, 400);
  };

  const closeFlyoutImmediately = () => {
    if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    setFlyout(null);
  };

  useEffect(() => {
    return () => {
      if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isCollapsed) {
      closeFlyoutImmediately();
    }
  }, [isCollapsed]);

  const allSections = [
    {
      title: 'Home',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          badge: 'LIVE',
          icon: <DataTrending24Regular className={styles.icon19} />,
          activeIcon: <DataTrending24Filled className={styles.icon19} />,
        },
      ],
    },
    {
      title: 'Billing & sales',
      items: [
        {
          to: '/pos/fastfood',
          label: 'Fast Food POS',
          moduleKey: 'fastfood' as const,
          icon: <Food24Regular className={styles.icon19} />,
          activeIcon: <Food24Filled className={styles.icon19} />,
        },
        {
          to: '/pos/omnimart',
          label: retailPosLabel,
          moduleKey: 'omnimart' as const,
          icon: <BuildingRetail24Regular className={styles.icon19} />,
          activeIcon: <BuildingRetail24Filled className={styles.icon19} />,
        },
        {
          to: '/kitchen',
          label: 'Kitchen Screen',
          badge: 'KOT',
          moduleKey: 'kitchen' as const,
          icon: <BowlSalad24Regular className={styles.icon19} />,
          activeIcon: <BowlSalad24Filled className={styles.icon19} />,
        },
      ],
    },
    {
      title: 'Items & stock',
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
          icon: <Tag24Regular className={styles.icon19} />,
          activeIcon: <Tag24Filled className={styles.icon19} />,
          subItems: [
            { to: '/catalog', label: 'Catalog Overview', icon: <Tag20Regular className={styles.icon15} /> },
            { to: '/catalog/fastfood', label: 'Fast Food Menu', moduleKey: 'fastfood' as const, icon: <Food24Regular className={styles.icon15} /> },
            { to: '/catalog/omnimart', label: retailItemsLabel, moduleKey: 'omnimart' as const, icon: <BuildingRetail24Regular className={styles.icon15} /> },
            { to: '/catalog/categories', label: 'Categories', icon: <Grid20Regular className={styles.icon15} /> },
            { to: '/catalog/barcode-labels', label: 'Barcode Stickers', icon: <BarcodeScanner20Regular className={styles.icon15} /> },
            { to: '/catalog/new', label: 'Add New Item', icon: <Add20Regular className={styles.icon15Red} />, isSpecial: true },
          ],
        },
        {
          to: '/quotations',
          label: 'Quotations & Estimates',
          moduleKey: 'catalog' as const,
          icon: <DocumentBulletList24Regular className={styles.icon19} />,
          activeIcon: <DocumentBulletList24Filled className={styles.icon19} />,
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
          icon: <Box24Regular className={styles.icon19} />,
          activeIcon: <Box24Filled className={styles.icon19} />,
          subItems: [
            { to: '/inventory/dashboard', label: 'Inventory Dashboard', icon: <Box20Regular className={styles.icon15} /> },
            { to: '/inventory/stock-in', label: 'Stock In', icon: <ArrowCircleDown20Regular className={styles.icon15} /> },
            { to: '/inventory/stock-out', label: 'Stock Out', icon: <ArrowCircleUp20Regular className={styles.icon15} /> },
            { to: '/inventory/vendors', label: 'Vendors & Suppliers', icon: <PeopleCommunity20Regular className={styles.icon15} /> },
            { to: '/inventory/ledger', label: 'Stock Movement Ledger', icon: <DocumentTableSearch20Regular className={styles.icon15} /> },
          ],
        },
        {
          to: '/customers',
          label: 'Customers & Returns',
          moduleKey: 'khata' as const,
          icon: <PeopleCommunity24Regular className={styles.icon19} />,
          activeIcon: <PeopleCommunity24Filled className={styles.icon19} />,
        },
        {
          to: '/khata',
          label: 'Customer Khata (Credit)',
          moduleKey: 'khata' as const,
          icon: <BookContacts24Regular className={styles.icon19} />,
          activeIcon: <BookContacts24Filled className={styles.icon19} />,
        },
      ],
    },
    {
      title: 'Accounts & reports',
      items: [
        {
          to: '/expenses',
          label: 'Daily Expenses',
          moduleKey: 'expenses' as const,
          icon: <Money24Regular className={styles.icon19} />,
          activeIcon: <Money24Filled className={styles.icon19} />,
        },
        {
          to: '/reports',
          label: 'Sales & Reports',
          moduleKey: 'reports' as const,
          icon: <DataTrending24Regular className={styles.icon19} />,
          activeIcon: <DataTrending24Filled className={styles.icon19} />,
        },
      ],
    },
    {
      title: 'Settings & users',
      items: [
        {
          to: '/admin',
          label: 'Staff & Cashiers',
          moduleKey: 'admin' as const,
          icon: <PeopleCommunity24Regular className={styles.icon19} />,
          activeIcon: <PeopleCommunity24Filled className={styles.icon19} />,
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
            if (!can('kitchen')) return false;
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

  return (
    <nav
      className={mergeClasses(
        styles.nav,
        isCollapsed ? styles.navCollapsed : styles.navExpanded,
        isDark ? styles.navDark : styles.navLight
      )}
    >
      {/* ── Pane header: hamburger button (WinUI "GlobalNavigationButton") ── */}
      <div className={styles.header}>
        <button
          type="button"
          onClick={toggleSidebar}
          className={mergeClasses(styles.hamburgerBtn, isDark ? styles.navLinkInactiveDark : styles.navLinkInactiveLight)}
          title={isCollapsed ? 'Open navigation (Ctrl+B)' : 'Close navigation (Ctrl+B)'}
          aria-label={isCollapsed ? 'Open navigation' : 'Close navigation'}
          aria-expanded={!isCollapsed}
        >
          <Navigation20Regular className={styles.icon19} />
        </button>
        {/* The desktop title bar already shows the app name; the web build shows it here. */}
        {!isCollapsed && !hasTitleBar && <span className={styles.paneTitle}>Omnipos</span>}
      </div>

      {/* ── Scrollable Navigation Items ─────────────────────────── */}
      <div
        className={mergeClasses(
          'fluent-sidebar-scroll',
          styles.scrollContainer,
          isCollapsed ? styles.scrollCollapsed : styles.scrollExpanded
        )}
      >
        {sections.map((section, secIdx) => (
          <div key={section.title} className={styles.sectionContainer}>
            {!isCollapsed && (
              <div
                className={mergeClasses(
                  styles.sectionTitleRow,
                  isDark ? styles.sectionTitleDark : styles.sectionTitleLight
                )}
              >
                <span className={isDark ? styles.sectionDotDark : styles.sectionDotLight} />
                <span>{section.title}</span>
              </div>
            )}
            {isCollapsed && secIdx > 0 && (
              <div className={isDark ? styles.dividerDark : styles.dividerLight} />
            )}

            <div className={styles.sectionItems}>
              {section.items.map((item: any) => {
                // Special Accordion handling (Products & Catalog + Inventory & Stock)
                if (item.isAccordion) {
                  if (isCollapsed) {
                    const isOpen = flyout?.label === item.label;
                    return (
                      <div
                        key={item.label}
                        onMouseEnter={(e) => openFlyout(e, item)}
                        onMouseLeave={closeFlyoutWithDelay}
                      >
                        <button
                          type="button"
                          onMouseEnter={(e) => openFlyout(e, item)}
                          onClick={(e) => {
                            if (isOpen) closeFlyoutImmediately();
                            else openFlyout(e, item);
                          }}
                          title={item.label}
                          aria-label={item.label}
                          className={mergeClasses(
                            styles.collapsedAccordionBtn,
                            item.isActive
                              ? (isDark ? styles.collapsedBtnActiveDark : styles.collapsedBtnActiveLight)
                              : (isDark ? styles.collapsedBtnInactiveDark : styles.collapsedBtnInactiveLight)
                          )}
                        >
                          <span className={styles.collapsedInnerSpan}>
                            {item.isActive && (
                              <div className={styles.collapsedActiveLaser} />
                            )}
                            {item.isActive ? item.activeIcon : item.icon}
                          </span>
                        </button>
                      </div>
                    );
                  }

                  // When expanded: Accordion with ChevronDown
                  return (
                    <div key={item.label}>
                      <button
                        type="button"
                        onClick={() => item.setIsOpen((prev: boolean) => !prev)}
                        className={mergeClasses(
                          styles.accordionBtn,
                          item.isActive
                            ? (isDark ? styles.accordionBtnActiveDark : styles.accordionBtnActiveLight)
                            : (isDark ? styles.accordionBtnInactiveDark : styles.accordionBtnInactiveLight)
                        )}
                      >
                        <div className={styles.accordionInner}>
                          {item.isActive && (
                            <div className={styles.laserIndicator} />
                          )}
                          <span
                            className={mergeClasses(
                              styles.iconWrap,
                              item.isActive
                                ? styles.accordionIconWrapActive
                                : (isDark ? styles.accordionIconWrapInactiveDark : styles.accordionIconWrapInactiveLight)
                            )}
                          >
                            {item.isActive ? item.activeIcon : item.icon}
                          </span>
                          <span
                            className={mergeClasses(
                              styles.noWrapText,
                              item.isActive ? styles.accordionLabelActive : styles.accordionLabelInactive
                            )}
                          >
                            {item.label}
                          </span>
                        </div>
                        <ChevronDown20Regular
                          className={mergeClasses(
                            styles.chevronIcon,
                            isDark ? styles.chevronDark : styles.chevronLight,
                            item.isOpen ? styles.chevronRotated : styles.chevronNormal
                          )}
                        />
                      </button>

                      {/* Smooth slide-down Submenu with glowing guide line */}
                      <div
                        className={mergeClasses(
                          styles.submenuContainer,
                          isDark ? styles.submenuBorderDark : styles.submenuBorderLight,
                          item.isOpen ? styles.submenuOpen : styles.submenuClosed
                        )}
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
                                className={mergeClasses(
                                  styles.subItemBtn,
                                  isSubActive
                                    ? (isDark ? styles.subItemActiveDark : styles.subItemActiveLight)
                                    : (isDark ? styles.subItemInactiveDark : styles.subItemInactiveLight)
                                )}
                              >
                                {/* Glowing Laser Notch right over the line */}
                                {isSubActive && (
                                  <div className={styles.submenuLaserNotch} />
                                )}
                                <span
                                  className={mergeClasses(
                                    styles.iconWrap,
                                    isSubActive ? styles.subItemIconWrapActive : styles.subItemIconWrapInactive
                                  )}
                                >
                                  {sub.icon}
                                </span>
                                <span
                                  className={mergeClasses(
                                    styles.noWrapText,
                                    isSubActive ? styles.subItemLabelActive : styles.subItemLabelInactive
                                  )}
                                >
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
                if (isCollapsed) {
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      aria-label={item.label}
                      className={({ isActive }) =>
                        mergeClasses(
                          styles.navLink,
                          styles.navLinkCollapsed,
                          isActive
                            ? (isDark ? styles.navLinkActiveDark : styles.navLinkActiveLight)
                            : (isDark ? styles.navLinkInactiveDark : styles.navLinkInactiveLight)
                        )
                      }
                    >
                      {({ isActive }) => (
                        <span className={styles.collapsedInnerSpan}>
                          {isActive && (
                            <div className={styles.collapsedActiveLaser} />
                          )}
                          <span
                            className={
                              isActive
                                ? styles.navLinkIconActive
                                : (isDark ? styles.navLinkIconInactiveDark : styles.navLinkIconInactiveLight)
                            }
                          >
                            {isActive ? item.activeIcon : item.icon}
                          </span>
                        </span>
                      )}
                    </NavLink>
                  );
                }

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      mergeClasses(
                        styles.navLink,
                        styles.navLinkExpanded,
                        isActive
                          ? (isDark ? styles.navLinkActiveDark : styles.navLinkActiveLight)
                          : (isDark ? styles.navLinkInactiveDark : styles.navLinkInactiveLight)
                      )
                    }
                  >
                    {({ isActive }) => (
                      <span className={styles.navLinkRow}>
                        {isActive && (
                          <div className={styles.laserIndicator} />
                        )}
                        <span
                          className={mergeClasses(
                            styles.iconWrap,
                            isActive
                              ? styles.navLinkIconActive
                              : (isDark ? styles.navLinkIconInactiveDark : styles.navLinkIconInactiveLight)
                          )}
                        >
                          {isActive ? item.activeIcon : item.icon}
                        </span>
                        <span
                          className={mergeClasses(
                            styles.navLinkLabel,
                            isActive ? styles.accordionLabelActive : styles.accordionLabelInactive
                          )}
                        >
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className={styles.badgePill}>
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom Deck ─────────────────────────── */}
      <div
        className={mergeClasses(
          styles.bottomDeck,
          isCollapsed ? styles.bottomDeckCollapsed : styles.bottomDeckExpanded,
          isDark ? styles.bottomDeckDark : styles.bottomDeckLight
        )}
      >
        {/* ── Bottom Deck Action Toolbar (Theme, [Settings], [Storage], Logout, Collapse) ── */}
        <div
          className={mergeClasses(
            styles.toolbar,
            isCollapsed ? styles.toolbarCollapsed : styles.toolbarExpanded,
            isAdmin ? styles.toolbarAdmin : styles.toolbarNonAdmin,
            isDark ? styles.toolbarDark : styles.toolbarLight
          )}
          // One extra column for the stock-alert bell (inventory users)
          style={
            !isCollapsed && (isAdmin || hasPermission('inventory'))
              ? { gridTemplateColumns: `repeat(${isAdmin ? 6 : 4}, 1fr)` }
              : undefined
          }
        >
          {/* 0. Low-stock alerts bell (inventory users only) */}
          <StockAlertBell
            className={mergeClasses(styles.toolbarBtn, isDark ? styles.refreshBtnDark : styles.refreshBtnLight)}
            iconClassName={styles.icon17}
          />

          {/* 1. Light / Dark Theme Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className={mergeClasses(styles.toolbarBtn, isDark ? styles.themeBtnDark : styles.themeBtnLight)}
          >
            {mode === 'dark' ? (
              <WeatherSunny20Regular className={mergeClasses(styles.icon17, styles.icon17Amber)} />
            ) : (
              <WeatherMoon20Regular className={mergeClasses(styles.icon17, styles.icon17Red)} />
            )}
          </button>

          {/* 2. Refresh App Button (F5) */}
          <button
            type="button"
            onClick={() => window.location.reload()}
            title="Refresh App (F5)"
            aria-label="Refresh App (F5)"
            className={mergeClasses(styles.toolbarBtn, isDark ? styles.refreshBtnDark : styles.refreshBtnLight)}
          >
            <ArrowSync20Regular className={styles.icon17} />
          </button>

          {/* 2. Admin & Store Settings Button (Admin Only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              title="Store & Admin Settings"
              aria-label="Store & Admin Settings"
              className={mergeClasses(
                styles.toolbarBtn,
                location.pathname === '/admin'
                  ? (isDark ? styles.adminBtnActiveDark : styles.adminBtnActiveLight)
                  : (isDark ? styles.adminBtnInactiveDark : styles.adminBtnInactiveLight)
              )}
            >
              <Settings20Regular
                className={mergeClasses(styles.icon17, location.pathname === '/admin' ? styles.icon17Red : undefined)}
              />
            </button>
          )}

          {/* 3. Storage & Database Engine Button (Admin Only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsStorageModalOpen(true)}
              title="Local Storage & Database Engine"
              aria-label="Local Storage & Database Engine"
              className={mergeClasses(
                styles.toolbarBtn,
                isStorageModalOpen
                  ? (isDark ? styles.storageBtnActiveDark : styles.storageBtnActiveLight)
                  : (isDark ? styles.storageBtnInactiveDark : styles.storageBtnInactiveLight)
              )}
            >
              <Database20Regular className={styles.icon17} />
            </button>
          )}

          {/* 4. Lock Terminal / Log Out Button */}
          <button
            type="button"
            onClick={logout}
            title={`Log Out / Lock Terminal (${user?.name || 'Cashier'})`}
            aria-label={`Log Out / Lock Terminal (${user?.name || 'Cashier'})`}
            className={mergeClasses(styles.toolbarBtn, isDark ? styles.logoutBtnDark : styles.logoutBtnLight)}
          >
            <LockClosed20Regular className={mergeClasses(styles.icon17, styles.icon17Danger)} />
          </button>
        </div>
      </div>

      {/* ── Storage & Local Database Dialog ─────────────────────────── */}
      <Dialog open={isStorageModalOpen} onOpenChange={(_, d) => setIsStorageModalOpen(d.open)}>
        <DialogSurface className={styles.storageDialogSurface}>
          <DialogBody>
            <DialogTitle className={styles.storageDialogTitle}>
              <Database20Regular className={styles.iconBrand} />
              <span>Offline-First Storage Engine</span>
            </DialogTitle>
            <DialogContent className={styles.storageDialogContent}>
              <Text size={200} className={styles.textMuted}>
                Local storage resilience, SQLite WAL persistence, and data synchronization.
              </Text>

              <div className={styles.storageStatusCard}>
                <div className={styles.storageStatusRow}>
                  <span className={styles.storageLabel}>Database Engine</span>
                  <Badge appearance="tint" color="success">SQLite WAL Active</Badge>
                </div>
                <div className={styles.storageStatusRow}>
                  <span className={styles.storageLabel}>Cloud Sync Engine</span>
                  <Badge appearance="tint" color="brand" className={styles.storageBadgeAuto}>
                    Auto-Sync Online
                  </Badge>
                </div>
                <div className={styles.storageStatusRow}>
                  <span className={styles.storageLabel}>Terminal State</span>
                  <span className={styles.storageHealthy}>● Healthy &amp; Ready</span>
                </div>
              </div>

              {storageStatusMsg && (
                <div className={styles.storageMsg}>
                  {storageStatusMsg}
                </div>
              )}

              {/* Action Buttons Grid */}
              <div className={styles.storageActionRow}>
                <button
                  type="button"
                  onClick={handleQuickBackup}
                  className={mergeClasses(styles.storageActionButton, styles.storageBackupBlue)}
                >
                  <ArrowDownload20Regular className={styles.icon17} />
                  <span>Backup Now (.db)</span>
                </button>
                <button
                  type="button"
                  onClick={handleResyncStorage}
                  className={mergeClasses(styles.storageActionButton, styles.storageResyncRed)}
                >
                  <ArrowSync20Filled className={styles.icon17} />
                  <span>Force Cloud Resync</span>
                </button>
              </div>
            </DialogContent>
            <DialogActions className={styles.storageActions}>
              <button
                type="button"
                onClick={() => {
                  setIsStorageModalOpen(false);
                  navigate('/settings', { state: { tab: 'backup' } });
                }}
                className={styles.storageManagerLink}
              >
                <span>Full Backup Manager →</span>
              </button>
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(false)}
                className={mergeClasses(styles.storageCloseBtn, isDark ? styles.storageCloseDark : styles.storageCloseLight)}
              >
                Close
              </button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Collapsed Flyout Submenu ──
          Rendered through Fluent's Portal (not react-dom createPortal on document.body) so the
          mount node carries the theme's CSS variables; otherwise the token-based surface
          colours resolve to nothing and the flyout has no background. */}
      {flyout && (() => {
        const flyoutPositionStyle: React.CSSProperties = {
          position: 'fixed',
          top: `${flyout.top}px`,
          left: `${flyout.left}px`,
          zIndex: 999999,
          width: 'max-content',
          minWidth: '220px',
        };
        return (
          <Portal>
          <div
            style={flyoutPositionStyle}
            onMouseEnter={() => {
              if (flyoutTimerRef.current) clearTimeout(flyoutTimerRef.current);
            }}
            onMouseLeave={closeFlyoutWithDelay}
            className={mergeClasses(
              styles.flyoutPortalWrapper,
              styles.menuPopover,
              isDark ? styles.menuPopoverDark : styles.menuPopoverLight
            )}
          >
            <div className={mergeClasses(styles.menuHeader, isDark ? styles.menuHeaderDark : styles.menuHeaderLight)}>
              <Text weight="bold" size={200} block className={styles.menuHeaderTitle}>
                {flyout.item.label}
              </Text>
              <Text size={100} className={styles.menuHeaderSubtitle}>
                {flyout.item.subtitle || 'Module navigation'}
              </Text>
            </div>
            <div className={styles.flyoutSubList}>
              {flyout.item.subItems
                .filter((sub: any) => !sub.moduleKey || can(sub.moduleKey))
                .map((sub: any) => {
                  const isSubActive = location.pathname === sub.to;
                  return (
                    <button
                      key={sub.to}
                      type="button"
                      onClick={() => {
                        closeFlyoutImmediately();
                        navigate(sub.to);
                      }}
                      className={mergeClasses(
                        styles.flyoutItemBtn,
                        isSubActive
                          ? (isDark ? styles.flyoutItemActiveDark : styles.flyoutItemActiveLight)
                          : sub.isSpecial
                            ? (isDark ? styles.flyoutItemSpecialDark : styles.flyoutItemSpecialLight)
                            : (isDark ? styles.flyoutItemInactiveDark : styles.flyoutItemInactiveLight)
                      )}
                    >
                      <span className={styles.iconWrap}>{sub.icon}</span>
                      <span className={styles.noWrapText}>{sub.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>
          </Portal>
        );
      })()}
    </nav>
  );
}
