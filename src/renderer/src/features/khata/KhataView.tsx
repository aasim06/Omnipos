import React, { useState } from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Button,
  Badge,
  Label,
  Body1,
  Body2,
  Caption1,
  Subtitle1,
  Text,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  ProgressBar,
} from '@fluentui/react-components';
import {
  Add20Regular,
  ArrowCircleDown20Regular,
  ArrowCircleUp20Regular,
  Search20Regular,
  Person20Regular,
  BookOpen20Regular,
  Chat20Regular,
  Delete16Regular,
  Print20Regular,
  Location16Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl } from '@/lib/api';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { CustomInput, CustomSelect } from '@/components/ui';

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'retail', label: 'Retail Customer' },
  { value: 'wholesale', label: 'Wholesale Dukandar' },
  { value: 'employee', label: 'Staff / Employee' },
];

const DUE_DAYS_OPTIONS = [
  { value: '7', label: '7 Days' },
  { value: '15', label: '15 Days' },
  { value: '30', label: '30 Days' },
  { value: '60', label: '60 Days' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash In Hand' },
  { value: 'bank', label: 'Bank Transfer / Cheque' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'jazzcash', label: 'JazzCash' },
];

/* ─── Zod Schemas ──────────────────────────────────────────────────── */
const newKhataSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required (min 10 digits)'),
  customerType: z.string().default('retail'),
  creditLimit: z.coerce.number().min(1000, 'Credit limit must be at least 1,000 PKR').default(50000),
  dueDays: z.coerce.number().min(1, 'Due days must be at least 1').default(30),
  cnic: z.string().optional(),
  address: z.string().optional(),
  currentDebt: z.coerce.number().min(0, 'Initial debt cannot be negative').default(0),
  note: z.string().optional(),
});

type NewKhataFormData = z.infer<typeof newKhataSchema>;

const transactionSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be at least 1 PKR'),
  paymentMethod: z.string().default('cash'),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const useStyles = makeStyles({
  container: {
    padding: '28px 32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '18px 20px',
    borderRadius: '12px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow4,
  },
  tableCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '12px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
  },
  filterBar: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    gap: '12px',
  },

  headerTitle: {
    fontWeight: 700,
    fontSize: '20px',
    color: tokens.colorNeutralForeground1,
    margin: 0,
    display: 'block',
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    marginTop: '4px',
    fontSize: '13px',
  },
  addCustomerBtn: {
    backgroundColor: '#E51937',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 700,
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },
  statLabel: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    fontWeight: 600,
  },
  statVal: {
    fontSize: '28px',
    fontWeight: 800,
    marginTop: '6px',
    display: 'block',
    color: tokens.colorNeutralForeground1,
  },
  statValRed: {
    color: '#E51937',
  },
  statValBrand: {
    color: tokens.colorBrandForeground1,
  },
  statValWarn: {
    color: '#D97706',
  },
  statValSuccess: {
    color: '#107C41',
  },
  statSub: {
    color: tokens.colorNeutralForeground3,
  },
  searchWrap: {
    width: '320px',
  },
  filterWrap: {
    width: '220px',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  table: {
    width: '100%',
    minWidth: '980px',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  tableHeaderRow: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  thProfile: {
    padding: '14px 20px',
    width: '27%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thContact: {
    padding: '14px 16px',
    width: '18%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thUsage: {
    padding: '14px 16px',
    width: '20%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thDebt: {
    padding: '14px 16px',
    width: '14%',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  thActions: {
    padding: '14px 20px',
    width: '21%',
    textAlign: 'right',
    fontWeight: 700,
    fontSize: '11.5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground2,
  },
  emptyTableCell: {
    textAlign: 'center',
    padding: '40px',
    color: tokens.colorNeutralForeground3,
  },
  tableBodyRow: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    transition: 'background-color 0.15s ease',
  },
  tdProfile: {
    padding: '14px 20px',
    verticalAlign: 'middle',
  },
  avatarWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  profileAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, rgba(229, 25, 55, 0.12) 0%, rgba(229, 25, 55, 0.04) 100%)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.2)', borderBottomColor: 'rgba(229, 25, 55, 0.2)',
    borderLeftColor: 'rgba(229, 25, 55, 0.2)', borderRightColor: 'rgba(229, 25, 55, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E51937',
    fontWeight: 800,
    fontSize: '14px',
    flexShrink: 0,
  },
  profileInfoCol: {
    minWidth: 0,
  },
  profileTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  profileName: {
    fontWeight: 700,
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  profileBadge: {
    textTransform: 'uppercase',
    fontSize: '10px',
    fontWeight: 700,
  },
  profileAddressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '3px',
    color: tokens.colorNeutralForeground3,
    fontSize: '11.5px',
  },
  locationIcon: {
    width: '13px',
    height: '13px',
    flexShrink: 0,
  },
  addressText: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tdCell: {
    padding: '14px 16px',
    verticalAlign: 'middle',
  },
  colGap3: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  contactPhone: {
    fontWeight: 600,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
  contactCnic: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    fontFamily: 'monospace',
    backgroundColor: tokens.colorNeutralBackground3,
    padding: '2px 6px',
    borderRadius: '4px',
    width: 'fit-content',
  },
  usageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '150px',
  },
  usageHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11.5px',
  },
  usagePercent: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground2,
  },
  usagePercentOver: {
    color: '#DC2626',
  },
  usagePercentNear: {
    color: '#D97706',
  },
  usageCap: {
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
  },
  progressBarTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.3s ease',
  },
  progressBarNormal: {
    backgroundColor: '#107C41',
  },
  progressBarWarn: {
    backgroundColor: '#F59E0B',
  },
  progressBarAlert: {
    backgroundColor: '#DC2626',
  },
  debtBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '8px',
    fontWeight: 800,
    fontSize: '13px',
    width: 'fit-content',
  },
  debtBadgeDue: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#FECACA', borderBottomColor: '#FECACA', borderLeftColor: '#FECACA', borderRightColor: '#FECACA',
  },
  debtBadgeClear: {
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#BBF7D0', borderBottomColor: '#BBF7D0', borderLeftColor: '#BBF7D0', borderRightColor: '#BBF7D0',
  },
  termText: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  tdActions: {
    padding: '14px 20px',
    verticalAlign: 'middle',
    textAlign: 'right',
  },
  actionsGroup: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  btnPassbook: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '7px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnReceive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 11px',
    borderRadius: '7px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#A7F3D0', borderBottomColor: '#A7F3D0',
    borderLeftColor: '#A7F3D0', borderRightColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    color: '#047857',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnUdhaar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 11px',
    borderRadius: '7px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#FECACA', borderBottomColor: '#FECACA',
    borderLeftColor: '#FECACA', borderRightColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnWhatsApp: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '7px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: '#BBF7D0', borderBottomColor: '#BBF7D0',
    borderLeftColor: '#BBF7D0', borderRightColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  btnDelete: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '7px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  icon15: {
    width: '15px',
    height: '15px',
  },
  icon16: {
    width: '16px',
    height: '16px',
  },
  dialogSurface520: {
    borderRadius: tokens.borderRadiusLarge,
    maxWidth: '520px',
  },
  dialogTitleBold: {
    fontWeight: 800,
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '12px',
  },
  grid2Col: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  dialogActions: {
    marginTop: '24px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    borderRadius: '8px',
    fontWeight: 600,
    padding: '8px 18px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    whiteSpace: 'nowrap',
  },
  modalSubmitBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '9px 22px',
    minWidth: '140px',
    whiteSpace: 'nowrap',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },
  dialogSurface440: {
    borderRadius: tokens.borderRadiusLarge,
    maxWidth: '440px',
  },
  selectedCustCard: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
  },
  selectedCustTitle: {
    fontWeight: 700,
  },
  selectedCustSub: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
  },
  currentBalStrong: {
    color: '#E51937',
  },
  transSubmitGreen: {
    backgroundColor: '#107C41',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '9px 22px',
    minWidth: '160px',
    whiteSpace: 'nowrap',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    boxShadow: '0 2px 8px rgba(16, 124, 65, 0.25)',
    ':hover': {
      backgroundColor: '#0D6535',
    },
  },
  transSubmitRed: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '9px 22px',
    minWidth: '160px',
    whiteSpace: 'nowrap',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
    ':hover': {
      backgroundColor: '#C6172E',
    },
  },
  passbookSurface: {
    borderRadius: '16px',
    maxWidth: '920px',
    minWidth: '780px',
    width: '92vw',
    padding: '24px',
  },
  passbookInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  passbookHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '14px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    gap: '16px',
    width: '100%',
  },
  passbookTitleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  passbookTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  passbookTitle: {
    fontWeight: 800,
    fontSize: '20px',
    margin: 0,
    padding: 0,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
  },
  passbookStatusBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '9999px',
    whiteSpace: 'nowrap',
  },
  passbookStatusDue: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#EF4444',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(239, 68, 68, 0.3)', borderBottomColor: 'rgba(239, 68, 68, 0.3)',
    borderLeftColor: 'rgba(239, 68, 68, 0.3)', borderRightColor: 'rgba(239, 68, 68, 0.3)',
  },
  passbookStatusSettled: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(16, 185, 129, 0.3)', borderBottomColor: 'rgba(16, 185, 129, 0.3)',
    borderLeftColor: 'rgba(16, 185, 129, 0.3)', borderRightColor: 'rgba(16, 185, 129, 0.3)',
  },
  passbookSubtitle: {
    color: tokens.colorNeutralForeground2,
    marginTop: '2px',
    fontSize: '13px',
  },
  passbookActionsRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexShrink: 0,
  },
  passbookPrintBtn: {
    borderRadius: '8px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  passbookWhatsAppBtn: {
    backgroundColor: '#25D366',
    color: '#FFFFFF',
    fontWeight: 700,
    borderRadius: '8px',
    borderTopStyle: 'none', borderBottomStyle: 'none', borderLeftStyle: 'none', borderRightStyle: 'none',
    boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#1EBE5D',
    },
  },
  passbookMetricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    width: '100%',
  },
  passbookStatCard: {
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  passbookStatCardAlert: {
    padding: '12px 14px',
    borderRadius: '10px',
    backgroundColor: 'rgba(229, 25, 55, 0.08)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.25)', borderBottomColor: 'rgba(229, 25, 55, 0.25)',
    borderLeftColor: 'rgba(229, 25, 55, 0.25)', borderRightColor: 'rgba(229, 25, 55, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  passbookStatTitle: {
    color: tokens.colorNeutralForeground3,
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  passbookStatTitleAlert: {
    color: '#EF4444',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  passbookStatVal: {
    fontSize: '16px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: 'nowrap',
  },
  passbookStatValRed: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#EF4444',
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: 'nowrap',
  },
  passbookStatValGreen: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#10B981',
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: 'nowrap',
  },
  passbookStatValNet: {
    fontSize: '18px',
    fontWeight: 900,
    color: '#E51937',
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: 'nowrap',
  },
  passbookTableWrap: {
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '2px',
    width: '100%',
  },
  passbookLoadingText: {
    padding: '40px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground2,
  },
  passbookEmptyText: {
    padding: '40px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  passbookTableCard: {
    borderRadius: '10px',
    overflow: 'hidden',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2, borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2, borderRightColor: tokens.colorNeutralStroke2,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  passbookTable: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'separate',
    borderSpacing: 0,
  },
  passbookTheadTr: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  passbookThDate: {
    padding: '12px 14px',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground2,
    width: '140px',
    whiteSpace: 'nowrap',
  },
  passbookThDesc: {
    padding: '12px 14px',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground2,
    width: 'auto',
  },
  passbookThDebit: {
    padding: '12px 14px',
    textAlign: 'right',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground2,
    width: '130px',
    whiteSpace: 'nowrap',
  },
  passbookThCredit: {
    padding: '12px 14px',
    textAlign: 'right',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground2,
    width: '130px',
    whiteSpace: 'nowrap',
  },
  passbookThBal: {
    padding: '12px 14px',
    textAlign: 'right',
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground2,
    width: '120px',
    whiteSpace: 'nowrap',
  },
  passbookTbodyTr: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke3,
  },
  passbookTdDate: {
    padding: '12px 14px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
  },
  passbookDatePrimary: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
  },
  passbookTimeSecondary: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
    whiteSpace: 'nowrap',
  },
  passbookTdDesc: {
    padding: '12px 14px',
  },
  passbookDescTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    fontSize: '13px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  passbookDescMode: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'capitalize',
    marginTop: '2px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
  },
  passbookTdRight: {
    padding: '12px 14px',
    textAlign: 'right',
  },
  passbookTdBal: {
    padding: '12px 14px',
    textAlign: 'right',
    fontWeight: 800,
    fontSize: '13px',
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
  },
  debitTag: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#EF4444',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(239, 68, 68, 0.25)', borderBottomColor: 'rgba(239, 68, 68, 0.25)',
    borderLeftColor: 'rgba(239, 68, 68, 0.25)', borderRightColor: 'rgba(239, 68, 68, 0.25)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: 'nowrap',
  },
  creditTag: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    color: '#10B981',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(16, 185, 129, 0.25)', borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    borderLeftColor: 'rgba(16, 185, 129, 0.25)', borderRightColor: 'rgba(16, 185, 129, 0.25)',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: tokens.fontFamilyMonospace,
    whiteSpace: 'nowrap',
  },
  dashText: {
    color: tokens.colorNeutralForeground3,
  },
  passbookFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
  },
  passbookRecordCount: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  passbookCloseBtn: {
    borderRadius: '8px',
    fontWeight: 600,
    padding: '8px 20px',
  },
});

interface CustomerKhata {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  cnic?: string;
  customerType?: string;
  currentDebt: number;
  creditLimit: number;
  dueDays?: number;
  note?: string;
  createdAt: string;
}

interface KhataTx {
  id: string;
  khataId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  description: string;
  paymentMethod: string;
  createdAt: string;
}

export function KhataView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();

  const [isNewKhataOpen, setIsNewKhataOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPassbookOpen, setIsPassbookOpen] = useState(false);
  const [selectedKhata, setSelectedKhata] = useState<CustomerKhata | null>(null);
  const [transType, setTransType] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // React Hook Form for New Khata Account
  const newKhataForm = useForm<NewKhataFormData>({
    resolver: zodResolver(newKhataSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      customerType: 'retail',
      creditLimit: 50000,
      dueDays: 30,
      cnic: '',
      address: '',
      currentDebt: 0,
      note: '',
    },
  });

  // React Hook Form for Transactions
  const transForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      amount: undefined,
      paymentMethod: 'cash',
      description: '',
    },
  });

  // Fetch Khatas
  const { data: khatas = [], isLoading } = useQuery<CustomerKhata[]>({
    queryKey: ['khatas'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Passbook Transactions for selected customer
  const { data: passbookTransactions = [], isLoading: isLoadingPassbook } = useQuery<KhataTx[]>({
    queryKey: ['khata-transactions', selectedKhata?.id],
    queryFn: async () => {
      if (!selectedKhata) return [];
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata/${selectedKhata.id}/transactions`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedKhata && isPassbookOpen,
  });

  // Create Khata Mutation
  const createMutation = useMutation({
    mutationFn: async (data: NewKhataFormData) => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create khata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
      setIsNewKhataOpen(false);
      newKhataForm.reset();
    },
  });

  // Add Transaction Mutation
  const transactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!selectedKhata) return;
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata/${selectedKhata.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: transType,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          description: data.description,
        }),
      });
      if (!res.ok) throw new Error('Transaction failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
      queryClient.invalidateQueries({ queryKey: ['khata-transactions', selectedKhata?.id] });
      setIsPaymentOpen(false);
      transForm.reset();
    },
  });

  // Delete Khata Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/khata/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
    },
  });

  const onNewKhataSubmit = (data: NewKhataFormData) => {
    createMutation.mutate(data);
  };

  const onTransSubmit = (data: TransactionFormData) => {
    transactionMutation.mutate(data);
  };

  // WhatsApp Reminder Handler
  const sendWhatsAppReminder = (khata: CustomerKhata) => {
    if (!khata.phone) {
      alert('Is customer ka phone number registered nahi hai.');
      return;
    }
    const cleanPhone = khata.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('92') ? cleanPhone : cleanPhone.startsWith('0') ? `92${cleanPhone.slice(1)}` : `92${cleanPhone}`;
    const text = encodeURIComponent(
      `As-salamu alaykum ${khata.name} sahab,\n\nAapke Omnipos store account mein PKR ${khata.currentDebt.toLocaleString()} ka baqaya (Udhaar) wajib-ul-ada hai.\nBaraye meharbani baqaya ki adaigi jald az jald farma dein.\n\nShukriya!\nOmnipos Retail & Restaurant`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  // Print Statement Handler: Generates clean, professional A4 Customer Ledger Statement for printing / PDF
  const printStatement = () => {
    if (!selectedKhata) return;

    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) {
      alert('Please allow popups in your browser to print statement');
      return;
    }

    const totalDebits = passbookTransactions
      .filter((tx) => tx.type === 'DEBIT')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalCredits = passbookTransactions
      .filter((tx) => tx.type === 'CREDIT')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const rowsHtml = passbookTransactions
      .map(
        (tx) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; vertical-align: top;">
            <strong>${new Date(tx.createdAt).toLocaleDateString()}</strong><br/>
            <span style="color: #6b7280; font-size: 11px;">${new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; vertical-align: top;">
            <strong style="color: #111827;">${tx.description || 'Transaction'}</strong><br/>
            <span style="color: #6b7280; font-size: 11px; text-transform: capitalize;">Payment Mode: ${tx.paymentMethod}</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: right; color: #dc2626; font-weight: 700; vertical-align: top;">
            ${tx.type === 'DEBIT' ? `+PKR ${tx.amount.toLocaleString()}` : '—'}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: right; color: #16a34a; font-weight: 700; vertical-align: top;">
            ${tx.type === 'CREDIT' ? `-PKR ${tx.amount.toLocaleString()}` : '—'}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: right; font-weight: 800; color: #111827; vertical-align: top;">
            PKR ${tx.balanceAfter.toLocaleString()}
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Customer Ledger Statement - ${selectedKhata.name}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            color: #E51937;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 12px;
            color: #4b5563;
            margin-top: 3px;
          }
          .statement-meta {
            text-align: right;
          }
          .statement-meta h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #111827;
          }
          .statement-meta p {
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #6b7280;
          }
          .customer-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 18px;
            margin-bottom: 16px;
          }
          .customer-box strong {
            font-size: 16px;
            color: #111827;
          }
          .customer-box p {
            margin: 3px 0 0 0;
            font-size: 12px;
            color: #4b5563;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .summary-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 14px;
            background: #f9fafb;
          }
          .summary-card .label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6b7280;
          }
          .summary-card .val {
            font-size: 16px;
            font-weight: 800;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #f3f4f6;
            border-bottom: 2px solid #d1d5db;
            padding: 10px 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #374151;
            text-align: left;
          }
          th.right { text-align: right; }
          .footer {
            display: flex;
            justify-content: space-between;
            border-top: 1px dashed #d1d5db;
            padding-top: 16px;
            font-size: 11px;
            color: #6b7280;
            margin-top: 36px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">OMNIPOS</h1>
            <div class="brand-sub">Commercial Ledger &amp; Customer Passbook Statement</div>
          </div>
          <div class="statement-meta">
            <h2>ACCOUNT STATEMENT</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <div class="customer-box">
          <div>
            <strong>${selectedKhata.name}</strong>
            <p>Phone: ${selectedKhata.phone || 'N/A'} &nbsp;|&nbsp; CNIC: ${selectedKhata.cnic || 'N/A'}</p>
            <p>Address: ${selectedKhata.address || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Account Status</div>
            <div style="font-size: 14px; font-weight: 800; color: ${selectedKhata.currentDebt > 0 ? '#dc2626' : '#16a34a'}; margin-top: 3px;">
              ${selectedKhata.currentDebt > 0 ? 'OUTSTANDING BALANCE DUE' : 'ACCOUNT SETTLED'}
            </div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Credit Limit</div>
            <div class="val">PKR ${selectedKhata.creditLimit.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Udhaar (Diya)</div>
            <div class="val" style="color: #dc2626;">+PKR ${totalDebits.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Wasooli (Received)</div>
            <div class="val" style="color: #16a34a;">-PKR ${totalCredits.toLocaleString()}</div>
          </div>
          <div class="summary-card" style="background: #fef2f2; border-color: #fca5a5;">
            <div class="label" style="color: #dc2626;">Net Outstanding Balance</div>
            <div class="val" style="color: #b91c1c;">PKR ${selectedKhata.currentDebt.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 140px;">Date &amp; Time</th>
              <th>Description / Mode</th>
              <th class="right" style="width: 130px;">Debit (Diya)</th>
              <th class="right" style="width: 130px;">Credit (Wasooli)</th>
              <th class="right" style="width: 130px;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 24px; color: #9ca3af;">No transactions recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>Omnipos Enterprise POS · Computer Generated Statement</div>
          <div>Customer Signature: _______________________</div>
          <div>Authorized Signature: _______________________</div>
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

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Filter khatas
  const filteredKhatas = khatas.filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.phone && k.phone.includes(searchTerm)) ||
      (k.cnic && k.cnic.includes(searchTerm));
    const matchesType = typeFilter === 'all' || k.customerType === typeFilter;
    return matchesSearch && matchesType;
  });

  // KPI Calculations
  const totalMarketDebt = khatas.reduce((acc, k) => acc + (k.currentDebt || 0), 0);
  const highRiskCustomers = khatas.filter((k) => k.creditLimit > 0 && k.currentDebt >= k.creditLimit * 0.8).length;
  const totalCreditExtended = khatas.reduce((acc, k) => acc + (k.creditLimit || 50000), 0);

  if (isLoading && khatas.length === 0) {
    return <TablePageSkeleton title="Khata / Udhaar Ledger Book" />;
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <Subtitle1
            as="h1"
            style={{ fontWeight: 700, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Khata / Udhaar Commercial Ledger
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginTop: '4px', fontSize: '13px' }}>
            Enterprise customer credit management, passbook statements, credit limits &amp; WhatsApp reminders
          </Caption1>
        </div>

        <Button
          appearance="primary"
          icon={<Add20Regular />}
          onClick={() => {
            newKhataForm.reset();
            setIsNewKhataOpen(true);
          }}
          style={{ backgroundColor: '#E51937', borderRadius: tokens.borderRadiusMedium, fontWeight: 700 }}
        >
          Add New Customer Khata
        </Button>
      </div>

      {/* ── 4 KPI Summary Metric Cards ── */}
      <div className={styles.summaryGrid}>
        <div className={styles.statCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>
            Total Customers on Credit
          </Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', display: 'block', color: tokens.colorNeutralForeground1 }}>
            {khatas.length}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Registered accounts</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>
            Total Market Receivables (Udhaar)
          </Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', display: 'block', color: '#E51937' }}>
            PKR {totalMarketDebt.toLocaleString()}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Outstanding balance to recover</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>
            Approved Credit Limit Cap
          </Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', display: 'block', color: tokens.colorBrandForeground1 }}>
            PKR {totalCreditExtended.toLocaleString()}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Total risk ceiling</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>
            High-Risk / Near Limit Accounts
          </Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', display: 'block', color: highRiskCustomers > 0 ? '#D97706' : '#107C41' }}>
            {highRiskCustomers}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>&gt;80% credit limit utilized</Caption1>
        </div>
      </div>

      {/* ── Main Khata Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.filterBar}>
          <div style={{ width: '320px' }}>
            <CustomInput
              label="Search Customers"
              placeholder="Name, phone, or CNIC..."
              icon={<Search20Regular />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={searchTerm ? () => setSearchTerm('') : undefined}
            />
          </div>

          <div style={{ width: '220px' }}>
            <CustomSelect
              label="Filter Account Type"
              value={typeFilter}
              options={[
                { value: 'all', label: `All Accounts (${khatas.length})` },
                { value: 'retail', label: 'Retail Customers' },
                { value: 'wholesale', label: 'Wholesale / Dukandar' },
                { value: 'employee', label: 'Staff / Employee' },
              ]}
              onChange={(val) => setTypeFilter(val as any)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <Table style={{ width: '100%', minWidth: '980px', borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHeader>
              <TableRow style={{ backgroundColor: tokens.colorNeutralBackground3, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                <TableHeaderCell style={{ padding: '14px 20px', width: '27%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Customer Profile
                </TableHeaderCell>
                <TableHeaderCell style={{ padding: '14px 16px', width: '18%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Contact &amp; CNIC
                </TableHeaderCell>
                <TableHeaderCell style={{ padding: '14px 16px', width: '20%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Credit Limit &amp; Usage
                </TableHeaderCell>
                <TableHeaderCell style={{ padding: '14px 16px', width: '14%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Outstanding Debt
                </TableHeaderCell>
                <TableHeaderCell style={{ padding: '14px 20px', width: '21%', textAlign: 'right', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Actions &amp; Reminders
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKhatas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px', color: tokens.colorNeutralForeground3 }}>
                    No khata accounts found matching filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKhatas.map((khata) => {
                  const limit = khata.creditLimit || 50000;
                  const percent = Math.min(100, Math.round((khata.currentDebt / limit) * 100));
                  const isOverLimit = khata.currentDebt >= limit;
                  const isNearLimit = khata.currentDebt >= limit * 0.8;

                  return (
                    <TableRow
                      key={khata.id}
                      style={{
                        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Customer Info */}
                      <TableCell style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, rgba(229, 25, 55, 0.12) 0%, rgba(229, 25, 55, 0.04) 100%)',
                              border: '1px solid rgba(229, 25, 55, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#E51937',
                              fontWeight: 800,
                              fontSize: '14px',
                              flexShrink: 0,
                            }}
                          >
                            {khata.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: tokens.colorNeutralForeground1 }}>
                                {khata.name}
                              </span>
                              <Badge
                                size="small"
                                appearance="tint"
                                color={khata.customerType === 'wholesale' ? 'brand' : khata.customerType === 'employee' ? 'informative' : 'subtle'}
                                style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }}
                              >
                                {khata.customerType || 'RETAIL'}
                              </Badge>
                            </div>
                            {khata.address && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', color: tokens.colorNeutralForeground3, fontSize: '11.5px' }}>
                                <Location16Regular style={{ width: 13, height: 13, flexShrink: 0 }} />
                                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {khata.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact & CNIC */}
                      <TableCell style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: tokens.colorNeutralForeground1 }}>
                            {khata.phone || 'No phone'}
                          </span>
                          {khata.cnic && (
                            <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, fontFamily: 'monospace', backgroundColor: tokens.colorNeutralBackground3, padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                              CNIC: {khata.cnic}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Credit Limit & Mini Progress Bar */}
                      <TableCell style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                            <span style={{ fontWeight: 700, color: isOverLimit ? '#DC2626' : isNearLimit ? '#D97706' : tokens.colorNeutralForeground2 }}>
                              {percent}% Used
                            </span>
                            <span style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
                              Cap: PKR {limit.toLocaleString()}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${percent}%`,
                                height: '100%',
                                backgroundColor: isOverLimit ? '#DC2626' : isNearLimit ? '#F59E0B' : '#107C41',
                                borderRadius: '999px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Debt Badge */}
                      <TableCell style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              backgroundColor: khata.currentDebt > 0 ? '#FEF2F2' : '#F0FDF4',
                              color: khata.currentDebt > 0 ? '#DC2626' : '#16A34A',
                              border: `1px solid ${khata.currentDebt > 0 ? '#FECACA' : '#BBF7D0'}`,
                              fontWeight: 800,
                              fontSize: '13px',
                              width: 'fit-content',
                            }}
                          >
                            PKR {khata.currentDebt.toLocaleString()}
                          </span>
                          {khata.dueDays && (
                            <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                              Term: {khata.dueDays} days
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          {/* Passbook / Ledger History */}
                          <button
                            type="button"
                            title="View Ledger Statement Passbook"
                            onClick={() => {
                              setSelectedKhata(khata);
                              setIsPassbookOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '7px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              backgroundColor: tokens.colorNeutralBackground1,
                              color: tokens.colorNeutralForeground1,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <BookOpen20Regular style={{ width: 15, height: 15 }} />
                            <span>Passbook</span>
                          </button>

                          {/* Receive Payment (Credit) */}
                          <button
                            type="button"
                            title="Receive Payment from Customer"
                            onClick={() => {
                              setSelectedKhata(khata);
                              setTransType('CREDIT');
                              transForm.reset({ amount: undefined, paymentMethod: 'cash', description: '' });
                              setIsPaymentOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 11px',
                              borderRadius: '7px',
                              border: '1px solid #A7F3D0',
                              backgroundColor: '#ECFDF5',
                              color: '#047857',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <ArrowCircleDown20Regular style={{ width: 15, height: 15 }} />
                            <span>Receive</span>
                          </button>

                          {/* Add Udhaar (Debit) */}
                          <button
                            type="button"
                            title="Add Manual Udhaar"
                            onClick={() => {
                              setSelectedKhata(khata);
                              setTransType('DEBIT');
                              transForm.reset({ amount: undefined, paymentMethod: 'cash', description: '' });
                              setIsPaymentOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 11px',
                              borderRadius: '7px',
                              border: '1px solid #FECACA',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <ArrowCircleUp20Regular style={{ width: 15, height: 15 }} />
                            <span>Udhaar</span>
                          </button>

                          {/* WhatsApp 1-Click Reminder */}
                          {khata.currentDebt > 0 && (
                            <button
                              type="button"
                              title="Send WhatsApp Payment Reminder"
                              onClick={() => sendWhatsAppReminder(khata)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '7px',
                                border: '1px solid #BBF7D0',
                                backgroundColor: '#F0FDF4',
                                color: '#16A34A',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Chat20Regular style={{ width: 16, height: 16 }} />
                            </button>
                          )}

                          {/* Delete Account */}
                          <button
                            type="button"
                            title="Delete Customer Account"
                            onClick={() => {
                              if (window.confirm(`Kya aap ${khata.name} ka khata account delete karna chahte hain?`)) {
                                deleteMutation.mutate(khata.id);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '7px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              backgroundColor: 'transparent',
                              color: tokens.colorNeutralForeground3,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Delete16Regular style={{ width: 15, height: 15 }} />
                          </button>
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

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 1: CREATE NEW KHATA ACCOUNT (FULL PROFESSIONAL KYC)
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isNewKhataOpen} onOpenChange={(_, d) => setIsNewKhataOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '520px' }}>
          <form onSubmit={newKhataForm.handleSubmit(onNewKhataSubmit)}>
            <DialogBody>
              <DialogTitle style={{ fontWeight: 800 }}>Create New Customer Khata Account</DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                {/* Full Name */}
                <div>
                  <Controller
                    control={newKhataForm.control}
                    name="name"
                    render={({ field }) => (
                      <CustomInput
                        label="Customer / Business Name"
                        required
                        placeholder="e.g. Muhammad Naveed / Green Mart"
                        value={field.value || ''}
                        onChange={field.onChange}
                        error={newKhataForm.formState.errors.name?.message}
                      />
                    )}
                  />
                </div>

                {/* Phone & CNIC */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="phone"
                      render={({ field }) => (
                        <CustomInput
                          label="Phone Number"
                          required
                          placeholder="0300-1234567"
                          value={field.value || ''}
                          onChange={field.onChange}
                          error={newKhataForm.formState.errors.phone?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="cnic"
                      render={({ field }) => (
                        <CustomInput
                          label="CNIC (National ID)"
                          placeholder="35201-1234567-1"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Account Type & Payment Term */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="customerType"
                      render={({ field }) => (
                        <CustomSelect
                          label="Customer Type"
                          value={field.value}
                          options={CUSTOMER_TYPE_OPTIONS}
                          onChange={(val) => field.onChange(val)}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="dueDays"
                      render={({ field }) => (
                        <CustomSelect
                          label="Credit Term"
                          value={String(field.value)}
                          options={DUE_DAYS_OPTIONS}
                          onChange={(val) => field.onChange(Number(val))}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Credit Limit & Initial Opening Debt */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <CustomInput
                          label="Credit Limit (PKR)"
                          required
                          type="number"
                          placeholder="50000"
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          error={newKhataForm.formState.errors.creditLimit?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="currentDebt"
                      render={({ field }) => (
                        <CustomInput
                          label="Initial Debt (Opening PKR)"
                          type="number"
                          placeholder="0"
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Controller
                    control={newKhataForm.control}
                    name="address"
                    render={({ field }) => (
                      <CustomInput
                        label="Shop / Home Address"
                        placeholder="e.g. Shop #4, Main Market, Lahore"
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </DialogContent>

              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsNewKhataOpen(false)}
                  style={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '8px 18px',
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={createMutation.isPending}
                  style={{
                    backgroundColor: '#E51937',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    padding: '9px 22px',
                    minWidth: '140px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
                  }}
                >
                  {createMutation.isPending ? 'Saving...' : 'Create Khata'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 2: TRANSACTION (RECEIVE PAYMENT OR ADD UDHAAR)
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isPaymentOpen} onOpenChange={(_, d) => setIsPaymentOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '440px' }}>
          <form onSubmit={transForm.handleSubmit(onTransSubmit)}>
            <DialogBody>
              <DialogTitle style={{ fontWeight: 800 }}>
                {transType === 'CREDIT' ? 'Receive Payment (Wasooli)' : 'Add Udhaar (Give Credit)'}
              </DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                {/* Selected Customer Header */}
                <div style={{ padding: '12px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '8px' }}>
                  <Body1 style={{ fontWeight: 700 }}>{selectedKhata?.name}</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block' }}>
                    Current Balance: <strong style={{ color: '#E51937' }}>PKR {selectedKhata?.currentDebt.toLocaleString()}</strong> • Limit: PKR {selectedKhata?.creditLimit.toLocaleString()}
                  </Caption1>
                </div>

                {/* Amount */}
                <div>
                  <Controller
                    control={transForm.control}
                    name="amount"
                    render={({ field }) => (
                      <CustomInput
                        label="Amount (PKR)"
                        required
                        type="number"
                        placeholder="e.g. 5000"
                        autoFocus
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        error={transForm.formState.errors.amount?.message}
                      />
                    )}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <Controller
                    control={transForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <CustomSelect
                        label="Payment Mode"
                        required
                        value={field.value}
                        options={PAYMENT_METHOD_OPTIONS}
                        onChange={(val) => field.onChange(val)}
                      />
                    )}
                  />
                </div>

                {/* Description */}
                <div>
                  <Controller
                    control={transForm.control}
                    name="description"
                    render={({ field }) => (
                      <CustomInput
                        label="Description / Bill Reference"
                        placeholder={transType === 'CREDIT' ? 'e.g. Cash received by cashier Ali' : 'e.g. 3x Oil Filter & Grocery'}
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </DialogContent>

              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  style={{
                    borderRadius: '8px',
                    fontWeight: 600,
                    padding: '8px 18px',
                    border: `1px solid ${tokens.colorNeutralStroke1}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={transactionMutation.isPending}
                  style={{
                    backgroundColor: transType === 'CREDIT' ? '#107C41' : '#E51937',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    padding: '9px 22px',
                    minWidth: '160px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    boxShadow: transType === 'CREDIT' ? '0 2px 8px rgba(16, 124, 65, 0.25)' : '0 2px 8px rgba(229, 25, 55, 0.25)',
                  }}
                >
                  {transactionMutation.isPending ? 'Processing...' : transType === 'CREDIT' ? 'Confirm Payment Received' : 'Add Udhaar to Khata'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 3: CUSTOMER PASSBOOK / LEDGER STATEMENT
      ════════════════════════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════════════════════
          MODAL 3: CUSTOMER PASSBOOK / LEDGER STATEMENT
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isPassbookOpen} onOpenChange={(_, d) => setIsPassbookOpen(d.open)}>
        <DialogSurface style={{ borderRadius: '16px', maxWidth: '920px', minWidth: '780px', width: '92vw', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            {/* 1. Header: Title, Customer Details, Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                gap: '16px',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontWeight: 800, fontSize: '20px', margin: 0, padding: 0, color: tokens.colorNeutralForeground1, whiteSpace: 'nowrap' }}>
                    Ledger Passbook Statement
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      whiteSpace: 'nowrap',
                      backgroundColor: (selectedKhata?.currentDebt || 0) > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: (selectedKhata?.currentDebt || 0) > 0 ? '#EF4444' : '#10B981',
                      border: `1px solid ${(selectedKhata?.currentDebt || 0) > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    }}
                  >
                    {(selectedKhata?.currentDebt || 0) > 0 ? 'Outstanding Due' : 'Account Settled'}
                  </span>
                </div>
                <div style={{ color: tokens.colorNeutralForeground2, marginTop: '2px', fontSize: '13px' }}>
                  <strong style={{ color: tokens.colorNeutralForeground1, fontWeight: 700 }}>{selectedKhata?.name}</strong>
                  {' · '}{selectedKhata?.phone || 'No phone'}
                  {' · '}{selectedKhata?.address || 'No address'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
                <Button
                  size="medium"
                  appearance="secondary"
                  icon={<Print20Regular />}
                  onClick={printStatement}
                  style={{ borderRadius: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  Print Statement
                </Button>
                {selectedKhata && selectedKhata.currentDebt > 0 && (
                  <Button
                    size="medium"
                    appearance="primary"
                    icon={<Chat20Regular />}
                    style={{
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={() => sendWhatsAppReminder(selectedKhata)}
                  >
                    WhatsApp Reminder
                  </Button>
                )}
              </div>
            </div>

            {/* 2. 4 KPI Summary Metric Cards (Full Width Row) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                width: '100%',
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: tokens.colorNeutralBackground3,
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ color: tokens.colorNeutralForeground3, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Credit Limit
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: tokens.colorNeutralForeground1, fontFamily: tokens.fontFamilyMonospace, whiteSpace: 'nowrap' }}>
                  PKR {selectedKhata?.creditLimit.toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: tokens.colorNeutralBackground3,
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ color: tokens.colorNeutralForeground3, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Total Udhaar (Diya)
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444', fontFamily: tokens.fontFamilyMonospace, whiteSpace: 'nowrap' }}>
                  +PKR {passbookTransactions.filter((tx) => tx.type === 'DEBIT').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: tokens.colorNeutralBackground3,
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ color: tokens.colorNeutralForeground3, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Total Wasooli (Received)
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981', fontFamily: tokens.fontFamilyMonospace, whiteSpace: 'nowrap' }}>
                  -PKR {passbookTransactions.filter((tx) => tx.type === 'CREDIT').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(229, 25, 55, 0.08)',
                  border: '1px solid rgba(229, 25, 55, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Net Outstanding
                </span>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#E51937', fontFamily: tokens.fontFamilyMonospace, whiteSpace: 'nowrap' }}>
                  PKR {selectedKhata?.currentDebt.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 3. Table Container */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '2px', width: '100%' }}>
              {isLoadingPassbook ? (
                <div style={{ padding: '40px', textAlign: 'center', color: tokens.colorNeutralForeground2 }}>
                  Loading passbook ledger...
                </div>
              ) : passbookTransactions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                  No transactions recorded for this customer yet.
                </div>
              ) : (
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${tokens.colorNeutralStroke2}`, backgroundColor: tokens.colorNeutralBackground1 }}>
                  <Table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: tokens.colorNeutralBackground3, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                        <TableHeaderCell style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2, width: '140px', whiteSpace: 'nowrap' }}>
                          Date &amp; Time
                        </TableHeaderCell>
                        <TableHeaderCell style={{ padding: '12px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2, width: 'auto' }}>
                          Description / Mode
                        </TableHeaderCell>
                        <TableHeaderCell style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2, width: '130px', whiteSpace: 'nowrap' }}>
                          Debit (Diya)
                        </TableHeaderCell>
                        <TableHeaderCell style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2, width: '130px', whiteSpace: 'nowrap' }}>
                          Credit (Wasooli)
                        </TableHeaderCell>
                        <TableHeaderCell style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2, width: '120px', whiteSpace: 'nowrap' }}>
                          Balance
                        </TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {passbookTransactions.map((tx) => (
                        <TableRow key={tx.id} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke3}` }}>
                          <TableCell style={{ padding: '12px 14px', fontSize: '12px', color: tokens.colorNeutralForeground2 }}>
                            <div style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, whiteSpace: 'nowrap' }}>
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, marginTop: '2px', whiteSpace: 'nowrap' }}>
                              {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {tx.description || 'Transaction'}
                            </div>
                            <div style={{ color: tokens.colorNeutralForeground3, textTransform: 'capitalize', marginTop: '2px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                              Payment Mode: <strong style={{ color: tokens.colorNeutralForeground2 }}>{tx.paymentMethod}</strong>
                            </div>
                          </TableCell>
                          <TableCell style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {tx.type === 'DEBIT' ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  fontFamily: tokens.fontFamilyMonospace,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                +PKR {tx.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>
                            )}
                          </TableCell>
                          <TableCell style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {tx.type === 'CREDIT' ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.25)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  fontFamily: tokens.fontFamilyMonospace,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                -PKR {tx.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ color: tokens.colorNeutralForeground3 }}>—</span>
                            )}
                          </TableCell>
                          <TableCell style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: '13px', fontFamily: tokens.fontFamilyMonospace, color: tokens.colorNeutralForeground1, whiteSpace: 'nowrap' }}>
                            PKR {tx.balanceAfter.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* 4. Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: `1px solid ${tokens.colorNeutralStroke2}` }}>
              <span style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
                Showing {passbookTransactions.length} transaction record{passbookTransactions.length !== 1 ? 's' : ''}
              </span>
              <Button
                appearance="secondary"
                onClick={() => setIsPassbookOpen(false)}
                style={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  padding: '8px 20px',
                }}
              >
                Close Passbook
              </Button>
            </div>
          </div>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
