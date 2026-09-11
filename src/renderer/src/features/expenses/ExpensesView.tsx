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
import { posApi } from '@/lib/api';
import { formatPKR } from '@/lib/utils';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { CustomInput, CustomSelect } from '@/components/ui';
import { useAppToast } from '../../context/AppNotificationContext';

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

import { useExpensesStyles, useStyles } from './expenses.styles';

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
  const styles = useExpensesStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError } = useAppToast();
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

  // Fetch Expenses: Offline-First Cache (<5ms)
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<ExpenseRecord[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      return (await posApi.fetchExpenses()) as ExpenseRecord[];
    },
  });

  // Fetch Cash Drawer Audit: Offline-First Local Cache
  const { data: drawer } = useQuery<CashDrawer>({
    queryKey: ['cash-drawer'],
    queryFn: async () => {
      return posApi.fetchCashDrawer();
    },
  });

  // Add Expense Mutation: Instant Offline Dexie Write + Cloud Sync
  const addExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      await posApi.saveExpense(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      await queryClient.refetchQueries({ queryKey: ['expenses'] });
      await queryClient.invalidateQueries({ queryKey: ['cash-drawer'] });
      await queryClient.refetchQueries({ queryKey: ['cash-drawer'] });
      setIsAddExpenseOpen(false);
      expenseForm.reset();
      notifySuccess('Expense recorded successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to record expense');
    },
  });

  // Drawer Action Mutation: Instant Offline Update + Cloud Sync
  const drawerMutation = useMutation({
    mutationFn: async (data: DrawerActionFormData) => {
      await posApi.saveCashDrawerAction({
        type: drawerActionType,
        amount: data.amount,
        notes: data.notes,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cash-drawer'] });
      await queryClient.refetchQueries({ queryKey: ['cash-drawer'] });
      setIsCashDrawerActionOpen(false);
      drawerForm.reset();
      notifySuccess('Cash drawer updated successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to update cash drawer');
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
