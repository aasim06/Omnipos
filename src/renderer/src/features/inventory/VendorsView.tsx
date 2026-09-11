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
import { posApi } from '@/lib/api';
import { StockMovement } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { vendorStorage, Vendor } from './vendorStorage';
import { useAppToast, useConfirmDialog } from '../../context/AppNotificationContext';

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

import { useVendorsStyles, useStyles } from './vendors.styles';

export function VendorsView(): React.JSX.Element {
  const styles = useVendorsStyles();
  const navigate = useNavigate();
  const { notifySuccess } = useAppToast();
  const confirmModal = useConfirmDialog();
  const [vendors, setVendors] = useState<Vendor[]>(() => vendorStorage.getVendors());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Right Drawer State for Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingVendor, setPrintingVendor] = useState<Vendor | null>(null);

  // Fetch Stock Movements: Offline-First Cache (<5ms)
  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: () => posApi.fetchStockMovements(),
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

  const handleDelete = async (id: string) => {
    const ok = await confirmModal({
      title: 'Delete Vendor',
      message: 'Are you sure you want to delete this vendor record? This action cannot be undone.',
      confirmLabel: 'Delete Vendor',
      intent: 'danger',
    });
    if (ok) {
      vendorStorage.deleteVendor(id);
      setVendors(vendorStorage.getVendors());
      notifySuccess('Vendor record deleted successfully');
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

            {/* Field 5: OPENING BALANCE */}
            <Controller
              name="openingBalance"
              control={form.control}
              render={({ field }) => (
                <CustomInput
                  label="Opening Balance (PKR)"
                  type="number"
                  placeholder="0"
                  value={field.value !== undefined ? String(field.value) : '0'}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  error={form.formState.errors.openingBalance?.message}
                />
              )}
            />

            {/* Field 6: COMPANY / ADDRESS NOTE */}
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
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<ArrowCircleDown20Regular className={styles.iconStockIn} />}
                            onClick={() => navigate('/inventory/stock-in', { state: { vendorName: v.companyName || v.name, vendorId: v.id } })}
                            className={styles.actionBtnStockIn}
                            title="Record Stock In from this Vendor"
                            aria-label="Record Stock In from this Vendor"
                          />

                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Print20Regular className={styles.iconPrint} />}
                            onClick={() => handleOpenPrint(v)}
                            className={styles.actionBtnPrint}
                            title="Print Vendor Slip / Statement"
                            aria-label="Print Vendor Slip / Statement"
                          />

                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Edit20Regular className={styles.iconEdit} />}
                            onClick={() => handleOpenEdit(v)}
                            className={styles.actionBtnEdit}
                            title="Edit Vendor (Right Drawer)"
                            aria-label="Edit Vendor (Right Drawer)"
                          />

                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Delete20Regular className={styles.iconDelete} />}
                            onClick={() => handleDelete(v.id)}
                            className={styles.actionBtnDelete}
                            title="Delete Vendor"
                            aria-label="Delete Vendor"
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

                {/* OPENING / PAYABLE BALANCE */}
                <Controller
                  name="openingBalance"
                  control={editForm.control}
                  render={({ field }) => (
                    <CustomInput
                      label="Opening / Current Balance (PKR)"
                      type="number"
                      placeholder="0"
                      value={field.value !== undefined ? String(field.value) : '0'}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      error={editForm.formState.errors.openingBalance?.message}
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
