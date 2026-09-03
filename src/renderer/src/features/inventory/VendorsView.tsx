import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Subtitle2,
  Caption1,
  Badge,
  Button,
  Input,
  Select,
  Dropdown,
  Option,
  Checkbox,
  Tooltip,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
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
import { vendorStorage, Vendor } from './vendorStorage';

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
    alignItems: 'flex-end',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr 1fr',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
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
          <Subtitle2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
            Add New Vendor / Party
          </Subtitle2>
        </div>

        <form onSubmit={form.handleSubmit(onSave)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: Identification & Classification */}
          <div className={styles.row1}>
            {/* Field 1: VENDOR / PERSON NAME */}
            <div>
              <span className={styles.fieldLabel}>
                VENDOR / BUSINESS NAME <span style={{ color: '#E51937' }}>*</span>
              </span>
              <Controller
                name="name"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Enter vendor or business name..."
                    appearance="outline"
                    style={{ width: '100%', height: '36px' }}
                  />
                )}
              />
            </div>

            {/* Field 2: PARTY TYPE */}
            <div>
              <span className={styles.fieldLabel} style={{ color: '#E51937' }}>
                PARTY TYPE <span style={{ color: '#E51937' }}>*</span>
              </span>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <Dropdown
                    placeholder="Select Party Type"
                    value={field.value || ''}
                    selectedOptions={field.value ? [field.value] : []}
                    onOptionSelect={(_, d) => field.onChange(d.optionValue || '')}
                    style={{ width: '100%', height: '36px' }}
                  >
                    <Option value="Supplier (Vendor)" text="Supplier (Vendor)">Supplier (Vendor)</Option>
                    <Option value="Wholesale Distributor" text="Wholesale Distributor">Wholesale Distributor</Option>
                    <Option value="Food & Meat Vendor" text="Food & Meat Vendor">Food &amp; Meat Vendor</Option>
                    <Option value="Bakery Supplier" text="Bakery Supplier">Bakery Supplier</Option>
                    <Option value="Packaging & Cartons" text="Packaging & Cartons">Packaging &amp; Cartons</Option>
                    <Option value="General Party" text="General Party">General Party</Option>
                  </Dropdown>
                )}
              />
            </div>

            {/* Field 3: CONTACT PERSON / REP */}
            <div>
              <span className={styles.fieldLabel}>CONTACT PERSON / REP</span>
              <Controller
                name="contactPerson"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g. Sales manager, rep name..."
                    appearance="outline"
                    style={{ width: '100%', height: '36px' }}
                  />
                )}
              />
            </div>
          </div>

          {/* Row 2: Contact, Address Note & Submit Action */}
          <div className={styles.row2}>
            {/* Field 4: PHONE NUMBER */}
            <div>
              <span className={styles.fieldLabel}>PHONE NUMBER</span>
              <Controller
                name="phone"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="0300-1234567"
                    appearance="outline"
                    style={{ width: '100%', height: '36px' }}
                  />
                )}
              />
            </div>

            {/* Field 5: COMPANY / ADDRESS NOTE */}
            <div>
              <span className={styles.fieldLabel}>COMPANY / ADDRESS NOTE</span>
              <Controller
                name="address"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Shop #, Market, Area, City or note..."
                    appearance="outline"
                    style={{ width: '100%', height: '36px' }}
                  />
                )}
              />
            </div>

            {/* Save Button */}
            <div>
              <button type="submit" className={styles.saveBtn}>
                <Add20Regular style={{ width: 16, height: 16 }} />
                <span>Save Vendor / Supplier</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── CARD 2: Vendors & Suppliers Directory (Logs Table) ───────── */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <Subtitle2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
            Vendors &amp; Suppliers Directory
          </Subtitle2>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <Input
            appearance="outline"
            placeholder="Search Vendors by Name, Phone, Address, Category..."
            contentBefore={<Search20Regular style={{ color: tokens.colorNeutralForeground3 }} />}
            value={searchQuery}
            onChange={(_, d) => setSearchQuery(d.value)}
            style={{ minWidth: '280px', maxWidth: '420px', width: '100%' }}
          />

          <Caption1 style={{ color: tokens.colorNeutralForeground3, fontWeight: 600 }}>
            Total {filteredVendors.length} Vendor Records
          </Caption1>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: '36px', textAlign: 'center' }}>
                  <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className={styles.th}>VENDOR / PERSON NAME</th>
                <th className={styles.th}>PARTY TYPE</th>
                <th className={styles.th}>PHONE NUMBER</th>
                <th className={styles.th}>COMPANY / ADDRESS NOTE</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>BALANCE</th>
                <th className={styles.th}>REGISTERED DATE</th>
                <th className={styles.th} style={{ textAlign: 'center', minWidth: '100px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    No vendor or supplier records found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v) => {
                  const isChecked = selectedIds.includes(v.id);
                  const dt = new Date(v.createdAt || Date.now());

                  return (
                    <tr key={v.id} className={styles.tableRow}>
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <Checkbox checked={isChecked} onChange={() => toggleSelectRow(v.id)} />
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, fontSize: '13px' }}>
                            {v.name}
                          </span>
                          {v.contactPerson && (
                            <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                              Rep: {v.contactPerson}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <Badge appearance="tint" color="brand" style={{ fontWeight: 600 }}>
                          {v.category || 'Supplier (Vendor)'}
                        </Badge>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground1, fontWeight: 500 }}>
                          {v.phone || '—'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground2, fontSize: '12px' }}>
                          {v.address || '—'}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 700, color: (v.openingBalance || 0) > 0 ? '#D13438' : '#107C41' }}>
                        {formatPKR(v.openingBalance || 0)}
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground2, fontSize: '12px' }}>
                          {dt.toLocaleDateString()}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        {/* ── ACTION ICONS: Stock In Shortcut, Print, Edit (Right Drawer), Delete ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Tooltip content="Record Stock In from this Vendor" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<ArrowCircleDown20Regular style={{ color: '#107C41', width: 16, height: 16 }} />}
                              onClick={() => navigate('/inventory/stock-in', { state: { vendorName: v.companyName || v.name, vendorId: v.id } })}
                              style={{
                                width: '30px',
                                height: '30px',
                                minWidth: '30px',
                                padding: 0,
                                borderRadius: '6px',
                                backgroundColor: 'rgba(16, 124, 65, 0.12)',
                                border: '1px solid rgba(16, 124, 65, 0.25)',
                              }}
                            />
                          </Tooltip>

                          <Tooltip content="Print Vendor Slip / Statement" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Print20Regular style={{ color: '#0078D4', width: 16, height: 16 }} />}
                              onClick={() => handleOpenPrint(v)}
                              style={{
                                width: '30px',
                                height: '30px',
                                minWidth: '30px',
                                padding: 0,
                                borderRadius: '6px',
                                backgroundColor: 'rgba(0, 120, 212, 0.12)',
                                border: '1px solid rgba(0, 120, 212, 0.25)',
                              }}
                            />
                          </Tooltip>

                          <Tooltip content="Edit Vendor (Right Drawer)" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Edit20Regular style={{ color: '#E51937', width: 16, height: 16 }} />}
                              onClick={() => handleOpenEdit(v)}
                              style={{
                                width: '30px',
                                height: '30px',
                                minWidth: '30px',
                                padding: 0,
                                borderRadius: '6px',
                                backgroundColor: 'rgba(229, 25, 55, 0.12)',
                                border: '1px solid rgba(229, 25, 55, 0.25)',
                              }}
                            />
                          </Tooltip>

                          <Tooltip content="Delete Vendor" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Delete20Regular style={{ color: '#D13438', width: 16, height: 16 }} />}
                              onClick={() => handleDelete(v.id)}
                              style={{
                                width: '30px',
                                height: '30px',
                                minWidth: '30px',
                                padding: 0,
                                borderRadius: '6px',
                                backgroundColor: 'rgba(209, 52, 56, 0.12)',
                                border: '1px solid rgba(209, 52, 56, 0.25)',
                              }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit20Regular style={{ color: '#E51937' }} />
                <Subtitle2 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, margin: 0 }}>
                  Edit Vendor / Supplier
                </Subtitle2>
              </div>
              <Button
                appearance="subtle"
                icon={<Dismiss20Regular />}
                onClick={() => setIsDrawerOpen(false)}
                style={{ minWidth: 'auto', padding: '6px' }}
              />
            </div>

            <form onSubmit={editForm.handleSubmit(onUpdate)} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className={styles.drawerBody}>
                {/* VENDOR NAME */}
                <div>
                  <span className={styles.fieldLabel}>
                    VENDOR / PERSON NAME <span style={{ color: '#E51937' }}>*</span>
                  </span>
                  <Controller
                    name="name"
                    control={editForm.control}
                    render={({ field }) => (
                      <Input {...field} appearance="outline" style={{ width: '100%' }} />
                    )}
                  />
                </div>

                {/* PARTY TYPE */}
                <div>
                  <span className={styles.fieldLabel} style={{ color: '#107C41' }}>
                    PARTY TYPE
                  </span>
                  <Controller
                    name="category"
                    control={editForm.control}
                    render={({ field }) => (
                      <Dropdown
                        placeholder="Select Party Type"
                        value={field.value || ''}
                        selectedOptions={field.value ? [field.value] : []}
                        onOptionSelect={(_, d) => field.onChange(d.optionValue || '')}
                        style={{ width: '100%' }}
                      >
                        <Option value="Supplier (Vendor)" text="Supplier (Vendor)">Supplier (Vendor)</Option>
                        <Option value="Wholesale Distributor" text="Wholesale Distributor">Wholesale Distributor</Option>
                        <Option value="Food & Meat Vendor" text="Food & Meat Vendor">Food &amp; Meat Vendor</Option>
                        <Option value="Bakery Supplier" text="Bakery Supplier">Bakery Supplier</Option>
                        <Option value="Packaging & Cartons" text="Packaging & Cartons">Packaging &amp; Cartons</Option>
                        <Option value="General Party" text="General Party">General Party</Option>
                      </Dropdown>
                    )}
                  />
                </div>

                {/* CONTACT PERSON */}
                <div>
                  <span className={styles.fieldLabel}>CONTACT PERSON / REP</span>
                  <Controller
                    name="contactPerson"
                    control={editForm.control}
                    render={({ field }) => (
                      <Input {...field} appearance="outline" style={{ width: '100%' }} />
                    )}
                  />
                </div>

                {/* PHONE */}
                <div>
                  <span className={styles.fieldLabel}>PHONE NUMBER</span>
                  <Controller
                    name="phone"
                    control={editForm.control}
                    render={({ field }) => (
                      <Input {...field} appearance="outline" style={{ width: '100%' }} />
                    )}
                  />
                </div>

                {/* ADDRESS */}
                <div>
                  <span className={styles.fieldLabel}>COMPANY / ADDRESS NOTE</span>
                  <Controller
                    name="address"
                    control={editForm.control}
                    render={({ field }) => (
                      <Input {...field} appearance="outline" style={{ width: '100%' }} />
                    )}
                  />
                </div>

              </div>

              <div className={styles.drawerFooter}>
                <Button appearance="secondary" onClick={() => setIsDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  icon={<Checkmark20Regular />}
                  style={{ backgroundColor: '#E51937' }}
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
        <DialogSurface style={{ maxWidth: '480px', width: '92vw', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <DialogTitle style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
              Vendor Account Statement
            </DialogTitle>
            <Button
              appearance="subtle"
              icon={<Dismiss20Regular />}
              onClick={() => setIsPrintModalOpen(false)}
              style={{ minWidth: 'auto', padding: '4px' }}
            />
          </div>

          <DialogBody>
            <DialogContent>
              {printingVendor && (
                <div
                  id="printable-vendor-slip"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    padding: '24px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    lineHeight: '1.6',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '1px' }}>OMNIPOS STORE</div>
                    <div>VENDOR / SUPPLIER STATEMENT</div>
                    <div style={{ fontSize: '10px', color: '#555' }}>
                      Date: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                    </div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 'bold' }}>Vendor:</span>
                      <span>{printingVendor.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 'bold' }}>Type:</span>
                      <span>{printingVendor.category || 'Supplier'}</span>
                    </div>
                    {printingVendor.contactPerson && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>Contact Rep:</span>
                        <span>{printingVendor.contactPerson}</span>
                      </div>
                    )}
                    {printingVendor.phone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>Phone:</span>
                        <span>{printingVendor.phone}</span>
                      </div>
                    )}
                    {printingVendor.address && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 'bold' }}>Address:</span>
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
                      <div style={{ margin: '10px 0', borderTop: '1px dashed #bbb', borderBottom: '1px dashed #bbb', padding: '8px 0' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', color: '#333' }}>
                          Recent Invoices Received ({vendorMovements.length}):
                        </div>
                        {vendorMovements.slice(0, 5).map((m, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '2px 0' }}>
                            <span>{new Date(m.date).toLocaleDateString()} • {m.productName} ({m.quantity}x)</span>
                            <span style={{ fontWeight: 600 }}>{formatPKR((m.quantity || 0) * (m.unitCost || 0))}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div style={{ borderTop: '1px dashed #000', paddingTop: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                      <span>CURRENT BALANCE:</span>
                      <span>{formatPKR(printingVendor.openingBalance || 0)}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#777', marginTop: '16px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
                    Authorized Signature: __________________
                  </div>
                </div>
              )}
            </DialogContent>

            <DialogActions style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                appearance="secondary"
                onClick={() => setIsPrintModalOpen(false)}
                style={{ height: '38px', padding: '0 20px', borderRadius: '6px' }}
              >
                Close
              </Button>
              <Button
                appearance="primary"
                icon={<Print20Regular />}
                onClick={() => window.print()}
                style={{
                  height: '38px',
                  padding: '0 22px',
                  borderRadius: '6px',
                  backgroundColor: '#0078D4',
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                }}
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
