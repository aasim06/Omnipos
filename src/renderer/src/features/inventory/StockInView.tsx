import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Subtitle1,
  Subtitle2,
  Body1,
  Caption1,
  Badge,
  Button,
  Select,
  Checkbox,
  Label,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Search20Regular,
  Delete20Regular,
  Edit20Regular,
  Print20Regular,
  Dismiss20Regular,
  Receipt20Regular,
  Checkmark20Regular,
  Food24Regular,
  ShoppingBag24Regular,
  Box20Regular,
  Folder20Regular,
  Tag20Regular,
  Location20Regular,
  Ruler20Regular,
  Warning20Regular,
  ArrowSync20Regular,
  Flash20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl, posApi } from '@/lib/api';
import { StockMovement, Product, Category, ProductVariant } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { vendorStorage } from './vendorStorage';
import { CustomInput, CustomSelect } from '@/components/ui';
import { useLicense } from '@/features/auth/LicenseModulesContext';

const stockInSchema = z.object({
  module: z.enum(['fastfood', 'minimart']).default('minimart'),
  selectedProductId: z.string().optional(),
  productName: z.string().min(1, 'Please select or enter an item name'),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Qty must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  discountPercent: z.coerce.number().min(0, 'Discount cannot be negative').max(100, 'Discount cannot exceed 100%').optional(),
});

type StockInFormData = z.infer<typeof stockInSchema>;

const editSchema = z.object({
  id: z.string(),
  productName: z.string().min(1, 'Product name is required'),
  vendorName: z.string().optional(),
  quantity: z.coerce.number().min(1, 'Qty must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  note: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  card: {
    padding: '20px 24px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
    letterSpacing: '-0.2px',
  },
  row1: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1.8fr',
    gap: '16px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '2px 7px',
    borderRadius: '4px',
    width: 'fit-content',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  productDetailCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  productDetailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  productDetailLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productThumb: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  productDetailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  detailStatBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailStatLabel: {
    fontSize: '10.5px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
    letterSpacing: '0.4px',
  },
  detailStatVal: {
    fontSize: '14px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1.2fr 1.6fr',
    gap: '14px',
    alignItems: 'flex-end',
    '@media (max-width: 1024px)': {
      gridTemplateColumns: '1fr 1fr',
    },
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    color: tokens.colorNeutralForeground2,
    marginBottom: '6px',
    display: 'block',
  },
  lineTotalBox: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: 'rgba(16, 124, 65, 0.12)',
    border: '1.5px solid rgba(16, 124, 65, 0.35)',
    boxSizing: 'border-box',
  },
  lineTotalValue: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#107C41',
  },
  saveBtn: {
    height: '36px',
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 700,
    fontSize: '13px',
    border: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.35)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
    borderRadius: tokens.borderRadiusSmall,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '12px',
  },
  th: {
    padding: '12px 14px',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px 14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground1,
    fontSize: '12.5px',
    verticalAlign: 'middle',
  },
  tableRow: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },

  /* Right-Side Slide-Over Drawer */
  drawerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(3px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  drawerPanel: {
    width: '460px',
    maxWidth: '92vw',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeftWidth: '1px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow64,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    animationName: {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' },
    },
    animationDuration: '0.2s',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  drawerHeader: {
    padding: '20px 24px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  drawerBody: {
    padding: '24px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  drawerFooter: {
    padding: '16px 24px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    backgroundColor: tokens.colorNeutralBackground3,
  },

  /* Print Voucher Slip */
  voucherSlip: {
    padding: '24px',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    borderRadius: '8px',
    fontFamily: 'monospace',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  productImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  productEmoji: {
    fontSize: '20px',
  },
  productTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  productName: {
    fontSize: '15px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  productMetaRow: {
    fontSize: '11.5px',
    color: tokens.colorNeutralForeground3,
    display: 'flex',
    gap: '10px',
    marginTop: '3px',
    flexWrap: 'wrap',
  },
  skuCode: {
    color: tokens.colorNeutralForeground1,
    fontWeight: 700,
  },
  productActionWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  detailStatValLow: {
    color: '#E51937',
  },
  detailStatValBlue: {
    color: '#0F6CBD',
  },
  detailStatValGreen: {
    color: '#107C41',
  },
  detailStatSubtext: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 500,
  },
  variantsWrap: {
    paddingTop: '10px',
    borderTopWidth: '1px',
    borderTopStyle: 'dashed',
    borderTopColor: tokens.colorNeutralStroke2,
  },
  variantsHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px',
  },
  variantsTitle: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  variantHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  variantActionBtn: {
    padding: '3px 9px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '4px',
    backgroundColor: 'rgba(229, 25, 55, 0.08)',
    color: '#E51937',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.25)', borderBottomColor: 'rgba(229, 25, 55, 0.25)',
    borderLeftColor: 'rgba(229, 25, 55, 0.25)', borderRightColor: 'rgba(229, 25, 55, 0.25)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: 'rgba(229, 25, 55, 0.16)',
    },
  },
  variantActionBtnSubtle: {
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 500,
    borderRadius: '4px',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    border: 'none',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground4,
    },
  },
  variantsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  variantCard: {
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '150px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    transition: 'all 0.15s ease',
  },
  variantCardActive: {
    borderTopColor: '#E51937', borderBottomColor: '#E51937',
    borderLeftColor: '#E51937', borderRightColor: '#E51937',
    backgroundColor: '#FFF5F5',
  },
  variantCardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  variantLabelBadge: {
    fontWeight: 800,
    fontSize: '13px',
    color: '#E51937',
  },
  variantCardMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    gap: '8px',
  },
  variantMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  stockValZero: {
    color: '#DC2626',
    fontWeight: 700,
  },
  stockValNormal: {
    color: '#15803D',
    fontWeight: 700,
  },
  variantInputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    marginTop: '2px',
  },
  variantInputPlus: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#E51937',
  },
  variantNumberInput: {
    width: '64px',
    height: '28px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '13px',
    borderRadius: '4px',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    outline: 'none',
    ':focus': {
      borderTopColor: '#E51937', borderBottomColor: '#E51937',
      borderLeftColor: '#E51937', borderRightColor: '#E51937',
    },
  },
  variantUnitBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
  },
  variantProjected: {
    fontSize: '10.5px',
    color: '#15803D',
    fontWeight: 600,
    textAlign: 'right',
  },
  variantSkuBadge: {
    fontFamily: 'monospace',
    fontSize: '10px',
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '1px 4px',
    borderRadius: '3px',
  },
  emptyCategoryNotice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#FFFBEB',
    borderRadius: '8px',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#FDE68A', borderBottomColor: '#FDE68A',
    borderLeftColor: '#FDE68A', borderRightColor: '#FDE68A',
    marginTop: '6px',
    marginBottom: '6px',
  },
  emptyCategoryNoticeLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  emptyCategoryNoticeTitle: {
    fontWeight: 700,
    fontSize: '13px',
    color: '#92400e',
  },
  emptyCategoryNoticeSub: {
    fontSize: '12px',
    color: '#b45309',
    marginTop: '2px',
  },
  percentSuffix: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 700,
    paddingRight: '4px',
  },
  discountPill: {
    fontSize: '11px',
    color: '#107C41',
    marginLeft: '6px',
    fontWeight: 600,
  },
  btnIcon18: {
    width: '18px',
    height: '18px',
  },
  btnIcon16: {
    width: '16px',
    height: '16px',
  },
  searchWrap: {
    minWidth: '280px',
    maxWidth: '420px',
    width: '100%',
  },
  countCaption: {
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
  },
  thCenter: {
    textAlign: 'center',
  },
  thRight: {
    textAlign: 'right',
  },
  thCheckbox: {
    width: '36px',
    textAlign: 'center',
  },
  thActions: {
    textAlign: 'center',
    minWidth: '100px',
  },
  tdCenter: {
    textAlign: 'center',
  },
  tdRight: {
    textAlign: 'right',
    fontWeight: 600,
  },
  tdRightGreen: {
    textAlign: 'right',
    fontWeight: 700,
    color: '#107C41',
  },
  emptyTd: {
    padding: '36px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  logProdName: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  badgeBold: {
    fontWeight: 700,
  },
  reasonText: {
    color: tokens.colorNeutralForeground1,
  },
  dateTimeText: {
    color: tokens.colorNeutralForeground2,
    fontSize: '12px',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  actionBtnPrint: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    padding: 0,
    borderRadius: '6px',
    backgroundColor: 'rgba(0, 120, 212, 0.12)',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(0, 120, 212, 0.25)', borderBottomColor: 'rgba(0, 120, 212, 0.25)',
    borderLeftColor: 'rgba(0, 120, 212, 0.25)', borderRightColor: 'rgba(0, 120, 212, 0.25)',
  },
  actionBtnEdit: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    padding: 0,
    borderRadius: '6px',
    backgroundColor: 'rgba(16, 124, 65, 0.12)',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(16, 124, 65, 0.25)', borderBottomColor: 'rgba(16, 124, 65, 0.25)',
    borderLeftColor: 'rgba(16, 124, 65, 0.25)', borderRightColor: 'rgba(16, 124, 65, 0.25)',
  },
  actionBtnDelete: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    padding: 0,
    borderRadius: '6px',
    backgroundColor: 'rgba(209, 52, 56, 0.12)',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(209, 52, 56, 0.25)', borderBottomColor: 'rgba(209, 52, 56, 0.25)',
    borderLeftColor: 'rgba(209, 52, 56, 0.25)', borderRightColor: 'rgba(209, 52, 56, 0.25)',
  },
  iconPrint: {
    color: '#0078D4',
    width: '16px',
    height: '16px',
  },
  iconEdit: {
    color: '#107C41',
    width: '16px',
    height: '16px',
  },
  iconDelete: {
    color: '#D13438',
    width: '16px',
    height: '16px',
  },
  drawerHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  drawerHeaderBadge: {
    backgroundColor: 'rgba(16, 124, 65, 0.12)',
    color: '#107C41',
    padding: '8px',
    borderRadius: '8px',
    display: 'inline-flex',
  },
  drawerHeaderTitle: {
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  drawerHeaderSub: {
    color: tokens.colorNeutralForeground3,
  },
  iconBtn28: {
    minWidth: '28px',
    width: '28px',
    height: '28px',
    padding: 0,
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  drawerCancelBtn: {
    borderRadius: '8px',
  },
  drawerUpdateBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    borderTopStyle: 'none', borderBottomStyle: 'none',
    borderLeftStyle: 'none', borderRightStyle: 'none',
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },
  printDialogSurface: {
    borderRadius: '14px',
    width: '680px',
    maxWidth: '96vw',
    padding: '24px',
    boxSizing: 'border-box',
  },
  printHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  printModalTitle: {
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    margin: 0,
    fontSize: '18px',
  },
  iconBtn32: {
    minWidth: '32px',
    width: '32px',
    height: '32px',
    padding: 0,
  },
  printSheet: {
    backgroundColor: '#FFFFFF',
    color: '#111827',
    padding: '20px 22px',
    borderRadius: '10px',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  invoiceTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E51937',
    paddingBottom: '12px',
  },
  invoiceBrandWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoBox: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: '15px',
  },
  brandName: {
    fontWeight: 800,
    fontSize: '16px',
    color: '#111827',
    lineHeight: 1.1,
  },
  brandSub: {
    fontSize: '9.5px',
    color: '#64748B',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  invHeaderRight: {
    textAlign: 'right',
  },
  invTitle: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#E51937',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  invMetaText: {
    fontSize: '10.5px',
    color: '#475569',
    marginTop: '2px',
  },
  partiesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  partyCard: {
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
    borderRadius: '8px',
    padding: '10px 14px',
    backgroundColor: '#F8FAFC',
  },
  supplierTag: {
    fontSize: '9.5px',
    fontWeight: 800,
    color: '#E51937',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px',
  },
  storeTag: {
    fontSize: '9.5px',
    fontWeight: 800,
    color: '#15803D',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '4px',
  },
  partyName: {
    fontSize: '13.5px',
    fontWeight: 800,
    color: '#0F172A',
    marginBottom: '3px',
  },
  partyDetail: {
    fontSize: '11px',
    color: '#475569',
    lineHeight: 1.35,
  },
  vendorBalanceTag: {
    marginTop: '8px',
    display: 'inline-block',
    backgroundColor: '#FEF2F2',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#FECACA', borderBottomColor: '#FECACA',
    borderLeftColor: '#FECACA', borderRightColor: '#FECACA',
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#991B1B',
  },
  verifiedTag: {
    marginTop: '8px',
    fontSize: '10.5px',
    color: '#15803D',
    fontWeight: 700,
  },
  slipTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '4px',
  },
  slipTrHeader: {
    backgroundColor: '#F1F5F9',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#CBD5E1',
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#94A3B8',
  },
  slipTh: {
    padding: '7px 10px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#334155',
  },
  slipThNum: {
    padding: '7px 10px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#334155',
    width: '32px',
  },
  slipThLeft: {
    padding: '7px 10px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'left',
    color: '#334155',
  },
  slipThRate: {
    padding: '7px 10px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'right',
    color: '#334155',
    width: '90px',
  },
  slipThQty: {
    padding: '7px 10px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#334155',
    width: '80px',
  },
  slipThDiscount: {
    padding: '7px 10px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'right',
    color: '#334155',
    width: '70px',
  },
  slipThTotal: {
    padding: '7px 10px',
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    textAlign: 'right',
    color: '#334155',
    width: '110px',
  },
  slipTdNum: {
    padding: '8px 10px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E2E8F0',
    fontSize: '11px',
    textAlign: 'center',
    color: '#64748B',
  },
  slipTdDesc: {
    padding: '8px 10px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E2E8F0',
    fontSize: '11.5px',
  },
  slipProdTitle: {
    fontWeight: 700,
    color: '#0F172A',
  },
  slipProdNote: {
    fontSize: '10px',
    color: '#64748B',
    marginTop: '2px',
  },
  slipTdRate: {
    padding: '8px 10px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E2E8F0',
    fontSize: '11.5px',
    textAlign: 'right',
    fontWeight: 600,
  },
  slipTdQty: {
    padding: '8px 10px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E2E8F0',
    fontSize: '11.5px',
    textAlign: 'center',
    fontWeight: 800,
    color: '#15803D',
  },
  slipTdDiscount: {
    padding: '8px 10px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E2E8F0',
    fontSize: '11.5px',
    textAlign: 'right',
    color: '#64748B',
  },
  slipTdTotal: {
    padding: '8px 10px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#E2E8F0',
    fontSize: '11.5px',
    textAlign: 'right',
    fontWeight: 800,
    color: '#0F172A',
  },
  calcWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '4px',
  },
  calcCard: {
    width: '280px',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#E2E8F0', borderBottomColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0', borderRightColor: '#E2E8F0',
    borderRadius: '8px',
    padding: '10px 14px',
    backgroundColor: '#F8FAFC',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    color: '#475569',
    marginBottom: '4px',
  },
  calcGrossVal: {
    fontWeight: 600,
  },
  calcDiscountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    color: '#15803D',
    marginBottom: '4px',
  },
  calcInvoiceTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12.5px',
    fontWeight: 800,
    color: '#0F172A',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#0F172A',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#0F172A',
    padding: '5px 0',
    margin: '5px 0',
  },
  calcInvoiceTotalVal: {
    color: '#E51937',
  },
  calcPrevRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#475569',
    marginBottom: '3px',
  },
  calcAddedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#15803D',
    marginBottom: '4px',
  },
  balanceDueBox: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    fontWeight: 800,
    color: '#991B1B',
    backgroundColor: '#FEF2F2',
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#FECACA', borderBottomColor: '#FECACA',
    borderLeftColor: '#FECACA', borderRightColor: '#FECACA',
    borderRadius: '4px',
    padding: '4px 6px',
    marginTop: '4px',
  },
  signaturesRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '14px',
    paddingTop: '10px',
    borderTopWidth: '1px',
    borderTopStyle: 'dashed',
    borderTopColor: '#CBD5E1',
    fontSize: '10px',
    color: '#64748B',
  },
  signatureBlock: {
    textAlign: 'center',
    width: '130px',
  },
  signatureLine: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#64748B',
    marginBottom: '3px',
  },
  modalActionsBar: {
    marginTop: '18px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCloseBtn: {
    height: '38px',
    padding: '0 20px',
    borderRadius: '8px',
    fontWeight: 600,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    cursor: 'pointer',
  },
  modalPrintBtn: {
    height: '38px',
    padding: '0 22px',
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    fontWeight: 700,
    borderRadius: '8px',
    borderTopStyle: 'none', borderBottomStyle: 'none',
    borderLeftStyle: 'none', borderRightStyle: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.35)',
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },
});

export function StockInView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Right Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingMovement, setPrintingMovement] = useState<StockMovement | null>(null);

  const vendors = vendorStorage.getVendors();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch Stock Movements: Offline-First Cache (<5ms)
  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: () => posApi.fetchStockMovements(),
  });

  // Fetch Products for Live Stock Inspection
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    staleTime: 60000,
  });

  // Fetch Categories for quick category filtering in form & logs table
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => posApi.fetchCategories(),
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableCategoryFilter, setTableCategoryFilter] = useState<string>('all');

  // Count products available in selected category
  const categoryProducts = React.useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') return allProducts;
    return allProducts.filter(
      (p) => (p.category || '').toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [allProducts, selectedCategory]);

  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  // Filter tab for stock inflows (All, Fast Food Raw Materials, Mini Mart Products)
  const [inventoryTab, setInventoryTab] = useState<'all' | 'fastfood' | 'minimart'>(() => {
    if (hasFastFood && !hasOmnimart) return 'fastfood';
    if (!hasFastFood && hasOmnimart) return 'minimart';
    return 'all';
  });

  // Top Card Create Form
  const form = useForm<StockInFormData>({
    resolver: zodResolver(stockInSchema) as any,
    defaultValues: {
      module: hasFastFood && !hasOmnimart ? 'fastfood' : 'minimart',
      selectedProductId: '',
      productName: '',
      vendorId: '',
      vendorName: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
    },
  });

  // Prefill from Navigation State (e.g. from Dashboard or Vendors)
  useEffect(() => {
    const s = location.state as any;
    if (s?.productName) {
      form.setValue('productName', s.productName);
      if (s.productId) form.setValue('selectedProductId', s.productId);
      if (s.costPrice) form.setValue('unitPrice', s.costPrice);
    }
    if (s?.vendorName) {
      form.setValue('vendorName', s.vendorName);
      if (s.vendorId) form.setValue('vendorId', s.vendorId);
    }
  }, [location.state]);

  // Right Drawer Edit Form
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema) as any,
    defaultValues: {
      id: '',
      productName: '',
      vendorName: '',
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      note: '',
    },
  });

  const watchedQty = form.watch('quantity') || 0;
  const watchedPrice = form.watch('unitPrice') || 0;
  const watchedDiscountPercent = form.watch('discountPercent') || 0;
  const watchedProductId = form.watch('selectedProductId');
  const watchedProductName = form.watch('productName');

  const selectedProduct = React.useMemo(() => {
    if (watchedProductId) {
      const byId = allProducts.find((p) => p.id === watchedProductId);
      if (byId) return byId;
    }
    if (watchedProductName?.trim()) {
      const q = watchedProductName.trim().toLowerCase();
      return (
        allProducts.find(
          (p) =>
            p.name.toLowerCase() === q ||
            (p.skuCode && p.skuCode.toLowerCase() === q)
        ) || null
      );
    }
    return null;
  }, [watchedProductId, watchedProductName, allProducts]);

  // Per-size / variant allocation state for stock receiving
  const [variantStockInQty, setVariantStockInQty] = useState<Record<string, number>>({});

  // Reset/re-initialize variant allocations whenever selected product changes
  useEffect(() => {
    if (selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0) {
      const initialMap: Record<string, number> = {};
      selectedProduct.variants.forEach((v) => {
        initialMap[v.id] = 0;
      });
      setVariantStockInQty(initialMap);
    } else {
      setVariantStockInQty({});
    }
  }, [selectedProduct?.id]);

  const handleVariantQtyChange = (variantId: string, qty: number) => {
    setVariantStockInQty((prev) => {
      const next = { ...prev, [variantId]: qty };
      const totalUnits = Object.values(next).reduce((sum, q) => sum + (Number(q) || 0), 0);
      if (totalUnits > 0) {
        form.setValue('quantity', totalUnits, { shouldValidate: true });
      }
      return next;
    });
  };

  const handleDistributeEvenly = () => {
    if (!selectedProduct?.variants || selectedProduct.variants.length === 0) return;
    const total = Number(form.getValues('quantity')) || 0;
    const count = selectedProduct.variants.length;
    if (total <= 0) return;

    const basePerVariant = Math.floor(total / count);
    const remainder = total % count;

    const next: Record<string, number> = {};
    selectedProduct.variants.forEach((v, index) => {
      next[v.id] = basePerVariant + (index < remainder ? 1 : 0);
    });
    setVariantStockInQty(next);
  };

  const handleResetVariantQuantities = () => {
    if (!selectedProduct?.variants) return;
    const next: Record<string, number> = {};
    selectedProduct.variants.forEach((v) => {
      next[v.id] = 0;
    });
    setVariantStockInQty(next);
  };

  const subTotal = watchedQty * watchedPrice;
  const discountAmount = Math.round((subTotal * watchedDiscountPercent) / 100);
  const lineTotal = Math.max(0, subTotal - discountAmount);

  // Edit Drawer calculated line total
  const editWatchedQty = editForm.watch('quantity') || 0;
  const editWatchedPrice = editForm.watch('unitPrice') || 0;
  const editWatchedDiscount = editForm.watch('discountPercent') || 0;
  const editSubTotal = editWatchedQty * editWatchedPrice;
  const editDiscountAmount = Math.round((editSubTotal * editWatchedDiscount) / 100);
  const editLineTotal = Math.max(0, editSubTotal - editDiscountAmount);

  // Mutation to Save Stock In Invoice
  const saveMutation = useMutation({
    mutationFn: async (data: StockInFormData) => {
      const base = await resolveApiUrl();
      const unitCost = data.unitPrice;
      const sub = data.quantity * unitCost;
      const discAmt = Math.round((sub * (data.discountPercent || 0)) / 100);
      const calcTotal = Math.max(0, sub - discAmt);

      // Prepare updated variants array if product has variants
      let updatedVariants: ProductVariant[] | undefined;
      const hasAnyVariantQty = Object.values(variantStockInQty).some((q) => q > 0);

      if (selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0) {
        updatedVariants = selectedProduct.variants.map((v) => {
          const added = hasAnyVariantQty ? (Number(variantStockInQty[v.id]) || 0) : 0;
          return {
            ...v,
            stock: Math.max(0, (Number(v.stock) || 0) + added),
          };
        });
      }

      const variantSummary = updatedVariants && hasAnyVariantQty
        ? updatedVariants
            .filter((v) => (variantStockInQty[v.id] || 0) > 0)
            .map((v) => `${v.label} (+${variantStockInQty[v.id]})`)
            .join(', ')
        : null;

      const noteDetails = [
        data.vendorName ? `Vendor: ${data.vendorName}` : null,
        data.discountPercent && data.discountPercent > 0 ? `Discount: ${data.discountPercent}% (-PKR ${discAmt.toLocaleString()})` : null,
        variantSummary ? `Sizes: ${variantSummary}` : null,
        `Line Total: PKR ${calcTotal.toLocaleString()}`,
      ]
        .filter(Boolean)
        .join(' • ');

      await posApi.saveStockMovement({
        module: data.module || 'minimart',
        type: 'in',
        productId: data.selectedProductId || uid('prod_'),
        productName: data.productName,
        quantity: data.quantity,
        unitCost: unitCost,
        reason: data.vendorName || 'Supplier Purchase',
        referenceInvoice: noteDetails,
        variants: updatedVariants,
      });

      // Update Vendor Payable Balance in real-time
      if (data.vendorName) {
        const vName = data.vendorName.trim().toLowerCase();
        const allVendors = vendorStorage.getVendors();
        const matched = allVendors.find(
          (v) =>
            (v.companyName || v.name).trim().toLowerCase() === vName ||
            (data.vendorId && v.id === data.vendorId)
        );
        if (matched) {
          vendorStorage.saveVendor({
            ...matched,
            openingBalance: (matched.openingBalance || 0) + calcTotal,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      setVariantStockInQty({});
      form.reset({
        module: form.getValues('module') || 'minimart',
        selectedProductId: '',
        productName: '',
        vendorId: '',
        vendorName: '',
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
      });
    },
  });

  // Mutation to Update via Right Drawer
  const updateMutation = useMutation({
    mutationFn: async (data: EditFormData) => {
      const sub = data.quantity * data.unitPrice;
      const discAmt = Math.round((sub * (data.discountPercent || 0)) / 100);
      const calcTotal = Math.max(0, sub - discAmt);

      const noteDetails = [
        data.vendorName ? `Vendor: ${data.vendorName}` : null,
        data.discountPercent && data.discountPercent > 0 ? `Discount: ${data.discountPercent}% (-PKR ${discAmt.toLocaleString()})` : null,
        `Line Total: PKR ${calcTotal.toLocaleString()}`,
        data.note ? data.note : null,
      ]
        .filter(Boolean)
        .join(' • ');

      await posApi.updateStockMovement(data.id, {
        productName: data.productName,
        quantity: data.quantity,
        unitCost: data.unitPrice,
        reason: data.vendorName || 'Supplier Purchase',
        note: noteDetails,
      });

      // Update Vendor Payable Balance difference
      if (data.vendorName) {
        const vName = data.vendorName.trim().toLowerCase();
        const prev = editingMovement;
        const allVendors = vendorStorage.getVendors();
        const matched = allVendors.find(
          (v) => (v.companyName || v.name).trim().toLowerCase() === vName
        );
        if (matched) {
          const prevCost = prev ? (prev.quantity || 0) * (prev.unitCost || 0) : 0;
          const diff = calcTotal - prevCost;
          vendorStorage.saveVendor({
            ...matched,
            openingBalance: Math.max(0, (matched.openingBalance || 0) + diff),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      setIsDrawerOpen(false);
      setEditingMovement(null);
    },
  });

  // Mutation to Delete Stock In Entry
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const target = movements.find((m) => m.id === id);
      await posApi.deleteStockMovement(id);

      // Revert vendor payable balance if linked
      if (target && target.reason && target.reason !== 'Supplier Purchase') {
        const allVendors = vendorStorage.getVendors();
        const matched = allVendors.find(
          (v) => (v.companyName || v.name).trim().toLowerCase() === target.reason?.trim().toLowerCase()
        );
        if (matched) {
          const lineCost = (target.quantity || 0) * (target.unitCost || 0);
          vendorStorage.saveVendor({
            ...matched,
            openingBalance: Math.max(0, (matched.openingBalance || 0) - lineCost),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      setSelectedIds([]);
    },
  });

  const onSave = (data: StockInFormData) => {
    saveMutation.mutate(data);
  };

  const onUpdate = (data: EditFormData) => {
    updateMutation.mutate(data);
  };

  // Open Edit Drawer
  const handleOpenEdit = (mov: StockMovement) => {
    setEditingMovement(mov);
    // Parse discount percent from note if present
    let parsedDiscount = 0;
    if (mov.note) {
      const match = mov.note.match(/Discount:\s*(\d+)%/i);
      if (match && match[1]) parsedDiscount = Number(match[1]);
    }

    editForm.reset({
      id: mov.id,
      productName: mov.productName,
      vendorName: mov.reason || '',
      quantity: mov.quantity,
      unitPrice: mov.unitCost || 0,
      discountPercent: parsedDiscount,
      note: mov.note || '',
    });
    setIsDrawerOpen(true);
  };

  // Open Print Modal
  const handleOpenPrint = (mov: StockMovement) => {
    setPrintingMovement(mov);
    setIsPrintModalOpen(true);
  };

  // Current Vendor & Invoice calculations for printing
  const currentPrintVendor = printingMovement
    ? vendors.find(
        (v) =>
          v.name.toLowerCase() === (printingMovement.reason || '').toLowerCase() ||
          v.companyName?.toLowerCase() === (printingMovement.reason || '').toLowerCase()
      )
    : undefined;

  const printUnitCost = printingMovement?.unitCost || 0;
  const printQty = printingMovement?.quantity || 0;
  const printGrossTotal = printUnitCost * printQty;
  const printDiscountPercent = printingMovement?.note?.includes('%')
    ? parseFloat(printingMovement.note.match(/(\d+(\.\d+)?)%/)?.[1] || '0')
    : 0;
  const printDiscountAmount = (printGrossTotal * printDiscountPercent) / 100;
  const printNetTotal = printGrossTotal - printDiscountAmount;
  const printVendorBalance = currentPrintVendor?.openingBalance || printNetTotal;
  const printPrevBalance = Math.max(0, printVendorBalance - printNetTotal);
  const printDocNo = printingMovement
    ? `PINV-${new Date(printingMovement.date).toISOString().slice(0, 10).replace(/-/g, '')}-${printingMovement.id.slice(-6).toUpperCase()}`
    : '';
  const printDate = printingMovement
    ? new Date(printingMovement.date).toLocaleDateString('en-PK', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const printTime = printingMovement
    ? new Date(printingMovement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const handlePrint = () => {
    if (!printingMovement) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Purchase Receiving Invoice - ${printDocNo}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 14mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            padding: 24px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .inv-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #E51937;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .brand-wrap {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .logo-badge {
            width: 40px;
            height: 40px;
            background: #E51937;
            color: #ffffff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 18px;
            letter-spacing: -0.5px;
          }
          .brand-title {
            font-size: 22px;
            font-weight: 800;
            color: #111827;
            letter-spacing: -0.02em;
            line-height: 1.1;
          }
          .brand-sub {
            font-size: 10.5px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 600;
            margin-top: 2px;
          }
          .inv-meta {
            text-align: right;
          }
          .inv-meta h2 {
            font-size: 17px;
            font-weight: 800;
            color: #E51937;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .inv-meta p {
            font-size: 11px;
            color: #475569;
            margin-top: 3px;
          }
          .parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 18px;
          }
          .party-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            background: #f8fafc;
          }
          .party-card .party-role {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #E51937;
            margin-bottom: 6px;
          }
          .party-card .party-name {
            font-size: 14.5px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 4px;
          }
          .party-card .party-detail {
            font-size: 11px;
            color: #475569;
            line-height: 1.4;
          }
          .vendor-bal-badge {
            margin-top: 8px;
            display: inline-block;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 5px;
            padding: 4px 10px;
            font-size: 11px;
            color: #991b1b;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #f1f5f9;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #94a3b8;
            padding: 8px 12px;
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            color: #334155;
            letter-spacing: 0.4px;
          }
          td {
            padding: 9px 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 11.5px;
            color: #1e293b;
          }
          .calc-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 20px;
          }
          .calc-box {
            width: 320px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
            padding: 12px 16px;
          }
          .calc-line {
            display: flex;
            justify-content: space-between;
            font-size: 11.5px;
            color: #475569;
            margin-bottom: 6px;
          }
          .calc-line.total {
            border-top: 1.5px solid #0f172a;
            border-bottom: 1.5px solid #0f172a;
            padding: 6px 0;
            margin: 6px 0;
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
          }
          .calc-line.vendor-net {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 6px 8px;
            margin-top: 8px;
            font-size: 12px;
            font-weight: 800;
            color: #991b1b;
          }
          .footer-sign {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 30px;
            padding-top: 14px;
            border-top: 1px dashed #cbd5e1;
            page-break-inside: avoid;
          }
          .sign-block {
            text-align: center;
            width: 170px;
          }
          .sign-line {
            border-top: 1px solid #475569;
            margin-bottom: 4px;
          }
          .sign-title {
            font-size: 10px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
          }
          .disclaimer {
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="inv-header">
          <div class="brand-wrap">
            <div class="logo-badge">OP</div>
            <div>
              <div class="brand-title">OmniPos</div>
              <div class="brand-sub">Enterprise POS &amp; Inventory Receiving</div>
            </div>
          </div>
          <div class="inv-meta">
            <h2>PURCHASE RECEIVING INVOICE</h2>
            <p><strong>Invoice No:</strong> ${printDocNo}</p>
            <p><strong>Date &amp; Time:</strong> ${printDate} ${printTime}</p>
          </div>
        </div>

        <!-- Parties Grid -->
        <div class="parties-grid">
          <!-- Vendor / Supplier Details -->
          <div class="party-card">
            <div class="party-role">Supplier / Vendor Details</div>
            <div class="party-name">${currentPrintVendor?.name || printingMovement.reason || 'Vendor / Supplier'}</div>
            <div class="party-detail"><strong>Contact Rep:</strong> ${currentPrintVendor?.contactPerson || 'Authorized Agent'}</div>
            <div class="party-detail"><strong>Phone / Mobile:</strong> ${currentPrintVendor?.phone || 'N/A'}</div>
            <div class="party-detail"><strong>Address:</strong> ${currentPrintVendor?.address || 'Local Wholesale Supply'}</div>
            <div class="vendor-bal-badge">
              Vendor Payable Balance: Rs. ${printVendorBalance.toLocaleString()} PKR
            </div>
          </div>

          <!-- Receiving Store / Warehouse Details -->
          <div class="party-card">
            <div class="party-role">Delivered To / Receiving Facility</div>
            <div class="party-name">OmniPos Central Branch &amp; Store</div>
            <div class="party-detail"><strong>Facility:</strong> Main Inward Logistics Bay #1</div>
            <div class="party-detail"><strong>Received By:</strong> Store Manager (Admin)</div>
            <div class="party-detail"><strong>Account Type:</strong> Commercial Inventory (Trade Credit)</div>
            <div style="margin-top: 8px; font-size: 10.5px; color: #15803d; font-weight: 700;">
              &#10003; Goods Verified &amp; Added to System Stock
            </div>
          </div>
        </div>

        <!-- Itemized Table -->
        <table>
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th style="text-align: left;">Item Description / Food Product</th>
              <th style="width: 100px; text-align: right;">Unit Rate (PKR)</th>
              <th style="width: 80px; text-align: center;">Quantity</th>
              <th style="width: 80px; text-align: right;">Discount</th>
              <th style="width: 110px; text-align: right;">Line Total (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center; color: #64748b;">1</td>
              <td>
                <div style="font-weight: 700; color: #0f172a;">${printingMovement.productName}</div>
                ${printingMovement.note ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">Note: ${printingMovement.note}</div>` : ''}
              </td>
              <td style="text-align: right; font-weight: 600;">${formatPKR(printUnitCost)}</td>
              <td style="text-align: center; font-weight: 800; color: #15803d;">+${printQty} units</td>
              <td style="text-align: right; color: #64748b;">${printDiscountPercent > 0 ? `${printDiscountPercent}%` : '—'}</td>
              <td style="text-align: right; font-weight: 800; color: #0f172a;">${formatPKR(printNetTotal)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Calculation & Vendor Balance Reconciliation Box -->
        <div class="calc-row">
          <div class="calc-box">
            <div class="calc-line">
              <span>Gross Total:</span>
              <span style="font-weight: 600;">${formatPKR(printGrossTotal)}</span>
            </div>
            ${printDiscountAmount > 0 ? `
              <div class="calc-line">
                <span>Discount (${printDiscountPercent}%):</span>
                <span style="color: #15803d;">- ${formatPKR(printDiscountAmount)}</span>
              </div>
            ` : ''}
            <div class="calc-line total">
              <span>This Invoice Total:</span>
              <span style="color: #E51937;">${formatPKR(printNetTotal)}</span>
            </div>
            <div class="calc-line" style="margin-top: 6px;">
              <span>Previous Vendor Balance:</span>
              <span>${formatPKR(printPrevBalance)}</span>
            </div>
            <div class="calc-line">
              <span>This Bill Added:</span>
              <span style="color: #15803d;">+ ${formatPKR(printNetTotal)}</span>
            </div>
            <div class="calc-line vendor-net">
              <span>Total Balance Due:</span>
              <span>${formatPKR(printVendorBalance)}</span>
            </div>
          </div>
        </div>

        <!-- Formal Signatures -->
        <div class="footer-sign">
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Vendor / Delivery Person</div>
          </div>
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Received By (Store Incharge)</div>
          </div>
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-title">Authorized Store Seal</div>
          </div>
        </div>

        <div class="disclaimer">
          OmniPos Enterprise Cloud &amp; Local Node Sync · Computer-generated Purchase Receiving Invoice · Valid for Accounts Settlement
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    // Dedicated invisible iframe
    let printFrame = document.getElementById('stock-in-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'stock-in-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();
    } else {
      const printWindow = window.open('', '_blank', 'width=950,height=800');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this stock in shipment record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected stock in records?`)) {
      for (const id of selectedIds) {
        await deleteMutation.mutateAsync(id);
      }
      setSelectedIds([]);
    }
  };

  // Only Inflow Movements (filtered by licensed modules)
  const stockInMovements = movements.filter((m) => {
    if (m.type !== 'in') return false;
    if (!hasFastFood && m.module === 'fastfood') return false;
    if (!hasOmnimart && m.module !== 'fastfood') return false;
    return true;
  });

  // Filtered List by Tab, Search Query and Category Filter
  const filteredMovements = stockInMovements.filter((m) => {
    if (inventoryTab === 'fastfood' && m.module !== 'fastfood') return false;
    if (inventoryTab === 'minimart' && m.module === 'fastfood') return false;

    const matchedProd = allProducts.find((p) => p.id === m.productId || p.name.toLowerCase() === m.productName.toLowerCase());
    if (tableCategoryFilter !== 'all') {
      if ((matchedProd?.category || '').toLowerCase() !== tableCategoryFilter.toLowerCase()) {
        return false;
      }
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.productName.toLowerCase().includes(q) ||
      (m.reason && m.reason.toLowerCase().includes(q)) ||
      (m.note && m.note.toLowerCase().includes(q)) ||
      (matchedProd?.category && matchedProd.category.toLowerCase().includes(q))
    );
  });

  const isAllSelected = filteredMovements.length > 0 && selectedIds.length === filteredMovements.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMovements.map((m) => m.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  if (isLoading && movements.length === 0) {
    return <TablePageSkeleton title="Stock In" hasMetrics={false} />;
  }

  return (
    <div className={styles.container}>
      {/* ── CARD 1: Record Stock In (Receiving Invoice) ── */}
      <div className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span className={styles.cardTitle}>Record Stock In (Receiving Invoice)</span>

          {/* Department / Branch Switcher for Stock In */}
          {hasFastFood && hasOmnimart ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Destination:
              </span>
              <div style={{ display: 'inline-flex', backgroundColor: tokens.colorNeutralBackground3, padding: '3px', borderRadius: '8px', gap: '3px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                <button
                  type="button"
                  onClick={() => form.setValue('module', 'fastfood')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: form.watch('module') === 'fastfood' ? '#E51937' : 'transparent',
                    color: form.watch('module') === 'fastfood' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                    fontWeight: form.watch('module') === 'fastfood' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <Food24Regular style={{ width: 14, height: 14 }} />
                  <span>Kitchen & Fast Food</span>
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('module', 'minimart')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: form.watch('module') !== 'fastfood' ? '#E51937' : 'transparent',
                    color: form.watch('module') !== 'fastfood' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                    fontWeight: form.watch('module') !== 'fastfood' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <ShoppingBag24Regular style={{ width: 14, height: 14 }} />
                  <span>Retail Mini Mart</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Destination:
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: tokens.colorNeutralForeground1, padding: '4px 10px', borderRadius: '6px', backgroundColor: tokens.colorNeutralBackground3, border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                {hasFastFood ? <Food24Regular style={{ width: 14, height: 14, color: '#E51937' }} /> : <ShoppingBag24Regular style={{ width: 14, height: 14, color: '#2563EB' }} />}
                <span>{hasFastFood ? 'Kitchen & Fast Food' : 'Retail Mini Mart'}</span>
              </span>
            </div>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSave)} className={styles.form}>
          {/* Row 1: Vendor, Category & Product Select */}
          <div className={styles.row1}>
            <div>
              <Controller
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <CustomSelect
                    label="SELECT VENDOR / SUPPLIER"
                    placeholder="Select Vendor / Supplier"
                    value={field.value || ''}
                    options={[
                      { value: '', label: 'Direct Supplier / Purchase' },
                      ...vendors.map((v) => ({ value: v.name, label: v.name }))
                    ]}
                    onChange={(val) => {
                      field.onChange(val);
                      const matched = vendors.find((v) => v.name === val || v.companyName === val);
                      if (matched) form.setValue('vendorId', matched.id);
                    }}
                  />
                )}
              />
            </div>

            <div>
              <CustomSelect
                label="FILTER BY CATEGORY"
                placeholder="All Categories"
                value={selectedCategory}
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c.name, label: c.name }))
                ]}
                onChange={(val) => setSelectedCategory(val || 'all')}
              />
            </div>

            <div>
              <Controller
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <ProductAutocomplete
                    id="stockInItemSelect"
                    label="ITEM SELECT"
                    required
                    filterModule={form.watch('module')}
                    filterCategory={selectedCategory}
                    placeholder="Search by product name, SKU or barcode..."
                    value={field.value || ''}
                    onChange={(name, prod) => {
                      field.onChange(name);
                      if (prod) {
                        form.setValue('selectedProductId', prod.id);
                        if (prod.category && selectedCategory === 'all') {
                          setSelectedCategory(prod.category);
                        }
                        if (prod.costPrice !== undefined && prod.costPrice !== null) {
                          form.setValue('unitPrice', prod.costPrice);
                        } else if (prod.price) {
                          form.setValue('unitPrice', prod.price);
                        }
                      } else {
                        form.setValue('selectedProductId', '');
                      }
                    }}
                    error={form.formState.errors.productName?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Empty Category Notice Banner */}
          {selectedCategory !== 'all' && categoryProducts.length === 0 && (
            <div className={styles.emptyCategoryNotice}>
              <div className={styles.emptyCategoryNoticeLeft}>
                <Warning20Regular style={{ width: 22, height: 22, color: '#D97706', flexShrink: 0 }} />
                <div>
                  <div className={styles.emptyCategoryNoticeTitle}>
                    No products found in category &quot;{selectedCategory}&quot;
                  </div>
                  <div className={styles.emptyCategoryNoticeSub}>
                    Is category mein abhi tak koi item register nahi hai. Stock In karne ke liye pehle is category mein naya product add karein:
                  </div>
                </div>
              </div>
              <Button
                appearance="primary"
                size="small"
                icon={<Add20Regular />}
                onClick={() => {
                  navigate(
                    `/catalog/new?category=${encodeURIComponent(selectedCategory)}&module=${form.getValues('module') || 'minimart'}&returnUrl=/inventory/stock-in`
                  );
                }}
              >
                + Add Product in &quot;{selectedCategory}&quot;
              </Button>
            </div>
          )}

          {/* Selected Product Live Stock & Details Card */}
          {selectedProduct && (
            <div className={styles.productDetailCard}>
              <div className={styles.productDetailHeader}>
                <div className={styles.productDetailLeft}>
                  <div className={styles.productThumb}>
                    {selectedProduct.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className={styles.productImg}
                      />
                    ) : (
                      <Box20Regular style={{ width: 24, height: 24, color: '#94A3B8' }} />
                    )}
                  </div>
                  <div>
                    <div className={styles.productTitleRow}>
                      <span className={styles.productName}>
                        {selectedProduct.name}
                      </span>
                      <Badge
                        appearance="filled"
                        color={
                          (selectedProduct.openingStock ?? 0) <= 0
                            ? 'danger'
                            : (selectedProduct.openingStock ?? 0) <= (selectedProduct.minThreshold ?? 10)
                            ? 'warning'
                            : 'success'
                        }
                        size="small"
                      >
                        {(selectedProduct.openingStock ?? 0) <= 0
                          ? 'Out of Stock'
                          : (selectedProduct.openingStock ?? 0) <= (selectedProduct.minThreshold ?? 10)
                          ? 'Low Stock Alert'
                          : 'In Stock'}
                      </Badge>
                    </div>
                    <div className={styles.productMetaRow}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Folder20Regular style={{ width: 14, height: 14 }} />
                        <span>{selectedProduct.category || 'General'}</span>
                      </span>
                      {selectedProduct.skuCode && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Tag20Regular style={{ width: 14, height: 14 }} />
                          <span>SKU: <code className={styles.skuCode}>{selectedProduct.skuCode}</code></span>
                        </span>
                      )}
                      {selectedProduct.rackLocation && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Location20Regular style={{ width: 14, height: 14 }} />
                          <span>Rack: {selectedProduct.rackLocation}</span>
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <Ruler20Regular style={{ width: 14, height: 14 }} />
                        <span>Unit: {selectedProduct.unit || 'PCS'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.productActionWrap}>
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<Dismiss20Regular />}
                    onClick={() => {
                      form.setValue('selectedProductId', '');
                      form.setValue('productName', '');
                    }}
                    title="Clear selected product"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>

              {/* 4-stat Stock & Valuation Matrix */}
              <div className={styles.productDetailGrid}>
                <div className={styles.detailStatBox}>
                  <span className={styles.detailStatLabel}>Current Inventory</span>
                  <span
                    className={mergeClasses(
                      styles.detailStatVal,
                      (selectedProduct.openingStock ?? 0) <= 0 && styles.detailStatValLow
                    )}
                  >
                    {selectedProduct.openingStock ?? 0} {selectedProduct.unit || 'PCS'}
                  </span>
                </div>

                <div className={styles.detailStatBox}>
                  <span className={styles.detailStatLabel}>Stock In Addition</span>
                  <span className={mergeClasses(styles.detailStatVal, styles.detailStatValBlue)}>
                    +{watchedQty} {selectedProduct.unit || 'PCS'}
                  </span>
                </div>

                <div className={styles.detailStatBox}>
                  <span className={styles.detailStatLabel}>Projected New Stock</span>
                  <span className={mergeClasses(styles.detailStatVal, styles.detailStatValGreen)}>
                    {(selectedProduct.openingStock ?? 0) + (Number(watchedQty) || 0)} {selectedProduct.unit || 'PCS'}
                  </span>
                </div>

                <div className={styles.detailStatBox}>
                  <span className={styles.detailStatLabel}>Cost vs Selling</span>
                  <span className={styles.detailStatVal}>
                    PKR {(watchedPrice || selectedProduct.costPrice || 0).toLocaleString()}{' '}
                    <span className={styles.detailStatSubtext}>
                      / {selectedProduct.price ? `Sale: PKR ${selectedProduct.price.toLocaleString()}` : ''}
                    </span>
                  </span>
                </div>
              </div>

              {/* Portion Sizes / Variants details & Stock In allocation */}
              {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                <div className={styles.variantsWrap}>
                  <div className={styles.variantsHeaderRow}>
                    <div className={styles.variantsTitle}>
                      <span>Portion Sizes / Variants Stock In Allocation ({selectedProduct.variants.length} Sizes)</span>
                    </div>
                    <div className={styles.variantHeaderActions}>
                      <button
                        type="button"
                        className={styles.variantActionBtn}
                        onClick={handleDistributeEvenly}
                        title="Distribute current total QTY evenly across all sizes"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Flash20Regular style={{ width: 14, height: 14 }} />
                        Distribute Total Evenly
                      </button>
                      <button
                        type="button"
                        className={styles.variantActionBtnSubtle}
                        onClick={handleResetVariantQuantities}
                        title="Reset all size addition quantities to 0"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ArrowSync20Regular style={{ width: 14, height: 14 }} />
                        Reset Sizes
                      </button>
                    </div>
                  </div>

                  <div className={styles.variantsList}>
                    {selectedProduct.variants.map((v) => {
                      const currentStock = v.stock ?? 0;
                      const added = variantStockInQty[v.id] || 0;
                      const projected = currentStock + added;
                      const effectivePrice =
                        v.price !== undefined && v.price > 0
                          ? v.price
                          : selectedProduct.price + (v.priceDelta || 0);

                      return (
                        <div
                          key={v.id}
                          className={mergeClasses(
                            styles.variantCard,
                            added > 0 && styles.variantCardActive
                          )}
                        >
                          <div className={styles.variantCardTop}>
                            <span className={styles.variantLabelBadge}>{v.label}</span>
                            {v.skuCode && (
                              <span className={styles.variantSkuBadge}>
                                {v.skuCode}
                              </span>
                            )}
                          </div>

                          <div className={styles.variantCardMeta}>
                            <div className={styles.variantMetaItem}>
                              <span>Stock:</span>
                              <strong className={currentStock <= 0 ? styles.stockValZero : styles.stockValNormal}>
                                {currentStock}
                              </strong>
                            </div>
                            <div className={styles.variantMetaItem}>
                              <span>Price:</span>
                              <strong>Rs. {effectivePrice.toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className={styles.variantInputRow}>
                            <span className={styles.variantInputPlus}>+</span>
                            <input
                              type="number"
                              min="0"
                              className={styles.variantNumberInput}
                              placeholder="0"
                              value={variantStockInQty[v.id] !== undefined && variantStockInQty[v.id] > 0 ? variantStockInQty[v.id] : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0);
                                handleVariantQtyChange(v.id, val);
                              }}
                            />
                            <span className={styles.variantUnitBadge}>{selectedProduct.unit || 'PAIR'}</span>
                          </div>

                          {added > 0 && (
                            <div className={styles.variantProjected}>
                              New: {projected} {selectedProduct.unit || 'PAIR'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row 2: QTY, Unit Price, Discount (%), Line Total, Save Button */}
          <div className={styles.row2}>
            <div>
              <Controller
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <CustomInput
                    label="QTY *"
                    required
                    type="number"
                    placeholder="1"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    error={form.formState.errors.quantity?.message}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <CustomInput
                    label="UNIT PRICE (PKR)"
                    type="number"
                    placeholder="0"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <CustomInput
                    label="DISCOUNT (%)"
                    type="number"
                    placeholder="0"
                    min={0}
                    max={100}
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    rightElement={<span className={styles.percentSuffix}>%</span>}
                  />
                )}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>LINE TOTAL (PKR)</label>
              <div className={styles.lineTotalBox}>
                <span className={styles.lineTotalValue}>Rs. {lineTotal.toLocaleString()}</span>
                {discountAmount > 0 && (
                  <span className={styles.discountPill}>
                    (-{discountAmount.toLocaleString()})
                  </span>
                )}
              </div>
            </div>

            <div>
              <Button
                appearance="primary"
                type="submit"
                disabled={saveMutation.isPending}
                className={styles.saveBtn}
              >
                <Add20Regular className={styles.btnIcon18} />
                <span>{saveMutation.isPending ? 'Saving...' : 'Save Stock In Invoice'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ── CARD 2: Stock In (Receiving Logs) ── */}
      <div className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: '10px' }}>
          <span className={styles.cardTitle}>Stock In (Receiving Logs)</span>

          {/* Module Filter Tabs */}
          {hasFastFood && hasOmnimart ? (
            <div style={{ display: 'inline-flex', backgroundColor: tokens.colorNeutralBackground3, padding: '3px', borderRadius: '8px', gap: '3px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
              <button
                type="button"
                onClick={() => setInventoryTab('all')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: inventoryTab === 'all' ? '#E51937' : 'transparent',
                  color: inventoryTab === 'all' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                  fontWeight: inventoryTab === 'all' ? 700 : 500,
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <span>All Inflows</span>
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', backgroundColor: inventoryTab === 'all' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                  {stockInMovements.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setInventoryTab('fastfood')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: inventoryTab === 'fastfood' ? '#E51937' : 'transparent',
                  color: inventoryTab === 'fastfood' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                  fontWeight: inventoryTab === 'fastfood' ? 700 : 500,
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <Food24Regular style={{ width: 14, height: 14 }} />
                <span>Kitchen / Fast Food</span>
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', backgroundColor: inventoryTab === 'fastfood' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                  {stockInMovements.filter((m) => m.module === 'fastfood').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setInventoryTab('minimart')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: inventoryTab === 'minimart' ? '#E51937' : 'transparent',
                  color: inventoryTab === 'minimart' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                  fontWeight: inventoryTab === 'minimart' ? 700 : 500,
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <ShoppingBag24Regular style={{ width: 14, height: 14 }} />
                <span>Mini Mart Retail</span>
                <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', backgroundColor: inventoryTab === 'minimart' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                  {stockInMovements.filter((m) => m.module !== 'fastfood').length}
                </span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground3, border: `1px solid ${tokens.colorNeutralStroke2}`, fontSize: '12px', fontWeight: 600 }}>
              {hasFastFood ? <Food24Regular style={{ width: 14, height: 14, color: '#E51937' }} /> : <ShoppingBag24Regular style={{ width: 14, height: 14, color: '#2563EB' }} />}
              <span>{hasFastFood ? 'Kitchen / Fast Food Logs' : 'Mini Mart Retail Logs'}</span>
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground1, fontWeight: 700 }}>
                {stockInMovements.length}
              </span>
            </div>
          )}
        </div>

        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <CustomInput
              label="Search Stock In Logs"
              placeholder="Search by product, category, reason, note..."
              icon={<Search20Regular />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={searchQuery ? () => setSearchQuery('') : undefined}
            />
          </div>

          <div style={{ minWidth: '220px' }}>
            <CustomSelect
              label="FILTER BY CATEGORY"
              value={tableCategoryFilter}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
              onChange={(val) => setTableCategoryFilter(val || 'all')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedIds.length > 0 && (
              <Button
                appearance="primary"
                size="small"
                icon={<Delete20Regular />}
                onClick={handleBatchDelete}
                style={{ backgroundColor: '#D13438', color: '#FFFFFF', fontWeight: 600 }}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
            <Caption1 className={styles.countCaption}>
              Total {filteredMovements.length} Stock In Records
            </Caption1>
          </div>
        </div>

        {/* Table with Checkbox, Item, Qty, Unit Price, Line Total, Vendor, Date, and Actions */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={mergeClasses(styles.th, styles.thCheckbox)}>
                  <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className={styles.th}>ITEM SELECT</th>
                <th className={mergeClasses(styles.th, styles.thCenter)}>QTY</th>
                <th className={mergeClasses(styles.th, styles.thRight)}>UNIT PRICE</th>
                <th className={mergeClasses(styles.th, styles.thRight)}>LINE TOTAL</th>
                <th className={styles.th}>VENDOR / SUPPLIER</th>
                <th className={styles.th}>DATE &amp; TIME</th>
                <th className={mergeClasses(styles.th, styles.thActions)}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTd}>
                    No Stock In shipment records found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isChecked = selectedIds.includes(mov.id);
                  const dt = new Date(mov.date);
                  const totalLine = (mov.unitCost || 0) * (mov.quantity || 0);
                  const matchedProd = allProducts.find(
                    (p) => p.id === mov.productId || p.name.toLowerCase() === mov.productName.toLowerCase()
                  );

                  return (
                    <tr key={mov.id} className={styles.tableRow}>
                      <td className={mergeClasses(styles.td, styles.tdCenter)}>
                        <Checkbox checked={isChecked} onChange={() => toggleSelectRow(mov.id)} />
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={styles.logProdName}>
                            {mov.productName}
                          </span>
                          <span className={styles.categoryBadge}>
                            <Folder20Regular style={{ width: 12, height: 12, color: '#2563EB' }} />
                            <span>{matchedProd?.category || 'General'}</span>
                          </span>
                        </div>
                      </td>
                      <td className={mergeClasses(styles.td, styles.tdCenter)}>
                        <Badge appearance="tint" color="success" className={styles.badgeBold}>
                          +{mov.quantity}
                        </Badge>
                      </td>
                      <td className={mergeClasses(styles.td, styles.tdRight)}>
                        {mov.unitCost !== null && mov.unitCost !== undefined ? formatPKR(mov.unitCost) : '—'}
                      </td>
                      <td className={mergeClasses(styles.td, styles.tdRightGreen)}>
                        {totalLine > 0 ? formatPKR(totalLine) : '—'}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.reasonText}>
                          {mov.reason || 'Supplier Purchase'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.dateTimeText}>
                          {dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className={mergeClasses(styles.td, styles.tdCenter)}>
                        {/* ── ACTION ICONS: Print, Edit (Right Drawer), Delete ── */}
                        <div className={styles.actionGroup}>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Print20Regular className={styles.iconPrint} />}
                            onClick={() => handleOpenPrint(mov)}
                            className={styles.actionBtnPrint}
                            title="Print Receiving Slip"
                            aria-label="Print Receiving Slip"
                          />

                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Edit20Regular className={styles.iconEdit} />}
                            onClick={() => handleOpenEdit(mov)}
                            className={styles.actionBtnEdit}
                            title="Edit Invoice (Right Drawer)"
                            aria-label="Edit Invoice (Right Drawer)"
                          />

                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Delete20Regular className={styles.iconDelete} />}
                            onClick={() => handleDelete(mov.id)}
                            className={styles.actionBtnDelete}
                            title="Delete Record"
                            aria-label="Delete Record"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── RIGHT-SIDE SLIDE-OVER DRAWER (Edit Stock In) ── */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderLeft}>
                <span className={styles.drawerHeaderBadge}>
                  <Edit20Regular />
                </span>
                <div>
                  <Subtitle2 className={styles.drawerHeaderTitle}>
                    Edit Stock In Invoice
                  </Subtitle2>
                  <Caption1 className={styles.drawerHeaderSub}>
                    Record #{editingMovement?.id.slice(-6).toUpperCase()}
                  </Caption1>
                </div>
              </div>

              <Button
                appearance="subtle"
                icon={<Dismiss20Regular />}
                onClick={() => setIsDrawerOpen(false)}
                className={styles.iconBtn28}
              />
            </div>

            {/* Drawer Form Body */}
            <form id="editDrawerForm" onSubmit={editForm.handleSubmit(onUpdate)} className={styles.drawerBody}>
              {/* Product Name */}
              <div>
                <Controller
                  control={editForm.control}
                  name="productName"
                  render={({ field }) => (
                    <CustomInput
                      label="Item / Product Name"
                      required
                      placeholder="Product name"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              {/* Vendor / Supplier */}
              <div>
                <Controller
                  control={editForm.control}
                  name="vendorName"
                  render={({ field }) => (
                    <CustomSelect
                      label="Vendor / Supplier"
                      value={field.value || ''}
                      placeholder="Direct Supplier / Purchase"
                      options={[
                        { value: '', label: 'Direct Supplier / Purchase' },
                        ...vendors.map((v) => ({ value: v.name, label: v.name }))
                      ]}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />
              </div>

              {/* Quantity & Unit Cost */}
              <div className={styles.grid2Col}>
                <div>
                  <Controller
                    control={editForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <CustomInput
                        label="Quantity (Units)"
                        required
                        type="number"
                        placeholder="1"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    )}
                  />
                </div>

                <div>
                  <Controller
                    control={editForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <CustomInput
                        label="Unit Price (PKR)"
                        type="number"
                        placeholder="0"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Discount (%) */}
              <div>
                <Controller
                  control={editForm.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <CustomInput
                      label="Discount (%)"
                      type="number"
                      placeholder="0"
                      min={0}
                      max={100}
                      value={field.value !== undefined ? String(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      rightElement={<span className={styles.percentSuffix}>%</span>}
                    />
                  )}
                />
              </div>

              {/* Line Total Display Box */}
              <div>
                <div className={styles.lineTotalBox}>
                  <span className={styles.lineTotalValue}>Rs. {editLineTotal.toLocaleString()}</span>
                  {editDiscountAmount > 0 && (
                    <span className={styles.discountPill}>
                      (-{editDiscountAmount.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>

              {/* Reference Note */}
              <div>
                <Controller
                  control={editForm.control}
                  name="note"
                  render={({ field }) => (
                    <CustomInput
                      label="Note / Remarks"
                      placeholder="Batch #, invoice notes, etc."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </form>

            {/* Drawer Footer */}
            <div className={styles.drawerFooter}>
              <Button
                appearance="subtle"
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className={styles.drawerCancelBtn}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                form="editDrawerForm"
                disabled={updateMutation.isPending}
                className={styles.drawerUpdateBtn}
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT RECEIVING INVOICE MODAL ── */}
      <Dialog open={isPrintModalOpen} onOpenChange={(_, d) => setIsPrintModalOpen(d.open)}>
        <DialogSurface className={styles.printDialogSurface}>
          <div className={styles.printHeader}>
            <Subtitle2 className={styles.printModalTitle}>
              Purchase Receiving Invoice
            </Subtitle2>
            <Button
              appearance="subtle"
              icon={<Dismiss20Regular />}
              onClick={() => setIsPrintModalOpen(false)}
              className={styles.iconBtn32}
            />
          </div>

          <div>
            {printingMovement && (
              <div className={styles.printSheet}>
                {/* Invoice Top Header */}
                <div className={styles.invoiceTopRow}>
                  <div className={styles.invoiceBrandWrap}>
                    <div className={styles.logoBox}>
                      OP
                    </div>
                    <div>
                      <div className={styles.brandName}>OmniPos</div>
                      <div className={styles.brandSub}>
                        Enterprise POS &amp; Inventory
                      </div>
                    </div>
                  </div>

                  <div className={styles.invHeaderRight}>
                    <div className={styles.invTitle}>
                      RECEIVING INVOICE
                    </div>
                    <div className={styles.invMetaText}>
                      <strong>Inv #:</strong> {printDocNo}
                    </div>
                    <div className={styles.invMetaText}>
                      <strong>Date:</strong> {printDate} {printTime}
                    </div>
                  </div>
                </div>

                {/* Parties Information (Vendor & Store) */}
                <div className={styles.partiesGrid}>
                  {/* Vendor / Supplier Box */}
                  <div className={styles.partyCard}>
                    <div className={styles.supplierTag}>
                      Supplier / Vendor Details
                    </div>
                    <div className={styles.partyName}>
                      {currentPrintVendor?.name || printingMovement.reason || 'Vendor / Supplier'}
                    </div>
                    <div className={styles.partyDetail}>
                      <div><strong>Rep:</strong> {currentPrintVendor?.contactPerson || 'Authorized Agent'}</div>
                      <div><strong>Phone:</strong> {currentPrintVendor?.phone || 'N/A'}</div>
                      <div><strong>Address:</strong> {currentPrintVendor?.address || 'Local Supply'}</div>
                    </div>
                    <div className={styles.vendorBalanceTag}>
                      Vendor Balance: Rs. {printVendorBalance.toLocaleString()} PKR
                    </div>
                  </div>

                  {/* Store / Destination Box */}
                  <div className={styles.partyCard}>
                    <div className={styles.storeTag}>
                      Receiving Facility / Store
                    </div>
                    <div className={styles.partyName}>
                      OmniPos Central Branch &amp; Store
                    </div>
                    <div className={styles.partyDetail}>
                      <div><strong>Warehouse:</strong> Inward Logistics Bay #1</div>
                      <div><strong>Received By:</strong> Store Manager (Admin)</div>
                      <div><strong>Account:</strong> Inventory Trade Payable</div>
                    </div>
                    <div className={styles.verifiedTag} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Checkmark20Regular style={{ width: 14, height: 14 }} />
                      <span>Stock Count Verified &amp; Added</span>
                    </div>
                  </div>
                </div>

                {/* Itemized Table */}
                <table className={styles.slipTable}>
                  <thead>
                    <tr className={styles.slipTrHeader}>
                      <th className={styles.slipThNum}>#</th>
                      <th className={styles.slipThLeft}>Item Description</th>
                      <th className={styles.slipThRate}>Unit Rate</th>
                      <th className={styles.slipThQty}>Quantity</th>
                      <th className={styles.slipThDiscount}>Discount</th>
                      <th className={styles.slipThTotal}>Total (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className={styles.slipTdNum}>1</td>
                      <td className={styles.slipTdDesc}>
                        <div className={styles.slipProdTitle}>{printingMovement.productName}</div>
                        {printingMovement.note && <div className={styles.slipProdNote}>Note: {printingMovement.note}</div>}
                      </td>
                      <td className={styles.slipTdRate}>{formatPKR(printUnitCost)}</td>
                      <td className={styles.slipTdQty}>+{printQty} units</td>
                      <td className={styles.slipTdDiscount}>{printDiscountPercent > 0 ? `${printDiscountPercent}%` : '—'}</td>
                      <td className={styles.slipTdTotal}>{formatPKR(printNetTotal)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Calculation & Vendor Balance Breakdown */}
                <div className={styles.calcWrap}>
                  <div className={styles.calcCard}>
                    <div className={styles.calcRow}>
                      <span>Gross Total:</span>
                      <span className={styles.calcGrossVal}>{formatPKR(printGrossTotal)}</span>
                    </div>
                    {printDiscountAmount > 0 && (
                      <div className={styles.calcDiscountRow}>
                        <span>Discount ({printDiscountPercent}%):</span>
                        <span>- {formatPKR(printDiscountAmount)}</span>
                      </div>
                    )}
                    <div className={styles.calcInvoiceTotalRow}>
                      <span>This Invoice Total:</span>
                      <span className={styles.calcInvoiceTotalVal}>{formatPKR(printNetTotal)}</span>
                    </div>
                    <div className={styles.calcPrevRow}>
                      <span>Previous Vendor Balance:</span>
                      <span>{formatPKR(printPrevBalance)}</span>
                    </div>
                    <div className={styles.calcAddedRow}>
                      <span>This Bill Added:</span>
                      <span>+ {formatPKR(printNetTotal)}</span>
                    </div>
                    <div className={styles.balanceDueBox}>
                      <span>Total Balance Due:</span>
                      <span>{formatPKR(printVendorBalance)}</span>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className={styles.signaturesRow}>
                  <div className={styles.signatureBlock}>
                    <div className={styles.signatureLine}></div>
                    <div>Vendor / Delivery Sign</div>
                  </div>
                  <div className={styles.signatureBlock}>
                    <div className={styles.signatureLine}></div>
                    <div>Storekeeper Received</div>
                  </div>
                  <div className={styles.signatureBlock}>
                    <div className={styles.signatureLine}></div>
                    <div>Authorized Seal</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.modalActionsBar}>
            <Button
              appearance="secondary"
              onClick={() => setIsPrintModalOpen(false)}
              className={styles.modalCloseBtn}
            >
              Close
            </Button>
            <Button
              appearance="primary"
              icon={<Print20Regular className={styles.btnIcon18} />}
              onClick={handlePrint}
              className={styles.modalPrintBtn}
            >
              Print Invoice
            </Button>
          </div>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
