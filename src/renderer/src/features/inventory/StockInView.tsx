import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Subtitle1,
  Subtitle2,
  Body1,
  Caption1,
  Badge,
  Button,
  Input,
  Select,
  Dropdown,
  Option,
  Checkbox,
  Tooltip,
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
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl } from '@/lib/api';
import { StockMovement, Product } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { vendorStorage } from './vendorStorage';

const stockInSchema = z.object({
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
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
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

  // Fetch Stock Movements
  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/stock-movements`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Top Card Create Form
  const form = useForm<StockInFormData>({
    resolver: zodResolver(stockInSchema) as any,
    defaultValues: {
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

      const noteDetails = [
        data.vendorName ? `Vendor: ${data.vendorName}` : null,
        data.discountPercent && data.discountPercent > 0 ? `Discount: ${data.discountPercent}% (-PKR ${discAmt.toLocaleString()})` : null,
        `Line Total: PKR ${calcTotal.toLocaleString()}`,
      ]
        .filter(Boolean)
        .join(' • ');

      await fetch(`${base}/api/stock-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'minimart',
          type: 'in',
          productId: data.selectedProductId || uid('prod_'),
          productName: data.productName,
          quantity: data.quantity,
          unitCost: unitCost,
          unitPrice: null,
          reason: data.vendorName || 'Supplier Purchase',
          note: noteDetails,
        }),
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
      form.reset({
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
      const base = await resolveApiUrl();
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

      await fetch(`${base}/api/stock-movements/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: data.productName,
          quantity: data.quantity,
          unitCost: data.unitPrice,
          reason: data.vendorName || 'Supplier Purchase',
          note: noteDetails,
        }),
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
      const base = await resolveApiUrl();
      await fetch(`${base}/api/stock-movements/${id}`, {
        method: 'DELETE',
      });

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

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this stock in shipment record?')) {
      deleteMutation.mutate(id);
    }
  };

  // Only Inflow Movements
  const stockInMovements = movements.filter((m) => m.type === 'in');

  // Filtered List
  const filteredMovements = stockInMovements.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.productName.toLowerCase().includes(q) ||
      (m.reason && m.reason.toLowerCase().includes(q)) ||
      (m.note && m.note.toLowerCase().includes(q))
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
        <span className={styles.cardTitle}>Record Stock In (Receiving Invoice)</span>

        <form onSubmit={form.handleSubmit(onSave)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Row 1: Vendor & Product Select */}
          <div className={styles.row1}>
            <div>
              <label className={styles.fieldLabel}>SELECT VENDOR / SUPPLIER</label>
              <Controller
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <Dropdown
                    placeholder="Select Vendor / Supplier"
                    value={field.value || ''}
                    selectedOptions={field.value ? [field.value] : []}
                    onOptionSelect={(_, d) => {
                      const val = d.optionValue || '';
                      field.onChange(val);
                      const matched = vendors.find((v) => v.name === val || v.companyName === val);
                      if (matched) form.setValue('vendorId', matched.id);
                    }}
                    style={{ width: '100%' }}
                  >
                    <Option value="" text="Select Vendor / Supplier">Select Vendor / Supplier</Option>
                    {vendors.map((v) => (
                      <Option key={v.id} value={v.name} text={v.name}>
                        {v.name}
                      </Option>
                    ))}
                  </Dropdown>
                )}
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
                    placeholder="Search and select product..."
                    value={field.value || ''}
                    onChange={(name, prod) => {
                      field.onChange(name);
                      if (prod) {
                        form.setValue('selectedProductId', prod.id);
                        if (prod.costPrice !== undefined && prod.costPrice !== null) {
                          form.setValue('unitPrice', prod.costPrice);
                        } else if (prod.price) {
                          form.setValue('unitPrice', prod.price);
                        }
                      }
                    }}
                    error={form.formState.errors.productName?.message}
                  />
                )}
              />
            </div>
          </div>

          {/* Row 2: QTY, Unit Price, Discount (%), Line Total, Save Button */}
          <div className={styles.row2}>
            <div>
              <label className={styles.fieldLabel}>QTY *</label>
              <Controller
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <Input
                    appearance="outline"
                    type="number"
                    style={{ width: '100%' }}
                    placeholder="1"
                    value={String(field.value ?? '')}
                    onChange={(_, d) => field.onChange(d.value)}
                  />
                )}
              />
              {form.formState.errors.quantity && (
                <span style={{ color: '#E51937', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                  {form.formState.errors.quantity.message}
                </span>
              )}
            </div>

            <div>
              <label className={styles.fieldLabel}>UNIT PRICE (PKR)</label>
              <Controller
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <Input
                    appearance="outline"
                    type="number"
                    style={{ width: '100%' }}
                    placeholder="0"
                    value={String(field.value ?? '')}
                    onChange={(_, d) => field.onChange(d.value)}
                  />
                )}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>DISCOUNT (%)</label>
              <Controller
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <Input
                    appearance="outline"
                    type="number"
                    style={{ width: '100%' }}
                    placeholder="0"
                    contentAfter="%"
                    min={0}
                    max={100}
                    value={String(field.value ?? '')}
                    onChange={(_, d) => field.onChange(d.value)}
                  />
                )}
              />
            </div>

            <div>
              <label className={styles.fieldLabel}>LINE TOTAL (PKR)</label>
              <div className={styles.lineTotalBox}>
                <span className={styles.lineTotalValue}>Rs. {lineTotal.toLocaleString()}</span>
                {discountAmount > 0 && (
                  <span style={{ fontSize: '11px', color: '#107C41', marginLeft: '6px', fontWeight: 600 }}>
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
                style={{ width: '100%' }}
              >
                <Add20Regular style={{ width: 18, height: 18 }} />
                <span>{saveMutation.isPending ? 'Saving...' : 'Save Stock In Invoice'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ── CARD 2: Stock In (Receiving Logs) ── */}
      <div className={styles.card}>
        <span className={styles.cardTitle}>Stock In (Receiving Logs)</span>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <Input
            appearance="outline"
            placeholder="Search Stock In logs by Name..."
            contentBefore={<Search20Regular style={{ color: tokens.colorNeutralForeground3 }} />}
            value={searchQuery}
            onChange={(_, d) => setSearchQuery(d.value)}
            style={{ minWidth: '280px', maxWidth: '420px', width: '100%' }}
          />

          <Caption1 style={{ color: tokens.colorNeutralForeground3, fontWeight: 600 }}>
            Total {filteredMovements.length} Stock In Records
          </Caption1>
        </div>

        {/* Table with Checkbox, Item, Qty, Unit Price, Line Total, Vendor, Date, and Actions */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: '36px', textAlign: 'center' }}>
                  <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className={styles.th}>ITEM SELECT</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>QTY</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>UNIT PRICE</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>LINE TOTAL</th>
                <th className={styles.th}>VENDOR / SUPPLIER</th>
                <th className={styles.th}>DATE &amp; TIME</th>
                <th className={styles.th} style={{ textAlign: 'center', minWidth: '100px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    No Stock In shipment records found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isChecked = selectedIds.includes(mov.id);
                  const dt = new Date(mov.date);
                  const totalLine = (mov.unitCost || 0) * (mov.quantity || 0);

                  return (
                    <tr key={mov.id} className={styles.tableRow}>
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <Checkbox checked={isChecked} onChange={() => toggleSelectRow(mov.id)} />
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>
                          {mov.productName}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        <Badge appearance="tint" color="success" style={{ fontWeight: 700 }}>
                          +{mov.quantity}
                        </Badge>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 600 }}>
                        {mov.unitCost !== null && mov.unitCost !== undefined ? formatPKR(mov.unitCost) : '—'}
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 700, color: '#107C41' }}>
                        {totalLine > 0 ? formatPKR(totalLine) : '—'}
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground1 }}>
                          {mov.reason || 'Supplier Purchase'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground2, fontSize: '12px' }}>
                          {dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'center' }}>
                        {/* ── ACTION ICONS: Print, Edit (Right Drawer), Delete ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Tooltip content="Print Receiving Slip" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Print20Regular style={{ color: '#0078D4', width: 16, height: 16 }} />}
                              onClick={() => handleOpenPrint(mov)}
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

                          <Tooltip content="Edit Invoice (Right Drawer)" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Edit20Regular style={{ color: '#107C41', width: 16, height: 16 }} />}
                              onClick={() => handleOpenEdit(mov)}
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

                          <Tooltip content="Delete Record" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Delete20Regular style={{ color: '#D13438', width: 16, height: 16 }} />}
                              onClick={() => handleDelete(mov.id)}
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

      {/* ── RIGHT-SIDE SLIDE-OVER DRAWER (Edit Stock In) ── */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 124, 65, 0.12)',
                    color: '#107C41',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                  }}
                >
                  <Edit20Regular />
                </span>
                <div>
                  <Subtitle2 style={{ fontWeight: 800, color: tokens.colorNeutralForeground1, display: 'block' }}>
                    Edit Stock In Invoice
                  </Subtitle2>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                    Record #{editingMovement?.id.slice(-6).toUpperCase()}
                  </Caption1>
                </div>
              </div>

              <Button
                appearance="subtle"
                icon={<Dismiss20Regular />}
                onClick={() => setIsDrawerOpen(false)}
                style={{ minWidth: '28px', width: '28px', height: '28px', padding: 0 }}
              />
            </div>

            {/* Drawer Form Body */}
            <form id="editDrawerForm" onSubmit={editForm.handleSubmit(onUpdate)} className={styles.drawerBody}>
              {/* Product Name */}
              <div>
                <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Item / Product Name
                </Label>
                <Controller
                  control={editForm.control}
                  name="productName"
                  render={({ field }) => (
                    <Input
                      appearance="outline"
                      style={{ width: '100%' }}
                      placeholder="Product name"
                      value={field.value}
                      onChange={(_, d) => field.onChange(d.value)}
                    />
                  )}
                />
              </div>

              {/* Vendor / Supplier */}
              <div>
                <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Vendor / Supplier
                </Label>
                <Controller
                  control={editForm.control}
                  name="vendorName"
                  render={({ field }) => (
                    <Dropdown
                      placeholder="Direct Supplier / Purchase"
                      value={field.value || ''}
                      selectedOptions={field.value ? [field.value] : []}
                      onOptionSelect={(_, d) => field.onChange(d.optionValue || '')}
                      style={{ width: '100%' }}
                    >
                      <Option value="" text="Direct Supplier / Purchase">Direct Supplier / Purchase</Option>
                      {vendors.map((v) => (
                        <Option key={v.id} value={v.name} text={v.name}>
                          {v.name}
                        </Option>
                      ))}
                    </Dropdown>
                  )}
                />
              </div>

              {/* Quantity & Unit Cost */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Quantity (Units)
                  </Label>
                  <Controller
                    control={editForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="1"
                        value={String(field.value ?? '')}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                </div>

                <div>
                  <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                    Unit Price (PKR)
                  </Label>
                  <Controller
                    control={editForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="0"
                        value={String(field.value ?? '')}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Discount (%) */}
              <div>
                <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Discount (%)
                </Label>
                <Controller
                  control={editForm.control}
                  name="discountPercent"
                  render={({ field }) => (
                    <Input
                      appearance="outline"
                      type="number"
                      style={{ width: '100%' }}
                      placeholder="0"
                      contentAfter="%"
                      min={0}
                      max={100}
                      value={String(field.value ?? '')}
                      onChange={(_, d) => field.onChange(d.value)}
                    />
                  )}
                />
              </div>

              {/* Line Total Display Box */}
              <div>
                <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Updated Line Total (PKR)
                </Label>
                <div className={styles.lineTotalBox}>
                  <span className={styles.lineTotalValue}>Rs. {editLineTotal.toLocaleString()}</span>
                  {editDiscountAmount > 0 && (
                    <span style={{ fontSize: '11px', color: '#107C41', marginLeft: '6px', fontWeight: 600 }}>
                      (-{editDiscountAmount.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>

              {/* Reference Note */}
              <div>
                <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Note / Remarks
                </Label>
                <Controller
                  control={editForm.control}
                  name="note"
                  render={({ field }) => (
                    <Input
                      appearance="outline"
                      style={{ width: '100%' }}
                      placeholder="Batch #, invoice notes, etc."
                      value={field.value || ''}
                      onChange={(_, d) => field.onChange(d.value)}
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
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                form="editDrawerForm"
                disabled={updateMutation.isPending}
                style={{
                  backgroundColor: '#E51937',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT RECEIVING SLIP MODAL ── */}
      <Dialog open={isPrintModalOpen} onOpenChange={(_, d) => setIsPrintModalOpen(d.open)}>
        <DialogSurface style={{ borderRadius: '12px', width: '480px', maxWidth: '94vw', padding: '22px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <Subtitle2 style={{ fontWeight: 800, color: tokens.colorNeutralForeground1, margin: 0, fontSize: '17px' }}>
              Stock In Receiving Voucher
            </Subtitle2>
            <Button
              appearance="subtle"
              icon={<Dismiss20Regular />}
              onClick={() => setIsPrintModalOpen(false)}
              style={{ minWidth: '32px', width: '32px', height: '32px', padding: 0 }}
            />
          </div>

          <div>
            {printingMovement && (
              <div
                id="printableVoucher"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  padding: '18px 20px',
                  borderRadius: '8px',
                  border: '1px dashed #777',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  fontFamily: 'monospace',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #999', paddingBottom: '8px' }}>
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>OMNIPOS WAREHOUSE</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Stock In Receiving Voucher</div>
                  <div style={{ fontSize: '10px', color: '#777', marginTop: '2px' }}>
                    Ref: #{printingMovement.id.slice(-8).toUpperCase()}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#555' }}>Date:</span>
                    <span>{new Date(printingMovement.date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#555' }}>Time:</span>
                    <span>{new Date(printingMovement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#555' }}>Supplier:</span>
                    <span style={{ fontWeight: 700 }}>{printingMovement.reason || 'Direct'}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '8px 0', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <span>Item:</span>
                    <span>{printingMovement.productName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ color: '#555' }}>Quantity Received:</span>
                    <span style={{ fontWeight: 800, color: '#107C41' }}>+{printingMovement.quantity} units</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ color: '#555' }}>Unit Rate:</span>
                    <span>PKR {printingMovement.unitCost || 0}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800 }}>
                  <span>Total Inflow:</span>
                  <span style={{ color: '#107C41' }}>PKR {((printingMovement.unitCost || 0) * printingMovement.quantity).toLocaleString()}</span>
                </div>

                {printingMovement.note && (
                  <div style={{ fontSize: '10px', color: '#555', borderTop: '1px dotted #ccc', paddingTop: '6px' }}>
                    Note: {printingMovement.note}
                  </div>
                )}

                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#777' }}>
                  <div>Received By: ____________</div>
                  <div>Signature: ____________</div>
                </div>
              </div>
            )}
          </div>

          {/* Clean Aligned Action Buttons */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Button
              appearance="secondary"
              onClick={() => setIsPrintModalOpen(false)}
              style={{
                height: '38px',
                padding: '0 20px',
                borderRadius: '8px',
                fontWeight: 600,
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                backgroundColor: tokens.colorNeutralBackground3,
                color: tokens.colorNeutralForeground1,
                cursor: 'pointer',
              }}
            >
              Close
            </Button>
            <Button
              appearance="primary"
              icon={<Print20Regular style={{ width: 18, height: 18 }} />}
              onClick={handlePrint}
              style={{
                height: '38px',
                padding: '0 22px',
                backgroundColor: '#0078D4',
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 120, 212, 0.35)',
              }}
            >
              Print Voucher
            </Button>
          </div>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
