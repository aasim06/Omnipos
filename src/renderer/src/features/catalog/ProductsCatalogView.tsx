import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Button,
  Badge,
  Label,
  Subtitle1,
  Body1,
  Caption1,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Search20Regular,
  Edit20Regular,
  Delete20Regular,
  Food24Regular,
  BuildingRetail24Regular,
  Tag20Regular,
  ArrowUpload20Regular,
  Dismiss16Regular,
  Image20Regular,
  Grid20Regular,
  ArrowRight20Regular,
  Warning20Regular,
  Box20Regular,
  Money20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Product, Category, ModuleKey } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { CustomInput, CustomSelect } from '@/components/ui';

const UNIT_OPTIONS = [
  { value: 'PCS', label: 'Piece (PCS)' },
  { value: 'KG', label: 'Kilogram (KG)' },
  { value: 'Gram', label: 'Gram (g)' },
  { value: 'Liter', label: 'Liter (L)' },
  { value: 'ML', label: 'Milliliter (ml)' },
  { value: 'PACK', label: 'Pack' },
  { value: 'BOX', label: 'Box' },
  { value: 'DOZEN', label: 'Dozen' },
  { value: 'FEET', label: 'Feet (ft)' },
  { value: 'METER', label: 'Meter (m)' },
  { value: 'GALLON', label: 'Gallon' },
  { value: 'BAG', label: 'Bag' },
  { value: 'BUNDLE', label: 'Bundle' },
  { value: 'PAIR', label: 'Pair' },
];

/* ── Zod Schemas ───────────────────────────────────────────────────── */
const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  module: z.enum(['fastfood', 'minimart']),
  category: z.string().min(1, 'Category is required'),
  price: z.coerce.number().positive('Retail selling price must be greater than 0'),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').optional(),
  unit: z.string().default('PCS'),
  skuCode: z.string().optional(),
  rackLocation: z.string().optional(),
  openingStock: z.coerce.number().min(0, 'Opening stock cannot be negative').default(0),
  imageUrl: z.string().optional(),
  imageBase64: z.string().optional(),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  module: z.enum(['fastfood', 'minimart']),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const useStyles = makeStyles({
  container: {
    padding: '20px 24px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    backgroundColor: tokens.colorNeutralBackground2, // #F5F5F5 Mica Canvas
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  hudCard: {
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },
  },
  divisionHeroCard: {
    borderRadius: '14px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: tokens.shadow16,
    },
  },
  tableCard: {
    borderRadius: tokens.borderRadiusMedium, // 8px
    backgroundColor: tokens.colorNeutralBackground1, // White container
    boxShadow: tokens.shadow4, // Subtle Fluent elevation
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  categoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
  },
  categoryCard: {
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
  },
  productDialogSurface: {
    maxWidth: '980px',
    width: 'min(980px, 95vw)',
    minWidth: 'min(800px, 90vw)',
    maxHeight: 'min(92vh, 680px)',
    borderRadius: '16px',
    padding: '18px 24px 14px 24px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  productDialogContent: {
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '0',
    flex: '1 1 auto',
    minHeight: '0',
  },
  kpiContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '22px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  },
  kpiHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: '26px',
    fontWeight: 900,
    color: tokens.colorNeutralForeground1,
    marginTop: '4px',
    lineHeight: '1.1',
  },
  kpiSkus: {
    fontSize: '13px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
  },
  kpiValueGreen: {
    fontSize: '24px',
    fontWeight: 900,
    color: '#10B981',
    marginTop: '4px',
    lineHeight: '1.1',
  },
  kpiValueRed: {
    fontSize: '26px',
    fontWeight: 900,
    color: '#EF4444',
    marginTop: '4px',
    lineHeight: '1.1',
  },
  kpiIconFastFood: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(229, 25, 55, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E51937',
  },
  kpiIconGreen: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(160, 230, 190, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#10B981',
  },
  kpiIconRed: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#EF4444',
  },
  kpiIconPurple: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(168, 85, 247, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#A855F7',
  },
  kpiSubRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    fontSize: '11.5px',
  },
  kpiRedText: {
    color: '#E51937',
    fontWeight: 700,
  },
  kpiBlueText: {
    color: '#0284C7',
    fontWeight: 700,
  },
  kpiAmberText: {
    color: '#F59E0B',
    fontWeight: 700,
  },
  kpiManageCatsLink: {
    color: '#A855F7',
    fontWeight: 700,
    cursor: 'pointer',
  },
  divisionHeroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  divisionHeroTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  divisionIconFastFood: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #FF1E3C 0%, #990012 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    boxShadow: '0 0 16px rgba(229, 25, 55, 0.4)',
  },
  divisionIconOmnimart: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    boxShadow: '0 0 16px rgba(14, 165, 233, 0.4)',
  },
  divisionTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  divisionSubtitle: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  divisionTagFastFood: {
    fontSize: '10.5px',
    fontWeight: 800,
    color: '#E51937',
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(229, 25, 55, 0.25)',
  },
  divisionTagOmnimart: {
    fontSize: '10.5px',
    fontWeight: 800,
    color: '#0284C7',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid rgba(14, 165, 233, 0.25)',
  },
  divisionStatBox: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginTop: '20px',
    padding: '14px',
    borderRadius: '8px',
    background: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  divisionStatHead: {
    fontSize: '10.5px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  divisionStatNum: {
    fontSize: '18px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    marginTop: '2px',
  },
  divisionStatNumGreen: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#10B981',
    marginTop: '2px',
  },
  divisionStatNumBlue: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0284C7',
    marginTop: '2px',
  },
  divisionBtnRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  btnFastFoodHero: {
    backgroundColor: '#E51937',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 700,
    flex: 1,
    ':hover': {
      backgroundColor: '#be123c',
    },
  },
  btnOmnimartHero: {
    backgroundColor: '#0284C7',
    color: '#ffffff',
    borderRadius: '8px',
    fontWeight: 700,
    flex: 1,
    ':hover': {
      backgroundColor: '#0369a1',
    },
  },
  btnOutlineRounded: {
    borderRadius: '8px',
    fontWeight: 600,
  },
  // Header styles
  headerTitleWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTitle: {
    fontWeight: 800,
    fontSize: '20px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  headerBadge: {
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 7px',
    borderRadius: '4px',
    backgroundColor: 'rgba(229, 25, 55, 0.15)',
    color: '#FF4D63',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.3)', borderBottomColor: 'rgba(229, 25, 55, 0.3)',
    borderLeftColor: 'rgba(229, 25, 55, 0.3)', borderRightColor: 'rgba(229, 25, 55, 0.3)',
    letterSpacing: '0.06em',
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
    margin: 0,
    display: 'block',
    fontSize: '13px',
    marginTop: '2px',
  },
  headerActions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  categoriesMgrBtn: {
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 600,
  },
  addProductBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 600,
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },

  // KPI & Radar styles
  kpiDot: {
    color: tokens.colorNeutralForeground4,
  },
  kpiSubRowColored: {
    color: tokens.colorNeutralForeground3,
  },
  totalCostVal: {
    color: tokens.colorNeutralForeground1,
  },
  icon22: {
    width: '22px',
    height: '22px',
  },
  icon26: {
    width: '26px',
    height: '26px',
  },
  icon28: {
    width: '28px',
    height: '28px',
  },
  icon14: {
    width: '14px',
    height: '14px',
  },
  icon20: {
    width: '20px',
    height: '20px',
  },
  divisionGrid: {
    display: 'grid',
    gap: '20px',
  },
  divisionGrid2: {
    gridTemplateColumns: '1fr 1fr',
  },
  divisionGrid1: {
    gridTemplateColumns: '1fr',
  },
  radarCard: {
    borderRadius: '12px',
    padding: '18px 20px',
    background: 'rgba(239, 68, 68, 0.04)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(239, 68, 68, 0.2)', borderBottomColor: 'rgba(239, 68, 68, 0.2)',
    borderLeftColor: 'rgba(239, 68, 68, 0.2)', borderRightColor: 'rgba(239, 68, 68, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  radarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radarTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  radarIcon: {
    color: '#EF4444',
    width: '20px',
    height: '20px',
  },
  radarTitle: {
    fontWeight: 800,
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  radarBadge: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
    padding: '2px 7px',
    borderRadius: '999px',
  },
  radarActionBtn: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#E51937',
  },
  radarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '12px',
  },
  radarItemCard: {
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: tokens.shadow2,
  },
  radarItemLeft: {
    overflow: 'hidden',
    marginRight: '10px',
  },
  radarItemName: {
    fontSize: '13px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  radarItemMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  radarItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  radarItemBadge: {
    fontWeight: 800,
    fontSize: '11px',
  },

  // Live POS Cards Showcase styles
  liveHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  liveTitleWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  liveTitle: {
    fontWeight: 800,
    fontSize: '16px',
    color: tokens.colorNeutralForeground1,
  },
  liveSubtitle: {
    fontSize: '11.5px',
    color: tokens.colorNeutralForeground3,
  },
  liveSearchWrap: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    width: '280px',
  },
  liveCardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
    gap: '14px',
  },
  liveCard: {
    height: '210px',
    borderRadius: '10px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: tokens.shadow4,
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    position: 'relative',
  },
  liveCardImgWrap: {
    height: '126px',
    width: '100%',
    position: 'relative',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  noPhotoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: tokens.colorNeutralForeground4,
  },
  noPhotoText: {
    fontSize: '10px',
  },
  cardStockBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 700,
  },
  cardStockBadgeAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
  },
  cardStockBadgeNormal: {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  cardEditBtn: {
    position: 'absolute',
    bottom: '6px',
    right: '6px',
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: '#ffffff',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveCardContent: {
    height: '84px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardProdName: {
    fontSize: '13px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cardVariantRow: {
    display: 'flex',
    gap: '3px',
    marginTop: '2px',
    overflow: 'hidden',
  },
  cardVariantTag: {
    fontSize: '9px',
    fontWeight: 800,
    padding: '0 4px',
    borderRadius: '3px',
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    color: '#E51937',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.25)', borderBottomColor: 'rgba(229, 25, 55, 0.25)',
    borderLeftColor: 'rgba(229, 25, 55, 0.25)', borderRightColor: 'rgba(229, 25, 55, 0.25)',
  },
  cardVariantMore: {
    fontSize: '9px',
    color: tokens.colorNeutralForeground3,
  },
  cardCatSubtitle: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginTop: '1px',
  },
  cardBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: '14px',
    fontWeight: 900,
    color: '#E51937',
  },
  cardSku: {
    fontSize: '10px',
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground3,
  },

  // Detailed Table styles
  searchRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  searchCol300: {
    width: '300px',
  },
  filterCol200: {
    width: '200px',
  },
  tableCaption: {
    color: tokens.colorNeutralForeground2,
  },
  tableOverflow: {
    overflowX: 'auto',
    width: '100%',
  },
  dataTable: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0,
    tableLayout: 'auto',
  },
  tableTheadTr: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  thDetails: {
    padding: '12px 14px',
    width: '28%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thCategory: {
    padding: '12px 12px',
    width: '15%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thPrice: {
    padding: '12px 12px',
    width: '13%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thCost: {
    padding: '12px 12px',
    width: '13%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thStock: {
    padding: '12px 12px',
    width: '11%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thSku: {
    padding: '12px 12px',
    width: '10%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thActions: {
    padding: '12px 14px',
    width: '10%',
    textAlign: 'right',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  emptyTd: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
  },
  tbodyTr: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    transition: 'background-color 0.15s ease',
  },
  tdDetails: {
    padding: '12px 18px',
    verticalAlign: 'middle',
  },
  prodDetailsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  prodThumbnailWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
  },
  prodTextCol: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  prodTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  prodDesc: {
    color: tokens.colorNeutralForeground2,
    maxWidth: '240px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tdCell: {
    padding: '12px 14px',
    verticalAlign: 'middle',
  },
  badgeRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  catSub: {
    color: tokens.colorNeutralForeground3,
  },
  costCaption: {
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
  },
  stockBadge: {
    fontWeight: 700,
  },
  skuCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  skuCode: {
    fontFamily: tokens.fontFamilyMonospace,
    fontWeight: 600,
  },
  rackText: {
    color: tokens.colorNeutralForeground3,
  },
  tdActions: {
    padding: '12px 18px',
    verticalAlign: 'middle',
    textAlign: 'right',
  },
  actionsRow: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end',
  },
  deleteIcon: {
    color: '#D13438',
  },

  // Modal styles (Product Dialog & Category Dialog)
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
    overflow: 'hidden',
    padding: 0,
  },
  modalHeader: {
    marginBottom: '10px',
    paddingBottom: '8px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    flexShrink: 0,
  },
  dialogTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  dialogSub: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    marginTop: '2px',
  },
  dialogContentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '18px',
    alignItems: 'start',
    paddingRight: '4px',
    overflowY: 'auto',
  },
  formColLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formGrid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  formBottomAlign: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  categoryHeaderRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '6px',
  },
  newCategoryLink: {
    fontSize: '11.5px',
    color: '#E51937',
    fontWeight: 700,
    cursor: 'pointer',
  },
  formColRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '280px',
  },
  uploadCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '12px',
    padding: '12px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
  },
  uploadLabel: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 700,
    fontSize: '12px',
  },
  hiddenInput: {
    display: 'none',
  },
  attachedRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  attachedThumb: {
    width: '46px',
    height: '46px',
    borderRadius: '6px',
    overflow: 'hidden',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
    flexShrink: 0,
    backgroundColor: '#1E1E1E',
  },
  attachedInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    minWidth: 0,
  },
  attachedTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  attachedPath: {
    fontSize: '10.5px',
    color: tokens.colorNeutralForeground3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  attachedActions: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
  },
  changeBtn: {
    minWidth: 'auto',
    padding: '3px 8px',
    fontSize: '11px',
  },
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    padding: '14px 10px',
    borderRadius: '8px',
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'dashed', borderBottomStyle: 'dashed', borderLeftStyle: 'dashed', borderRightStyle: 'dashed',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ':hover': {
      borderTopColor: '#E51937', borderBottomColor: '#E51937', borderLeftColor: '#E51937', borderRightColor: '#E51937',
      backgroundColor: 'rgba(229, 25, 55, 0.04)',
    },
  },
  uploadIcon: {
    width: '24px',
    height: '24px',
    color: '#E51937',
  },
  uploadTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  uploadSub: {
    fontSize: '10.5px',
    color: tokens.colorNeutralForeground3,
  },
  urlWrap: {
    marginTop: '8px',
  },
  previewCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '12px',
    padding: '12px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  previewHeadTitle: {
    fontSize: '10.5px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: tokens.colorNeutralForeground2,
  },
  previewHeadSub: {
    fontSize: '10.5px',
    color: tokens.colorNeutralForeground3,
  },
  posMockup: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '10px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
    display: 'flex',
    flexDirection: 'column',
  },
  mockupMedia: {
    height: '114px',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#18181B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoMockup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    color: '#71717A',
  },
  mockupCatBadge: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFFFFF',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '9.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  mockupStockBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '9.5px',
    fontWeight: 800,
  },
  mockupContent: {
    height: '76px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },
  mockupName: {
    fontWeight: 800,
    fontSize: '12.5px',
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  mockupBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2px',
  },
  mockupPriceLabel: {
    fontSize: '9px',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  mockupPriceVal: {
    fontWeight: 900,
    fontSize: '14.5px',
    color: '#E51937',
  },
  mockupUnitTag: {
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: 'rgba(229, 25, 55, 0.1)',
    color: '#E51937',
    padding: '2px 7px',
    borderRadius: '4px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.2)', borderBottomColor: 'rgba(229, 25, 55, 0.2)',
    borderLeftColor: 'rgba(229, 25, 55, 0.2)', borderRightColor: 'rgba(229, 25, 55, 0.2)',
  },
  dialogFooterActions: {
    marginTop: 'auto',
    paddingTop: '10px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flexShrink: 0,
  },
  dialogCancelBtn: {
    borderRadius: '8px',
    fontWeight: 600,
    padding: '8px 18px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    whiteSpace: 'nowrap',
  },
  dialogSubmitBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '9px 24px',
    minWidth: '150px',
    whiteSpace: 'nowrap',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },

  // Category Dialog styles
  catDialogSurface: {
    maxWidth: '460px',
    width: '92vw',
    borderRadius: '16px',
    padding: '24px',
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
  },
  catForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    width: '100%',
  },
  catHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    width: '100%',
  },
  catHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  catIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E51937',
  },
  catTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  catDialogSub: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  catFieldsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
  },
  catFooter: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '6px',
    paddingTop: '14px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    width: '100%',
  },
  catCancelBtn: {
    borderRadius: '8px',
    fontWeight: 600,
    padding: '8px 18px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    whiteSpace: 'nowrap',
  },
  catSubmitBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '9px 22px',
    minWidth: '130px',
    whiteSpace: 'nowrap',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },
});

export function ProductsCatalogView({ initialTab }: { initialTab?: 'all' | 'fastfood' | 'minimart' | 'categories' } = {}): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  // Synchronize activeTab with URL route or prop
  const getTabFromPath = (): 'all' | 'fastfood' | 'minimart' | 'categories' => {
    if (location.pathname === '/catalog/fastfood') return 'fastfood';
    if (location.pathname === '/catalog/omnimart') return 'minimart';
    if (location.pathname === '/catalog/categories') return 'categories';
    return initialTab || 'all';
  };

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'all' | 'fastfood' | 'minimart' | 'categories'>(getTabFromPath);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname, initialTab]);

  const handleTabChange = (key: 'all' | 'fastfood' | 'minimart' | 'categories') => {
    setActiveTab(key);
    if (key === 'all') navigate('/catalog');
    else if (key === 'fastfood') navigate('/catalog/fastfood');
    else if (key === 'minimart') navigate('/catalog/omnimart');
    else if (key === 'categories') navigate('/catalog/categories');
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  /* ── React Hook Form + Zod for Products ────────────────────────────── */
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      module: 'fastfood',
      category: 'General',
      price: undefined,
      costPrice: undefined,
      skuCode: '',
      rackLocation: '',
      openingStock: 50,
      imageUrl: '',
      description: '',
    },
  });

  /* ── React Hook Form + Zod for Categories ──────────────────────────── */
  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: '',
      module: 'fastfood',
    },
  });

  // Watch selected module in product dialog to filter category choices & live preview
  const watchedModule = productForm.watch('module');
  const watchedName = productForm.watch('name');
  const watchedPrice = productForm.watch('price');
  const watchedCategory = productForm.watch('category');
  const watchedUnit = productForm.watch('unit');
  const watchedStock = productForm.watch('openingStock');

  /* ── Local Image Upload & Preview State ────────────────────────────── */
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      productForm.setValue('imageUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    productForm.setValue('imageUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch Products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => posApi.fetchCategories(),
  });

  // Save Product Mutation
  const saveProductMutation = useMutation({
    mutationFn: async (prod: Product) => {
      return await posApi.saveProduct(prod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
    },
  });

  // Delete Product Mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return await posApi.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  // Save Category Mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async (cat: Category) => {
      return await posApi.saveCategory(cat);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
    },
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await posApi.deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setImagePreview(null);
    const defaultMod = activeTab === 'minimart' ? 'minimart' : 'fastfood';
    const firstCat = categories.find((c) => c.module === defaultMod)?.name || 'General';
    productForm.reset({
      name: '',
      module: defaultMod,
      category: firstCat,
      price: undefined,
      costPrice: undefined,
      unit: defaultMod === 'minimart' ? 'PCS' : 'PCS',
      skuCode: `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
      rackLocation: '',
      openingStock: 50,
      imageUrl: '',
      description: '',
    });
    setIsProductDialogOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setImagePreview(prod.imageBase64 || prod.imageUrl || null);
    productForm.reset({
      name: prod.name,
      module: prod.module,
      category: prod.category,
      price: prod.price,
      costPrice: prod.costPrice,
      unit: prod.unit || 'PCS',
      skuCode: prod.skuCode || '',
      rackLocation: prod.rackLocation || '',
      openingStock: prod.openingStock ?? 0,
      imageUrl: prod.imageUrl || '',
      description: prod.description || '',
    });
    setIsProductDialogOpen(true);
  };

  const onProductSubmit = (data: ProductFormData) => {
    const isBase64 = imagePreview && imagePreview.startsWith('data:');
    const prod: Product = {
      id: editingProduct ? editingProduct.id : uid('prod_'),
      name: data.name.trim(),
      module: data.module,
      category: data.category || 'General',
      price: data.price,
      costPrice: data.costPrice,
      unit: data.unit || 'PCS',
      skuCode: data.skuCode?.trim() || `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
      rackLocation: data.rackLocation?.trim() || undefined,
      openingStock: data.openingStock,
      imageUrl: data.imageUrl?.trim() || (isBase64 ? imagePreview : undefined),
      imageBase64: isBase64 ? imagePreview : (editingProduct?.imageBase64 || undefined),
      description: data.description?.trim() || undefined,
      hasVariants: editingProduct ? editingProduct.hasVariants : undefined,
      variants: editingProduct ? editingProduct.variants : undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProductMutation.mutate(prod);
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    const cat: Category = {
      id: uid('cat_'),
      name: data.name.trim(),
      module: data.module,
    };
    saveCategoryMutation.mutate(cat);
  };
  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  // Filtered products
  const filteredProducts = products.filter((p) => {
    if (p.module === 'fastfood' && !hasFastFood) return false;
    if (p.module === 'minimart' && !hasOmnimart) return false;

    if (activeTab === 'fastfood' && p.module !== 'fastfood') return false;
    if (activeTab === 'minimart' && p.module !== 'minimart') return false;
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.skuCode && p.skuCode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.variants &&
          p.variants.some(
            (v) =>
              (v.skuCode && v.skuCode.toLowerCase().includes(q)) ||
              (v.label && v.label.toLowerCase().includes(q))
          ))
      );
    }
    return true;
  });

  if (isLoadingProducts && products.length === 0) {
    return <TablePageSkeleton title="Products & Menu Catalog" hasMetrics={false} />;
  }

  // Dashboard KPI metrics calculations
  const activeProducts = products.filter((p) =>
    p.module === 'fastfood' ? hasFastFood : hasOmnimart,
  );
  const fastFoodProducts = activeProducts.filter((p) => p.module === 'fastfood');
  const omnimartProducts = activeProducts.filter((p) => p.module === 'minimart');
  const totalRetailValue = activeProducts.reduce((acc, p) => acc + (p.price * (p.openingStock || 0)), 0);
  const totalCostValue = activeProducts.reduce((acc, p) => acc + ((p.costPrice || (p.price * 0.7)) * (p.openingStock || 0)), 0);
  const outOfStockProducts = activeProducts.filter((p) => (p.openingStock || 0) <= 0);
  const lowStockProducts = activeProducts.filter((p) => (p.openingStock || 0) > 0 && (p.openingStock || 0) <= (p.minThreshold || 10));
  const fastFoodAvgPrice = fastFoodProducts.length > 0
    ? Math.round(fastFoodProducts.reduce((sum, p) => sum + p.price, 0) / fastFoodProducts.length)
    : 0;

  return (
    <div className={styles.container}>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTitleWrap}>
          <div className={styles.headerTitleRow}>
            <Subtitle1 as="h1" className={styles.headerTitle}>
              {activeTab === 'fastfood'
                ? 'Fast Food Menu Catalog'
                : activeTab === 'minimart'
                ? 'Omnimart Supermarket Catalog'
                : 'Catalog Executive Dashboard'}
            </Subtitle1>
            {activeTab === 'all' && (
              <span className={styles.headerBadge}>
                INTELLIGENCE HUB
              </span>
            )}
          </div>
          <Caption1 as="p" className={styles.headerSubtitle}>
            {activeTab === 'fastfood'
              ? 'Manage fast food burgers, pizzas, snacks, and kitchen prep items'
              : activeTab === 'minimart'
              ? 'Manage retail groceries, SKU barcodes, rack locations, and loose scale items'
              : 'Real-time catalog performance, departmental division hubs & stock valuation'}
          </Caption1>
        </div>

        <div className={styles.headerActions}>
          {activeTab === 'all' && (
            <Button
              appearance="outline"
              icon={<Grid20Regular />}
              className={styles.categoriesMgrBtn}
              onClick={() => navigate('/catalog/categories')}
            >
              Categories Manager
            </Button>
          )}

          {/* Primary Action Button */}
          <Button
            appearance="primary"
            icon={<Add20Regular />}
            className={styles.addProductBtn}
            onClick={() => {
              if (activeTab === 'fastfood') {
                navigate('/catalog/new?module=fastfood');
              } else if (activeTab === 'minimart') {
                navigate('/catalog/new?module=minimart');
              } else {
                navigate('/catalog/new');
              }
            }}
          >
            {activeTab === 'fastfood'
              ? '+ Add Fast Food Item'
              : activeTab === 'minimart'
              ? '+ Add Omnimart Product'
              : '+ Add New Product'}
          </Button>
        </div>
      </div>

      {/* ── Condition: Dashboard vs Detailed Table View ─────────── */}
      {activeTab === 'all' ? (
        <div className={styles.kpiContainer}>
          {/* 1. Futuristic KPI Pulse HUD */}
          <div className={styles.kpiGrid}>
            <div className={styles.hudCard}>
              <div className={styles.kpiHeaderRow}>
                <div>
                  <div className={styles.kpiLabel}>
                    Catalog Inventory
                  </div>
                  <div className={styles.kpiValue}>
                    {products.length} <span className={styles.kpiSkus}>SKUs</span>
                  </div>
                </div>
                <div className={styles.kpiIconFastFood}>
                  <Box20Regular className={styles.icon22} />
                </div>
              </div>
              <div className={styles.kpiSubRow}>
                <span className={styles.kpiRedText}>{fastFoodProducts.length} Fast Food</span>
                <span className={styles.kpiDot}>•</span>
                <span className={styles.kpiBlueText}>{omnimartProducts.length} Omnimart</span>
              </div>
            </div>

            <div className={styles.hudCard}>
              <div className={styles.kpiHeaderRow}>
                <div>
                  <div className={styles.kpiLabel}>
                    Retail Valuation
                  </div>
                  <div className={styles.kpiValueGreen}>
                    {formatPKR(totalRetailValue)}
                  </div>
                </div>
                <div className={styles.kpiIconGreen}>
                  <Money20Regular className={styles.icon22} />
                </div>
              </div>
              <div className={mergeClasses(styles.kpiSubRow, styles.kpiSubRowColored)}>
                <span>Estimated Cost: <strong className={styles.totalCostVal}>{formatPKR(totalCostValue)}</strong></span>
              </div>
            </div>

            <div className={styles.hudCard}>
              <div className={styles.kpiHeaderRow}>
                <div>
                  <div className={styles.kpiLabel}>
                    Stock Health
                  </div>
                  <div className={outOfStockProducts.length > 0 ? styles.kpiValueRed : styles.kpiValueGreen}>
                    {outOfStockProducts.length} <span className={styles.kpiSkus}>Zero Stock</span>
                  </div>
                </div>
                <div className={styles.kpiIconRed}>
                  <Warning20Regular className={styles.icon22} />
                </div>
              </div>
              <div className={styles.kpiSubRow}>
                <span className={styles.kpiAmberText}>{lowStockProducts.length} Low Stock Warnings</span>
              </div>
            </div>

            <div className={styles.hudCard}>
              <div className={styles.kpiHeaderRow}>
                <div>
                  <div className={styles.kpiLabel}>
                    Active Categories
                  </div>
                  <div className={styles.kpiValue}>
                    {categories.length} <span className={styles.kpiSkus}>Departments</span>
                  </div>
                </div>
                <div className={styles.kpiIconPurple}>
                  <Grid20Regular className={styles.icon22} />
                </div>
              </div>
              <div className={styles.kpiSubRow}>
                <span
                  onClick={() => navigate('/catalog/categories')}
                  className={styles.kpiManageCatsLink}
                >
                  Manage Categories →
                </span>
              </div>
            </div>
          </div>

          {/* 2. Department Division Command Hubs */}
          {(hasFastFood || hasOmnimart) && (
            <div className={mergeClasses(styles.divisionGrid, (hasFastFood && hasOmnimart) ? styles.divisionGrid2 : styles.divisionGrid1)}>
              {/* Fast Food Hub Card */}
              {hasFastFood && (
                <div className={styles.divisionHeroCard}>
                  <div className={styles.divisionHeroTop}>
                    <div className={styles.divisionHeroTitleWrap}>
                      <div className={styles.divisionIconFastFood}>
                        <Food24Regular className={styles.icon26} />
                      </div>
                      <div>
                        <div className={styles.divisionTitle}>
                          Fast Food Division
                        </div>
                        <div className={styles.divisionSubtitle}>
                          Burgers, pizzas, snacks, prep times &amp; kitchen addons
                        </div>
                      </div>
                    </div>
                    <span className={styles.divisionTagFastFood}>
                      RESTAURANT
                    </span>
                  </div>

                  <div className={styles.divisionStatBox}>
                    <div>
                      <div className={styles.divisionStatHead}>Items</div>
                      <div className={styles.divisionStatNum}>
                        {fastFoodProducts.length}
                      </div>
                    </div>
                    <div>
                      <div className={styles.divisionStatHead}>Categories</div>
                      <div className={styles.divisionStatNum}>
                        {categories.filter(c => c.module === 'fastfood').length}
                      </div>
                    </div>
                    <div>
                      <div className={styles.divisionStatHead}>Avg Price</div>
                      <div className={styles.divisionStatNumGreen}>
                        {formatPKR(fastFoodAvgPrice)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.divisionBtnRow}>
                    <Button
                      appearance="primary"
                      className={styles.btnFastFoodHero}
                      onClick={() => navigate('/catalog/fastfood')}
                    >
                      Open Fast Food Catalog →
                    </Button>
                    <Button
                      appearance="outline"
                      className={styles.btnOutlineRounded}
                      onClick={() => navigate('/catalog/new?module=fastfood')}
                    >
                      + Add Food Item
                    </Button>
                  </div>
                </div>
              )}

              {/* Omnimart Supermarket Hub Card */}
              {hasOmnimart && (
                <div className={styles.divisionHeroCard}>
                  <div className={styles.divisionHeroTop}>
                    <div className={styles.divisionHeroTitleWrap}>
                      <div className={styles.divisionIconOmnimart}>
                        <BuildingRetail24Regular className={styles.icon26} />
                      </div>
                      <div>
                        <div className={styles.divisionTitle}>
                          Omnimart Supermarket
                        </div>
                        <div className={styles.divisionSubtitle}>
                          Retail goods, SKU barcodes, racks &amp; scale units
                        </div>
                      </div>
                    </div>
                    <span className={styles.divisionTagOmnimart}>
                      RETAIL &amp; MART
                    </span>
                  </div>

                  <div className={styles.divisionStatBox}>
                    <div>
                      <div className={styles.divisionStatHead}>Products</div>
                      <div className={styles.divisionStatNum}>
                        {omnimartProducts.length}
                      </div>
                    </div>
                    <div>
                      <div className={styles.divisionStatHead}>Categories</div>
                      <div className={styles.divisionStatNum}>
                        {categories.filter(c => c.module === 'minimart').length}
                      </div>
                    </div>
                    <div>
                      <div className={styles.divisionStatHead}>Total Stock</div>
                      <div className={styles.divisionStatNumBlue}>
                        {omnimartProducts.reduce((sum, p) => sum + (p.openingStock || 0), 0)} units
                      </div>
                    </div>
                  </div>

                  <div className={styles.divisionBtnRow}>
                    <Button
                      appearance="primary"
                      className={styles.btnOmnimartHero}
                      onClick={() => navigate('/catalog/omnimart')}
                    >
                      Open Omnimart Catalog →
                    </Button>
                    <Button
                      appearance="outline"
                      className={styles.btnOutlineRounded}
                      onClick={() => navigate('/catalog/new?module=minimart')}
                    >
                      + Add Retail Item
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. Critical Stock Attention Radar */}
          {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
            <div className={styles.radarCard}>
              <div className={styles.radarHeader}>
                <div className={styles.radarTitleWrap}>
                  <Warning20Regular className={styles.radarIcon} />
                  <span className={styles.radarTitle}>
                    Critical Stock Attention Radar
                  </span>
                  <span className={styles.radarBadge}>
                    {outOfStockProducts.length + lowStockProducts.length} Items Require Action
                  </span>
                </div>
                <Button
                  size="small"
                  appearance="subtle"
                  className={styles.radarActionBtn}
                  onClick={() => navigate('/inventory')}
                >
                  Go to Inventory Manager →
                </Button>
              </div>

              <div className={styles.radarGrid}>
                {[...outOfStockProducts, ...lowStockProducts].slice(0, 4).map((p) => (
                  <div key={p.id} className={styles.radarItemCard}>
                    <div className={styles.radarItemLeft}>
                      <div className={styles.radarItemName}>
                        {p.name}
                      </div>
                      <div className={styles.radarItemMeta}>
                        {p.module === 'fastfood' ? 'Fast Food' : 'Omnimart'} • {p.category}
                      </div>
                    </div>

                    <div className={styles.radarItemRight}>
                      <Badge
                        appearance="filled"
                        color={(p.openingStock || 0) <= 0 ? 'danger' : 'warning'}
                        className={styles.radarItemBadge}
                      >
                        {p.openingStock ?? 0} {p.unit || 'PCS'}
                      </Badge>
                      <Button
                        size="small"
                        appearance="subtle"
                        icon={<Edit20Regular />}
                        onClick={() => handleOpenEditProduct(p)}
                        title="Restock / Edit"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Live Visual Catalog Cards Showcase (6:4 Proportions) */}
          <div>
            <div className={styles.liveHeader}>
              <div className={styles.liveTitleWrap}>
                <span className={styles.liveTitle}>
                  Live Store Catalog Visuals
                </span>
                <span className={styles.liveSubtitle}>
                  Showing {filteredProducts.length} Items (6:4 Live POS Cards)
                </span>
              </div>

              <div className={styles.liveSearchWrap}>
                <CustomInput
                  label="Instant SKU / Search"
                  placeholder="Search products..."
                  icon={<Search20Regular />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={searchTerm ? () => setSearchTerm('') : undefined}
                />
              </div>
            </div>

            <div className={styles.liveCardGrid}>
              {filteredProducts.slice(0, 12).map((p) => {
                const img = p.imageBase64 || p.imageUrl;
                return (
                  <div key={p.id} className={styles.liveCard}>
                    {/* 6 Parts Image (126px) */}
                    <div className={styles.liveCardImgWrap}>
                      {img ? (
                        <img
                          src={img}
                          alt={p.name}
                          className={styles.cardImg}
                        />
                      ) : (
                        <div className={styles.noPhotoPlaceholder}>
                          {p.module === 'fastfood' ? <Food24Regular className={styles.icon28} /> : <BuildingRetail24Regular className={styles.icon28} />}
                          <span className={styles.noPhotoText}>No photo</span>
                        </div>
                      )}

                      {/* Stock Badge Overlay */}
                      <div
                        className={mergeClasses(
                          styles.cardStockBadge,
                          (p.openingStock || 0) <= 0 ? styles.cardStockBadgeAlert : styles.cardStockBadgeNormal
                        )}
                      >
                        {p.openingStock ?? 0} {p.unit || 'PCS'}
                      </div>

                      {/* Quick Edit Overlay Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(p)}
                        className={styles.cardEditBtn}
                        title="Edit Product"
                      >
                        <Edit20Regular className={styles.icon14} />
                      </button>
                    </div>

                    {/* 4 Parts Details (84px) */}
                    <div className={styles.liveCardContent}>
                      <div>
                        <div className={styles.cardProdName}>
                          {p.name}
                        </div>
                        {p.hasVariants && p.variants && p.variants.length > 0 ? (
                          <div className={styles.cardVariantRow}>
                            {p.variants.slice(0, 3).map((v) => (
                              <span key={v.id} className={styles.cardVariantTag}>
                                {v.label}
                              </span>
                            ))}
                            {p.variants.length > 3 && (
                              <span className={styles.cardVariantMore}>
                                +{p.variants.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className={styles.cardCatSubtitle}>
                            {p.category} • {p.module === 'fastfood' ? 'Fast Food' : 'Omnimart'}
                          </div>
                        )}
                      </div>

                      <div className={styles.cardBottomRow}>
                        <div className={styles.cardPrice}>
                          {formatPKR(p.price)}
                        </div>
                        <div className={styles.cardSku}>
                          {p.skuCode ? p.skuCode.slice(0, 10) : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Module Data Table View (for Fast Food, Omnimart, or user toggled) */
        <div className={styles.tableCard}>
          {/* Filter & Search Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchRow}>
              <div className={styles.searchCol300}>
                <CustomInput
                  label="Search Products"
                  placeholder="Name, SKU, or category..."
                  icon={<Search20Regular />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={searchTerm ? () => setSearchTerm('') : undefined}
                />
              </div>

              <div className={styles.filterCol200}>
                <CustomSelect
                  label="Category Filter"
                  value={selectedCategory}
                  options={[
                    { value: 'ALL', label: 'All Categories' },
                    ...categories
                      .filter((c) => (activeTab === 'fastfood' ? c.module === 'fastfood' : activeTab === 'minimart' ? c.module === 'minimart' : true))
                      .map((c) => ({ value: c.name, label: c.name })),
                  ]}
                  onChange={(val) => setSelectedCategory(val)}
                />
              </div>
            </div>

            <Caption1 className={styles.tableCaption}>
              Showing {filteredProducts.length} items
            </Caption1>
          </div>

          {/* Fluent Table with responsive wrapper and high-end styling */}
          <div className={styles.tableOverflow}>
            <Table className={styles.dataTable}>
              <TableHeader>
                <TableRow className={styles.tableTheadTr}>
                  <TableHeaderCell className={styles.thDetails}>
                    Product Details
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thCategory}>
                    Category &amp; Type
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thPrice}>
                    Retail Price
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thCost}>
                    Purchase Cost
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thStock}>
                    Current Stock
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thSku}>
                    SKU / Rack
                  </TableHeaderCell>
                  <TableHeaderCell className={styles.thActions}>
                    Actions
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className={styles.emptyTd}>
                      No products found matching the criteria. Click "+ Add New Product" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = p.openingStock !== null && p.openingStock !== undefined && p.openingStock <= (p.minThreshold ?? 10);
                    const isFastFood = p.module === 'fastfood';

                    return (
                      <TableRow key={p.id} className={styles.tbodyTr}>
                        <TableCell className={styles.tdDetails}>
                          <div className={styles.prodDetailsRow}>
                            <div className={styles.prodThumbnailWrap}>
                              {p.imageBase64 || p.imageUrl ? (
                                <img src={p.imageBase64 || p.imageUrl} alt={p.name} className={styles.cardImg} />
                              ) : isFastFood ? (
                                <Food24Regular className={styles.catSub} />
                              ) : (
                                <BuildingRetail24Regular className={styles.catSub} />
                              )}
                            </div>
                            <div className={styles.prodTextCol}>
                              <Body1 className={styles.prodTitle}>{p.name}</Body1>
                              {p.description && (
                                <Caption1 className={styles.prodDesc}>
                                  {p.description}
                                </Caption1>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <div className={styles.badgeRow}>
                            <Badge size="medium" appearance="tint" color={isFastFood ? 'warning' : 'informative'}>
                              {p.category}
                            </Badge>
                            <Caption1 className={styles.catSub}>
                              ({isFastFood ? 'Food' : 'Retail'})
                            </Caption1>
                          </div>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <Body1 className={styles.prodTitle}>
                            {formatPKR(p.price)}
                          </Body1>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <Caption1 className={styles.costCaption}>
                            {p.costPrice ? formatPKR(p.costPrice) : '—'}
                          </Caption1>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <Badge
                            size="medium"
                            appearance="filled"
                            color={isLow ? 'danger' : 'success'}
                            className={styles.stockBadge}
                          >
                            {p.openingStock ?? 0} {p.unit || 'PCS'}
                          </Badge>
                        </TableCell>

                        <TableCell className={styles.tdCell}>
                          <div className={styles.skuCol}>
                            <Caption1 className={styles.skuCode}>{p.skuCode || '—'}</Caption1>
                            {p.rackLocation && (
                              <Caption1 className={styles.rackText}>Rack: {p.rackLocation}</Caption1>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className={styles.tdActions}>
                          <div className={styles.actionsRow}>
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Edit20Regular />}
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit Product"
                            />
                            <Button
                              size="small"
                              appearance="subtle"
                              icon={<Delete20Regular className={styles.deleteIcon} />}
                              onClick={() => deleteProductMutation.mutate(p.id)}
                              title="Delete Product"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Product Dialog: Executive 2-Column Studio Layout ── */}
      <Dialog open={isProductDialogOpen} onOpenChange={(_, d) => setIsProductDialogOpen(d.open)}>
        <DialogSurface className={styles.productDialogSurface}>
          <form onSubmit={productForm.handleSubmit(onProductSubmit)} className={styles.modalForm}>
            <DialogBody className={styles.modalBody}>
              
              {/* Modal Header */}
              <div className={styles.modalHeader}>
                <DialogTitle className={styles.dialogTitle}>
                  {editingProduct ? 'Edit Product Item' : 'Add New Product to Catalog'}
                </DialogTitle>
                <div className={styles.dialogSub}>
                  {editingProduct ? 'Update product pricing, inventory thresholds, and media' : 'Create a new product for Fast Food menu or Omnimart supermarket'}
                </div>
              </div>

              {/* 2-Column Responsive Body */}
              <DialogContent
                className={`${styles.productDialogContent} ${styles.dialogContentGrid} no-scrollbar`}
              >
                {/* ── Left Column: Primary Product & Stock Form Details ── */}
                <div className={styles.formColLeft}>
                  
                  {/* Module & Category Row */}
                  <div className={styles.formGrid2Col}>
                    <div className={styles.formBottomAlign}>
                      <Controller
                        control={productForm.control}
                        name="module"
                        render={({ field }) => (
                          <CustomSelect
                            label="Target Module"
                            required
                            value={field.value}
                            options={[
                              ...(hasFastFood ? [{ value: 'fastfood', label: 'Fast Food Menu' }] : []),
                              ...(hasOmnimart ? [{ value: 'minimart', label: 'Omnimart Goods' }] : []),
                            ]}
                            onChange={(val) => {
                              field.onChange(val as ModuleKey);
                              const firstCat = categories.find((c) => c.module === val)?.name || 'General';
                              productForm.setValue('category', firstCat);
                            }}
                          />
                        )}
                      />
                    </div>

                    <div className={styles.formBottomAlign}>
                      <div className={styles.categoryHeaderRow}>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            categoryForm.reset({ name: '', module: watchedModule });
                            setIsCategoryDialogOpen(true);
                          }}
                          className={styles.newCategoryLink}
                        >
                          + New Category
                        </span>
                      </div>
                      <Controller
                        control={productForm.control}
                        name="category"
                        render={({ field }) => {
                          const activeGroupCats = categories.filter(
                            (c) => c.module === watchedModule && (c.module === 'fastfood' ? hasFastFood : hasOmnimart),
                          );
                          const otherGroupCats = categories.filter(
                            (c) => c.module !== watchedModule && (c.module === 'fastfood' ? hasFastFood : hasOmnimart),
                          );
                          const displayList = [...activeGroupCats, ...otherGroupCats];

                          return (
                            <CustomSelect
                              label="Category"
                              required
                              placeholder="Select Category"
                              value={field.value}
                              options={displayList.map((c) => ({ value: c.name, label: c.name }))}
                              onChange={(val) => field.onChange(val)}
                              error={productForm.formState.errors.category?.message}
                            />
                          );
                        }}
                      />
                    </div>
                  </div>

                  {/* Product Name */}
                  <div>
                    <Controller
                      control={productForm.control}
                      name="name"
                      render={({ field }) => (
                        <CustomInput
                          label="Item / Product Name"
                          required
                          placeholder="e.g. Crispy Zinger Burger, Super Basmati Rice, or Fresh Milk"
                          value={field.value || ''}
                          onChange={field.onChange}
                          error={productForm.formState.errors.name?.message}
                        />
                      )}
                    />
                  </div>

                  {/* Retail Price & Purchase Cost */}
                  <div className={styles.formGrid2Col}>
                    <div>
                      <Controller
                        control={productForm.control}
                        name="price"
                        render={({ field }) => (
                          <CustomInput
                            label="Retail Selling Price (PKR)"
                            required
                            type="number"
                            placeholder="e.g. 550"
                            value={field.value !== undefined ? String(field.value) : ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                            error={productForm.formState.errors.price?.message}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Controller
                        control={productForm.control}
                        name="costPrice"
                        render={({ field }) => (
                          <CustomInput
                            label="Purchase Cost Price (PKR)"
                            type="number"
                            placeholder="e.g. 320"
                            value={field.value !== undefined ? String(field.value) : ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Unit of Measure & Opening Stock */}
                  <div className={styles.formGrid2Col}>
                    <div>
                      <Controller
                        control={productForm.control}
                        name="unit"
                        render={({ field }) => (
                          <CustomSelect
                            label="Unit of Measure"
                            required
                            value={field.value || 'PCS'}
                            options={UNIT_OPTIONS}
                            onChange={(val) => field.onChange(val)}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Controller
                        control={productForm.control}
                        name="openingStock"
                        render={({ field }) => (
                          <CustomInput
                            label="Opening Stock"
                            type="number"
                            placeholder="50"
                            value={field.value !== undefined ? String(field.value) : ''}
                            onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                            error={productForm.formState.errors.openingStock?.message}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* SKU & Rack Location */}
                  <div className={styles.formGrid2Col}>
                    <div>
                      <Controller
                        control={productForm.control}
                        name="skuCode"
                        render={({ field }) => (
                          <CustomInput
                            label="SKU / Barcode"
                            placeholder="Auto-generated"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div>
                      <Controller
                        control={productForm.control}
                        name="rackLocation"
                        render={({ field }) => (
                          <CustomInput
                            label="Rack / Shelf Location"
                            placeholder="e.g. Aisle 1 or Chiller-01"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Description / Notes */}
                  <div>
                    <Controller
                      control={productForm.control}
                      name="description"
                      render={({ field }) => (
                        <CustomInput
                          label="Description / Notes (Optional)"
                          placeholder="e.g. Fresh farm product, premium quality"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* ── Right Column: Visual Media & Live Interactive POS Card Preview (Compact 280px) ── */}
                <div className={styles.formColRight}>
                  
                  {/* Photo Upload Card */}
                  <div className={styles.uploadCard}>
                    <Label className={styles.uploadLabel}>
                      Product Media &amp; Photo
                    </Label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleLocalImageSelect}
                      className={styles.hiddenInput}
                    />

                    {imagePreview ? (
                      <div className={styles.attachedRow}>
                        <div className={styles.attachedThumb}>
                          <img
                            src={imagePreview}
                            alt="Product Preview"
                            className={styles.cardImg}
                          />
                        </div>

                        <div className={styles.attachedInfo}>
                          <span className={styles.attachedTitle}>
                            Photo Attached
                          </span>
                          <span className={styles.attachedPath}>
                            {imagePreview.startsWith('data:') ? 'Local file' : imagePreview}
                          </span>
                        </div>

                        <div className={styles.attachedActions}>
                          <Button
                            size="small"
                            appearance="outline"
                            className={styles.changeBtn}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Change
                          </Button>
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Dismiss16Regular className={styles.deleteIcon} />}
                            onClick={handleRemoveImage}
                            title="Remove image"
                          />
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={styles.dropzone}
                      >
                        <ArrowUpload20Regular className={styles.uploadIcon} />
                        <span className={styles.uploadTitle}>
                          Upload Photo from PC
                        </span>
                        <span className={styles.uploadSub}>
                          PNG, JPG, WebP
                        </span>
                      </div>
                    )}

                    {/* Optional URL input fallback */}
                    <div className={styles.urlWrap}>
                      <Controller
                        control={productForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <CustomInput
                            label="Image Web URL (Optional)"
                            placeholder="Or paste an image web link..."
                            value={field.value && !field.value.startsWith('data:') ? field.value : ''}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setImagePreview(e.target.value || null);
                            }}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* ── Live POS Counter Card Preview ── */}
                  <div className={styles.previewCard}>
                    <div className={styles.previewHeader}>
                      <span className={styles.previewHeadTitle}>
                        Live POS Card Preview
                      </span>
                      <span className={styles.previewHeadSub}>
                        {watchedModule === 'minimart' ? 'Supermarket' : 'Fast Food'}
                      </span>
                    </div>

                    {/* POS Card Mockup */}
                    <div className={styles.posMockup}>
                      {/* Media container: 60% of card (6 hissay: 114px) */}
                      <div className={styles.mockupMedia}>
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Live Preview"
                            className={styles.cardImg}
                          />
                        ) : (
                          <div className={styles.noPhotoMockup}>
                            <Image20Regular className={styles.icon28} />
                            <span className={styles.noPhotoText}>No photo selected</span>
                          </div>
                        )}
                        <div className={styles.mockupCatBadge}>
                          {watchedCategory || 'Category'}
                        </div>
                        <div className={styles.mockupStockBadge}>
                          {watchedStock ?? 50} {watchedUnit || 'PCS'}
                        </div>
                      </div>

                      {/* Card Content: 40% of card (4 hissay: 76px) */}
                      <div className={styles.mockupContent}>
                        <div className={styles.mockupName}>
                          {watchedName || 'Item Name Preview'}
                        </div>

                        <div className={styles.mockupBottom}>
                          <div>
                            <div className={styles.mockupPriceLabel}>
                              Price
                            </div>
                            <div className={styles.mockupPriceVal}>
                              PKR {watchedPrice ? Number(watchedPrice).toLocaleString() : '0'}
                            </div>
                          </div>

                          <span className={styles.mockupUnitTag}>
                            per {watchedUnit || 'PCS'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>

              {/* Modal Footer Actions - Pinned at Bottom, Never Cut Off */}
              <div className={styles.dialogFooterActions}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsProductDialogOpen(false)}
                  className={styles.dialogCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={saveProductMutation.isPending}
                  className={styles.dialogSubmitBtn}
                >
                  {saveProductMutation.isPending ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </Button>
              </div>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ── Add Category Dialog with Labels & Zod + React Hook Form ── */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(_, d) => setIsCategoryDialogOpen(d.open)}>
        <DialogSurface className={styles.catDialogSurface}>
          <form
            onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
            className={styles.catForm}
          >
            {/* Modal Header */}
            <div className={styles.catHeader}>
              <div className={styles.catHeaderLeft}>
                <div className={styles.catIconWrap}>
                  <Tag20Regular className={styles.icon20} />
                </div>
                <div>
                  <div className={styles.catTitle}>
                    Create New Category
                  </div>
                  <div className={styles.catDialogSub}>
                    Add quick classification to catalog
                  </div>
                </div>
              </div>

              <Button
                size="small"
                appearance="subtle"
                icon={<Dismiss16Regular />}
                onClick={() => setIsCategoryDialogOpen(false)}
                type="button"
              />
            </div>

            {/* Form Fields */}
            <div className={styles.catFieldsCol}>

              <Controller
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <CustomInput
                    label="Category Name"
                    required
                    placeholder="e.g. Desserts, Beverages, Lubricants"
                    value={field.value}
                    onChange={field.onChange}
                    error={categoryForm.formState.errors.name?.message}
                  />
                )}
              />

              <Controller
                control={categoryForm.control}
                name="module"
                render={({ field }) => (
                  <CustomSelect
                    label="Assign to Module"
                    required
                    value={field.value}
                    options={[
                      ...(hasFastFood ? [{ value: 'fastfood', label: 'Fast Food Menu' }] : []),
                      ...(hasOmnimart ? [{ value: 'minimart', label: 'Omnimart Goods' }] : []),
                    ]}
                    onChange={(val) => field.onChange(val as ModuleKey)}
                  />
                )}
              />
            </div>

            {/* Actions */}
            <div className={styles.catFooter}>
              <Button
                appearance="subtle"
                type="button"
                onClick={() => setIsCategoryDialogOpen(false)}
                className={styles.catCancelBtn}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={saveCategoryMutation.isPending}
                className={styles.catSubmitBtn}
              >
                {saveCategoryMutation.isPending ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
