import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Subtitle2,
  Caption1,
  Badge,
  Button,
  Checkbox,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Search20Regular,
  Print20Regular,
  Edit20Regular,
  Delete20Regular,
  Dismiss20Regular,
  PeopleCommunity24Regular,
  Call20Regular,
  BuildingRetail24Regular,
  Add20Regular,
  Checkmark20Regular,
  ArrowCircleDown20Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl } from '@/lib/api';
import { StockMovement } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { vendorStorage, Vendor } from './vendorStorage';

const PARTY_TYPE_OPTIONS = [
  { value: 'Supplier (Vendor)', label: 'Supplier (Vendor)' },
  { value: 'Wholesale Distributor', label: 'Wholesale Distributor' },
  { value: 'Food & Meat Vendor', label: 'Food & Meat Vendor' },
  { value: 'Bakery Supplier', label: 'Bakery Supplier' },
  { value: 'Packaging & Cartons', label: 'Packaging & Cartons' },
  { value: 'General Party', label: 'General Party' },
];

// Form validation schema with rich 2-row layout
const vendorSchema = z.object({
  name: z.string().min(2, 'Vendor/Business Name is required'),
  contactPerson: z.string().optional(),
  category: z.string().default('Supplier (Vendor)'),
  phone: z.string().optional(),
  address: z.string().optional(),
  openingBalance: z.coerce.number().optional().default(0),
});

type VendorFormData = z.infer<typeof vendorSchema>;

const editVendorSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Vendor/Business Name is required'),
  contactPerson: z.string().optional(),
  category: z.string().default('Supplier (Vendor)'),
  phone: z.string().optional(),
  address: z.string().optional(),
  openingBalance: z.coerce.number().optional().default(0),
});

type EditVendorFormData = z.infer<typeof editVendorSchema>;

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
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
    letterSpacing: '-0.2px',
  },
  cardForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  row1: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr',
    gap: '16px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 2.4fr auto',
    gap: '16px',
    alignItems: 'center',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr 1fr',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  saveBtn: {
    height: '38px',
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
    padding: '0 22px',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
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
    padding: '14px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    color: tokens.colorNeutralForeground1,
    verticalAlign: 'middle',
  },
  tableRow: {
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  // Slide-over Drawer styles
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
  saveBtnIcon: {
    width: '16px',
    height: '16px',
  },
  directoryTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
  },
  searchBoxContainer: {
    minWidth: '280px',
    maxWidth: '420px',
    width: '100%',
  },
  totalCountCaption: {
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
  },
  thSelect: {
    width: '36px',
    textAlign: 'center',
  },
  thRight: {
    textAlign: 'right',
  },
  thCenter: {
    textAlign: 'center',
    minWidth: '100px',
  },
  emptyTd: {
    padding: '36px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  tdCenter: {
    textAlign: 'center',
  },
  vendorNameCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  vendorNameText: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    fontSize: '13px',
  },
  vendorRepText: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  badgeBold: {
    fontWeight: 600,
  },
  phoneText: {
    color: tokens.colorNeutralForeground1,
    fontWeight: 500,
  },
  secondaryText: {
    color: tokens.colorNeutralForeground2,
    fontSize: '12px',
  },
  tdBalanceDebit: {
    textAlign: 'right',
    fontWeight: 700,
    color: '#D13438',
  },
  tdBalanceCredit: {
    textAlign: 'right',
    fontWeight: 700,
    color: '#107C41',
  },
  actionBtnsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  actionBtnStockIn: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    padding: 0,
    borderRadius: '6px',
    backgroundColor: 'rgba(16, 124, 65, 0.12)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(16, 124, 65, 0.25)', borderBottomColor: 'rgba(16, 124, 65, 0.25)', borderLeftColor: 'rgba(16, 124, 65, 0.25)', borderRightColor: 'rgba(16, 124, 65, 0.25)',
  },
  actionBtnPrint: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    padding: 0,
    borderRadius: '6px',
    backgroundColor: 'rgba(0, 120, 212, 0.12)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(0, 120, 212, 0.25)', borderBottomColor: 'rgba(0, 120, 212, 0.25)', borderLeftColor: 'rgba(0, 120, 212, 0.25)', borderRightColor: 'rgba(0, 120, 212, 0.25)',
  },
  actionBtnEdit: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    padding: 0,
    borderRadius: '6px',
    backgroundColor: 'rgba(229, 25, 55, 0.12)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(229, 25, 55, 0.25)', borderBottomColor: 'rgba(229, 25, 55, 0.25)', borderLeftColor: 'rgba(229, 25, 55, 0.25)', borderRightColor: 'rgba(229, 25, 55, 0.25)',
  },
  actionBtnDelete: {
    width: '30px',
    height: '30px',
    minWidth: '30px',
    padding: 0,
    borderRadius: '6px',
    backgroundColor: 'rgba(209, 52, 56, 0.12)',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: 'rgba(209, 52, 56, 0.25)', borderBottomColor: 'rgba(209, 52, 56, 0.25)', borderLeftColor: 'rgba(209, 52, 56, 0.25)', borderRightColor: 'rgba(209, 52, 56, 0.25)',
  },
  iconStockIn: {
    color: '#107C41',
    width: '16px',
    height: '16px',
  },
  iconPrint: {
    color: '#0078D4',
    width: '16px',
    height: '16px',
  },
  iconEdit: {
    color: '#E51937',
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
    gap: '8px',
  },
  drawerTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  drawerCloseBtn: {
    minWidth: 'auto',
    padding: '6px',
  },
  drawerForm: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  drawerSaveBtn: {
    backgroundColor: '#E51937',
  },
  printModalSurface: {
    maxWidth: '480px',
    width: '92vw',
    borderRadius: '12px',
    padding: '24px',
  },
  printModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  printModalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 800,
  },
  printModalCloseBtn: {
    minWidth: 'auto',
    padding: '4px',
  },
  slipContainer: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    padding: '24px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    lineHeight: '1.6',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  slipHeader: {
    textAlign: 'center',
    borderBottomTopWidth: 0,
    borderBottomWidth: '1px',
    borderBottomStyle: 'dashed',
    borderBottomColor: '#000000',
    paddingBottom: '10px',
    marginBottom: '12px',
  },
  slipStoreTitle: {
    fontWeight: 700,
    fontSize: '16px',
    letterSpacing: '1px',
  },
  slipDateText: {
    fontSize: '10px',
    color: '#555555',
  },
  slipSection: {
    marginBottom: '12px',
  },
  slipRowBetween: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  slipBoldLabel: {
    fontWeight: 700,
  },
  slipInvoicesBox: {
    margin: '10px 0',
    borderTopWidth: '1px',
    borderTopStyle: 'dashed',
    borderTopColor: '#BBBBBB',
    borderBottomWidth: '1px',
    borderBottomStyle: 'dashed',
    borderBottomColor: '#BBBBBB',
    padding: '8px 0',
  },
  slipInvoicesHeader: {
    fontWeight: 700,
    fontSize: '11px',
    marginBottom: '4px',
    textTransform: 'uppercase',
    color: '#333333',
  },
  slipInvoiceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    padding: '2px 0',
  },
  slipInvoiceCost: {
    fontWeight: 600,
  },
  slipBalanceBox: {
    borderTopWidth: '1px',
    borderTopStyle: 'dashed',
    borderTopColor: '#000000',
    paddingTop: '10px',
    marginBottom: '10px',
  },
  slipBalanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontWeight: 700,
    fontSize: '14px',
  },
  slipFooterSignature: {
    textAlign: 'center',
    fontSize: '10px',
    color: '#777777',
    marginTop: '16px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#DDDDDD',
    paddingTop: '8px',
  },
  printModalActions: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  printModalCloseActionBtn: {
    height: '38px',
    padding: '0 20px',
    borderRadius: '6px',
  },
  printModalConfirmBtn: {
    height: '38px',
    padding: '0 22px',
    borderRadius: '6px',
    backgroundColor: '#0078D4',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  },
});

export function VendorsView(): React.JSX.Element {
  const styles = useStyles();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>(() => vendorStorage.getVendors());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Right Drawer State for Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingVendor, setPrintingVendor] = useState<Vendor | null>(null);

  // Fetch Stock Movements to link with Vendor Purchases
  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/stock-movements`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Form for Adding new Vendor
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema) as any,
    defaultValues: {
      name: '',
      contactPerson: '',
      category: 'Supplier (Vendor)',
      phone: '',
      address: '',
      openingBalance: 0,
    },
  });

  // Form for Editing existing Vendor
  const editForm = useForm<EditVendorFormData>({
    resolver: zodResolver(editVendorSchema) as any,
    defaultValues: {
      id: '',
      name: '',
      contactPerson: '',
      category: 'Supplier (Vendor)',
      phone: '',
      address: '',
      openingBalance: 0,
    },
  });

  const onSave = (data: VendorFormData) => {
    const created = vendorStorage.saveVendor({
      name: data.name,
      companyName: data.name,
      contactPerson: data.contactPerson || '',
      category: data.category,
      phone: data.phone || '',
      address: data.address || '',
      openingBalance: data.openingBalance || 0,
    });

    setVendors(vendorStorage.getVendors());
    form.reset({
      name: '',
      contactPerson: '',
      category: 'Supplier (Vendor)',
      phone: '',
      address: '',
      openingBalance: 0,
    });
  };

  const onUpdate = (data: EditVendorFormData) => {
    vendorStorage.saveVendor({
      id: data.id,
      name: data.name,
      companyName: data.name,
      contactPerson: data.contactPerson || '',
      category: data.category,
      phone: data.phone || '',
      address: data.address || '',
      openingBalance: data.openingBalance || 0,
    });

    setVendors(vendorStorage.getVendors());
    setIsDrawerOpen(false);
    setEditingVendor(null);
  };

  const handleOpenEdit = (v: Vendor) => {
    setEditingVendor(v);
    editForm.reset({
      id: v.id,
      name: v.name || v.companyName || '',
      contactPerson: v.contactPerson || '',
      category: v.category || 'Supplier (Vendor)',
      phone: v.phone || '',
      address: v.address || '',
      openingBalance: v.openingBalance || 0,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenPrint = (v: Vendor) => {
    setPrintingVendor(v);
    setIsPrintModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this vendor record?')) {
      vendorStorage.deleteVendor(id);
      setVendors(vendorStorage.getVendors());
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      !searchQuery ||
      v.name.toLowerCase().includes(q) ||
      (v.companyName && v.companyName.toLowerCase().includes(q)) ||
      (v.phone && v.phone.toLowerCase().includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      (v.address && v.address.toLowerCase().includes(q))
    );
  });

  const isAllSelected = filteredVendors.length > 0 && selectedIds.length === filteredVendors.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVendors.map((v) => v.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className={styles.container}>
      {/* ── CARD 1: Add New Vendor / Party Inline Form ───────────────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Subtitle2 className={styles.directoryTitle}>
            Add New Vendor / Party
          </Subtitle2>
        </div>

        <form onSubmit={form.handleSubmit(onSave)} className={styles.cardForm}>
          {/* Row 1: Identification & Classification */}
          <div className={styles.row1}>
            {/* Field 1: VENDOR / PERSON NAME */}
            <Controller
              name="name"
              control={form.control}
              render={({ field }) => (
                <CustomInput
                  label="Vendor / Business Name"
                  required
                  placeholder="Enter vendor or business name..."
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={form.formState.errors.name?.message}
                />
              )}
            />

            {/* Field 2: PARTY TYPE */}
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <CustomSelect
                  label="Party Type"
                  required
                  placeholder="Select Party Type"
                  value={field.value || 'Supplier (Vendor)'}
                  onChange={field.onChange}
                  options={PARTY_TYPE_OPTIONS}
                />
              )}
            />

            {/* Field 3: CONTACT PERSON / REP */}
            <Controller
              name="contactPerson"
              control={form.control}
              render={({ field }) => (
                <CustomInput
                  label="Contact Person / Rep"
                  placeholder="e.g. Sales manager, rep name..."
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Row 2: Contact, Address Note & Submit Action */}
          <div className={styles.row2}>
            {/* Field 4: PHONE NUMBER */}
            <Controller
              name="phone"
              control={form.control}
              render={({ field }) => (
                <CustomInput
                  label="Phone Number"
                  placeholder="0300-1234567"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Field 5: COMPANY / ADDRESS NOTE */}
            <Controller
              name="address"
              control={form.control}
              render={({ field }) => (
                <CustomInput
                  label="Company / Address Note"
                  placeholder="Shop #, Market, Area, City or note..."
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Save Button */}
            <div>
              <button type="submit" className={styles.saveBtn}>
                <Add20Regular className={styles.saveBtnIcon} />
                <span>Save Vendor / Supplier</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── CARD 2: Vendors & Suppliers Directory (Logs Table) ───────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Subtitle2 className={styles.directoryTitle}>
            Vendors &amp; Suppliers Directory
          </Subtitle2>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.searchBoxContainer}>
            <CustomInput
              placeholder="Search Vendors by Name, Phone, Address, Category..."
              leftIcon={<Search20Regular />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Caption1 className={styles.totalCountCaption}>
            Total {filteredVendors.length} Vendor Records
          </Caption1>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={mergeClasses(styles.th, styles.thSelect)}>
                  <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className={styles.th}>VENDOR / PERSON NAME</th>
                <th className={styles.th}>PARTY TYPE</th>
                <th className={styles.th}>PHONE NUMBER</th>
                <th className={styles.th}>COMPANY / ADDRESS NOTE</th>
                <th className={mergeClasses(styles.th, styles.thRight)}>BALANCE</th>
                <th className={styles.th}>REGISTERED DATE</th>
                <th className={mergeClasses(styles.th, styles.thCenter)}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyTd}>
                    No vendor or supplier records found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v) => {
                  const isChecked = selectedIds.includes(v.id);
                  const dt = new Date(v.createdAt || Date.now());

                  return (
                    <tr key={v.id} className={styles.tableRow}>
                      <td className={mergeClasses(styles.td, styles.tdCenter)}>
                        <Checkbox checked={isChecked} onChange={() => toggleSelectRow(v.id)} />
                      </td>
                      <td className={styles.td}>
                        <div className={styles.vendorNameCol}>
                          <span className={styles.vendorNameText}>
                            {v.name}
                          </span>
                          {v.contactPerson && (
                            <span className={styles.vendorRepText}>
                              Rep: {v.contactPerson}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <Badge appearance="tint" color="brand" className={styles.badgeBold}>
                          {v.category || 'Supplier (Vendor)'}
                        </Badge>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.phoneText}>
                          {v.phone || '—'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.secondaryText}>
                          {v.address || '—'}
                        </span>
                      </td>
                      <td className={mergeClasses(styles.td, (v.openingBalance || 0) > 0 ? styles.tdBalanceDebit : styles.tdBalanceCredit)}>
                        {formatPKR(v.openingBalance || 0)}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.secondaryText}>
                          {dt.toLocaleDateString()}
                        </span>
                      </td>
                      <td className={mergeClasses(styles.td, styles.tdCenter)}>
                        {/* ── ACTION ICONS: Stock In Shortcut, Print, Edit (Right Drawer), Delete ── */}
                        <div className={styles.actionBtnsRow}>
                          <Tooltip content="Record Stock In from this Vendor" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<ArrowCircleDown20Regular className={styles.iconStockIn} />}
                              onClick={() => navigate('/inventory/stock-in', { state: { vendorName: v.companyName || v.name, vendorId: v.id } })}
                              className={styles.actionBtnStockIn}
                            />
                          </Tooltip>

                          <Tooltip content="Print Vendor Slip / Statement" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Print20Regular className={styles.iconPrint} />}
                              onClick={() => handleOpenPrint(v)}
                              className={styles.actionBtnPrint}
                            />
                          </Tooltip>

                          <Tooltip content="Edit Vendor (Right Drawer)" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Edit20Regular className={styles.iconEdit} />}
                              onClick={() => handleOpenEdit(v)}
                              className={styles.actionBtnEdit}
                            />
                          </Tooltip>

                          <Tooltip content="Delete Vendor" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Delete20Regular className={styles.iconDelete} />}
                              onClick={() => handleDelete(v.id)}
                              className={styles.actionBtnDelete}
                            />
                          </Tooltip>
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

      {/* ── RIGHT-SIDE SLIDE-OVER DRAWER FOR EDITING VENDOR ─────────── */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderLeft}>
                <Edit20Regular className={styles.iconEdit} />
                <Subtitle2 className={styles.drawerTitle}>
                  Edit Vendor / Supplier
                </Subtitle2>
              </div>
              <Button
                appearance="subtle"
                icon={<Dismiss20Regular />}
                onClick={() => setIsDrawerOpen(false)}
                className={styles.drawerCloseBtn}
              />
            </div>

            <form onSubmit={editForm.handleSubmit(onUpdate)} className={styles.drawerForm}>
              <div className={styles.drawerBody}>
                {/* VENDOR NAME */}
                <Controller
                  name="name"
                  control={editForm.control}
                  render={({ field }) => (
                    <CustomInput
                      label="Vendor / Business Name"
                      required
                      placeholder="Vendor name..."
                      value={field.value || ''}
                      onChange={field.onChange}
                      error={editForm.formState.errors.name?.message}
                    />
                  )}
                />

                {/* PARTY TYPE */}
                <Controller
                  name="category"
                  control={editForm.control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Party Type"
                      required
                      placeholder="Select Party Type"
                      value={field.value || 'Supplier (Vendor)'}
                      onChange={field.onChange}
                      options={PARTY_TYPE_OPTIONS}
                    />
                  )}
                />

                {/* CONTACT PERSON */}
                <Controller
                  name="contactPerson"
                  control={editForm.control}
                  render={({ field }) => (
                    <CustomInput
                      label="Contact Person / Rep"
                      placeholder="Contact person..."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />

                {/* PHONE */}
                <Controller
                  name="phone"
                  control={editForm.control}
                  render={({ field }) => (
                    <CustomInput
                      label="Phone Number"
                      placeholder="Phone number..."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />

                {/* ADDRESS */}
                <Controller
                  name="address"
                  control={editForm.control}
                  render={({ field }) => (
                    <CustomInput
                      label="Company / Address Note"
                      placeholder="Address..."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className={styles.drawerFooter}>
                <Button appearance="secondary" onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  icon={<Checkmark20Regular />}
                  className={styles.drawerSaveBtn}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINT VENDOR STATEMENT MODAL ────────────────────────────── */}
      <Dialog open={isPrintModalOpen} onOpenChange={(_, d) => setIsPrintModalOpen(d.open)}>
        <DialogSurface className={styles.printModalSurface}>
          <div className={styles.printModalHeader}>
            <DialogTitle className={styles.printModalTitle}>
              Vendor Account Statement
            </DialogTitle>
            <Button
              appearance="subtle"
              icon={<Dismiss20Regular />}
              onClick={() => setIsPrintModalOpen(false)}
              className={styles.printModalCloseBtn}
            />
          </div>

          <DialogBody>
            <DialogContent>
              {printingVendor && (
                <div
                  id="printable-vendor-slip"
                  className={styles.slipContainer}
                >
                  <div className={styles.slipHeader}>
                    <div className={styles.slipStoreTitle}>OMNIPOS STORE</div>
                    <div>VENDOR / SUPPLIER STATEMENT</div>
                    <div className={styles.slipDateText}>
                      Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </div>
                  </div>

                  <div className={styles.slipSection}>
                    <div className={styles.slipRowBetween}>
                      <span className={styles.slipBoldLabel}>Vendor:</span>
                      <span>{printingVendor.name}</span>
                    </div>
                    <div className={styles.slipRowBetween}>
                      <span className={styles.slipBoldLabel}>Type:</span>
                      <span>{printingVendor.category || 'Supplier'}</span>
                    </div>
                    {printingVendor.contactPerson && (
                      <div className={styles.slipRowBetween}>
                        <span className={styles.slipBoldLabel}>Contact Rep:</span>
                        <span>{printingVendor.contactPerson}</span>
                      </div>
                    )}
                    {printingVendor.phone && (
                      <div className={styles.slipRowBetween}>
                        <span className={styles.slipBoldLabel}>Phone:</span>
                        <span>{printingVendor.phone}</span>
                      </div>
                    )}
                    {printingVendor.address && (
                      <div className={styles.slipRowBetween}>
                        <span className={styles.slipBoldLabel}>Address:</span>
                        <span>{printingVendor.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Itemized Stock In Invoices for this Vendor */}
                  {(() => {
                    const vendorMovements = movements.filter(
                      (m) =>
                        m.type === 'in' &&
                        ((m.reason && m.reason.toLowerCase() === (printingVendor.companyName || printingVendor.name).toLowerCase()) ||
                          (m.note && m.note.toLowerCase().includes(printingVendor.name.toLowerCase())))
                    );
                    if (vendorMovements.length === 0) return null;
                    return (
                      <div className={styles.slipInvoicesBox}>
                        <div className={styles.slipInvoicesHeader}>
                          Recent Invoices Received ({vendorMovements.length}):
                        </div>
                        {vendorMovements.slice(0, 5).map((m, idx) => (
                          <div key={idx} className={styles.slipInvoiceRow}>
                            <span>{new Date(m.date).toLocaleDateString()} • {m.productName} ({m.quantity}x)</span>
                            <span className={styles.slipInvoiceCost}>{formatPKR((m.quantity || 0) * (m.unitCost || 0))}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className={styles.slipBalanceBox}>
                    <div className={styles.slipBalanceRow}>
                      <span>CURRENT BALANCE:</span>
                      <span>{formatPKR(printingVendor.openingBalance || 0)}</span>
                    </div>
                  </div>

                  <div className={styles.slipFooterSignature}>
                    Authorized Signature: __________________
                  </div>
                </div>
              )}
            </DialogContent>

            <DialogActions className={styles.printModalActions}>
              <Button
                appearance="secondary"
                onClick={() => setIsPrintModalOpen(false)}
                className={styles.printModalCloseActionBtn}
              >
                Close
              </Button>
              <Button
                appearance="primary"
                icon={<Print20Regular />}
                onClick={() => window.print()}
                className={styles.printModalConfirmBtn}
              >
                Print Statement
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
