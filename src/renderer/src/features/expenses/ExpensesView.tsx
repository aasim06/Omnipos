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
  Dropdown,
  Option,
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
  Money24Regular,
  ArrowUpload24Regular,
  ArrowDownload24Regular,
  Add20Regular,
  LockClosed20Regular,
  Receipt20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl } from '@/lib/api';
import { formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';

/* ── Zod Schemas ───────────────────────────────────────────────────── */
const expenseSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  amount: z.coerce.number().min(1, 'Amount must be at least 1 PKR'),
  paymentMode: z.string().default('cash'),
  vendorName: z.string().optional(),
  description: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const drawerActionSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be at least 1 PKR'),
  notes: z.string().min(2, 'Reason or audit note is required'),
});

type DrawerActionFormData = z.infer<typeof drawerActionSchema>;

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
    borderRadius: tokens.borderRadiusMedium, // 8px
    backgroundColor: tokens.colorNeutralBackground1, // White container
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
  expenseRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralBackground3,
    marginBottom: '8px',
  },
});

interface ExpenseRecord {
  id: string;
  category: string;
  amount: number;
  paymentMode: string;
  vendorName?: string;
  description?: string;
  date: string;
}

interface CashDrawer {
  id: string;
  openingFloat: number;
  cashSales: number;
  cashIn: number;
  cashOut: number;
  closingCash?: number;
  status: 'open' | 'closed';
}

export function ExpensesView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'expenses' | 'drawer'>('expenses');

  // Dialog States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCashDrawerActionOpen, setIsCashDrawerActionOpen] = useState(false);
  const [drawerActionType, setDrawerActionType] = useState<'CASH_IN' | 'CASH_OUT' | 'CLOSE'>('CASH_IN');

  /* ── React Hook Form + Zod for Expense ─────────────────────────────── */
  const expenseForm = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      category: 'Petty Cash',
      amount: undefined,
      paymentMode: 'cash',
      vendorName: '',
      description: '',
    },
  });

  /* ── React Hook Form + Zod for Drawer Action ───────────────────────── */
  const drawerForm = useForm<DrawerActionFormData>({
    resolver: zodResolver(drawerActionSchema) as any,
    defaultValues: {
      amount: undefined,
      notes: '',
    },
  });

  // Fetch Expenses
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<ExpenseRecord[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/expenses`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Cash Drawer Audit
  const { data: drawer } = useQuery<CashDrawer>({
    queryKey: ['cash-drawer'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/cash-drawer`);
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Add Expense Mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cash-drawer'] });
      setIsAddExpenseOpen(false);
      expenseForm.reset();
    },
  });

  // Drawer Action Mutation
  const drawerMutation = useMutation({
    mutationFn: async (data: DrawerActionFormData) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/cash-drawer/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: drawer?.id,
          type: drawerActionType,
          amount: data.amount,
          notes: data.notes,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-drawer'] });
      setIsCashDrawerActionOpen(false);
      drawerForm.reset();
    },
  });

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const expectedInDrawer = drawer
    ? drawer.openingFloat + drawer.cashSales + drawer.cashIn - drawer.cashOut
    : 0;

  if (isLoadingExpenses && expenses.length === 0) {
    return <TablePageSkeleton title="Daily Expenses & Cash Drawer" hasMetrics={true} />;
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
            Daily Expenses &amp; Cash Drawer
          </Subtitle1>
          <Caption1
            as="p"
            style={{ color: tokens.colorNeutralForeground2, margin: 0, display: 'block', fontSize: '13px' }}
          >
            Record store expenses, petty cash, and manage daily cashier drawer float audit
          </Caption1>
        </div>
      </div>

      <div style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke1}`, paddingBottom: '4px', marginBottom: '8px' }}>
        <TabList selectedValue={activeTab} onTabSelect={(_, d) => setActiveTab(d.value as any)}>
          <Tab value="expenses">Expenses Ledger</Tab>
          <Tab value="drawer">Cash Drawer Audit</Tab>
        </TabList>
      </div>

      {activeTab === 'expenses' ? (
        <>
          {/* Metrics */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Total Logged Expenses</Caption1>
              <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, color: '#D13438', marginTop: '6px', display: 'block' }}>
                {formatPKR(totalExpenseAmount)}
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Total Entries</Caption1>
              <Subtitle1 style={{ fontSize: '22px', fontWeight: 800, marginTop: '6px', display: 'block', color: tokens.colorNeutralForeground1 }}>
                {expenses.length} Records
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Top Category</Caption1>
              <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#0078D4', display: 'block' }}>
                Rent &amp; Utilities
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Paid via Cash Drawer</Caption1>
              <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, marginTop: '6px', color: '#107C41', display: 'block' }}>
                {formatPKR(expenses.filter((e) => e.paymentMode === 'cash').reduce((s, e) => s + (e.amount || 0), 0))}
              </Subtitle1>
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.actionGrid}>
            <div className={styles.actionCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Receipt20Regular style={{ width: 28, height: 28, color: '#0078D4', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Record Store Expense</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px' }}>
                    Log tea, salaries, utilities, repair, or raw vendor purchases
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
                  expenseForm.reset();
                  setIsAddExpenseOpen(true);
                }}
              >
                Record New Expense
              </Button>
            </div>

            <div className={styles.actionCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <Money24Regular style={{ width: 28, height: 28, color: '#107C41', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Drawer Cash Out</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px' }}>
                    Withdraw petty cash directly from register drawer
                  </Caption1>
                </div>
              </div>
              <Button
                appearance="outline"
                icon={<ArrowDownload24Regular />}
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
                  setDrawerActionType('CASH_OUT');
                  drawerForm.reset({ amount: undefined, notes: 'Petty cash withdrawal' });
                  setIsCashDrawerActionOpen(true);
                }}
              >
                Withdraw Cash
              </Button>
            </div>
          </div>

          {/* Expense History Ledger */}
          <div className={styles.historyCard}>
            <div style={{ marginBottom: '16px' }}>
              <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>
                Expense Transactions Ledger
              </Body1>
            </div>

            {expenses.length === 0 ? (
              <Body1 style={{ color: tokens.colorNeutralForeground3, textAlign: 'center', padding: '32px', display: 'block' }}>
                No expense entries logged today.
              </Body1>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className={styles.expenseRow}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Body1 style={{ fontWeight: 600, color: tokens.colorNeutralForeground1 }}>{exp.category}</Body1>
                      <Badge size="small" appearance="outline" color="informative">
                        {exp.paymentMode ? exp.paymentMode.toUpperCase() : 'CASH'}
                      </Badge>
                    </div>
                    <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block' }}>
                      {new Date(exp.date).toLocaleDateString()} at {new Date(exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {exp.vendorName ? ` • Vendor: ${exp.vendorName}` : ''}
                      {exp.description ? ` • ${exp.description}` : ''}
                    </Caption1>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Subtitle1 style={{ fontWeight: 700, color: '#D13438' }}>
                      -PKR {exp.amount.toLocaleString()}
                    </Subtitle1>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Cash Drawer Audit Tab */
        <>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Opening Register Float</Caption1>
              <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, color: tokens.colorNeutralForeground1, marginTop: '6px', display: 'block' }}>
                {formatPKR(drawer?.openingFloat || 5000)}
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Total Cash Sales Today</Caption1>
              <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, color: '#107C41', marginTop: '6px', display: 'block' }}>
                +{formatPKR(drawer?.cashSales || 0)}
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Cash In / Cash Out</Caption1>
              <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, color: tokens.colorNeutralForeground1, marginTop: '6px', display: 'block' }}>
                +{formatPKR(drawer?.cashIn || 0)} / -{formatPKR(drawer?.cashOut || 0)}
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>Expected In Drawer Right Now</Caption1>
              <Subtitle1 style={{ fontSize: '26px', fontWeight: 800, color: '#0078D4', marginTop: '6px', display: 'block' }}>
                {formatPKR(expectedInDrawer)}
              </Subtitle1>
            </div>
          </div>

          <div className={styles.actionGrid}>
            <div className={styles.actionCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <ArrowUpload24Regular style={{ width: 28, height: 28, color: '#107C41', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Add Cash In to Register</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px' }}>
                    Inject change float, petty cash addition, or owner cash
                  </Caption1>
                </div>
              </div>
              <Button
                appearance="primary"
                style={{ backgroundColor: '#107C41', borderRadius: tokens.borderRadiusMedium }}
                onClick={() => {
                  setDrawerActionType('CASH_IN');
                  drawerForm.reset({ amount: undefined, notes: 'Cash In float' });
                  setIsCashDrawerActionOpen(true);
                }}
              >
                Add Cash In
              </Button>
            </div>

            <div className={styles.actionCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <LockClosed20Regular style={{ width: 28, height: 28, color: '#F7630C', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <Body1 style={{ fontWeight: 700, color: tokens.colorNeutralForeground1, display: 'block' }}>Close Drawer / Audit</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontSize: '12px' }}>
                    Count physical cash and close daily register session
                  </Caption1>
                </div>
              </div>
              <Button
                appearance="primary"
                style={{ backgroundColor: '#E51937', borderRadius: tokens.borderRadiusMedium }}
                onClick={() => {
                  setDrawerActionType('CLOSE');
                  drawerForm.reset({ amount: expectedInDrawer, notes: 'End of day close' });
                  setIsCashDrawerActionOpen(true);
                }}
              >
                Audit &amp; Close Register
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Record Expense Dialog with Labels & Zod + React Hook Form ─ */}
      <Dialog open={isAddExpenseOpen} onOpenChange={(_, d) => setIsAddExpenseOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '500px', width: '100%', overflowX: 'hidden' }}>
          <form onSubmit={expenseForm.handleSubmit((data) => addExpenseMutation.mutate(data))}>
            <DialogBody style={{ overflowX: 'hidden' }}>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px', overflowX: 'hidden', overflowY: 'auto' }}>
                
                {/* Category */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Expense Category</Label>
                  <Controller
                    control={expenseForm.control}
                    name="category"
                    render={({ field }) => {
                      const categoryLabels: Record<string, string> = {
                        'Petty Cash': 'Tea / Refreshments / Cleaning',
                        Rent: 'Shop Rent',
                        Utilities: 'Electricity / Gas / Water Bill',
                        Salaries: 'Staff Salary / Daily Wages',
                        Vendor: 'Vendor & Raw Material Supply',
                        Maintenance: 'Equipment Repair & Maintenance',
                        Other: 'Other Expenses',
                      };
                      return (
                        <Dropdown
                          appearance="outline"
                          style={{ width: '100%' }}
                          value={categoryLabels[field.value] || field.value || 'Select Expense Category'}
                          selectedOptions={field.value ? [field.value] : []}
                          onOptionSelect={(_, d) => {
                            if (d.optionValue) field.onChange(d.optionValue);
                          }}
                        >
                          <Option value="Petty Cash" text="Tea / Refreshments / Cleaning">Tea / Refreshments / Cleaning</Option>
                          <Option value="Rent" text="Shop Rent">Shop Rent</Option>
                          <Option value="Utilities" text="Electricity / Gas / Water Bill">Electricity / Gas / Water Bill</Option>
                          <Option value="Salaries" text="Staff Salary / Daily Wages">Staff Salary / Daily Wages</Option>
                          <Option value="Vendor" text="Vendor & Raw Material Supply">Vendor &amp; Raw Material Supply</Option>
                          <Option value="Maintenance" text="Equipment Repair & Maintenance">Equipment Repair &amp; Maintenance</Option>
                          <Option value="Other" text="Other Expenses">Other Expenses</Option>
                        </Dropdown>
                      );
                    }}
                  />
                  {expenseForm.formState.errors.category && (
                    <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {expenseForm.formState.errors.category.message}
                    </span>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Expense Amount (PKR)</Label>
                  <Controller
                    control={expenseForm.control}
                    name="amount"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="e.g. 1500"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                  {expenseForm.formState.errors.amount && (
                    <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {expenseForm.formState.errors.amount.message}
                    </span>
                  )}
                </div>

                {/* Payment Mode */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Payment Method</Label>
                  <Controller
                    control={expenseForm.control}
                    name="paymentMode"
                    render={({ field }) => {
                      const modeLabels: Record<string, string> = {
                        cash: 'Paid via Cash (Draw from Register Drawer)',
                        bank: 'Paid via Bank Transfer',
                        card: 'Paid via Company Card',
                      };
                      return (
                        <Dropdown
                          appearance="outline"
                          style={{ width: '100%' }}
                          value={modeLabels[field.value] || field.value || 'Select Payment Method'}
                          selectedOptions={field.value ? [field.value] : []}
                          onOptionSelect={(_, d) => {
                            if (d.optionValue) field.onChange(d.optionValue);
                          }}
                        >
                          <Option value="cash" text="Paid via Cash (Draw from Register Drawer)">Paid via Cash (Draw from Register Drawer)</Option>
                          <Option value="bank" text="Paid via Bank Transfer">Paid via Bank Transfer</Option>
                          <Option value="card" text="Paid via Company Card">Paid via Company Card</Option>
                        </Dropdown>
                      );
                    }}
                  />
                </div>

                {/* Payee / Vendor Name */}
                <div>
                  <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Payee / Vendor Name (Optional)</Label>
                  <Controller
                    control={expenseForm.control}
                    name="vendorName"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        style={{ width: '100%' }}
                        placeholder="e.g. K-Electric, Metro Cash & Carry, or Tea Stall"
                        value={field.value || ''}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                </div>

                {/* Description Note */}
                <div>
                  <Label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Description / Note (Optional)</Label>
                  <Controller
                    control={expenseForm.control}
                    name="description"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        style={{ width: '100%' }}
                        placeholder="e.g. Morning shift refreshments"
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
                  onClick={() => setIsAddExpenseOpen(false)}
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
                  disabled={addExpenseMutation.isPending}
                  style={{
                    backgroundColor: '#E51937',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    padding: '9px 22px',
                    minWidth: '130px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
                  }}
                >
                  {addExpenseMutation.isPending ? 'Saving...' : 'Save Expense'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ── Cash Drawer Action Dialog with Labels & Zod + React Hook Form ── */}
      <Dialog open={isCashDrawerActionOpen} onOpenChange={(_, d) => setIsCashDrawerActionOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '460px', width: '100%', overflowX: 'hidden' }}>
          <form onSubmit={drawerForm.handleSubmit((data) => drawerMutation.mutate(data))}>
            <DialogBody style={{ overflowX: 'hidden' }}>
              <DialogTitle>
                {drawerActionType === 'CASH_IN' && 'Add Cash to Register Drawer'}
                {drawerActionType === 'CASH_OUT' && 'Remove Cash from Register Drawer'}
                {drawerActionType === 'CLOSE' && 'End of Day Drawer Close & Reconciliation'}
              </DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px', overflowX: 'hidden', overflowY: 'auto' }}>
                
                {/* Amount */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Amount (PKR)</Label>
                  <Controller
                    control={drawerForm.control}
                    name="amount"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        type="number"
                        style={{ width: '100%' }}
                        placeholder="e.g. 5000"
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                  {drawerForm.formState.errors.amount && (
                    <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {drawerForm.formState.errors.amount.message}
                    </span>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label required style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Reason / Audit Note</Label>
                  <Controller
                    control={drawerForm.control}
                    name="notes"
                    render={({ field }) => (
                      <Input
                        appearance="outline"
                        style={{ width: '100%' }}
                        placeholder="e.g. Morning float injection or end of day closing"
                        value={field.value}
                        onChange={(_, d) => field.onChange(d.value)}
                      />
                    )}
                  />
                  {drawerForm.formState.errors.notes && (
                    <span style={{ color: '#E51937', fontSize: '11px', marginTop: '3px', display: 'block' }}>
                      {drawerForm.formState.errors.notes.message}
                    </span>
                  )}
                </div>
              </DialogContent>
              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsCashDrawerActionOpen(false)}
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
                  disabled={drawerMutation.isPending}
                  style={{
                    backgroundColor: '#E51937',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    padding: '9px 22px',
                    minWidth: '130px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
                  }}
                >
                  {drawerMutation.isPending ? 'Processing...' : 'Confirm Action'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
