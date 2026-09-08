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

const useStyles = makeStyles({
  container: {
    padding: '24px 28px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  primaryBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    fontWeight: 700,
    border: 'none',
    boxShadow: '0 2px 8px rgba(229, 25, 55, 0.35)',
    ':hover': {
      backgroundColor: '#be123c',
      color: '#FFFFFF',
    },
  },
  refundHeaderBtn: {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    fontWeight: 700,
    border: 'none',
    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
    ':hover': {
      backgroundColor: '#1d4ed8',
      color: '#FFFFFF',
    },
  },

  // Stats Grid
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  statCard: {
    padding: '16px 20px',
    borderRadius: '10px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: tokens.shadow2,
  },
  statIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
  },
  statLabel: {
    fontSize: '11.5px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
  },

  // Card Panel
  card: {
    padding: '20px 24px',
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  searchBox: {
    width: '360px',
    '@media (max-width: 600px)': {
      width: '100%',
    },
  },

  // Table
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  th: {
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontWeight: 700,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  td: {
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    color: tokens.colorNeutralForeground1,
    verticalAlign: 'middle',
  },
  tr: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },

  // Action Buttons in Table
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  actionBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: tokens.colorNeutralForeground2,
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground1,
    },
  },
  refundActionBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: '1px solid rgba(37, 99, 235, 0.3)',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#2563EB',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: '#2563EB',
      color: '#FFFFFF',
    },
  },

  // Modal / Dialog Details
  dialogSurface: {
    maxWidth: '720px',
    width: '100%',
  },
  orderItemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    marginBottom: '8px',
    gap: '12px',
  },
  qtyStepper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepperBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    width: '44px',
    textAlign: 'center',
    height: '28px',
    borderRadius: '6px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    fontWeight: 700,
  },
});

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
  const styles = useStyles();
  const queryClient = useQueryClient();

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
    queryKey: ['customer-khatas-directory'],
    queryFn: async () => {
      try {
        return await posApi.fetchKhatas();
      } catch {
        return await offlineDb.khatas.toArray();
      }
    },
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
  });

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
      await posApi.saveKhata({
        name: data.name,
        phone: data.phone,
        address: data.address,
        customerType: data.accountType || 'regular',
        currentDebt: isCredit ? Number(data.openingDebt || 0) : 0,
        creditLimit: isCredit ? Number(data.creditLimit || 50000) : 0,
        note: data.note,
      });
      await refetchKhatas();
      setIsAddCustomerOpen(false);
      customerForm.reset();
    } catch (err: any) {
      alert(err.message || 'Failed to create customer');
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
      alert('Please select at least 1 item quantity to return/refund.');
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

      setRefundSuccessMsg(`Refund of ${formatPKR(calculatedRefundTotal)} processed successfully! Stock has been replenished and sales adjusted.`);
      setTimeout(() => {
        setRefundSuccessMsg(null);
        setIsRefundModalOpen(false);
        setSelectedOrderForRefund(null);
      }, 2200);
    } catch (err: any) {
      alert(err.message || 'Failed to process refund');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PeopleCommunity24Regular style={{ color: '#E51937', width: 28, height: 28 }} />
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
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(229, 25, 55, 0.1)', color: '#E51937' }}>
            <PeopleCommunity24Regular style={{ width: 22, height: 22 }} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalCustomerCount}</span>
            <span className={styles.statLabel}>Total Customers</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#D97706' }}>
            <Money20Regular style={{ width: 22, height: 22 }} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatPKR(totalKhataDebt)}</span>
            <span className={styles.statLabel}>Total Khata Receivables</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ backgroundColor: 'rgba(37, 99, 235, 0.12)', color: '#2563EB' }}>
            <ArrowCounterclockwise20Regular style={{ width: 22, height: 22 }} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatPKR(totalRefundAmount)}</span>
            <span className={styles.statLabel}>Total Sales Returns Processed</span>
          </div>
        </div>
      </div>

      {/* ── Tabs: Customers List vs Refunds History ── */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: `1px solid ${tokens.colorNeutralStroke2}`, paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('customers')}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            border: activeTab === 'customers' ? '2px solid #E51937' : `1px solid ${tokens.colorNeutralStroke2}`,
            backgroundColor: activeTab === 'customers' ? 'rgba(229, 25, 55, 0.1)' : 'transparent',
            color: activeTab === 'customers' ? '#E51937' : tokens.colorNeutralForeground2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <PeopleCommunity24Regular style={{ width: 16, height: 16 }} />
          <span>Customers Directory ({filteredCustomers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('refunds')}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            border: activeTab === 'refunds' ? '2px solid #2563EB' : `1px solid ${tokens.colorNeutralStroke2}`,
            backgroundColor: activeTab === 'refunds' ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
            color: activeTab === 'refunds' ? '#2563EB' : tokens.colorNeutralForeground2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ArrowCounterclockwise20Regular style={{ width: 16, height: 16 }} />
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
            <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, fontWeight: 600 }}>
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
                  <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                      No customers found matching &quot;{searchQuery}&quot;. Click &quot;+ Add New Customer&quot; above to register.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: tokens.colorNeutralBackground3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '11px' }}>
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700 }}>{cust.name}</span>
                        </div>
                      </td>
                      <td className={styles.td}>
                        {cust.phone ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: tokens.colorNeutralForeground2 }}>
                            <Call20Regular style={{ width: 13, height: 13 }} />
                            {cust.phone}
                          </span>
                        ) : (
                          <span style={{ color: tokens.colorNeutralForeground4 }}>None</span>
                        )}
                      </td>
                      <td className={styles.td}>
                        <span style={{ color: tokens.colorNeutralForeground2 }}>{cust.address || '—'}</span>
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
                        <span style={{ fontWeight: 600 }}>{cust.totalOrders} Invoices</span>
                      </td>
                      <td className={styles.td}>
                        <span style={{ fontWeight: 700, color: '#0078D4' }}>{formatPKR(cust.totalSpent)}</span>
                      </td>
                      <td className={styles.td}>
                        {cust.khataDebt > 0 ? (
                          <span style={{ fontWeight: 700, color: '#D97706' }}>{formatPKR(cust.khataDebt)} (Udhaar)</span>
                        ) : (
                          <span style={{ color: '#107C41', fontWeight: 600 }}>0 PKR</span>
                        )}
                      </td>
                      <td className={styles.td} style={{ textAlign: 'right' }}>
                        <div className={styles.actionGroup} style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.refundActionBtn}
                            title="Process Sales Return / Refund for this customer"
                            onClick={() => {
                              setRefundSearchQuery(cust.name);
                              setIsRefundModalOpen(true);
                            }}
                          >
                            <ArrowCounterclockwise20Regular style={{ width: 15, height: 15 }} />
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
            <div style={{ fontSize: '13px', fontWeight: 700, color: tokens.colorNeutralForeground1 }}>
              Processed Returns &amp; Restocked Inventory Logs
            </div>
            <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
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
                  <th className={styles.th} style={{ textAlign: 'right' }}>Refund Amount</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
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
                          <span style={{ fontSize: '12px', color: tokens.colorNeutralForeground2 }}>
                            {new Date(ref.createdAt).toLocaleString()}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span style={{ fontWeight: 700, color: '#2563EB' }}>#{ref.orderId}</span>
                        </td>
                        <td className={styles.td}>
                          <span style={{ fontWeight: 600 }}>{ref.customerName || 'Walk-In Customer'}</span>
                        </td>
                        <td className={styles.td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {parsedItems.map((it, idx) => (
                              <span key={idx} style={{ fontSize: '11.5px', color: tokens.colorNeutralForeground1 }}>
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
                        <td className={styles.td} style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, color: '#D13438', fontSize: '14px' }}>
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
          <DialogSurface style={{ maxWidth: '480px' }}>
            <DialogTitle>Add New Customer Profile</DialogTitle>
            <form onSubmit={customerForm.handleSubmit(onSaveNewCustomer)}>
              <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: tokens.colorNeutralBackground3, fontSize: '11.5px', color: tokens.colorNeutralForeground2 }}>
                    Cash / Regular customer: Purchases are paid on the spot. No Khata (udhaar) balance is tracked.
                  </div>
                )}
              </DialogBody>
              <DialogActions style={{ marginTop: '20px' }}>
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
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowCounterclockwise20Regular style={{ color: '#2563EB' }} />
              <span>Process Sales Return / Customer Refund</span>
            </DialogTitle>

            <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              {refundSuccessMsg && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: 'rgba(16, 124, 65, 0.12)', color: '#107C41', fontWeight: 700, border: '1px solid rgba(16, 124, 65, 0.3)' }}>
                  {refundSuccessMsg}
                </div>
              )}

              {/* Step 1: Search and Select Order if not selected */}
              {!selectedOrderForRefund ? (
                <div>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: tokens.colorNeutralForeground2 }}>
                    STEP 1: Search Bill / Invoice by Order ID or Customer Name
                  </div>
                  <CustomInput
                    placeholder="Type Invoice ID (e.g. ord_...) or Customer name..."
                    leftIcon={<Search20Regular />}
                    value={refundSearchQuery}
                    onChange={(e) => setRefundSearchQuery(e.target.value)}
                  />

                  <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {eligibleOrdersForRefund.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3, fontSize: '12px' }}>
                        No orders found matching &quot;{refundSearchQuery}&quot;
                      </div>
                    ) : (
                      eligibleOrdersForRefund.map((ord: any) => (
                        <div
                          key={ord.id}
                          onClick={() => handleSelectOrderForRefund(ord)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            border: `1px solid ${tokens.colorNeutralStroke2}`,
                            backgroundColor: tokens.colorNeutralBackground1,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, color: '#2563EB', fontSize: '13px' }}>#{ord.id}</span>
                              <Badge appearance="tint" color="informative">{String(ord.module).toUpperCase()}</Badge>
                              {ord.stage === 'refunded' && <Badge appearance="filled" color="danger">Fully Refunded</Badge>}
                            </div>
                            <div style={{ fontSize: '12px', color: tokens.colorNeutralForeground2, marginTop: '2px' }}>
                              Customer: <strong>{ord.customerName || 'Walk-In'}</strong> &bull; {new Date(ord.createdAt).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                              {(ord.lines || []).map((l: any) => `${l.name} (x${l.quantity})`).join(', ')}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: tokens.colorNeutralForeground1, display: 'block' }}>
                              {formatPKR(ord.totalAmount || 0)}
                            </span>
                            <Button size="small" appearance="outline" style={{ marginTop: '4px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', marginBottom: '14px' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#2563EB' }}>Invoice #{selectedOrderForRefund.id}</span>
                      <span style={{ fontSize: '12px', color: tokens.colorNeutralForeground2, marginLeft: '8px' }}>
                        Customer: <strong>{selectedOrderForRefund.customerName || 'Walk-In'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForRefund(null)}
                      style={{ fontSize: '11px', color: '#E51937', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change Order
                    </button>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 700, color: tokens.colorNeutralForeground2, marginBottom: '8px' }}>
                    STEP 2: Select Items and Quantity to Return:
                  </div>

                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {(selectedOrderForRefund.lines || []).map((line, idx) => {
                      const key = `${line.productId || line.name}_${idx}`;
                      const currentReturnQty = returnQuantities[key] || 0;
                      const maxQty = Number(line.quantity || 1);

                      return (
                        <div key={key} className={styles.orderItemRow}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', display: 'block' }}>
                              {line.name} {line.variantLabel ? `(${line.variantLabel})` : ''}
                            </span>
                            <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                              Sold Rate: {formatPKR(line.unitPrice)} | Bought Qty: {maxQty}
                            </span>
                          </div>

                          <div className={styles.qtyStepper}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground3 }}>Return Qty:</span>
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

                          <div style={{ minWidth: '90px', textAlign: 'right' }}>
                            <span style={{ fontWeight: 700, color: currentReturnQty > 0 ? '#D13438' : tokens.colorNeutralForeground3 }}>
                              {formatPKR(currentReturnQty * Number(line.unitPrice || 0))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Return Reason & Payment Mode */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginTop: '12px' }}>
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
                  <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: tokens.colorNeutralBackground3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Box20Regular style={{ color: '#107C41' }} />
                      <span style={{ fontSize: '11.5px', color: tokens.colorNeutralForeground2 }}>
                        All selected items will be <strong>automatically added back into stock</strong>!
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, display: 'block' }}>Total Refund Amount:</span>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: '#D13438' }}>
                        {formatPKR(calculatedRefundTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </DialogBody>

            <DialogActions style={{ marginTop: '16px' }}>
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
