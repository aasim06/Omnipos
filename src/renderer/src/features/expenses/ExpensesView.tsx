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
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  TabList,
  Tab,
  mergeClasses,
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
import { CustomInput, CustomSelect } from '@/components/ui';

const EXPENSE_CATEGORY_OPTIONS = [
  { value: 'Petty Cash', label: 'Tea / Refreshments / Cleaning' },
  { value: 'Rent', label: 'Shop Rent' },
  { value: 'Utilities', label: 'Electricity / Gas / Water Bill' },
  { value: 'Salaries', label: 'Staff Salary / Daily Wages' },
  { value: 'Vendor', label: 'Vendor & Raw Material Supply' },
  { value: 'Maintenance', label: 'Equipment Repair & Maintenance' },
  { value: 'Other', label: 'Other Expenses' },
];

const PAYMENT_MODE_OPTIONS = [
  { value: 'cash', label: 'Paid via Cash (Draw from Register Drawer)' },
  { value: 'bank', label: 'Paid via Bank Transfer' },
  { value: 'card', label: 'Paid via Company Card' },
];

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
  headerTitleCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
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
    margin: 0,
    display: 'block',
    fontSize: '13px',
  },
  tabListContainer: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    paddingBottom: '4px',
    marginBottom: '8px',
  },
  kpiLabel: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    fontWeight: 600,
  },
  kpiValueDanger: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#D13438',
    marginTop: '6px',
    display: 'block',
  },
  kpiValueDefault: {
    fontSize: '22px',
    fontWeight: 800,
    marginTop: '6px',
    display: 'block',
    color: tokens.colorNeutralForeground1,
  },
  kpiValueDefaultLg: {
    fontSize: '26px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    marginTop: '6px',
    display: 'block',
  },
  kpiValueBrand: {
    fontSize: '26px',
    fontWeight: 800,
    marginTop: '6px',
    color: '#0078D4',
    display: 'block',
  },
  kpiValueSuccess: {
    fontSize: '26px',
    fontWeight: 800,
    marginTop: '6px',
    color: '#107C41',
    display: 'block',
  },
  actionContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  actionTextCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  actionTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  actionSubtitle: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
    fontSize: '12px',
  },
  actionIconReceipt: {
    width: '28px',
    height: '28px',
    color: '#0078D4',
    flexShrink: 0,
    marginTop: '2px',
  },
  actionIconCashOut: {
    width: '28px',
    height: '28px',
    color: '#107C41',
    flexShrink: 0,
    marginTop: '2px',
  },
  actionIconUpload: {
    width: '28px',
    height: '28px',
    color: '#107C41',
    flexShrink: 0,
    marginTop: '2px',
  },
  actionIconLock: {
    width: '28px',
    height: '28px',
    color: '#F7630C',
    flexShrink: 0,
    marginTop: '2px',
  },
  btnRecordExpense: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '9px 18px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    border: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
  },
  btnDrawerCashOut: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    borderRadius: '8px',
    fontWeight: 700,
    padding: '8px 18px',
    borderTopWidth: '1.5px', borderBottomWidth: '1.5px', borderLeftWidth: '1.5px', borderRightWidth: '1.5px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  btnCashIn: {
    backgroundColor: '#107C41',
    borderRadius: tokens.borderRadiusMedium,
  },
  btnCloseDrawer: {
    backgroundColor: '#E51937',
    borderRadius: tokens.borderRadiusMedium,
  },
  historyTitleBox: {
    marginBottom: '16px',
  },
  historyTitle: {
    fontWeight: 700,
    color: tokens.colorNeutralForeground1,
    display: 'block',
  },
  emptyHistoryText: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    padding: '32px',
    display: 'block',
  },
  expenseMetaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  expenseCategoryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  expenseCategoryText: {
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  expenseDateCaption: {
    color: tokens.colorNeutralForeground2,
    display: 'block',
  },
  expenseAmountRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  expenseAmountText: {
    fontWeight: 700,
    color: '#D13438',
  },
  dialogSurfaceExpense: {
    borderRadius: tokens.borderRadiusLarge,
    maxWidth: '500px',
    width: '100%',
    overflowX: 'hidden',
  },
  dialogSurfaceDrawer: {
    borderRadius: tokens.borderRadiusLarge,
    maxWidth: '460px',
    width: '100%',
    overflowX: 'hidden',
  },
  dialogBodyNoOverflow: {
    overflowX: 'hidden',
  },
  dialogContentScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '14px',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  dialogActionsRow: {
    marginTop: '24px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  dialogCancelBtn: {
    borderRadius: '8px',
    fontWeight: 600,
    padding: '8px 18px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    whiteSpace: 'nowrap',
  },
  dialogSubmitExpenseBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '9px 22px',
    minWidth: '140px',
    whiteSpace: 'nowrap',
    border: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.25)',
  },
  dialogSubmitCashInBtn: {
    backgroundColor: '#107C41',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontWeight: 700,
    padding: '9px 22px',
    minWidth: '140px',
    whiteSpace: 'nowrap',
    border: 'none',
    boxShadow: '0 2px 8px rgba(16, 124, 65, 0.25)',
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
        <div className={styles.headerTitleCol}>
          <Subtitle1
            as="h1"
            className={styles.headerTitle}
          >
            Daily Expenses &amp; Cash Drawer
          </Subtitle1>
          <Caption1
            as="p"
            className={styles.headerSubtitle}
          >
            Record store expenses, petty cash, and manage daily cashier drawer float audit
          </Caption1>
        </div>
      </div>

      <div className={styles.tabListContainer}>
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
              <Caption1 className={styles.kpiLabel}>Total Logged Expenses</Caption1>
              <Subtitle1 className={styles.kpiValueDanger}>
                {formatPKR(totalExpenseAmount)}
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 className={styles.kpiLabel}>Total Entries</Caption1>
              <Subtitle1 className={styles.kpiValueDefault}>
                {expenses.length} Records
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 className={styles.kpiLabel}>Top Category</Caption1>
              <Subtitle1 className={styles.kpiValueBrand}>
                Rent &amp; Utilities
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 className={styles.kpiLabel}>Paid via Cash Drawer</Caption1>
              <Subtitle1 className={styles.kpiValueSuccess}>
                {formatPKR(expenses.filter((e) => e.paymentMode === 'cash').reduce((s, e) => s + (e.amount || 0), 0))}
              </Subtitle1>
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.actionGrid}>
            <div className={styles.actionCard}>
              <div className={styles.actionContent}>
                <Receipt20Regular className={styles.actionIconReceipt} />
                <div className={styles.actionTextCol}>
                  <Body1 className={styles.actionTitle}>Record Store Expense</Body1>
                  <Caption1 className={styles.actionSubtitle}>
                    Log tea, salaries, utilities, repair, or raw vendor purchases
                  </Caption1>
                </div>
              </div>
              <Button
                appearance="primary"
                icon={<Add20Regular />}
                className={styles.btnRecordExpense}
                onClick={() => {
                  expenseForm.reset();
                  setIsAddExpenseOpen(true);
                }}
              >
                Record New Expense
              </Button>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.actionContent}>
                <Money24Regular className={styles.actionIconCashOut} />
                <div className={styles.actionTextCol}>
                  <Body1 className={styles.actionTitle}>Drawer Cash Out</Body1>
                  <Caption1 className={styles.actionSubtitle}>
                    Withdraw petty cash directly from register drawer
                  </Caption1>
                </div>
              </div>
              <Button
                appearance="outline"
                icon={<ArrowDownload24Regular />}
                className={styles.btnDrawerCashOut}
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
            <div className={styles.historyTitleBox}>
              <Body1 className={styles.historyTitle}>
                Expense Transactions Ledger
              </Body1>
            </div>

            {expenses.length === 0 ? (
              <Body1 className={styles.emptyHistoryText}>
                No expense entries logged today.
              </Body1>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className={styles.expenseRow}>
                  <div className={styles.expenseMetaCol}>
                    <div className={styles.expenseCategoryRow}>
                      <Body1 className={styles.expenseCategoryText}>{exp.category}</Body1>
                      <Badge size="small" appearance="outline" color="informative">
                        {exp.paymentMode ? exp.paymentMode.toUpperCase() : 'CASH'}
                      </Badge>
                    </div>
                    <Caption1 className={styles.expenseDateCaption}>
                      {new Date(exp.date).toLocaleDateString()} at {new Date(exp.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {exp.vendorName ? ` • Vendor: ${exp.vendorName}` : ''}
                      {exp.description ? ` • ${exp.description}` : ''}
                    </Caption1>
                  </div>

                  <div className={styles.expenseAmountRow}>
                    <Subtitle1 className={styles.expenseAmountText}>
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
              <Caption1 className={styles.kpiLabel}>Opening Register Float</Caption1>
              <Subtitle1 className={styles.kpiValueDefaultLg}>
                {formatPKR(drawer?.openingFloat || 5000)}
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 className={styles.kpiLabel}>Total Cash Sales Today</Caption1>
              <Subtitle1 className={styles.kpiValueSuccess}>
                +{formatPKR(drawer?.cashSales || 0)}
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 className={styles.kpiLabel}>Cash In / Cash Out</Caption1>
              <Subtitle1 className={styles.kpiValueDefaultLg}>
                +{formatPKR(drawer?.cashIn || 0)} / -{formatPKR(drawer?.cashOut || 0)}
              </Subtitle1>
            </div>
            <div className={styles.metricCard}>
              <Caption1 className={styles.kpiLabel}>Expected In Drawer Right Now</Caption1>
              <Subtitle1 className={styles.kpiValueBrand}>
                {formatPKR(expectedInDrawer)}
              </Subtitle1>
            </div>
          </div>

          <div className={styles.actionGrid}>
            <div className={styles.actionCard}>
              <div className={styles.actionContent}>
                <ArrowUpload24Regular className={styles.actionIconUpload} />
                <div className={styles.actionTextCol}>
                  <Body1 className={styles.actionTitle}>Add Cash In to Register</Body1>
                  <Caption1 className={styles.actionSubtitle}>
                    Inject change float, petty cash addition, or owner cash
                  </Caption1>
                </div>
              </div>
              <Button
                appearance="primary"
                className={styles.btnCashIn}
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
              <div className={styles.actionContent}>
                <LockClosed20Regular className={styles.actionIconLock} />
                <div className={styles.actionTextCol}>
                  <Body1 className={styles.actionTitle}>Close Drawer / Audit</Body1>
                  <Caption1 className={styles.actionSubtitle}>
                    Count physical cash and close daily register session
                  </Caption1>
                </div>
              </div>
              <Button
                appearance="primary"
                className={styles.btnCloseDrawer}
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
        <DialogSurface className={styles.dialogSurfaceExpense}>
          <form onSubmit={expenseForm.handleSubmit((data) => addExpenseMutation.mutate(data))}>
            <DialogBody className={styles.dialogBodyNoOverflow}>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogContent className={styles.dialogContentScroll}>
                {/* Category */}
                <Controller
                  control={expenseForm.control}
                  name="category"
                  render={({ field }) => (
                    <CustomSelect
                      label="Expense Category"
                      required
                      placeholder="Select Expense Category"
                      value={field.value || ''}
                      onChange={field.onChange}
                      options={EXPENSE_CATEGORY_OPTIONS}
                      error={expenseForm.formState.errors.category?.message}
                    />
                  )}
                />

                {/* Amount */}
                <Controller
                  control={expenseForm.control}
                  name="amount"
                  render={({ field }) => (
                    <CustomInput
                      label="Expense Amount (PKR)"
                      required
                      type="number"
                      placeholder="e.g. 1500"
                      value={field.value !== undefined ? String(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      error={expenseForm.formState.errors.amount?.message}
                    />
                  )}
                />

                {/* Payment Mode */}
                <Controller
                  control={expenseForm.control}
                  name="paymentMode"
                  render={({ field }) => (
                    <CustomSelect
                      label="Payment Method"
                      required
                      placeholder="Select Payment Method"
                      value={field.value || 'cash'}
                      onChange={field.onChange}
                      options={PAYMENT_MODE_OPTIONS}
                    />
                  )}
                />

                {/* Payee / Vendor Name */}
                <Controller
                  control={expenseForm.control}
                  name="vendorName"
                  render={({ field }) => (
                    <CustomInput
                      label="Payee / Vendor Name (Optional)"
                      placeholder="e.g. K-Electric, Metro Cash & Carry, or Tea Stall"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />

                {/* Description Note */}
                <Controller
                  control={expenseForm.control}
                  name="description"
                  render={({ field }) => (
                    <CustomInput
                      label="Description / Note (Optional)"
                      placeholder="e.g. Morning shift refreshments"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </DialogContent>
              <DialogActions className={styles.dialogActionsRow}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className={styles.dialogCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={addExpenseMutation.isPending}
                  className={styles.dialogSubmitExpenseBtn}
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
        <DialogSurface className={styles.dialogSurfaceDrawer}>
          <form onSubmit={drawerForm.handleSubmit((data) => drawerMutation.mutate(data))}>
            <DialogBody className={styles.dialogBodyNoOverflow}>
              <DialogTitle>
                {drawerActionType === 'CASH_IN' && 'Add Cash to Register Drawer'}
                {drawerActionType === 'CASH_OUT' && 'Remove Cash from Register Drawer'}
                {drawerActionType === 'CLOSE' && 'End of Day Drawer Close & Reconciliation'}
              </DialogTitle>
              <DialogContent className={styles.dialogContentScroll}>
                {/* Amount */}
                <Controller
                  control={drawerForm.control}
                  name="amount"
                  render={({ field }) => (
                    <CustomInput
                      label="Amount (PKR)"
                      required
                      type="number"
                      placeholder="e.g. 5000"
                      value={field.value !== undefined ? String(field.value) : ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      error={drawerForm.formState.errors.amount?.message}
                    />
                  )}
                />

                {/* Notes */}
                <Controller
                  control={drawerForm.control}
                  name="notes"
                  render={({ field }) => (
                    <CustomInput
                      label="Reason / Audit Note"
                      required
                      placeholder="e.g. Morning float injection or end of day closing"
                      value={field.value || ''}
                      onChange={field.onChange}
                      error={drawerForm.formState.errors.notes?.message}
                    />
                  )}
                />
              </DialogContent>
              <DialogActions className={styles.dialogActionsRow}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsCashDrawerActionOpen(false)}
                  className={styles.dialogCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={drawerMutation.isPending}
                  className={styles.dialogSubmitExpenseBtn}
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
