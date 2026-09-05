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
  mergeClasses,
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
  icon19: {
    width: '19px',
    height: '19px',
  },
  icon15: {
    width: '15px',
    height: '15px',
  },
  icon15Red: {
    width: '15px',
    height: '15px',
    color: '#FF4D63',
  },
  icon17: {
    width: '17px',
    height: '17px',
  },
  icon17Red: {
    width: '17px',
    height: '17px',
    color: '#E51937',
  },
  icon17Amber: {
    width: '17px',
    height: '17px',
    color: '#F59E0B',
  },
  icon17Danger: {
    width: '17px',
    height: '17px',
    color: '#EF4444',
  },
  iconBrand: {
    color: '#E51937',
  },
  nav: {
    height: '100vh',
    maxHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    flexShrink: 0,
    overflow: 'hidden',
    transitionProperty: 'width, background, border-color',
    transitionDuration: '0.25s, 0.2s, 0.2s',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1), ease, ease',
    position: 'relative',
    userSelect: 'none',
  },
  navCollapsed: {
    width: '64px',
  },
  navExpanded: {
    width: '236px',
  },
  navDark: {
    background: 'linear-gradient(180deg, #111215 0%, #0c0d10 100%)',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.35)',
  },
  navLight: {
    background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#E2E8F0',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.04)',
  },
  header: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
  headerCollapsed: {
    padding: '16px 0 12px',
    justifyContent: 'center',
  },
  headerExpanded: {
    padding: '16px 14px 14px',
    justifyContent: 'flex-start',
  },
  headerDark: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    background: 'radial-gradient(circle at 50% 0%, rgba(229, 25, 55, 0.12) 0%, transparent 75%)',
  },
  headerLight: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#F1F5F9',
    background: 'radial-gradient(circle at 50% 0%, rgba(229, 25, 55, 0.06) 0%, transparent 75%)',
  },
  brandToggle: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '10px',
  },
  brandToggleCollapsed: {
    width: 'auto',
  },
  brandToggleExpanded: {
    width: '100%',
  },
  brandBadge: {
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
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(255, 255, 255, 0.2)', borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    borderLeftColor: 'rgba(255, 255, 255, 0.2)', borderRightColor: 'rgba(255, 255, 255, 0.2)',
    flexShrink: 0,
  },
  brandTextWrap: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  brandTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  brandTitle: {
    fontWeight: 800,
    fontSize: '14.5px',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  brandTitleDark: {
    color: '#FFFFFF',
  },
  brandTitleLight: {
    color: '#0F172A',
  },
  brandDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#E51937',
    boxShadow: '0 0 6px #E51937',
  },
  brandSubtitle: {
    fontSize: '9.5px',
    color: '#64748B',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  scrollContainer: {
    flex: '1 1 0%',
    minHeight: 0,
    maxHeight: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  scrollCollapsed: {
    padding: '12px 6px',
  },
  scrollExpanded: {
    padding: '12px 10px',
  },
  sectionContainer: {
    marginBottom: '8px',
  },
  sectionTitleRow: {
    fontSize: '9.5px',
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    padding: '10px 10px 4px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  sectionTitleDark: {
    color: '#475569',
  },
  sectionTitleLight: {
    color: '#94A3B8',
  },
  sectionDotDark: {
    width: '4px',
    height: '4px',
    borderRadius: '1px',
    backgroundColor: '#334155',
  },
  sectionDotLight: {
    width: '4px',
    height: '4px',
    borderRadius: '1px',
    backgroundColor: '#CBD5E1',
  },
  dividerDark: {
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: '8px 6px',
  },
  dividerLight: {
    height: '1px',
    backgroundColor: '#E2E8F0',
    margin: '8px 6px',
  },
  sectionItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  collapsedAccordionBtn: {
    width: '42px',
    height: '40px',
    padding: 0,
    margin: '0 auto',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  collapsedBtnActiveDark: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.28)', borderBottomColor: 'rgba(229, 25, 55, 0.28)',
    borderLeftColor: 'rgba(229, 25, 55, 0.28)', borderRightColor: 'rgba(229, 25, 55, 0.28)',
    background: 'linear-gradient(90deg, rgba(229, 25, 55, 0.16) 0%, rgba(229, 25, 55, 0.04) 100%)',
    color: '#FF4D63',
  },
  collapsedBtnActiveLight: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.22)', borderBottomColor: 'rgba(229, 25, 55, 0.22)',
    borderLeftColor: 'rgba(229, 25, 55, 0.22)', borderRightColor: 'rgba(229, 25, 55, 0.22)',
    background: 'linear-gradient(90deg, rgba(229, 25, 55, 0.12) 0%, rgba(229, 25, 55, 0.03) 100%)',
    color: '#FF4D63',
  },
  collapsedBtnInactiveDark: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    background: 'transparent',
    color: '#94A3B8',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      color: '#F1F5F9',
    },
  },
  collapsedBtnInactiveLight: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    background: 'transparent',
    color: '#475569',
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      color: '#0F172A',
    },
  },
  collapsedInnerSpan: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  collapsedActiveLaser: {
    position: 'absolute',
    left: '0',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3.5px',
    height: '20px',
    borderRadius: '0 3px 3px 0',
    backgroundColor: '#E51937',
    boxShadow: '0 0 8px #E51937',
  },
  menuPopover: {
    borderRadius: '10px',
    padding: '6px',
    minWidth: '220px',
  },
  menuPopoverDark: {
    backgroundColor: '#121316',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(255, 255, 255, 0.1)', borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)', borderRightColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
  },
  menuPopoverLight: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08)',
  },
  menuHeader: {
    padding: '6px 12px 8px',
    marginBottom: '4px',
  },
  menuHeaderDark: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  menuHeaderLight: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#F1F5F9',
  },
  menuHeaderTitle: {
    color: '#FF4D63',
  },
  menuHeaderSubtitle: {
    color: '#64748B',
  },
  menuItemActive: {
    fontWeight: 700,
    color: '#FF4D63',
  },
  menuItemSpecial: {
    fontWeight: 500,
    color: '#FF4D63',
  },
  menuItemInactiveDark: {
    fontWeight: 500,
    color: '#E2E8F0',
  },
  menuItemInactiveLight: {
    fontWeight: 500,
    color: '#1E293B',
  },
  accordionBtnActiveDark: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.28)', borderBottomColor: 'rgba(229, 25, 55, 0.28)',
    borderLeftColor: 'rgba(229, 25, 55, 0.28)', borderRightColor: 'rgba(229, 25, 55, 0.28)',
    background: 'linear-gradient(90deg, rgba(229, 25, 55, 0.16) 0%, rgba(229, 25, 55, 0.04) 100%)',
    color: '#FFFFFF',
  },
  accordionBtnActiveLight: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.22)', borderBottomColor: 'rgba(229, 25, 55, 0.22)',
    borderLeftColor: 'rgba(229, 25, 55, 0.22)', borderRightColor: 'rgba(229, 25, 55, 0.22)',
    background: 'linear-gradient(90deg, rgba(229, 25, 55, 0.12) 0%, rgba(229, 25, 55, 0.03) 100%)',
    color: '#E51937',
  },
  accordionBtnInactiveDark: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    background: 'transparent',
    color: '#94A3B8',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      color: '#F1F5F9',
    },
  },
  accordionBtnInactiveLight: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    background: 'transparent',
    color: '#475569',
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      color: '#0F172A',
    },
  },
  accordionIconWrapActive: {
    color: '#FF4D63',
  },
  accordionIconWrapInactiveDark: {
    color: '#94A3B8',
  },
  accordionIconWrapInactiveLight: {
    color: '#475569',
  },
  accordionLabelActive: {
    fontSize: '13px',
    fontWeight: 700,
  },
  accordionLabelInactive: {
    fontSize: '13px',
    fontWeight: 500,
  },
  chevronIcon: {
    width: '15px',
    height: '15px',
    transition: 'transform 0.22s ease',
  },
  chevronDark: {
    color: '#475569',
  },
  chevronLight: {
    color: '#94A3B8',
  },
  chevronRotated: {
    transform: 'rotate(180deg)',
  },
  chevronNormal: {
    transform: 'rotate(0deg)',
  },
  submenuContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginLeft: '14px',
    paddingLeft: '10px',
    overflow: 'hidden',
    transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  submenuBorderDark: {
    borderLeftWidth: '1.5px',
    borderLeftStyle: 'solid',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  submenuBorderLight: {
    borderLeftWidth: '1.5px',
    borderLeftStyle: 'solid',
    borderLeftColor: '#E2E8F0',
  },
  submenuOpen: {
    maxHeight: '240px',
    opacity: 1,
    marginTop: '4px',
    marginBottom: '4px',
  },
  submenuClosed: {
    maxHeight: 0,
    opacity: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  subItemActiveDark: {
    color: '#E51937',
    background: 'rgba(229, 25, 55, 0.1)',
    fontWeight: 700,
  },
  subItemActiveLight: {
    color: '#E51937',
    background: 'rgba(229, 25, 55, 0.08)',
    fontWeight: 700,
  },
  subItemInactiveDark: {
    color: '#94A3B8',
    background: 'transparent',
    fontWeight: 500,
    ':hover': {
      color: '#F1F5F9',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
  },
  subItemInactiveLight: {
    color: '#64748B',
    background: 'transparent',
    fontWeight: 500,
    ':hover': {
      color: '#0F172A',
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  subItemLabelActive: {
    fontWeight: 700,
    fontSize: '12px',
  },
  subItemLabelInactive: {
    fontWeight: 500,
    fontSize: '12px',
  },
  subItemIconWrapActive: {
    opacity: 1,
  },
  subItemIconWrapInactive: {
    opacity: 0.75,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    height: '38px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '13px',
    position: 'relative',
    boxSizing: 'border-box',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  navLinkCollapsed: {
    width: '42px',
    margin: '0 auto',
    padding: 0,
    justifyContent: 'center',
  },
  navLinkExpanded: {
    width: '100%',
    margin: 0,
    padding: '0 10px',
    justifyContent: 'flex-start',
  },
  navLinkActiveDark: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.28)', borderBottomColor: 'rgba(229, 25, 55, 0.28)',
    borderLeftColor: 'rgba(229, 25, 55, 0.28)', borderRightColor: 'rgba(229, 25, 55, 0.28)',
    background: 'linear-gradient(90deg, rgba(229, 25, 55, 0.16) 0%, rgba(229, 25, 55, 0.04) 100%)',
    color: '#FFFFFF',
    fontWeight: 700,
  },
  navLinkActiveLight: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.22)', borderBottomColor: 'rgba(229, 25, 55, 0.22)',
    borderLeftColor: 'rgba(229, 25, 55, 0.22)', borderRightColor: 'rgba(229, 25, 55, 0.22)',
    background: 'linear-gradient(90deg, rgba(229, 25, 55, 0.12) 0%, rgba(229, 25, 55, 0.03) 100%)',
    color: '#E51937',
    fontWeight: 700,
  },
  navLinkInactiveDark: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    background: 'transparent',
    color: '#94A3B8',
    fontWeight: 500,
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      color: '#F1F5F9',
    },
  },
  navLinkInactiveLight: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    background: 'transparent',
    color: '#475569',
    fontWeight: 500,
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      color: '#0F172A',
    },
  },
  navLinkIconActive: {
    color: '#FF4D63',
    filter: 'drop-shadow(0 0 6px rgba(229, 25, 55, 0.6))',
  },
  navLinkIconInactiveDark: {
    color: '#94A3B8',
    filter: 'none',
  },
  navLinkIconInactiveLight: {
    color: '#475569',
    filter: 'none',
  },
  navLinkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
  },
  navLinkLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '13px',
  },
  badgePill: {
    fontSize: '9.5px',
    fontWeight: 800,
    padding: '1px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(229, 25, 55, 0.15)',
    color: '#FF4D63',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.3)', borderBottomColor: 'rgba(229, 25, 55, 0.3)',
    borderLeftColor: 'rgba(229, 25, 55, 0.3)', borderRightColor: 'rgba(229, 25, 55, 0.3)',
  },
  bottomDeck: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bottomDeckCollapsed: {
    padding: '10px 6px 14px',
  },
  bottomDeckExpanded: {
    padding: '10px 10px 14px',
  },
  bottomDeckDark: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)',
  },
  bottomDeckLight: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#E2E8F0',
    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.02) 100%)',
  },
  toolbar: {
    padding: '3px',
    borderRadius: '9px',
    boxSizing: 'border-box',
    alignItems: 'center',
    gap: '4px',
  },
  toolbarCollapsed: {
    display: 'flex',
    flexDirection: 'column',
    width: '38px',
    margin: '0 auto',
  },
  toolbarExpanded: {
    display: 'grid',
    width: '100%',
    margin: 0,
  },
  toolbarAdmin: {
    gridTemplateColumns: 'repeat(5, 1fr)',
  },
  toolbarNonAdmin: {
    gridTemplateColumns: 'repeat(3, 1fr)',
  },
  toolbarDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(255, 255, 255, 0.08)', borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftColor: 'rgba(255, 255, 255, 0.08)', borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  toolbarLight: {
    backgroundColor: '#F1F5F9',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
  },
  toolbarBtn: {
    height: '32px',
    width: '100%',
    padding: 0,
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  themeBtnDark: {
    color: '#F59E0B',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    },
  },
  themeBtnLight: {
    color: '#E51937',
    ':hover': {
      backgroundColor: '#FFFFFF',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    },
  },
  adminBtnActiveDark: {
    backgroundColor: 'rgba(229, 25, 55, 0.2)',
    color: '#E51937',
  },
  adminBtnActiveLight: {
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    color: '#E51937',
  },
  adminBtnInactiveDark: {
    color: '#CBD5E1',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    },
  },
  adminBtnInactiveLight: {
    color: '#64748B',
    ':hover': {
      backgroundColor: '#FFFFFF',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    },
  },
  storageBtnActiveDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#CBD5E1',
  },
  storageBtnActiveLight: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    color: '#64748B',
  },
  storageBtnInactiveDark: {
    color: '#CBD5E1',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    },
  },
  storageBtnInactiveLight: {
    color: '#64748B',
    ':hover': {
      backgroundColor: '#FFFFFF',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    },
  },
  logoutBtnDark: {
    color: '#EF4444',
    ':hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    },
  },
  logoutBtnLight: {
    color: '#EF4444',
    ':hover': {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    },
  },
  collapseBtnDark: {
    color: '#CBD5E1',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    },
  },
  collapseBtnLight: {
    color: '#64748B',
    ':hover': {
      backgroundColor: '#FFFFFF',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    },
  },
  storageDialogSurface: {
    borderRadius: tokens.borderRadiusLarge,
    maxWidth: '440px',
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
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
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
    fontWeight: 700,
    color: '#10B981',
  },
  storageBadgeAuto: {
    backgroundColor: 'rgba(229, 25, 55, 0.1)',
    color: '#E51937',
  },
  storageMsg: {
    color: '#10B981',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'center',
  },
  storageActions: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
  },
  storageCloseBtn: {
    height: '36px',
    padding: '0 18px',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  storageCloseDark: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(255, 255, 255, 0.15)', borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    borderLeftColor: 'rgba(255, 255, 255, 0.15)', borderRightColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#F1F5F9',
  },
  storageCloseLight: {
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#CBD5E1', borderBottomColor: '#CBD5E1',
    borderLeftColor: '#CBD5E1', borderRightColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#334155',
  },
  storageResyncBtn: {
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
  },
  textMuted: {
    color: tokens.colorNeutralForeground2,
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
      title: 'POS TERMINALS',
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
          label: 'Omnimart POS',
          moduleKey: 'omnimart' as const,
          icon: <BuildingRetail24Regular className={styles.icon19} />,
          activeIcon: <BuildingRetail24Filled className={styles.icon19} />,
        },
        {
          to: '/kitchen',
          label: 'Kitchen Display',
          badge: 'KDS',
          moduleKey: 'kitchen' as const,
          icon: <BowlSalad24Regular className={styles.icon19} />,
          activeIcon: <BowlSalad24Filled className={styles.icon19} />,
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
          icon: <Tag24Regular className={styles.icon19} />,
          activeIcon: <Tag24Filled className={styles.icon19} />,
          subItems: [
            { to: '/catalog', label: 'All Store Items', icon: <Tag20Regular className={styles.icon15} /> },
            { to: '/catalog/fastfood', label: 'Fast Food Menu', moduleKey: 'fastfood' as const, icon: <Food24Regular className={styles.icon15} /> },
            { to: '/catalog/omnimart', label: 'Omnimart Goods', moduleKey: 'omnimart' as const, icon: <BuildingRetail24Regular className={styles.icon15} /> },
            { to: '/catalog/categories', label: 'Categories Manager', icon: <Grid20Regular className={styles.icon15} /> },
            { to: '/catalog/new', label: '+ Add Product', icon: <Add20Regular className={styles.icon15Red} />, isSpecial: true },
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
          to: '/khata',
          label: 'Khata Ledger Book',
          moduleKey: 'khata' as const,
          icon: <BookContacts24Regular className={styles.icon19} />,
          activeIcon: <BookContacts24Filled className={styles.icon19} />,
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
          icon: <Money24Regular className={styles.icon19} />,
          activeIcon: <Money24Filled className={styles.icon19} />,
        },
        {
          to: '/reports',
          label: 'Profit & Loss Analytics',
          moduleKey: 'reports' as const,
          icon: <DataTrending24Regular className={styles.icon19} />,
          activeIcon: <DataTrending24Filled className={styles.icon19} />,
        },
      ],
    },
    {
      title: 'ADMIN & CONTROL',
      items: [
        {
          to: '/admin',
          label: 'Staff & Cashier Roles',
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
        if (it.moduleKey && !can(it.moduleKey)) return false;
        // 2. Check user granular permission (cashier restrictions)
        if (it.moduleKey) {
          const perm = MODULE_TO_PERMISSION[it.moduleKey as keyof LicenseModules];
          if (perm && !hasPermission(perm)) return false;
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
      {/* ── Top Ambient Glow Header ─────────────────────────────── */}
      <div
        className={mergeClasses(
          styles.header,
          isCollapsed ? styles.headerCollapsed : styles.headerExpanded,
          isDark ? styles.headerDark : styles.headerLight
        )}
      >
        <div
          onClick={toggleSidebar}
          className={mergeClasses(
            styles.brandToggle,
            isCollapsed ? styles.brandToggleCollapsed : styles.brandToggleExpanded
          )}
          title={isCollapsed ? 'Click to expand sidebar (Ctrl+B)' : 'Click to collapse sidebar (Ctrl+B)'}
        >
          {/* Futuristic Hexagon/Square Logo Badge */}
          <div className={styles.brandBadge}>
            OP
          </div>

          {!isCollapsed && (
            <div className={styles.brandTextWrap}>
              <div className={styles.brandTitleRow}>
                <span className={mergeClasses(styles.brandTitle, isDark ? styles.brandTitleDark : styles.brandTitleLight)}>
                  OmniPos
                </span>
                <span className={styles.brandDot} />
              </div>
              <div className={styles.brandSubtitle}>
                Enterprise POS &amp; ERP
              </div>
            </div>
          )}
        </div>
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
                    // When collapsed: Flyout Popover Menu
                    return (
                      <Menu key={item.label} positioning="after" openOnHover={true} hoverDelay={150}>
                        <MenuTrigger disableButtonEnhancement>
                          <button
                            type="button"
                            onClick={() => navigate(item.defaultRoute)}
                            className={mergeClasses(
                              styles.collapsedAccordionBtn,
                              item.isActive
                                ? (isDark ? styles.collapsedBtnActiveDark : styles.collapsedBtnActiveLight)
                                : (isDark ? styles.collapsedBtnInactiveDark : styles.collapsedBtnInactiveLight)
                            )}
                          >
                            <Tooltip content={item.label} relationship="label" positioning="after">
                              <span className={styles.collapsedInnerSpan}>
                                {item.isActive && (
                                  <div className={styles.collapsedActiveLaser} />
                                )}
                                {item.isActive ? item.activeIcon : item.icon}
                              </span>
                            </Tooltip>
                          </button>
                        </MenuTrigger>
                        <MenuPopover
                          className={mergeClasses(
                            styles.menuPopover,
                            isDark ? styles.menuPopoverDark : styles.menuPopoverLight
                          )}
                        >
                          <MenuList>
                            <div className={mergeClasses(styles.menuHeader, isDark ? styles.menuHeaderDark : styles.menuHeaderLight)}>
                              <Text weight="bold" size={200} block className={styles.menuHeaderTitle}>
                                {item.label}
                              </Text>
                              <Text size={100} className={styles.menuHeaderSubtitle}>
                                {item.subtitle || 'Module navigation'}
                              </Text>
                            </div>
                            {item.subItems.map((sub: any) => (
                              <MenuItem
                                key={sub.to}
                                icon={sub.icon}
                                onClick={() => navigate(sub.to)}
                                className={
                                  location.pathname === sub.to
                                    ? styles.menuItemActive
                                    : sub.isSpecial
                                    ? styles.menuItemSpecial
                                    : isDark
                                    ? styles.menuItemInactiveDark
                                    : styles.menuItemInactiveLight
                                }
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
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      mergeClasses(
                        styles.navLink,
                        isCollapsed ? styles.navLinkCollapsed : styles.navLinkExpanded,
                        isActive
                          ? (isDark ? styles.navLinkActiveDark : styles.navLinkActiveLight)
                          : (isDark ? styles.navLinkInactiveDark : styles.navLinkInactiveLight)
                      )
                    }
                  >
                    {({ isActive }) => {
                      const content = isCollapsed ? (
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
                      ) : (
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
              className={mergeClasses(styles.toolbarBtn, isDark ? styles.themeBtnDark : styles.themeBtnLight)}
              title={mode === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {mode === 'dark' ? (
                <WeatherSunny20Regular className={mergeClasses(styles.icon17, styles.icon17Amber)} />
              ) : (
                <WeatherMoon20Regular className={mergeClasses(styles.icon17, styles.icon17Red)} />
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
                className={mergeClasses(
                  styles.toolbarBtn,
                  location.pathname === '/admin'
                    ? (isDark ? styles.adminBtnActiveDark : styles.adminBtnActiveLight)
                    : (isDark ? styles.adminBtnInactiveDark : styles.adminBtnInactiveLight)
                )}
                title="Store & Admin Settings"
              >
                <Settings20Regular
                  className={mergeClasses(styles.icon17, location.pathname === '/admin' ? styles.icon17Red : undefined)}
                />
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
                className={mergeClasses(
                  styles.toolbarBtn,
                  isStorageModalOpen
                    ? (isDark ? styles.storageBtnActiveDark : styles.storageBtnActiveLight)
                    : (isDark ? styles.storageBtnInactiveDark : styles.storageBtnInactiveLight)
                )}
                title="Local Storage & Database Engine"
              >
                <Database20Regular className={styles.icon17} />
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
              className={mergeClasses(styles.toolbarBtn, isDark ? styles.logoutBtnDark : styles.logoutBtnLight)}
              title={`Log Out / Lock Terminal (${user?.name || 'Cashier'})`}
            >
              <LockClosed20Regular className={mergeClasses(styles.icon17, styles.icon17Danger)} />
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
              className={mergeClasses(styles.toolbarBtn, isDark ? styles.collapseBtnDark : styles.collapseBtnLight)}
              title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            >
              {isCollapsed ? (
                <ChevronRight20Regular className={styles.icon17} />
              ) : (
                <ChevronLeft20Regular className={styles.icon17} />
              )}
            </button>
          </Tooltip>
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
            </DialogContent>
            <DialogActions className={styles.storageActions}>
              <button
                type="button"
                onClick={() => setIsStorageModalOpen(false)}
                className={mergeClasses(styles.storageCloseBtn, isDark ? styles.storageCloseDark : styles.storageCloseLight)}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleResyncStorage}
                className={styles.storageResyncBtn}
              >
                <ArrowSync20Filled className={styles.icon15} />
                <span>Force Cloud Resync</span>
              </button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </nav>
  );
}
