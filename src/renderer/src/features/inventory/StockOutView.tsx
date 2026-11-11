import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Subtitle1,
  Subtitle2,
  Body1,
  Caption1,
  Badge,
  Button,
    Select,
      Checkbox,
  TabList,
  Tab,
  Label,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  mergeClasses,
} from '@fluentui/react-components';
import {
  ArrowCircleUp20Regular,
  Search20Regular,
  Delete20Regular,
  Edit20Regular,
  Print20Regular,
  Dismiss20Regular,
  Food24Regular,
  ShoppingBag24Regular,
  Folder20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl, posApi, round3 } from '@/lib/api';
import { StockMovement, Product, Category } from '@shared/types';
import { uid, formatPKR } from '@/lib/utils';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { CustomInput, CustomSelect } from '@/components/ui';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { useAppToast, useConfirmDialog } from '../../context/AppNotificationContext';
import { useAuth } from '@/features/auth/AuthContext';
import { vendorStorage } from './vendorStorage';

/** Stock sent back to the supplier: reduces stock AND what we owe that vendor. */
const RETURN_TO_VENDOR = 'Return to Vendor';

/** Value credited back to the vendor for a purchase-return movement. */
const returnValue = (m: { quantity?: number; unitCost?: number | null }) =>
  Math.round((Number(m.quantity) || 0) * (Number(m.unitCost) || 0) * 100) / 100;

const STOCK_OUT_REASONS = [
  { value: 'Kitchen Usage', label: 'Kitchen Usage / Consumption' },
  { value: 'Damage / Broken', label: 'Damage / Broken' },
  { value: 'Expired Goods', label: 'Expired Goods' },
  { value: 'Audit Adjustment', label: 'Audit Adjustment / Physical Discrepancy' },
  { value: 'Theft / Lost', label: 'Theft / Unaccounted Lost' },
  { value: 'Staff Meal', label: 'Staff Meal / Sampling' },
  { value: RETURN_TO_VENDOR, label: 'Return to Vendor (Purchase Return)' },
  { value: 'Other Reason', label: 'Other Reason' },
];

const stockOutSchema = z.object({
  module: z.enum(['fastfood', 'minimart']).default('fastfood'),
  selectedProductId: z.string().optional(),
  productName: z.string().min(1, 'Please select or enter an item name'),
  reason: z.string().min(1, 'Please select a reason'),
  quantity: z.coerce.number().positive('Qty must be more than 0'),
  unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative').optional(),
  note: z.string().optional(),
  vendorName: z.string().optional(),
  deductUnit: z.enum(['base', 'wholesale']).optional(),
});

type StockOutFormData = z.infer<typeof stockOutSchema>;

const editOutSchema = z.object({
  id: z.string(),
  productName: z.string().min(1, 'Product name is required'),
  reason: z.string().min(1, 'Please select a reason'),
  quantity: z.coerce.number().min(1, 'Qty must be at least 1'),
  unitCost: z.coerce.number().min(0).optional(),
  note: z.string().optional(),
});

type EditOutFormData = z.infer<typeof editOutSchema>;

import { useStockOutStyles, useStyles } from './stockOut.styles';

export function StockOutView(): React.JSX.Element {
  const styles = useStockOutStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useAppToast();
  const confirmModal = useConfirmDialog();
  // Editing / reversing stock entries needs the "Stock Corrections" permission
  const { hasPermission } = useAuth();
  const canAdjust = hasPermission('stock_adjust');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Right Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);

  // Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printingMovement, setPrintingMovement] = useState<StockMovement | null>(null);

  // Fetch Stock Movements: Offline-First Cache (<5ms)
  const { data: movements = [], isLoading } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: () => posApi.fetchStockMovements(),
  });

  // Fetch Products for Live Stock Inspection & Category Lookup
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    staleTime: 60000,
  });

  // Fetch Categories for quick category filtering
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => posApi.fetchCategories(),
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tableCategoryFilter, setTableCategoryFilter] = useState<string>('all');

  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  // Filter tab for stock deductions (All, Kitchen Consumption, Retail Damage/Expiry)
  const [outflowTab, setOutflowTab] = useState<'all' | 'fastfood' | 'minimart'>(() => {
    if (hasFastFood && !hasOmnimart) return 'fastfood';
    if (!hasFastFood && hasOmnimart) return 'minimart';
    return 'all';
  });

  const form = useForm<StockOutFormData>({
    resolver: zodResolver(stockOutSchema) as any,
    defaultValues: {
      module: hasFastFood ? 'fastfood' : 'minimart',
      selectedProductId: '',
      productName: '',
      reason: hasFastFood ? 'Kitchen Usage' : 'Damage / Broken',
      quantity: 1,
      unitCost: 0,
      note: '',
    },
  });

  const editForm = useForm<EditOutFormData>({
    resolver: zodResolver(editOutSchema) as any,
    defaultValues: {
      id: '',
      productName: '',
      reason: 'Kitchen Usage',
      quantity: 1,
      unitCost: 0,
      note: '',
    },
  });

  const watchedQty = form.watch('quantity') || 0;
  const watchedCost = form.watch('unitCost') || 0;
  const totalLossValue = watchedQty * watchedCost;

  const editWatchedQty = editForm.watch('quantity') || 0;
  const editWatchedCost = editForm.watch('unitCost') || 0;
  const editTotalLossValue = editWatchedQty * editWatchedCost;

  // Mutation to Save Stock Out Entry: Offline-First
  /** Wholesale ↔ base unit conversion of a product (e.g. 1 Carton = 24 Pieces), when it has one. */
  const getConversion = (productId?: string) => {
    const p = allProducts.find((x) => x.id === productId);
    const rate = Number(p?.conversionRate || 0);
    if (!p || !p.primaryUnit || rate <= 1) return null;
    return { rate, wholesale: p.primaryUnit, base: p.secondaryUnit || p.unit || 'PCS' };
  };

  /** Current tracked stock for a product, or null when the product does not track stock. */
  const getTrackedStock = (productId?: string, productName?: string): { name: string; stock: number } | null => {
    const prod = allProducts.find(
      (p) => (productId && p.id === productId) || (!!productName && p.name.toLowerCase() === productName.toLowerCase())
    );
    if (!prod || prod.openingStock === undefined || prod.openingStock === null) return null;
    return { name: prod.name, stock: Number(prod.openingStock) || 0 };
  };

  const saveMutation = useMutation({
    mutationFn: async (data: StockOutFormData) => {
      const conv = data.deductUnit === 'wholesale' ? getConversion(data.selectedProductId) : null;
      const baseQty = round3(data.quantity * (conv ? conv.rate : 1));
      // unit cost is entered per the chosen unit; store it per base unit
      const baseUnitCost = conv && data.unitCost ? round3(Number(data.unitCost) / conv.rate) : data.unitCost;
      const tracked = getTrackedStock(data.selectedProductId, data.productName);
      if (tracked && baseQty > tracked.stock) {
        throw new Error(`Only ${tracked.stock} unit(s) of "${tracked.name}" in stock — cannot deduct ${baseQty}.`);
      }
      const isReturn = data.reason === RETURN_TO_VENDOR;
      const returnVendor = isReturn ? vendorStorage.findVendor({ name: data.vendorName }) : undefined;
      if (isReturn && !returnVendor) {
        throw new Error('Select the vendor this stock is being returned to.');
      }
      if (isReturn && !(Number(data.unitCost) > 0)) {
        throw new Error('Enter the unit cost so the vendor can be credited for the return.');
      }
      const saved = await posApi.saveStockMovement({
        module: data.module || 'fastfood',
        type: 'out',
        productId: data.selectedProductId || uid('prod_'),
        productName: data.productName,
        quantity: baseQty,
        unitCost: baseUnitCost ?? null,
        reason: data.reason,
        referenceInvoice: [conv ? `Deducted: ${data.quantity} ${conv.wholesale} × ${conv.rate} = ${baseQty} ${conv.base}` : '', data.note || '']
          .filter(Boolean)
          .join(' • '),
        ...(returnVendor ? { vendorName: returnVendor.name } : {}),
      });

      // Purchase return: credit the vendor (reduces what we owe)
      if (returnVendor) {
        const value = returnValue(saved);
        if (value > 0) {
          vendorStorage.recordTransaction(
            returnVendor.id,
            'ADJUSTMENT',
            -value,
            `Purchase return: ${data.productName} × ${baseQty}`,
            'return'
          );
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      await queryClient.refetchQueries({ queryKey: ['stock-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.refetchQueries({ queryKey: ['products'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_inventory_updated'));
      }
      notifySuccess('Stock deduction recorded successfully');
      form.reset({
        module: form.getValues('module') || 'fastfood',
        selectedProductId: '',
        productName: '',
        reason: form.getValues('module') === 'fastfood' ? 'Kitchen Usage' : 'Damage / Broken',
        quantity: 1,
        unitCost: 0,
        note: '',
        vendorName: '',
        deductUnit: 'base',
      });
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to save stock deduction');
    },
  });

  // Mutation to Update Stock Out Entry via Right Drawer
  const updateMutation = useMutation({
    mutationFn: async (data: EditOutFormData) => {
      // Only the extra quantity beyond the original deduction needs to be available
      const prevQty = editingMovement?.id === data.id ? Number(editingMovement.quantity || 0) : 0;
      const extra = data.quantity - prevQty;
      const tracked = getTrackedStock(editingMovement?.productId, data.productName);
      if (tracked && extra > tracked.stock) {
        throw new Error(`Only ${tracked.stock} more unit(s) of "${tracked.name}" available — cannot increase deduction by ${extra}.`);
      }
      const prev = editingMovement?.id === data.id ? editingMovement : null;
      const wasReturn = prev?.reason === RETURN_TO_VENDOR;
      const isReturn = data.reason === RETURN_TO_VENDOR;
      const returnVendor = vendorStorage.findVendor({ name: prev?.vendorName || undefined });
      if (isReturn && !returnVendor) {
        throw new Error('Purchase returns can only be edited when the original entry has a vendor. Reverse it and record the return again.');
      }

      await posApi.updateStockMovement(data.id, {
        productName: data.productName,
        quantity: data.quantity,
        unitCost: data.unitCost ?? null,
        reason: data.reason,
        note: data.note || '',
      });

      // Keep the vendor credit in step with the edited return value
      if (returnVendor && (wasReturn || isReturn)) {
        const prevCredit = wasReturn && prev ? returnValue(prev) : 0;
        const nextCredit = isReturn ? returnValue({ quantity: data.quantity, unitCost: data.unitCost }) : 0;
        const delta = nextCredit - prevCredit;
        if (delta !== 0) {
          vendorStorage.recordTransaction(
            returnVendor.id,
            'ADJUSTMENT',
            -delta,
            `Purchase return edited: ${data.productName} (${prevCredit.toLocaleString()} → ${nextCredit.toLocaleString()})`,
            'return'
          );
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      await queryClient.refetchQueries({ queryKey: ['stock-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.refetchQueries({ queryKey: ['products'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_inventory_updated'));
      }
      setIsDrawerOpen(false);
      setEditingMovement(null);
      notifySuccess('Stock deduction updated successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to update stock deduction');
    },
  });

  // Mutation to Delete Stock Out Entry
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const target = movements.find((m) => m.id === id);
      await posApi.reverseStockMovement(id);

      // Deleting a purchase return takes the vendor credit back
      if (target?.reason === RETURN_TO_VENDOR) {
        const vendor = vendorStorage.findVendor({ name: target.vendorName || undefined });
        const value = returnValue(target);
        if (vendor && value > 0) {
          vendorStorage.recordTransaction(
            vendor.id,
            'ADJUSTMENT',
            value,
            `Purchase return reversed: ${target.productName} × ${target.quantity}`,
            'return'
          );
        }
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      await queryClient.refetchQueries({ queryKey: ['stock-movements'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.refetchQueries({ queryKey: ['products'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pos_inventory_updated'));
      }
      setSelectedIds([]);
      notifySuccess('Stock deduction record deleted successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to delete record');
    },
  });

  const onSave = (data: StockOutFormData) => {
    saveMutation.mutate(data);
  };

  const onUpdate = (data: EditOutFormData) => {
    updateMutation.mutate(data);
  };

  const handleOpenEdit = (mov: StockMovement) => {
    setEditingMovement(mov);
    editForm.reset({
      id: mov.id,
      productName: mov.productName,
      reason: mov.reason || 'Kitchen Usage',
      quantity: mov.quantity,
      unitCost: mov.unitCost || 0,
      note: mov.note || '',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenPrint = (mov: StockMovement) => {
    setPrintingMovement(mov);
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirmModal({
      title: 'Reverse Stock Out Entry',
      message: 'This posts an opposite "Reversal" entry and puts the quantity back into stock. The original entry stays in the ledger for audit.',
      confirmLabel: 'Reverse Entry',
      intent: 'danger',
    });
    if (ok) {
      deleteMutation.mutate(id);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirmModal({
      title: 'Reverse Selected Records',
      message: `Post reversal entries for ${selectedIds.length} selected stock out records? The originals stay in the ledger.`,
      confirmLabel: 'Reverse Selected',
      intent: 'danger',
    });
    if (ok) {
      for (const id of selectedIds) {
        await deleteMutation.mutateAsync(id);
      }
      setSelectedIds([]);
    }
  };

  // Only Outflow Movements (filtered by licensed modules)
  const stockOutMovements = movements.filter((m) => {
    if (m.type !== 'out') return false;
    // Reversed entries and reversal entries are audit history: shown in the Stock Movement Ledger
    if (m.reversedAt || m.reversalOf) return false;
    // POS sales are logged in the Stock Movement Ledger; this page is for manual deductions only
    if (m.reason === 'POS Sale') return false;
    if (!hasFastFood && m.module === 'fastfood') return false;
    if (!hasOmnimart && m.module !== 'fastfood') return false;
    return true;
  });

  // Filtered List by Tab, Search Query and Category Filter
  const filteredMovements = stockOutMovements.filter((m) => {
    if (outflowTab === 'fastfood' && m.module !== 'fastfood') return false;
    if (outflowTab === 'minimart' && m.module === 'fastfood') return false;

    const matchedProd = allProducts.find((p) => p.id === m.productId || p.name.toLowerCase() === m.productName.toLowerCase());
    if (tableCategoryFilter !== 'all') {
      if ((matchedProd?.category || '').toLowerCase() !== tableCategoryFilter.toLowerCase()) {
        return false;
      }
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      m.productName.toLowerCase().includes(q) ||
      (m.reason && m.reason.toLowerCase().includes(q)) ||
      (m.note && m.note.toLowerCase().includes(q)) ||
      (matchedProd?.category && matchedProd.category.toLowerCase().includes(q));

    return matchesSearch;
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

  const getReasonColor = (reason?: string): 'danger' | 'warning' | 'important' | 'informative' => {
    const r = (reason || '').toLowerCase();
    if (r.includes('damage') || r.includes('theft')) return 'danger';
    if (r.includes('expired')) return 'important';
    if (r.includes('kitchen')) return 'warning';
    return 'informative';
  };

  if (isLoading && movements.length === 0) {
    return <TablePageSkeleton title="Stock Out" hasMetrics={false} />;
  }

  return (
    <div className={styles.container}>
      {/* ── CARD 1: Record Stock Out (Damage / Waste / Usage) ── */}
      <div className={styles.card}>
        <div className={styles.scopeRow}>
          <span className={styles.cardTitle}>Record Stock Out (Damage / Waste / Usage)</span>

          {/* Department / Branch Switcher for Stock Out */}
          {hasFastFood && hasOmnimart ? (
            <div className={styles.scopeLeft}>
              <span className={styles.scopeLabel}>
                Department:
              </span>
              <div className={styles.scopeTabList}>
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('module', 'fastfood');
                    form.setValue('reason', 'Kitchen Usage');
                  }}
                  className={mergeClasses(styles.scopeBtn, form.watch('module') === 'fastfood' && styles.scopeBtnActive)}
                >
                  <Food24Regular className={styles.icon14Neutral} />
                  <span>Kitchen Consumption &amp; Waste</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    form.setValue('module', 'minimart');
                    form.setValue('reason', 'Damage / Broken');
                  }}
                  className={mergeClasses(styles.scopeBtn, form.watch('module') !== 'fastfood' && styles.scopeBtnActive)}
                >
                  <ShoppingBag24Regular className={styles.icon14Neutral} />
                  <span>Retail Mini Mart Goods</span>
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.scopeLeft}>
              <span className={styles.scopeLabel}>
                Department:
              </span>
              <span className={styles.scopeSingleChip}>
                {hasFastFood ? <Food24Regular className={styles.icon14Red} /> : <ShoppingBag24Regular className={styles.icon14Blue} />}
                <span>{hasFastFood ? 'Kitchen Consumption & Waste' : 'Retail Mini Mart Goods'}</span>
              </span>
            </div>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSave)} className={styles.formColumn}>
          {/* Row 1: Reason, Category & Product Select */}
          <div className={styles.row1}>
            <div>
              <Controller
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <CustomSelect
                    label="DEDUCTION REASON *"
                    required
                    value={field.value || 'Kitchen Usage'}
                    options={STOCK_OUT_REASONS}
                    onChange={(val) => field.onChange(val)}
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
                  ...categories.map((c) => ({ value: c.name, label: c.name })),
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
                    id="stockOutItemSelect"
                    label="ITEM SELECT"
                    required
                    filterModule={form.watch('module')}
                    filterCategory={selectedCategory}
                    placeholder="Search and select product..."
                    value={field.value || ''}
                    onChange={(name, prod) => {
                      field.onChange(name);
                      if (prod) {
                        form.setValue('selectedProductId', prod.id);
                        if (prod.category && selectedCategory === 'all') {
                          setSelectedCategory(prod.category);
                        }
                        if (prod.costPrice !== undefined && prod.costPrice !== null) {
                          form.setValue('unitCost', prod.costPrice);
                        } else if (prod.price) {
                          form.setValue('unitCost', prod.price);
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

          {/* Row 2: QTY, Unit Cost, Note, Total Loss, Save Button */}
          <div className={styles.row2}>
            <div>
              <Controller
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <CustomInput
                    label={getConversion(form.watch('selectedProductId')) && form.watch('deductUnit') === 'wholesale'
                      ? `QTY (${getConversion(form.watch('selectedProductId'))!.wholesale}) *`
                      : 'QTY TO DEDUCT *'}
                    required
                    type="number"
                    step="any"
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
                name="unitCost"
                render={({ field }) => (
                  <CustomInput
                    label={form.watch('deductUnit') === 'wholesale' && getConversion(form.watch('selectedProductId'))
                      ? `COST / ${getConversion(form.watch('selectedProductId'))!.wholesale.toUpperCase()} (PKR)`
                      : 'UNIT COST (PKR)'}
                    type="number"
                    step="any"
                    placeholder="0"
                    value={field.value !== undefined ? String(field.value) : ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                )}
              />
            </div>

            <div>
              {form.watch('reason') === RETURN_TO_VENDOR ? (
                <Controller
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <CustomSelect
                      label="RETURN TO VENDOR *"
                      required
                      placeholder="Select vendor..."
                      value={field.value || ''}
                      options={vendorStorage.getVendors().map((v) => ({
                        value: v.name,
                        label: `${v.name} (Payable: PKR ${vendorStorage.getBalance(v).toLocaleString()})`,
                      }))}
                      onChange={(val) => field.onChange(val)}
                    />
                  )}
                />
              ) : (
                <Controller
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <CustomInput
                      label="DISPOSAL / AUDIT NOTE"
                      placeholder="e.g. Broken in fridge, expired batch..."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
            </div>

            <div>
              <label className={styles.fieldLabel}>ESTIMATED LOSS (PKR)</label>
              <div className={styles.lineTotalBox}>
                <span className={styles.lineTotalValue}>Rs. {totalLossValue.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <Button
                appearance="primary"
                type="submit"
                disabled={saveMutation.isPending}
                className={mergeClasses(styles.saveBtn, styles.wFull)}
              >
                <ArrowCircleUp20Regular className={styles.icon18} />
                <span>{saveMutation.isPending ? 'Saving...' : 'Save Stock Out Entry'}</span>
              </Button>
            </div>
          </div>

          {/* Deduct in wholesale or base unit (only for products with a conversion) */}
          {(() => {
            const conv = getConversion(form.watch('selectedProductId'));
            if (!conv) return null;
            return (
              <div style={{ maxWidth: 320, marginTop: 12 }}>
                <Controller
                  control={form.control}
                  name="deductUnit"
                  render={({ field }) => (
                    <CustomSelect
                      label="DEDUCT IN"
                      value={field.value || 'base'}
                      options={[
                        { value: 'base', label: `${conv.base} (stock unit)` },
                        { value: 'wholesale', label: `${conv.wholesale} (1 = ${conv.rate} ${conv.base})` },
                      ]}
                      onChange={(val) => field.onChange(val || 'base')}
                    />
                  )}
                />
                {form.watch('deductUnit') === 'wholesale' && (
                  <span className={styles.fieldLabel} style={{ display: 'block', marginTop: 4 }}>
                    = {round3((Number(form.watch('quantity')) || 0) * conv.rate)} {conv.base} out of stock
                  </span>
                )}
              </div>
            );
          })()}
        </form>
      </div>

      {/* ── CARD 2: Stock Out (Deduction Logs) ── */}
      <div className={styles.card}>
        <div className={styles.historyHeader}>
          <span className={styles.cardTitle}>Stock Out (Deduction Logs)</span>

          {/* Module Filter Tabs */}
          {hasFastFood && hasOmnimart ? (
            <div className={styles.scopeTabList}>
              <button
                type="button"
                onClick={() => setOutflowTab('all')}
                className={mergeClasses(styles.scopeBtn, outflowTab === 'all' && styles.scopeBtnActive)}
              >
                <span>All Outflows</span>
                <span className={mergeClasses(styles.scopeBtnBadge, outflowTab === 'all' && styles.scopeBtnBadgeActive)}>
                  {stockOutMovements.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setOutflowTab('fastfood')}
                className={mergeClasses(styles.scopeBtn, outflowTab === 'fastfood' && styles.scopeBtnActive)}
              >
                <Food24Regular className={styles.icon14Neutral} />
                <span>Kitchen Usage &amp; Waste</span>
                <span className={mergeClasses(styles.scopeBtnBadge, outflowTab === 'fastfood' && styles.scopeBtnBadgeActive)}>
                  {stockOutMovements.filter((m) => m.module === 'fastfood').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setOutflowTab('minimart')}
                className={mergeClasses(styles.scopeBtn, outflowTab === 'minimart' && styles.scopeBtnActive)}
              >
                <ShoppingBag24Regular className={styles.icon14Neutral} />
                <span>Mini Mart Damaged/Expired</span>
                <span className={mergeClasses(styles.scopeBtnBadge, outflowTab === 'minimart' && styles.scopeBtnBadgeActive)}>
                  {stockOutMovements.filter((m) => m.module !== 'fastfood').length}
                </span>
              </button>
            </div>
          ) : (
            <div className={styles.scopeSingleChip}>
              {hasFastFood ? <Food24Regular className={styles.icon14Red} /> : <ShoppingBag24Regular className={styles.icon14Blue} />}
              <span>{hasFastFood ? 'Kitchen Usage & Waste Logs' : 'Mini Mart Damaged/Expired Logs'}</span>
              <span className={styles.scopeBtnBadge}>
                {stockOutMovements.length}
              </span>
            </div>
          )}
        </div>

        <div className={styles.filterBar}>
          <div className={styles.searchContainer}>
            <CustomInput
              label="Search Stock Out Logs"
              placeholder="Search by product, category, reason, note..."
              icon={<Search20Regular />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={searchQuery ? () => setSearchQuery('') : undefined}
            />
          </div>

          <div className={styles.minWidth220}>
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

          <div className={styles.filterActionsRow}>
            {selectedIds.length > 0 && (
              <Button
                appearance="primary"
                size="small"
                icon={<Delete20Regular />}
                onClick={handleBatchDelete}
                disabled={!canAdjust}
                className={styles.deleteDangerBtn}
              >
                Reverse Selected ({selectedIds.length})
              </Button>
            )}
            <Caption1 className={styles.totalRecords}>
              Total {filteredMovements.length} Stock Out Records
            </Caption1>
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={mergeClasses(styles.th, styles.thCheck)}>
                  <Checkbox checked={isAllSelected} onChange={toggleSelectAll} />
                </th>
                <th className={styles.th}>ITEM SELECT</th>
                <th className={mergeClasses(styles.th, styles.thCenter)}>QTY</th>
                <th className={mergeClasses(styles.th, styles.thRight)}>UNIT PRICE</th>
                <th className={mergeClasses(styles.th, styles.thRight)}>LINE TOTAL</th>
                <th className={styles.th}>REASON / DEDUCTION</th>
                <th className={styles.th}>DATE &amp; TIME</th>
                <th className={mergeClasses(styles.th, styles.thActions)}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.tdEmpty}>
                    No Stock Out deduction records found.
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
                        <div className={styles.productCellStack}>
                          <span className={styles.productNameText}>
                            {mov.productName}
                          </span>
                          <span className={styles.categoryBadge}>
                            <Folder20Regular className={styles.icon12Red} />
                            <span>{matchedProd?.category || 'General'}</span>
                          </span>
                        </div>
                      </td>
                      <td className={mergeClasses(styles.td, styles.tdCenter)}>
                        <Badge appearance="tint" color="danger" className={styles.badgeBold}>
                          -{mov.quantity}
                        </Badge>
                      </td>
                      <td className={mergeClasses(styles.td, styles.tdRightBold)}>
                        {mov.unitCost !== null && mov.unitCost !== undefined ? formatPKR(mov.unitCost) : '—'}
                      </td>
                      <td className={mergeClasses(styles.td, styles.tdRightLoss)}>
                        {totalLine > 0 ? formatPKR(totalLine) : '—'}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.reasonText}>
                          {mov.reason || 'Deduction'}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.dateText}>
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
                            title="Print Deduction Slip"
                            aria-label="Print Deduction Slip"
                          />

                          {canAdjust && (
                            <>
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Edit20Regular className={styles.iconRed} />}
                                onClick={() => handleOpenEdit(mov)}
                                className={styles.actionBtnEdit}
                                title="Edit Deduction (Right Drawer)"
                                aria-label="Edit Deduction (Right Drawer)"
                              />

                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Delete20Regular className={styles.iconRed} />}
                                onClick={() => handleDelete(mov.id)}
                                className={styles.actionBtnDelete}
                                title="Reverse Entry"
                                aria-label="Reverse Entry"
                              />
                            </>
                          )}
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

      {/* ── RIGHT-SIDE SLIDE-OVER DRAWER (Edit Stock Out) ── */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHeaderLeft}>
                <span className={styles.drawerHeaderIconBadge}>
                  <Edit20Regular />
                </span>
                <div>
                  <Subtitle2 className={styles.drawerTitle}>
                    Edit Stock Out Entry
                  </Subtitle2>
                  <Caption1 className={styles.drawerSubtitle}>
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
            <form id="editOutDrawerForm" onSubmit={editForm.handleSubmit(onUpdate)} className={styles.drawerBody}>
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

              {/* Deduction Reason */}
              <div>
                <Controller
                  control={editForm.control}
                  name="reason"
                  render={({ field }) => (
                    <CustomSelect
                      label="Deduction Reason Category"
                      required
                      value={field.value || 'Kitchen Usage'}
                      options={STOCK_OUT_REASONS}
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
                        label="Quantity Deducted"
                        required
                        type="number"
                        step="any"
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
                    name="unitCost"
                    render={({ field }) => (
                      <CustomInput
                        label="Unit Cost (PKR)"
                        type="number"
                        placeholder="0"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Estimated Loss Display */}
              <div>
                <div className={styles.lineTotalBox}>
                  <span className={styles.lineTotalValue}>Rs. {editTotalLossValue.toLocaleString()}</span>
                </div>
              </div>

              {/* Remarks / Reference Note */}
              <div>
                <Controller
                  control={editForm.control}
                  name="note"
                  render={({ field }) => (
                    <CustomInput
                      label="Disposal / Audit Remarks"
                      placeholder="e.g. Broken in fridge, expired batch..."
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
                className={styles.btnRounded}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                form="editOutDrawerForm"
                disabled={updateMutation.isPending}
                className={styles.drawerSubmitBtn}
              >
                {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRINT DEDUCTION VOUCHER MODAL ── */}
      <Dialog open={isPrintModalOpen} onOpenChange={(_, d) => setIsPrintModalOpen(d.open)}>
        <DialogSurface className={styles.dialogSurface}>
          <div className={styles.dialogHeader}>
            <Subtitle2 className={styles.dialogTitle}>
              Stock Deduction / Waste Voucher
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
              <div
                id="printableVoucher"
                className={styles.voucherContainer}
              >
                <div className={styles.voucherHeader}>
                  <div className={styles.voucherHeaderTitle}>OMNIPOS INVENTORY</div>
                  <div className={styles.voucherHeaderSubtitle}>Stock Deduction / Waste Slip</div>
                  <div className={styles.voucherHeaderRef}>
                    Ref: #{printingMovement.id.slice(-8).toUpperCase()}
                  </div>
                </div>

                <div className={styles.voucherSection}>
                  <div className={styles.voucherRow}>
                    <span className={styles.voucherLabel}>Date:</span>
                    <span>{new Date(printingMovement.date).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.voucherRow}>
                    <span className={styles.voucherLabel}>Time:</span>
                    <span>{new Date(printingMovement.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={styles.voucherRow}>
                    <span className={styles.voucherLabel}>Reason:</span>
                    <span className={styles.voucherReasonVal}>{printingMovement.reason || 'Deduction'}</span>
                  </div>
                </div>

                <div className={styles.voucherTableSection}>
                  <div className={styles.voucherTableTitleRow}>
                    <span>Item:</span>
                    <span>{printingMovement.productName}</span>
                  </div>
                  <div className={styles.voucherTableRow}>
                    <span className={styles.voucherLabel}>Units Deducted:</span>
                    <span className={styles.voucherDeductedVal}>-{printingMovement.quantity} units</span>
                  </div>
                  <div className={styles.voucherTableRow}>
                    <span className={styles.voucherLabel}>Unit Cost:</span>
                    <span>PKR {printingMovement.unitCost || 0}</span>
                  </div>
                </div>

                <div className={styles.voucherTotalRow}>
                  <span>Estimated Loss:</span>
                  <span>PKR {((printingMovement.unitCost || 0) * printingMovement.quantity).toLocaleString()}</span>
                </div>

                {printingMovement.note && (
                  <div className={styles.voucherRemarks}>
                    Remarks: {printingMovement.note}
                  </div>
                )}

                <div className={styles.voucherSignatures}>
                  <div>Authorized By: ____________</div>
                  <div>Signature: ____________</div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.dialogFooter}>
            <Button
              appearance="secondary"
              onClick={() => setIsPrintModalOpen(false)}
              className={styles.dialogCloseBtn}
            >
              Close
            </Button>
            <Button
              appearance="primary"
              icon={<Print20Regular className={styles.icon18} />}
              onClick={handlePrint}
              className={styles.dialogPrintBtn}
            >
              Print Slip
            </Button>
          </div>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
