import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Card,
  Button,
  Subtitle1,
  Body1,
  Caption1,
  Badge,
  Input,
  Select,
  Label,
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
  ArrowCircleDown20Regular,
  ArrowCircleUp20Regular,
  Add20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl } from '@/lib/api';
import { StockMovement, Product } from '@shared/types';
import { uid } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';

/* ── Zod Form Validation Schemas ───────────────────────────────────── */
const stockInSchema = z.object({
  selectedProductId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1 unit'),
  unitCost: z.coerce.number().min(0, 'Cost must be 0 or positive').optional(),
  unitPrice: z.coerce.number().min(0, 'Price must be 0 or positive').optional(),
  note: z.string().optional(),
});

type StockInFormData = z.infer<typeof stockInSchema>;

const stockOutSchema = z.object({
  selectedProductId: z.string().optional(),
  productName: z.string().min(1, 'Product name is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1 unit'),
  reason: z.string().min(1, 'Please select a reason for stock deduction'),
  note: z.string().optional(),
});

type StockOutFormData = z.infer<typeof stockOutSchema>;

const useStyles = makeStyles({
  container: {
    padding: '28px 32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2, // Mica light theme tint
    overflowY: 'auto',
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
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    padding: '16px 20px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  actionCard: {
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
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
  historyCard: {
    borderRadius: tokens.borderRadiusMedium,
    padding: '20px',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    borderTopWidth: '1px', borderBottomWidth: '1px',
    borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid',
    borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
  },
  movementRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    marginBottom: '8px',
  },
});

export function InventoryView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'in' | 'out'>('all');

  // Dialog open states
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isStockOutOpen, setIsStockOutOpen] = useState(false);

  // Fetch Products
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/products`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Stock Movements
  const { data: movements = [] } = useQuery<StockMovement[]>({
    queryKey: ['stock-movements'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/stock-movements`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  /* ── React Hook Form + Zod for Stock In ────────────────────────────── */
  const stockInForm = useForm<StockInFormData>({
    resolver: zodResolver(stockInSchema) as any,
    defaultValues: {
      selectedProductId: '',
      productName: '',
      quantity: 10,
      unitCost: undefined,
      unitPrice: undefined,
      note: '',
    },
  });

  /* ── React Hook Form + Zod for Stock Out ───────────────────────────── */
  const stockOutForm = useForm<StockOutFormData>({
    resolver: zodResolver(stockOutSchema) as any,
    defaultValues: {
      selectedProductId: '',
      productName: '',
      quantity: 1,
      reason: 'Kitchen Usage',
      note: '',
    },
  });

  // Submit Stock Movement
  const stockMutation = useMutation({
    mutationFn: async (payload: {
      type: 'in' | 'out';
      productId: string;
      productName: string;
      quantity: number;
      unitCost?: number | null;
      unitPrice?: number | null;
      reason: string;
      note?: string;
    }) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/stock-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'minimart',
          ...payload,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsStockInOpen(false);
      setIsStockOutOpen(false);
      stockInForm.reset();
      stockOutForm.reset();
    },
  });

  const onStockInSubmit = (data: StockInFormData) => {
    stockMutation.mutate({
      type: 'in',
      productId: data.selectedProductId || uid('prod_'),
      productName: data.productName,
      quantity: data.quantity,
      unitCost: data.unitCost ?? null,
      unitPrice: data.unitPrice ?? null,
      reason: 'Purchase / Supply',
      note: data.note || '',
    });
  };

  const onStockOutSubmit = (data: StockOutFormData) => {
    stockMutation.mutate({
      type: 'out',
      productId: data.selectedProductId || uid('prod_'),
      productName: data.productName,
      quantity: data.quantity,
      reason: data.reason,
      note: data.note || '',
    });
  };

  // Live valuation
  const totalStockItems = products.length;
  const totalUnitsInStock = products.reduce((acc, p) => acc + (p.openingStock || 0), 0);
  const totalPurchaseValue = products.reduce((acc, p) => acc + (p.costPrice || 0) * (p.openingStock || 1), 0);
  const totalRetailValue = products.reduce((acc, p) => acc + (p.price || 0) * (p.openingStock || 1), 0);

  const filteredMovements = movements.filter((m) => {
    if (activeTab === 'in') return m.type === 'in';
    if (activeTab === 'out') return m.type === 'out';
    return true;
  });

  if (isLoadingProducts && products.length === 0) {
    return <TablePageSkeleton title="Inventory & Stock Control" hasMetrics={true} />;
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Subtitle1
            as="h1"
            style={{ fontWeight: 700, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Inventory &amp; Stock Control
          </Subtitle1>
          <Caption1
            as="p"
            style={{ color: tokens.colorNeutralForeground2, margin: 0, display: 'block', fontSize: '13px' }}
          >
            Record Stock In (purchases), Stock Out (waste/usage), and track live valuation
          </Caption1>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Total Catalog Items</Caption1>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', display: 'block', color: tokens.colorNeutralForeground1 }}>{totalStockItems}</Subtitle1>
        </div>
        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Total Units in Stock</Caption1>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', display: 'block', color: '#0078D4' }}>
            {totalUnitsInStock.toLocaleString()} units
          </Subtitle1>
        </div>
        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Inventory Purchase Cost</Caption1>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', display: 'block', color: tokens.colorNeutralForeground1 }}>
            PKR {totalPurchaseValue.toLocaleString()}
          </Subtitle1>
        </div>
        <div className={styles.metricCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Retail Selling Valuation</Caption1>
          <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', display: 'block', color: '#107C41' }}>
            PKR {totalRetailValue.toLocaleString()}
          </Subtitle1>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionGrid}>
        <div className={styles.actionCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ArrowCircleDown20Regular style={{ width: 28, height: 28, color: '#107C41', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Stock In (Purchases)</Body1>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px' }}>
                Receive new items, vendor supplies, and update warehouse count
              </Caption1>
            </div>
          </div>
          <Button
            appearance="primary"
            icon={<Add20Regular />}
            style={{
              backgroundColor: '#E51937',
              color: '#FFFFFF',
              borderRadius: '8px',
              fontWeight: 700,
              padding: '9px 18px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              border: 'none',
              boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
            }}
            onClick={() => {
              stockInForm.reset();
              setIsStockInOpen(true);
            }}
          >
            Record Stock In Entry
          </Button>
        </div>

        <div className={styles.actionCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ArrowCircleUp20Regular style={{ width: 28, height: 28, color: '#D13438', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Stock Out / Damage / Waste</Body1>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px' }}>
                Log inventory reduction, expired items, waste, or kitchen dispatch
              </Caption1>
            </div>
          </div>
          <Button
            appearance="outline"
            icon={<ArrowCircleUp20Regular />}
            style={{
              backgroundColor: tokens.colorNeutralBackground1,
              color: tokens.colorNeutralForeground1,
              borderRadius: '8px',
              fontWeight: 700,
              padding: '8px 18px',
              border: `1.5px solid ${tokens.colorNeutralStroke1}`,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onClick={() => {
              stockOutForm.reset();
              setIsStockOutOpen(true);
            }}
          >
            Record Stock Out Entry
          </Button>
        </div>
      </div>

      {/* Movements Table / History */}
      <div className={styles.historyCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>
            Stock Movement Ledger
          </Body1>

          <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value as any)}>
            <Tab value="all">All Movements</Tab>
            <Tab value="in">Stock In</Tab>
            <Tab value="out">Stock Out</Tab>
          </TabList>
        </div>

        {filteredMovements.length === 0 ? (
          <Body1 style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '32px', display: 'block' }}>
            No stock movement entries found.
          </Body1>
        ) : (
          filteredMovements.map((mov) => (
            <div key={mov.id} className={styles.movementRow}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <Body1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1, display: 'block' }}>{mov.productName}</Body1>
                <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block' }}>
                  {new Date(mov.date).toLocaleDateString()} at {new Date(mov.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Reason: {mov.reason || 'General'}
                  {mov.note ? ` • Note: ${mov.note}` : ''}
                </Caption1>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {mov.unitCost && (
                  <Caption1 style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                    @ PKR {mov.unitCost} / unit
                  </Caption1>
                )}
                <Badge
                  appearance="filled"
                  color={mov.type === 'in' ? 'success' : 'danger'}
                  size="large"
                  style={{ minWidth: '90px', textAlign: 'center', fontWeight: 700 }}
                >
                  {mov.type === 'in' ? '+' : '-'}{mov.quantity} units
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Stock In Dialog with Labels & Zod + React Hook Form ─────── */}
      <Dialog open={isStockInOpen} onOpenChange={(_, d) => setIsStockInOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '520px' }}>
          <form onSubmit={stockInForm.handleSubmit(onStockInSubmit)}>
            <DialogBody>
              <DialogTitle>Stock In (Receive Inventory)</DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                
                {/* Product Autocomplete Field */}
                <div>
                  <Controller
                    control={stockInForm.control}
                    name="productName"
                    render={({ field }) => (
                      <ProductAutocomplete
                        id="stockInProductName"
                        label="Product / Item Name"
                        required
                        placeholder="Search or type product (e.g. Zinger, Burger, Oil Filter)..."
                        value={field.value || ''}
                        onChange={(name, prod) => {
                          field.onChange(name);
                          if (prod) {
                            stockInForm.setValue('selectedProductId', prod.id);
                            if (prod.costPrice) stockInForm.setValue('unitCost', prod.costPrice);
                            if (prod.price) stockInForm.setValue('unitPrice', prod.price);
                          }
                        }}
                        error={stockInForm.formState.errors.productName?.message}
                      />
                    )}
                  />
                </div>

                {/* Quantity & Unit Cost */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Quantity (Units)</Label>
                    <Controller
                      control={stockInForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <Input
                          appearance="outline"
                          type="number"
                          style={{ width: '100%' }}
                          placeholder="e.g. 50"
                          value={String(field.value ?? '')}
                          onChange={(_, d) => field.onChange(d.value)}
                        />
                      )}
                    />
                    {stockInForm.formState.errors.quantity && (
                      <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                        {stockInForm.formState.errors.quantity.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Purchase Cost per Unit (PKR)</Label>
                    <Controller
                      control={stockInForm.control}
                      name="unitCost"
                      render={({ field }) => (
                        <Input
                          appearance="outline"
                          type="number"
                          style={{ width: '100%' }}
                          placeholder="e.g. 350"
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(_, d) => field.onChange(d.value)}
                        />
                      )}
                    />
                    {stockInForm.formState.errors.unitCost && (
                      <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                        {stockInForm.formState.errors.unitCost.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Retail Price */}
                <div>
                  <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Retail Selling Price (PKR)</Label>
                  <Controller
                    control={stockInForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="e.g. 550"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                  {stockInForm.formState.errors.unitPrice && (
                    <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {stockInForm.formState.errors.unitPrice.message}
                    </span>
                  )}
                </div>

                {/* Supplier Note */}
                <div>
                  <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Supplier or Receipt Note (Optional)</Label>
                  <Controller
                    control={stockInForm.control}
                    name="note"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        style={{ width: '100%' }}
                        placeholder="e.g. Invoice #9021 from Metro Cash & Carry"
                        value={field.value || ''}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                </div>
              </DialogContent>
              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsStockInOpen(false)}
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
                  disabled={stockMutation.isPending}
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
                  {stockMutation.isPending ? 'Saving...' : 'Confirm Stock In'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ── Stock Out Dialog with Labels & Zod + React Hook Form ────── */}
      <Dialog open={isStockOutOpen} onOpenChange={(_, d) => setIsStockOutOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '500px' }}>
          <form onSubmit={stockOutForm.handleSubmit(onStockOutSubmit)}>
            <DialogBody>
              <DialogTitle>Stock Out / Waste / Usage</DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                
                {/* Product Autocomplete Field */}
                <div>
                  <Controller
                    control={stockOutForm.control}
                    name="productName"
                    render={({ field }) => (
                      <ProductAutocomplete
                        id="stockOutProductName"
                        label="Product / Item Name"
                        required
                        placeholder="Search or type product (e.g. Zinger, Burger, Oil Filter)..."
                        value={field.value || ''}
                        onChange={(name, prod) => {
                          field.onChange(name);
                          if (prod) {
                            stockOutForm.setValue('selectedProductId', prod.id);
                          }
                        }}
                        error={stockOutForm.formState.errors.productName?.message}
                      />
                    )}
                  />
                </div>

                {/* Quantity */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Quantity to Deduct (Units)</Label>
                  <Controller
                    control={stockOutForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="e.g. 5"
                        value={String(field.value ?? '')}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                  {stockOutForm.formState.errors.quantity && (
                    <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {stockOutForm.formState.errors.quantity.message}
                    </span>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Reason for Deduction</Label>
                  <Controller
                    control={stockOutForm.control}
                    name="reason"
                    render={({ field }) => (
                      <Select
                        appearance="outline"
                        style={{ width: '100%' }}
                        value={field.value}
                        onChange={(_, d) => field.onChange(d.value)}
                      >
                        <option value="Kitchen Usage">Kitchen Usage / Consumption</option>
                        <option value="Damage / Broken">Damage / Broken</option>
                        <option value="Expired">Expired</option>
                        <option value="Audit Adjustment">Audit Adjustment</option>
                        <option value="Theft / Lost">Theft / Lost</option>
                        <option value="Other">Other Reason</option>
                      </Select>
                    )}
                  />
                </div>

                {/* Note */}
                <div>
                  <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Reason Note (Optional)</Label>
                  <Controller
                    control={stockOutForm.control}
                    name="note"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        style={{ width: '100%' }}
                        placeholder="Additional details about disposal/usage"
                        value={field.value || ''}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                </div>
              </DialogContent>
              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsStockOutOpen(false)}
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
                  disabled={stockMutation.isPending}
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
                  {stockMutation.isPending ? 'Saving...' : 'Confirm Stock Out'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
