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
  ArrowCircleUp20Regular,
  Search20Regular,
  Delete20Regular,
  Edit20Regular,
  Print20Regular,
  Dismiss20Regular,
  Food24Regular,
  ShoppingBag24Regular,
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
import { CustomInput, CustomSelect } from '@/components/ui';

const STOCK_OUT_REASONS = [
  { value: 'Kitchen Usage', label: 'Kitchen Usage / Consumption' },
  { value: 'Damage / Broken', label: 'Damage / Broken' },
  { value: 'Expired Goods', label: 'Expired Goods' },
  { value: 'Audit Adjustment', label: 'Audit Adjustment / Physical Discrepancy' },
  { value: 'Theft / Lost', label: 'Theft / Unaccounted Lost' },
  { value: 'Staff Meal', label: 'Staff Meal / Sampling' },
  { value: 'Other Reason', label: 'Other Reason' },
];

const stockOutSchema = z.object({
  module: z.enum(['fastfood', 'minimart']).default('fastfood'),
  selectedProductId: z.string().optional(),
  productName: z.string().min(1, 'Please select or enter an item name'),
  reason: z.string().min(1, 'Please select a reason'),
  quantity: z.coerce.number().min(1, 'Qty must be at least 1 unit'),
  unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative').optional(),
  note: z.string().optional(),
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
    gridTemplateColumns: '1fr 1.1fr 1.5fr 1.2fr 1.6fr',
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
    backgroundColor: 'rgba(209, 52, 56, 0.12)',
    border: '1.5px solid rgba(209, 52, 56, 0.35)',
    boxSizing: 'border-box',
  },
  lineTotalValue: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#D13438',
  },
  saveBtn: {
    height: '36px',
    backgroundColor: '#D13438',
    color: '#FFFFFF',
    borderRadius: tokens.borderRadiusMedium,
    fontWeight: 700,
    fontSize: '13px',
    border: 'none',
    boxShadow: '0 2px 6px rgba(209, 52, 56, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#B1282C',
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
});

export function StockOutView(): React.JSX.Element {
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

  // Filter tab for stock deductions (All, Kitchen Consumption, Retail Damage/Expiry)
  const [outflowTab, setOutflowTab] = useState<'all' | 'fastfood' | 'minimart'>('all');

  const form = useForm<StockOutFormData>({
    resolver: zodResolver(stockOutSchema) as any,
    defaultValues: {
      module: 'fastfood',
      selectedProductId: '',
      productName: '',
      reason: 'Kitchen Usage',
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

  // Mutation to Save Stock Out Entry
  const saveMutation = useMutation({
    mutationFn: async (data: StockOutFormData) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/stock-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: data.module || 'fastfood',
          type: 'out',
          productId: data.selectedProductId || uid('prod_'),
          productName: data.productName,
          quantity: data.quantity,
          unitCost: data.unitCost ?? null,
          reason: data.reason,
          note: data.note || '',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      form.reset({
        module: form.getValues('module') || 'fastfood',
        selectedProductId: '',
        productName: '',
        reason: form.getValues('module') === 'fastfood' ? 'Kitchen Usage' : 'Damage / Broken',
        quantity: 1,
        unitCost: 0,
        note: '',
      });
    },
  });

  // Mutation to Update Stock Out Entry via Right Drawer
  const updateMutation = useMutation({
    mutationFn: async (data: EditOutFormData) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/stock-movements/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: data.productName,
          quantity: data.quantity,
          unitCost: data.unitCost ?? null,
          reason: data.reason,
          note: data.note || '',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDrawerOpen(false);
      setEditingMovement(null);
    },
  });

  // Mutation to Delete Stock Out Entry
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/stock-movements/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setSelectedIds([]);
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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this stock out deduction record?')) {
      deleteMutation.mutate(id);
    }
  };

  // Only Outflow Movements
  const stockOutMovements = movements.filter((m) => m.type === 'out');

  // Filtered List by Tab and Search Query
  const filteredMovements = stockOutMovements.filter((m) => {
    if (outflowTab === 'fastfood' && m.module !== 'fastfood') return false;
    if (outflowTab === 'minimart' && m.module === 'fastfood') return false;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      m.productName.toLowerCase().includes(q) ||
      (m.reason && m.reason.toLowerCase().includes(q)) ||
      (m.note && m.note.toLowerCase().includes(q));

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span className={styles.cardTitle}>Record Stock Out (Damage / Waste / Usage)</span>

          {/* Department / Branch Switcher for Stock Out */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: tokens.colorNeutralForeground3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Department:
            </span>
            <div style={{ display: 'inline-flex', backgroundColor: tokens.colorNeutralBackground3, padding: '3px', borderRadius: '8px', gap: '3px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
              <button
                type="button"
                onClick={() => {
                  form.setValue('module', 'fastfood');
                  form.setValue('reason', 'Kitchen Usage');
                }}
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
                  transition: 'all 0.12s ease',
                }}
              >
                <Food24Regular style={{ width: 14, height: 14 }} />
                <span>Kitchen Consumption & Waste</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  form.setValue('module', 'minimart');
                  form.setValue('reason', 'Damage / Broken');
                }}
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
                  transition: 'all 0.12s ease',
                }}
              >
                <ShoppingBag24Regular style={{ width: 14, height: 14 }} />
                <span>Retail Mini Mart Goods</span>
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSave)} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Row 1: Reason & Product Select */}
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
              <Controller
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <ProductAutocomplete
                    id="stockOutItemSelect"
                    label="ITEM SELECT"
                    required
                    filterModule={form.watch('module')}
                    placeholder="Search and select product..."
                    value={field.value || ''}
                    onChange={(name, prod) => {
                      field.onChange(name);
                      if (prod) {
                        form.setValue('selectedProductId', prod.id);
                        if (prod.costPrice !== undefined && prod.costPrice !== null) {
                          form.setValue('unitCost', prod.costPrice);
                        } else if (prod.price) {
                          form.setValue('unitCost', prod.price);
                        }
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
                    label="QTY TO DEDUCT *"
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
                name="unitCost"
                render={({ field }) => (
                  <CustomInput
                    label="UNIT COST (PKR)"
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
                className={styles.saveBtn}
                style={{ width: '100%' }}
              >
                <ArrowCircleUp20Regular style={{ width: 18, height: 18 }} />
                <span>{saveMutation.isPending ? 'Saving...' : 'Save Stock Out Entry'}</span>
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* ── CARD 2: Stock Out (Deduction Logs) ── */}
      <div className={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: '10px' }}>
          <span className={styles.cardTitle}>Stock Out (Deduction Logs)</span>

          {/* Module Filter Tabs */}
          <div style={{ display: 'inline-flex', backgroundColor: tokens.colorNeutralBackground3, padding: '3px', borderRadius: '8px', gap: '3px', border: `1px solid ${tokens.colorNeutralStroke2}` }}>
            <button
              type="button"
              onClick={() => setOutflowTab('all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: outflowTab === 'all' ? '#E51937' : 'transparent',
                color: outflowTab === 'all' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                fontWeight: outflowTab === 'all' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <span>All Outflows</span>
              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', backgroundColor: outflowTab === 'all' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                {stockOutMovements.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOutflowTab('fastfood')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: outflowTab === 'fastfood' ? '#E51937' : 'transparent',
                color: outflowTab === 'fastfood' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                fontWeight: outflowTab === 'fastfood' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <Food24Regular style={{ width: 14, height: 14 }} />
              <span>Kitchen Usage & Waste</span>
              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', backgroundColor: outflowTab === 'fastfood' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                {stockOutMovements.filter((m) => m.module === 'fastfood').length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOutflowTab('minimart')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: outflowTab === 'minimart' ? '#E51937' : 'transparent',
                color: outflowTab === 'minimart' ? '#FFFFFF' : tokens.colorNeutralForeground2,
                fontWeight: outflowTab === 'minimart' ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <ShoppingBag24Regular style={{ width: 14, height: 14 }} />
              <span>Mini Mart Damaged/Expired</span>
              <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '8px', backgroundColor: outflowTab === 'minimart' ? 'rgba(255,255,255,0.25)' : tokens.colorNeutralBackground1, fontWeight: 700 }}>
                {stockOutMovements.filter((m) => m.module !== 'fastfood').length}
              </span>
            </button>
          </div>
        </div>

        <div className={styles.filterBar}>
          <div style={{ minWidth: '280px', maxWidth: '420px', width: '100%' }}>
            <CustomInput
              label="Search Stock Out Logs"
              placeholder="Search by product, reason, note..."
              icon={<Search20Regular />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={searchQuery ? () => setSearchQuery('') : undefined}
            />
          </div>

          <Caption1 style={{ color: tokens.colorNeutralForeground3, fontWeight: 600 }}>
            Total {filteredMovements.length} Stock Out Records
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
                <th className={styles.th}>ITEM SELECT</th>
                <th className={styles.th} style={{ textAlign: 'center' }}>QTY</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>UNIT PRICE</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>LINE TOTAL</th>
                <th className={styles.th}>REASON / DEDUCTION</th>
                <th className={styles.th}>DATE &amp; TIME</th>
                <th className={styles.th} style={{ textAlign: 'center', minWidth: '100px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                    No Stock Out deduction records found.
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
                        <Badge appearance="tint" color="danger" style={{ fontWeight: 700 }}>
                          -{mov.quantity}
                        </Badge>
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 600 }}>
                        {mov.unitCost !== null && mov.unitCost !== undefined ? formatPKR(mov.unitCost) : '—'}
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right', fontWeight: 700, color: '#D13438' }}>
                        {totalLine > 0 ? formatPKR(totalLine) : '—'}
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground1, fontWeight: 500 }}>
                          {mov.reason || 'Deduction'}
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
                          <Tooltip content="Print Deduction Slip" relationship="label" positioning="above">
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

                          <Tooltip content="Edit Deduction (Right Drawer)" relationship="label" positioning="above">
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<Edit20Regular style={{ color: '#D13438', width: 16, height: 16 }} />}
                              onClick={() => handleOpenEdit(mov)}
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

      {/* ── RIGHT-SIDE SLIDE-OVER DRAWER (Edit Stock Out) ── */}
      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(209, 52, 56, 0.12)',
                    color: '#D13438',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                  }}
                >
                  <Edit20Regular />
                </span>
                <div>
                  <Subtitle2 style={{ fontWeight: 800, color: tokens.colorNeutralForeground1, display: 'block' }}>
                    Edit Stock Out Entry
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Controller
                    control={editForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <CustomInput
                        label="Quantity Deducted"
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
                style={{ borderRadius: '8px' }}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                type="submit"
                form="editOutDrawerForm"
                disabled={updateMutation.isPending}
                style={{
                  backgroundColor: '#D13438',
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

      {/* ── PRINT DEDUCTION VOUCHER MODAL ── */}
      <Dialog open={isPrintModalOpen} onOpenChange={(_, d) => setIsPrintModalOpen(d.open)}>
        <DialogSurface style={{ borderRadius: '12px', width: '480px', maxWidth: '94vw', padding: '22px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <Subtitle2 style={{ fontWeight: 800, color: tokens.colorNeutralForeground1, margin: 0, fontSize: '17px' }}>
              Stock Deduction / Waste Voucher
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
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>OMNIPOS INVENTORY</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>Stock Deduction / Waste Slip</div>
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
                    <span style={{ color: '#555' }}>Reason:</span>
                    <span style={{ fontWeight: 700, color: '#D13438' }}>{printingMovement.reason || 'Deduction'}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #999', borderBottom: '1px dashed #999', padding: '8px 0', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                    <span>Item:</span>
                    <span>{printingMovement.productName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ color: '#555' }}>Units Deducted:</span>
                    <span style={{ fontWeight: 800, color: '#D13438' }}>-{printingMovement.quantity} units</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ color: '#555' }}>Unit Cost:</span>
                    <span>PKR {printingMovement.unitCost || 0}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, color: '#D13438' }}>
                  <span>Estimated Loss:</span>
                  <span>PKR {((printingMovement.unitCost || 0) * printingMovement.quantity).toLocaleString()}</span>
                </div>

                {printingMovement.note && (
                  <div style={{ fontSize: '10px', color: '#555', borderTop: '1px dotted #ccc', paddingTop: '6px' }}>
                    Remarks: {printingMovement.note}
                  </div>
                )}

                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#777' }}>
                  <div>Authorized By: ____________</div>
                  <div>Signature: ____________</div>
                </div>
              </div>
            )}
          </div>

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
              Print Slip
            </Button>
          </div>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
