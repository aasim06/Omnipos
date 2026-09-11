import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Subtitle1,
  Subtitle2,
  Caption1,
  Badge,
  Button,
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
  Edit20Regular,
  Delete20Regular,
  Dismiss20Regular,
  PeopleCommunity24Regular,
  Call20Regular,
  Add20Regular,
  Checkmark20Regular,
  Receipt20Regular,
  ArrowCounterclockwise20Regular,
  ShoppingBag20Regular,
  Money20Regular,
  DocumentBulletList20Regular,
  Box20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { posApi } from '@/lib/api';
import { Order, OrderRefund, ReturnedLineItem } from '@shared/types';
import { formatPKR, uid } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { offlineDb, LocalCustomerKhata } from '@/lib/offlineDb';
import { useAppToast } from '../../context/AppNotificationContext';

import { useCustomersStyles, useStyles } from './customers.styles';

const newCustomerSchema = z.object({
  name: z.string().min(2, 'Customer Name is required'),
  accountType: z.enum(['regular', 'credit', 'wholesale', 'vip']).default('regular'),
  phone: z.string().optional(),
  address: z.string().optional(),
  openingDebt: z.number().optional(),
  creditLimit: z.number().optional(),
  note: z.string().optional(),
});

type NewCustomerFormData = {
  name: string;
  accountType?: 'regular' | 'credit' | 'wholesale' | 'vip';
  phone?: string;
  address?: string;
  openingDebt?: number;
  creditLimit?: number;
  note?: string;
};

export function CustomersView(): React.JSX.Element {
  const styles = useCustomersStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'refunds'>('customers');

  // Dialog States
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<any[] | null>(null);

  // Refund Search & Selection State
  const [refundSearchQuery, setRefundSearchQuery] = useState('');
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [refundReason, setRefundReason] = useState('Customer Changed Mind');
  const [refundPaymentMode, setRefundPaymentMode] = useState<'cash' | 'khata' | 'card'>('cash');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: customerKhatas = [], refetch: refetchKhatas } = useQuery({
    queryKey: ['khatas'],
    queryFn: async () => {
      try {
        return await posApi.fetchKhatas();
      } catch {
        return await offlineDb.khatas.toArray();
      }
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['all-orders-directory'],
    queryFn: async () => {
      try {
        return await posApi.fetchOrders();
      } catch {
        return await offlineDb.orders.toArray();
      }
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: refunds = [], refetch: refetchRefunds } = useQuery({
    queryKey: ['all-refunds-directory'],
    queryFn: async () => {
      try {
        return await posApi.fetchRefunds();
      } catch {
        return await offlineDb.refunds.toArray();
      }
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Listen for instant cross-tab / cross-component updates
  React.useEffect(() => {
    const handleKhataUpdate = () => {
      refetchKhatas();
    };
    const handleOrdersUpdate = () => {
      refetchOrders();
      refetchRefunds();
    };
    window.addEventListener('pos_khata_updated', handleKhataUpdate);
    window.addEventListener('pos_orders_updated', handleOrdersUpdate);
    return () => {
      window.removeEventListener('pos_khata_updated', handleKhataUpdate);
      window.removeEventListener('pos_orders_updated', handleOrdersUpdate);
    };
  }, [refetchKhatas, refetchOrders, refetchRefunds]);

  // Aggregated Customer Directory
  const aggregatedCustomers = useMemo(() => {
    const custMap = new Map<string, {
      id: string;
      name: string;
      phone: string;
      address: string;
      accountType: 'regular' | 'credit' | 'wholesale' | 'vip';
      totalOrders: number;
      totalSpent: number;
      khataDebt: number;
      creditLimit: number;
      hasKhataAccount: boolean;
    }>();

    // 1. Seed with registered Khata Customers
    (customerKhatas || []).forEach((k: any) => {
      const key = (k.name || '').trim().toLowerCase();
      if (!key) return;
      const parsedType = (k.customerType || (Number(k.creditLimit || 0) > 0 || Number(k.currentDebt || 0) > 0 ? 'credit' : 'regular')) as 'regular' | 'credit' | 'wholesale' | 'vip';
      custMap.set(key, {
        id: k.id,
        name: k.name,
        phone: k.phone || '',
        address: k.address || '',
        accountType: parsedType,
        totalOrders: 0,
        totalSpent: 0,
        khataDebt: Number(k.currentDebt || 0),
        creditLimit: Number(k.creditLimit || 0),
        hasKhataAccount: parsedType === 'credit' || parsedType === 'wholesale' || Number(k.currentDebt || 0) > 0,
      });
    });

    // 2. Aggregate from past orders
    (orders || []).forEach((ord: any) => {
      const rawName = (ord.customerName || '').trim();
      if (!rawName || rawName.toLowerCase() === 'walk-in customer' || rawName.toLowerCase() === 'guest') return;

      const key = rawName.toLowerCase();
      const existing = custMap.get(key);
      const orderAmount = Number(ord.totalAmount || 0);

      if (existing) {
        existing.totalOrders += 1;
        existing.totalSpent += orderAmount;
      } else {
        custMap.set(key, {
          id: uid('cust_'),
          name: rawName,
          phone: '',
          address: '',
          accountType: 'regular',
          totalOrders: 1,
          totalSpent: orderAmount,
          khataDebt: 0,
          creditLimit: 0,
          hasKhataAccount: false,
        });
      }
    });

    return Array.from(custMap.values());
  }, [customerKhatas, orders]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return aggregatedCustomers;
    return aggregatedCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.accountType.toLowerCase().includes(q)
    );
  }, [aggregatedCustomers, searchQuery]);

  // Overall Metrics
  const totalCustomerCount = aggregatedCustomers.length;
  const totalKhataDebt = aggregatedCustomers.reduce((sum, c) => sum + c.khataDebt, 0);
  const totalRefundAmount = (refunds || []).reduce((sum: number, r: any) => sum + Number(r.refundAmount || 0), 0);

  // Form for New Customer
  const customerForm = useForm<NewCustomerFormData>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: {
      name: '',
      accountType: 'regular',
      phone: '',
      address: '',
      openingDebt: 0,
      creditLimit: 50000,
      note: '',
    },
  });

  const onSaveNewCustomer = async (data: NewCustomerFormData) => {
    try {
      const isCredit = data.accountType === 'credit' || data.accountType === 'wholesale';
      const customerType = data.accountType === 'wholesale' ? 'wholesale' : 'retail';
      await posApi.saveKhata({
        name: data.name,
        phone: data.phone,
        address: data.address,
        customerType: customerType,
        currentDebt: isCredit ? Number(data.openingDebt || 0) : 0,
        creditLimit: isCredit ? Number(data.creditLimit || 50000) : 0,
        note: data.note,
      });
      await queryClient.invalidateQueries({ queryKey: ['khatas'] });
      await queryClient.refetchQueries({ queryKey: ['khatas'] });
      await refetchKhatas();
      setIsAddCustomerOpen(false);
      customerForm.reset();
      notifySuccess('Customer profile created successfully');
    } catch (err: any) {
      notifyError(err.message || 'Failed to create customer');
    }
  };

  // Handle Order Selection in Refund Modal
  const handleSelectOrderForRefund = (ord: Order) => {
    setSelectedOrderForRefund(ord);
    const initialQtys: Record<string, number> = {};
    (ord.lines || []).forEach((l, idx) => {
      initialQtys[`${l.productId || l.name}_${idx}`] = 0;
    });
    setReturnQuantities(initialQtys);
    setRefundPaymentMode(ord.orderType === 'khata' ? 'khata' : 'cash');
  };

  // Calculate current refund total
  const calculatedRefundTotal = useMemo(() => {
    if (!selectedOrderForRefund) return 0;
    let sum = 0;
    (selectedOrderForRefund.lines || []).forEach((line, idx) => {
      const key = `${line.productId || line.name}_${idx}`;
      const qty = returnQuantities[key] || 0;
      sum += qty * Number(line.unitPrice || 0);
    });
    return sum;
  }, [selectedOrderForRefund, returnQuantities]);

  // Execute Refund
  const handleProcessRefund = async () => {
    if (!selectedOrderForRefund) return;
    if (calculatedRefundTotal <= 0) {
      notifyWarning('Please select at least 1 item quantity to return/refund.');
      return;
    }

    setIsProcessingRefund(true);
    try {
      const returnedLines: ReturnedLineItem[] = [];
      (selectedOrderForRefund.lines || []).forEach((line, idx) => {
        const key = `${line.productId || line.name}_${idx}`;
        const qty = returnQuantities[key] || 0;
        if (qty > 0) {
          returnedLines.push({
            productId: line.productId,
            name: line.name,
            quantity: qty,
            unitPrice: line.unitPrice,
            variantLabel: line.variantLabel,
          });
        }
      });

      await posApi.processOrderRefund(selectedOrderForRefund.id, {
        returnedLines,
        refundAmount: calculatedRefundTotal,
        reason: refundReason,
        paymentMode: refundPaymentMode,
        customerName: selectedOrderForRefund.customerName,
      });

      // Refetch
      await Promise.all([refetchOrders(), refetchRefunds(), refetchKhatas()]);
      queryClient.invalidateQueries({ queryKey: ['analytics-report'] });
      queryClient.refetchQueries({ queryKey: ['analytics-report'] });

      notifySuccess(`Refund of ${formatPKR(calculatedRefundTotal)} processed successfully! Stock replenished.`);
      setRefundSuccessMsg(`Refund of ${formatPKR(calculatedRefundTotal)} processed successfully! Stock has been replenished and sales adjusted.`);
      setTimeout(() => {
        setRefundSuccessMsg(null);
        setIsRefundModalOpen(false);
        setSelectedOrderForRefund(null);
      }, 2200);
    } catch (err: any) {
      notifyError(err.message || 'Failed to process refund');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Filter orders matching search in refund modal
  const eligibleOrdersForRefund = useMemo(() => {
    const q = refundSearchQuery.toLowerCase().trim();
    if (!q) return (orders || []).slice(0, 15);
    return (orders || []).filter(
      (o: any) =>
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.lines || []).some((l: any) => l.name && l.name.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [orders, refundSearchQuery]);

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLeftRow}>
            <PeopleCommunity24Regular className={styles.headerIconRed} />
            <span className={styles.title}>Customers &amp; Sales Returns</span>
          </div>
          <span className={styles.subtitle}>
            Customer directory, purchase logs, credit khata &amp; instant product refunds with automated inventory restock
          </span>
        </div>

        <div className={styles.headerActions}>
          <Button
            className={styles.refundHeaderBtn}
            icon={<ArrowCounterclockwise20Regular />}
            onClick={() => {
              setSelectedOrderForRefund(null);
              setRefundSearchQuery('');
              setIsRefundModalOpen(true);
            }}
          >
            Process Refund / Return
          </Button>
          <Button
            className={styles.primaryBtn}
            icon={<Add20Regular />}
            onClick={() => setIsAddCustomerOpen(true)}
          >
            Add New Customer
          </Button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={mergeClasses(styles.statIconBox, styles.statIconBoxRed)}>
            <PeopleCommunity24Regular className={styles.icon22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalCustomerCount}</span>
            <span className={styles.statLabel}>Total Customers</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={mergeClasses(styles.statIconBox, styles.statIconBoxAmber)}>
            <Money20Regular className={styles.icon22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatPKR(totalKhataDebt)}</span>
            <span className={styles.statLabel}>Total Khata Receivables</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={mergeClasses(styles.statIconBox, styles.statIconBoxBlue)}>
            <ArrowCounterclockwise20Regular className={styles.icon22} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatPKR(totalRefundAmount)}</span>
            <span className={styles.statLabel}>Total Sales Returns Processed</span>
          </div>
        </div>
      </div>

      {/* ── Tabs: Customers List vs Refunds History ── */}
      <div className={styles.viewTabRow}>
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          className={mergeClasses(
            styles.viewTabBtn,
            activeTab === 'customers' && styles.viewTabBtnActiveCustomers
          )}
        >
          <PeopleCommunity24Regular className={styles.icon16} />
          <span>Customers Directory ({filteredCustomers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('refunds')}
          className={mergeClasses(
            styles.viewTabBtn,
            activeTab === 'refunds' && styles.viewTabBtnActiveRefunds
          )}
        >
          <ArrowCounterclockwise20Regular className={styles.icon16} />
          <span>Sales Returns / Refunds Log ({refunds.length})</span>
        </button>
      </div>

      {/* ── TAB 1: CUSTOMERS DIRECTORY ── */}
      {activeTab === 'customers' && (
        <div className={styles.card}>
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <CustomInput
                placeholder="Search customers by name, phone or address..."
                leftIcon={<Search20Regular />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className={styles.showingCountText}>
              Showing {filteredCustomers.length} registered customers
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Customer Name</th>
                  <th className={styles.th}>Phone Number</th>
                  <th className={styles.th}>Address / City</th>
                  <th className={styles.th}>Account Type</th>
                  <th className={styles.th}>Total Invoices</th>
                  <th className={styles.th}>Total Spent</th>
                  <th className={styles.th}>Khata Balance</th>
                  <th className={mergeClasses(styles.th, styles.thRight)}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyTableTd}>
                      No customers found matching &quot;{searchQuery}&quot;. Click &quot;+ Add New Customer&quot; above to register.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.customerNameCell}>
                          <div className={styles.customerAvatar}>
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className={styles.customerNameBold}>{cust.name}</span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        {cust.phone ? (
                          <span className={styles.phoneCell}>
                            <Call20Regular className={styles.icon13} />
                            {cust.phone}
                          </span>
                        ) : (
                          <span className={styles.mutedNone}>None</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.mutedText}>{cust.address || '—'}</span>
                      </td>
                      <td className={styles.td}>
                        {cust.accountType === 'credit' ? (
                          <Badge appearance="filled" color="warning">Khata Account</Badge>
                        ) : cust.accountType === 'wholesale' ? (
                          <Badge appearance="filled" color="brand">Wholesale</Badge>
                        ) : cust.accountType === 'vip' ? (
                          <Badge appearance="filled" color="success">VIP Member</Badge>
                        ) : (
                          <Badge appearance="tint" color="informative">Cash / Regular</Badge>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span className={styles.weight600}>{cust.totalOrders} Invoices</span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.blueSpentText}>{formatPKR(cust.totalSpent)}</span>
                      </td>
                      <td className={styles.td}>
                        {cust.khataDebt > 0 ? (
                          <span className={styles.amberDebtText}>{formatPKR(cust.khataDebt)} (Udhaar)</span>
                        ) : (
                          <span className={styles.greenZeroText}>0 PKR</span>
                        )}
                      </td>
                      <td className={mergeClasses(styles.td, styles.thRight)}>
                        <div className={mergeClasses(styles.actionGroup, styles.actionGroupRight)}>
                          <button
                            type="button"
                            className={styles.refundActionBtn}
                            title="Process Sales Return / Refund for this customer"
                            onClick={() => {
                              setRefundSearchQuery(cust.name);
                              setIsRefundModalOpen(true);
                            }}
                          >
                            <ArrowCounterclockwise20Regular className={styles.icon15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: SALES RETURNS / REFUNDS LOG ── */}
      {activeTab === 'refunds' && (
        <div className={styles.card}>
          <div className={styles.filterBar}>
            <div className={styles.tableSubtitle}>
              Processed Returns &amp; Restocked Inventory Logs
            </div>
            <div className={styles.tableSubCount}>
              Total {refunds.length} Refund Records
            </div>
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Date &amp; Time</th>
                  <th className={styles.th}>Order ID</th>
                  <th className={styles.th}>Customer</th>
                  <th className={styles.th}>Returned Items</th>
                  <th className={styles.th}>Reason</th>
                  <th className={styles.th}>Payment Mode</th>
                  <th className={mergeClasses(styles.th, styles.thRight)}>Refund Amount</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyTableTd}>
                      No returns or refunds processed yet. Click &quot;Process Refund / Return&quot; above to handle returns.
                    </td>
                  </tr>
                ) : (
                  refunds.map((ref: any) => {
                    let parsedItems: any[] = [];
                    try {
                      parsedItems = typeof ref.items === 'string' ? JSON.parse(ref.items) : (ref.items || []);
                    } catch {}

                    return (
                      <tr key={ref.id} className={styles.tr}>
                        <td className={styles.td}>
                          <span className={styles.dateText}>
                            {new Date(ref.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.orderIdBlue}>#{ref.orderId}</span>
                        </td>
                        <td className={styles.td}>
                          <span className={styles.weight600}>{ref.customerName || 'Walk-In Customer'}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.itemsCol}>
                            {parsedItems.map((it, idx) => (
                              <span key={idx} className={styles.itemLineText}>
                                &bull; {it.name} {it.variantLabel ? `(${it.variantLabel})` : ''} &times; <strong>{it.quantity}</strong> (Restocked)
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={styles.td}>
                          <Badge appearance="tint" color="warning">{ref.reason || 'Return'}</Badge>
                        </td>
                        <td className={styles.td}>
                          <Badge appearance="filled" color={ref.paymentMode === 'khata' ? 'severe' : 'brand'}>
                            {String(ref.paymentMode).toUpperCase()}
                          </Badge>
                        </td>
                        <td className={mergeClasses(styles.td, styles.thRight)}>
                          <span className={styles.refundAmountDanger}>
                            -{formatPKR(ref.refundAmount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DIALOG 1: ADD NEW CUSTOMER ── */}
      {isAddCustomerOpen && (
        <Dialog open={isAddCustomerOpen} onOpenChange={(_, data) => setIsAddCustomerOpen(data.open)}>
          <DialogSurface className={styles.dialogSurface480}>
            <DialogTitle>Add New Customer Profile</DialogTitle>
            <form onSubmit={customerForm.handleSubmit(onSaveNewCustomer)}>
              <DialogBody className={styles.dialogBodyCol14}>
                <Controller
                  name="name"
                  control={customerForm.control}
                  render={({ field }) => (
                    <CustomInput
                      label="Customer Full Name"
                      required
                      placeholder="e.g. Muhammad Bilal"
                      value={field.value || ''}
                      onChange={field.onChange}
                      error={customerForm.formState.errors.name?.message}
                    />
                  )}
                />

                <Controller
                  name="accountType"
                  control={customerForm.control}
                  render={({ field }) => (
                    <CustomSelect
                      label="Account Type"
                      value={field.value || 'regular'}
                      onChange={(val) => field.onChange(val as any)}
                      options={[
                        { value: 'regular', label: 'Cash / Regular Customer (No Udhaar)' },
                        { value: 'credit', label: 'Khata / Credit Customer (Udhaar Account)' },
                        { value: 'wholesale', label: 'Wholesale Buyer (Bulk Customer)' },
                        { value: 'vip', label: 'VIP / Loyalty Member' },
                      ]}
                    />
                  )}
                />

                <Controller
                  name="phone"
                  control={customerForm.control}
                  render={({ field }) => (
                    <CustomInput
                      label="Phone Number"
                      placeholder="0300-1234567"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  name="address"
                  control={customerForm.control}
                  render={({ field }) => (
                    <CustomInput
                      label="Address / Location"
                      placeholder="Shop # / Street / City"
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />

                {customerForm.watch('accountType') === 'credit' || customerForm.watch('accountType') === 'wholesale' ? (
                  <div className={styles.grid2Col}>
                    <Controller
                      name="openingDebt"
                      control={customerForm.control}
                      render={({ field }) => (
                        <CustomInput
                          label="Opening Khata Debt (PKR)"
                          type="number"
                          placeholder="0"
                          value={field.value !== undefined ? String(field.value) : '0'}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      )}
                    />

                    <Controller
                      name="creditLimit"
                      control={customerForm.control}
                      render={({ field }) => (
                        <CustomInput
                          label="Credit Limit (PKR)"
                          type="number"
                          placeholder="50000"
                          value={field.value !== undefined ? String(field.value) : '50000'}
                          onChange={(e) => field.onChange(Number(e.target.value) || 50000)}
                        />
                      )}
                    />
                  </div>
                ) : (
                  <div className={styles.regularNoticeBox}>
                    Cash / Regular customer: Purchases are paid on the spot. No Khata (udhaar) balance is tracked.
                  </div>
                )}
              </DialogBody>
              <DialogActions className={styles.dialogActionsTop20}>
                <Button appearance="secondary" onClick={() => setIsAddCustomerOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" appearance="primary" className={styles.primaryBtn}>
                  Save Customer
                </Button>
              </DialogActions>
            </form>
          </DialogSurface>
        </Dialog>
      )}

      {/* ── DIALOG 2: PROCESS SALES RETURN & REFUND ── */}
      {isRefundModalOpen && (
        <Dialog open={isRefundModalOpen} onOpenChange={(_, data) => setIsRefundModalOpen(data.open)}>
          <DialogSurface className={styles.dialogSurface}>
            <DialogTitle className={styles.dialogTitleRow}>
              <ArrowCounterclockwise20Regular className={styles.blueIcon} />
              <span>Process Sales Return / Customer Refund</span>
            </DialogTitle>

            <DialogBody className={styles.dialogBodyCol16}>
              {refundSuccessMsg && (
                <div className={styles.refundSuccessMsgBox}>
                  {refundSuccessMsg}
                </div>
              )}

              {/* Step 1: Search and Select Order if not selected */}
              {!selectedOrderForRefund ? (
                <div>
                  <div className={styles.stepHeading}>
                    STEP 1: Search Bill / Invoice by Order ID or Customer Name
                  </div>
                  <CustomInput
                    placeholder="Type Invoice ID (e.g. ord_...) or Customer name..."
                    leftIcon={<Search20Regular />}
                    value={refundSearchQuery}
                    onChange={(e) => setRefundSearchQuery(e.target.value)}
                  />

                  <div className={styles.orderScrollList}>
                    {eligibleOrdersForRefund.length === 0 ? (
                      <div className={styles.emptyOrdersBox}>
                        No orders found matching &quot;{refundSearchQuery}&quot;
                      </div>
                    ) : (
                      eligibleOrdersForRefund.map((ord: any) => (
                        <div
                          key={ord.id}
                          onClick={() => handleSelectOrderForRefund(ord)}
                          className={styles.orderSelectCard}
                        >
                          <div>
                            <div className={styles.orderCardHeader}>
                              <span className={styles.orderIdTitle}>#{ord.id}</span>
                              <Badge appearance="tint" color="informative">{String(ord.module).toUpperCase()}</Badge>
                              {ord.stage === 'refunded' && <Badge appearance="filled" color="danger">Fully Refunded</Badge>}
                            </div>
                            <div className={styles.orderMetaSub}>
                              Customer: <strong>{ord.customerName || 'Walk-In'}</strong> &bull; {new Date(ord.createdAt).toLocaleDateString()}
                            </div>
                            <div className={styles.orderLinesSub}>
                              {(ord.lines || []).map((l: any) => `${l.name} (x${l.quantity})`).join(', ')}
                            </div>
                          </div>

                          <div className={styles.textRight}>
                            <span className={styles.orderTotalBold}>
                              {formatPKR(ord.totalAmount || 0)}
                            </span>
                            <Button size="small" appearance="outline" className={styles.marginTop4}>
                              Select for Refund &rarr;
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2: Line Item Selection & Return Amount */
                <div>
                  <div className={styles.selectedOrderBanner}>
                    <div>
                      <span className={styles.orderIdTitle}>Invoice #{selectedOrderForRefund.id}</span>
                      <span className={styles.orderCustomerMeta}>
                        Customer: <strong>{selectedOrderForRefund.customerName || 'Walk-In'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForRefund(null)}
                      className={styles.changeOrderBtn}
                    >
                      Change Order
                    </button>
                  </div>

                  <div className={styles.step2Heading}>
                    STEP 2: Select Items and Quantity to Return:
                  </div>

                  <div className={styles.itemsScrollBox}>
                    {(selectedOrderForRefund.lines || []).map((line, idx) => {
                      const key = `${line.productId || line.name}_${idx}`;
                      const currentReturnQty = returnQuantities[key] || 0;
                      const maxQty = Number(line.quantity || 1);

                      return (
                        <div key={key} className={styles.orderItemRow}>
                          <div className={styles.flex1}>
                            <span className={styles.itemName13}>
                              {line.name} {line.variantLabel ? `(${line.variantLabel})` : ''}
                            </span>
                            <span className={styles.itemMeta11}>
                              Sold Rate: {formatPKR(line.unitPrice)} | Bought Qty: {maxQty}
                            </span>
                          </div>

                          <div className={styles.qtyStepper}>
                            <span className={styles.stepperLabel}>Return Qty:</span>
                            <button
                              type="button"
                              className={styles.stepperBtn}
                              onClick={() => {
                                setReturnQuantities((prev) => ({
                                  ...prev,
                                  [key]: Math.max(0, (prev[key] || 0) - 1),
                                }));
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              className={styles.stepperInput}
                              min={0}
                              max={maxQty}
                              value={currentReturnQty}
                              onChange={(e) => {
                                const val = Math.min(maxQty, Math.max(0, Number(e.target.value) || 0));
                                setReturnQuantities((prev) => ({ ...prev, [key]: val }));
                              }}
                            />
                            <button
                              type="button"
                              className={styles.stepperBtn}
                              onClick={() => {
                                setReturnQuantities((prev) => ({
                                  ...prev,
                                  [key]: Math.min(maxQty, (prev[key] || 0) + 1),
                                }));
                              }}
                            >
                              +
                            </button>
                          </div>

                          <div className={styles.returnItemCostCol}>
                            <span className={currentReturnQty > 0 ? styles.returnCostActive : styles.returnCostInactive}>
                              {formatPKR(currentReturnQty * Number(line.unitPrice || 0))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Return Reason & Payment Mode */}
                  <div className={styles.reasonGrid}>
                    <CustomSelect
                      label="Return Reason"
                      value={refundReason}
                      onChange={(val) => setRefundReason(val)}
                      options={[
                        { value: 'Customer Changed Mind', label: 'Customer Changed Mind' },
                        { value: 'Defective / Damaged Item', label: 'Defective / Damaged Item' },
                        { value: 'Wrong Size / Variation', label: 'Wrong Size / Variation' },
                        { value: 'Expired / Stale Goods', label: 'Expired / Stale Goods' },
                        { value: 'Billing Error / Correction', label: 'Billing Error / Correction' },
                      ]}
                    />

                    <CustomSelect
                      label="Refund Payout Method"
                      value={refundPaymentMode}
                      onChange={(val) => setRefundPaymentMode(val as any)}
                      options={[
                        { value: 'cash', label: 'Cash Out (Cash Drawer)' },
                        { value: 'khata', label: 'Khata Reversal (Credit)' },
                        { value: 'card', label: 'Bank / Card Reversal' },
                      ]}
                    />
                  </div>

                  {/* Summary Banner */}
                  <div className={styles.summaryBanner}>
                    <div className={styles.summaryLeft}>
                      <Box20Regular className={styles.greenIcon} />
                      <span className={styles.summaryNoticeText}>
                        All selected items will be <strong>automatically added back into stock</strong>!
                      </span>
                    </div>

                    <div className={styles.textRight}>
                      <span className={styles.totalRefundLabel}>Total Refund Amount:</span>
                      <span className={styles.totalRefundVal}>
                        {formatPKR(calculatedRefundTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </DialogBody>

            <DialogActions className={styles.dialogActionsTop16}>
              <Button appearance="secondary" onClick={() => setIsRefundModalOpen(false)}>
                Close
              </Button>
              {selectedOrderForRefund && (
                <Button
                  appearance="primary"
                  className={styles.refundHeaderBtn}
                  disabled={calculatedRefundTotal <= 0 || isProcessingRefund}
                  onClick={handleProcessRefund}
                >
                  {isProcessingRefund ? 'Processing...' : `Confirm Refund (${formatPKR(calculatedRefundTotal)})`}
                </Button>
              )}
            </DialogActions>
          </DialogSurface>
        </Dialog>
      )}
    </div>
  );
}

export default CustomersView;
