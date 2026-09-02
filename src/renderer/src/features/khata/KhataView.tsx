import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Badge,
  Input,
  Select,
  Label,
  Body1,
  Body2,
  Caption1,
  Subtitle1,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  ProgressBar,
} from '@fluentui/react-components';
import {
  Add20Regular,
  ArrowCircleDown20Regular,
  ArrowCircleUp20Regular,
  Search20Regular,
  Person20Regular,
  BookOpen20Regular,
  Chat20Regular,
  Delete16Regular,
  Print20Regular,
  Location16Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveApiUrl } from '@/lib/api';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';

/* ─── Zod Schemas ──────────────────────────────────────────────────── */
const newKhataSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required (min 10 digits)'),
  customerType: z.string().default('retail'),
  creditLimit: z.coerce.number().min(1000, 'Credit limit must be at least 1,000 PKR').default(50000),
  dueDays: z.coerce.number().min(1, 'Due days must be at least 1').default(30),
  cnic: z.string().optional(),
  address: z.string().optional(),
  currentDebt: z.coerce.number().min(0, 'Initial debt cannot be negative').default(0),
  note: z.string().optional(),
});

type NewKhataFormData = z.infer<typeof newKhataSchema>;

const transactionSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be at least 1 PKR'),
  paymentMethod: z.string().default('cash'),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const useStyles = makeStyles({
  container: {
    padding: '28px 32px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '20px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  statCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: '18px 20px',
    borderRadius: '12px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow4,
  },
  tableCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '12px',
    borderTopWidth: '1px', borderBottomWidth: '1px', borderLeftWidth: '1px', borderRightWidth: '1px',
    borderTopStyle: 'solid', borderBottomStyle: 'solid', borderLeftStyle: 'solid', borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1, borderBottomColor: tokens.colorNeutralStroke1, borderLeftColor: tokens.colorNeutralStroke1, borderRightColor: tokens.colorNeutralStroke1,
    boxShadow: tokens.shadow4,
    overflow: 'hidden',
  },
  filterBar: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    gap: '12px',
  },
});

interface CustomerKhata {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  cnic?: string;
  customerType?: string;
  currentDebt: number;
  creditLimit: number;
  dueDays?: number;
  note?: string;
  createdAt: string;
}

interface KhataTx {
  id: string;
  khataId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  description: string;
  paymentMethod: string;
  createdAt: string;
}

export function KhataView(): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();

  const [isNewKhataOpen, setIsNewKhataOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isPassbookOpen, setIsPassbookOpen] = useState(false);
  const [selectedKhata, setSelectedKhata] = useState<CustomerKhata | null>(null);
  const [transType, setTransType] = useState<'DEBIT' | 'CREDIT'>('CREDIT');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // React Hook Form for New Khata Account
  const newKhataForm = useForm<NewKhataFormData>({
    resolver: zodResolver(newKhataSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      customerType: 'retail',
      creditLimit: 50000,
      dueDays: 30,
      cnic: '',
      address: '',
      currentDebt: 0,
      note: '',
    },
  });

  // React Hook Form for Transactions
  const transForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      amount: undefined,
      paymentMethod: 'cash',
      description: '',
    },
  });

  // Fetch Khatas
  const { data: khatas = [], isLoading } = useQuery<CustomerKhata[]>({
    queryKey: ['khatas'],
    queryFn: async () => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Passbook Transactions for selected customer
  const { data: passbookTransactions = [], isLoading: isLoadingPassbook } = useQuery<KhataTx[]>({
    queryKey: ['khata-transactions', selectedKhata?.id],
    queryFn: async () => {
      if (!selectedKhata) return [];
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata/${selectedKhata.id}/transactions`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedKhata && isPassbookOpen,
  });

  // Create Khata Mutation
  const createMutation = useMutation({
    mutationFn: async (data: NewKhataFormData) => {
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create khata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
      setIsNewKhataOpen(false);
      newKhataForm.reset();
    },
  });

  // Add Transaction Mutation
  const transactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!selectedKhata) return;
      const base = await resolveApiUrl();
      const res = await fetch(`${base}/api/khata/${selectedKhata.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: transType,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          description: data.description,
        }),
      });
      if (!res.ok) throw new Error('Transaction failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
      queryClient.invalidateQueries({ queryKey: ['khata-transactions', selectedKhata?.id] });
      setIsPaymentOpen(false);
      transForm.reset();
    },
  });

  // Delete Khata Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const base = await resolveApiUrl();
      await fetch(`${base}/api/khata/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
    },
  });

  const onNewKhataSubmit = (data: NewKhataFormData) => {
    createMutation.mutate(data);
  };

  const onTransSubmit = (data: TransactionFormData) => {
    transactionMutation.mutate(data);
  };

  // WhatsApp Reminder Handler
  const sendWhatsAppReminder = (khata: CustomerKhata) => {
    if (!khata.phone) {
      alert('Is customer ka phone number registered nahi hai.');
      return;
    }
    const cleanPhone = khata.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('92') ? cleanPhone : cleanPhone.startsWith('0') ? `92${cleanPhone.slice(1)}` : `92${cleanPhone}`;
    const text = encodeURIComponent(
      `As-salamu alaykum ${khata.name} sahab,\n\nAapke Omnipos store account mein PKR ${khata.currentDebt.toLocaleString()} ka baqaya (Udhaar) wajib-ul-ada hai.\nBaraye meharbani baqaya ki adaigi jald az jald farma dein.\n\nShukriya!\nOmnipos Retail & Restaurant`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  // Print Statement Handler
  const printStatement = () => {
    window.print();
  };

  // Filter khatas
  const filteredKhatas = khatas.filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.phone && k.phone.includes(searchTerm)) ||
      (k.cnic && k.cnic.includes(searchTerm));
    const matchesType = typeFilter === 'all' || k.customerType === typeFilter;
    return matchesSearch && matchesType;
  });

  // KPI Calculations
  const totalMarketDebt = khatas.reduce((acc, k) => acc + (k.currentDebt || 0), 0);
  const highRiskCustomers = khatas.filter((k) => k.creditLimit > 0 && k.currentDebt >= k.creditLimit * 0.8).length;
  const totalCreditExtended = khatas.reduce((acc, k) => acc + (k.creditLimit || 50000), 0);

  if (isLoading && khatas.length === 0) {
    return <TablePageSkeleton title="Khata / Udhaar Ledger Book" />;
  }

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <Subtitle1
            as="h1"
            style={{ fontWeight: 700, fontSize: '20px', color: tokens.colorNeutralForeground1, margin: 0, display: 'block' }}
          >
            Khata / Udhaar Commercial Ledger
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', marginTop: '4px', fontSize: '13px' }}>
            Enterprise customer credit management, passbook statements, credit limits &amp; WhatsApp reminders
          </Caption1>
        </div>

        <Button
          appearance="primary"
          icon={<Add20Regular />}
          onClick={() => {
            newKhataForm.reset();
            setIsNewKhataOpen(true);
          }}
          style={{ backgroundColor: '#E51937', borderRadius: tokens.borderRadiusMedium, fontWeight: 700 }}
        >
          + Add New Customer Khata
        </Button>
      </div>

      {/* ── 4 KPI Summary Metric Cards ── */}
      <div className={styles.summaryGrid}>
        <div className={styles.statCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>
            Total Customers on Credit
          </Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', display: 'block', color: tokens.colorNeutralForeground1 }}>
            {khatas.length}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Registered accounts</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>
            Total Market Receivables (Udhaar)
          </Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', display: 'block', color: '#E51937' }}>
            PKR {totalMarketDebt.toLocaleString()}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Outstanding balance to recover</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>
            Approved Credit Limit Cap
          </Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', display: 'block', color: tokens.colorBrandForeground1 }}>
            PKR {totalCreditExtended.toLocaleString()}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Total risk ceiling</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block', fontWeight: 600 }}>
            High-Risk / Near Limit Accounts
          </Caption1>
          <Subtitle1 style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', display: 'block', color: highRiskCustomers > 0 ? '#D97706' : '#107C41' }}>
            {highRiskCustomers}
          </Subtitle1>
          <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>&gt;80% credit limit utilized</Caption1>
        </div>
      </div>

      {/* ── Main Khata Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.filterBar}>
          <Input
            appearance="outline"
            placeholder="Search by customer name, phone, CNIC..."
            contentBefore={<Search20Regular />}
            value={searchTerm}
            onChange={(_, d) => setSearchTerm(d.value)}
            style={{ width: '320px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Label style={{ fontSize: '13px', fontWeight: 600 }}>Filter Type:</Label>
            <Select value={typeFilter} onChange={(_, d) => setTypeFilter(d.value)}>
              <option value="all">All Accounts ({khatas.length})</option>
              <option value="retail">Retail Customers</option>
              <option value="wholesale">Wholesale / Dukandar</option>
              <option value="employee">Staff / Employee</option>
            </Select>
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <Table style={{ width: '100%', minWidth: '980px', borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHeader>
              <TableRow style={{ backgroundColor: tokens.colorNeutralBackground3, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                <TableHeaderCell style={{ padding: '14px 20px', width: '27%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Customer Profile
                </TableHeaderCell>
                <TableHeaderCell style={{ padding: '14px 16px', width: '18%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Contact &amp; CNIC
                </TableHeaderCell>
                <TableHeaderCell style={{ padding: '14px 16px', width: '20%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Credit Limit &amp; Usage
                </TableHeaderCell>
                <TableHeaderCell style={{ padding: '14px 16px', width: '14%', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Outstanding Debt
                </TableHeaderCell>
                <TableHeaderCell style={{ padding: '14px 20px', width: '21%', textAlign: 'right', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.05em', color: tokens.colorNeutralForeground2 }}>
                  Actions &amp; Reminders
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKhatas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px', color: tokens.colorNeutralForeground3 }}>
                    No khata accounts found matching filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKhatas.map((khata) => {
                  const limit = khata.creditLimit || 50000;
                  const percent = Math.min(100, Math.round((khata.currentDebt / limit) * 100));
                  const isOverLimit = khata.currentDebt >= limit;
                  const isNearLimit = khata.currentDebt >= limit * 0.8;

                  return (
                    <TableRow
                      key={khata.id}
                      style={{
                        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Customer Info */}
                      <TableCell style={{ padding: '14px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, rgba(229, 25, 55, 0.12) 0%, rgba(229, 25, 55, 0.04) 100%)',
                              border: '1px solid rgba(229, 25, 55, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#E51937',
                              fontWeight: 800,
                              fontSize: '14px',
                              flexShrink: 0,
                            }}
                          >
                            {khata.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: tokens.colorNeutralForeground1 }}>
                                {khata.name}
                              </span>
                              <Badge
                                size="small"
                                appearance="tint"
                                color={khata.customerType === 'wholesale' ? 'brand' : khata.customerType === 'employee' ? 'informative' : 'subtle'}
                                style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }}
                              >
                                {khata.customerType || 'RETAIL'}
                              </Badge>
                            </div>
                            {khata.address && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', color: tokens.colorNeutralForeground3, fontSize: '11.5px' }}>
                                <Location16Regular style={{ width: 13, height: 13, flexShrink: 0 }} />
                                <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {khata.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact & CNIC */}
                      <TableCell style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px', color: tokens.colorNeutralForeground1 }}>
                            {khata.phone || 'No phone'}
                          </span>
                          {khata.cnic && (
                            <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, fontFamily: 'monospace', backgroundColor: tokens.colorNeutralBackground3, padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>
                              CNIC: {khata.cnic}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Credit Limit & Mini Progress Bar */}
                      <TableCell style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px' }}>
                            <span style={{ fontWeight: 700, color: isOverLimit ? '#DC2626' : isNearLimit ? '#D97706' : tokens.colorNeutralForeground2 }}>
                              {percent}% Used
                            </span>
                            <span style={{ color: tokens.colorNeutralForeground3, fontSize: '11px' }}>
                              Cap: PKR {limit.toLocaleString()}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${percent}%`,
                                height: '100%',
                                backgroundColor: isOverLimit ? '#DC2626' : isNearLimit ? '#F59E0B' : '#107C41',
                                borderRadius: '999px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Debt Badge */}
                      <TableCell style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '8px',
                              backgroundColor: khata.currentDebt > 0 ? '#FEF2F2' : '#F0FDF4',
                              color: khata.currentDebt > 0 ? '#DC2626' : '#16A34A',
                              border: `1px solid ${khata.currentDebt > 0 ? '#FECACA' : '#BBF7D0'}`,
                              fontWeight: 800,
                              fontSize: '13px',
                              width: 'fit-content',
                            }}
                          >
                            PKR {khata.currentDebt.toLocaleString()}
                          </span>
                          {khata.dueDays && (
                            <span style={{ fontSize: '11px', color: tokens.colorNeutralForeground3 }}>
                              Term: {khata.dueDays} days
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell style={{ padding: '14px 20px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          {/* Passbook / Ledger History */}
                          <button
                            type="button"
                            title="View Ledger Statement Passbook"
                            onClick={() => {
                              setSelectedKhata(khata);
                              setIsPassbookOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 10px',
                              borderRadius: '7px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              backgroundColor: tokens.colorNeutralBackground1,
                              color: tokens.colorNeutralForeground1,
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <BookOpen20Regular style={{ width: 15, height: 15 }} />
                            <span>Passbook</span>
                          </button>

                          {/* Receive Payment (Credit) */}
                          <button
                            type="button"
                            title="Receive Payment from Customer"
                            onClick={() => {
                              setSelectedKhata(khata);
                              setTransType('CREDIT');
                              transForm.reset({ amount: undefined, paymentMethod: 'cash', description: '' });
                              setIsPaymentOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 11px',
                              borderRadius: '7px',
                              border: '1px solid #A7F3D0',
                              backgroundColor: '#ECFDF5',
                              color: '#047857',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <ArrowCircleDown20Regular style={{ width: 15, height: 15 }} />
                            <span>Receive</span>
                          </button>

                          {/* Add Udhaar (Debit) */}
                          <button
                            type="button"
                            title="Add Manual Udhaar"
                            onClick={() => {
                              setSelectedKhata(khata);
                              setTransType('DEBIT');
                              transForm.reset({ amount: undefined, paymentMethod: 'cash', description: '' });
                              setIsPaymentOpen(true);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 11px',
                              borderRadius: '7px',
                              border: '1px solid #FECACA',
                              backgroundColor: '#FEF2F2',
                              color: '#DC2626',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <ArrowCircleUp20Regular style={{ width: 15, height: 15 }} />
                            <span>Udhaar</span>
                          </button>

                          {/* WhatsApp 1-Click Reminder */}
                          {khata.currentDebt > 0 && (
                            <button
                              type="button"
                              title="Send WhatsApp Payment Reminder"
                              onClick={() => sendWhatsAppReminder(khata)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '32px',
                                height: '32px',
                                borderRadius: '7px',
                                border: '1px solid #BBF7D0',
                                backgroundColor: '#F0FDF4',
                                color: '#16A34A',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Chat20Regular style={{ width: 16, height: 16 }} />
                            </button>
                          )}

                          {/* Delete Account */}
                          <button
                            type="button"
                            title="Delete Customer Account"
                            onClick={() => {
                              if (window.confirm(`Kya aap ${khata.name} ka khata account delete karna chahte hain?`)) {
                                deleteMutation.mutate(khata.id);
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '32px',
                              borderRadius: '7px',
                              border: `1px solid ${tokens.colorNeutralStroke1}`,
                              backgroundColor: 'transparent',
                              color: tokens.colorNeutralForeground3,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <Delete16Regular style={{ width: 15, height: 15 }} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 1: CREATE NEW KHATA ACCOUNT (FULL PROFESSIONAL KYC)
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isNewKhataOpen} onOpenChange={(_, d) => setIsNewKhataOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '520px' }}>
          <form onSubmit={newKhataForm.handleSubmit(onNewKhataSubmit)}>
            <DialogBody>
              <DialogTitle style={{ fontWeight: 800 }}>Create New Customer Khata Account</DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {/* Full Name */}
                <div>
                  <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer / Business Name</Label>
                  <Controller
                    control={newKhataForm.control}
                    name="name"
                    render={({ field }) => (
                      <Input {...field} appearance="outline" style={{ width: '100%' }} placeholder="e.g. Muhammad Naveed / Green Mart" />
                    )}
                  />
                  {newKhataForm.formState.errors.name && (
                    <span style={{ color: '#E51937', fontSize: '11px' }}>{newKhataForm.formState.errors.name.message}</span>
                  )}
                </div>

                {/* Phone & CNIC */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone Number</Label>
                    <Controller
                      control={newKhataForm.control}
                      name="phone"
                      render={({ field }) => (
                        <Input {...field} appearance="outline" style={{ width: '100%' }} placeholder="0300-1234567" />
                      )}
                    />
                    {newKhataForm.formState.errors.phone && (
                      <span style={{ color: '#E51937', fontSize: '11px' }}>{newKhataForm.formState.errors.phone.message}</span>
                    )}
                  </div>

                  <div>
                    <Label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>CNIC (National ID)</Label>
                    <Controller
                      control={newKhataForm.control}
                      name="cnic"
                      render={({ field }) => (
                        <Input {...field} appearance="outline" style={{ width: '100%' }} placeholder="35201-1234567-1" />
                      )}
                    />
                  </div>
                </div>

                {/* Account Type & Payment Term */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Customer Type</Label>
                    <Controller
                      control={newKhataForm.control}
                      name="customerType"
                      render={({ field }) => (
                        <Select {...field} appearance="outline" style={{ width: '100%' }}>
                          <option value="retail">Retail Customer</option>
                          <option value="wholesale">Wholesale Dukandar</option>
                          <option value="employee">Staff / Employee</option>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Credit Term (Days)</Label>
                    <Controller
                      control={newKhataForm.control}
                      name="dueDays"
                      render={({ field }) => (
                        <Select {...field} appearance="outline" style={{ width: '100%' }}>
                          <option value="7">7 Days</option>
                          <option value="15">15 Days</option>
                          <option value="30">30 Days</option>
                          <option value="60">60 Days</option>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Credit Limit & Initial Opening Debt */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Credit Limit (PKR)</Label>
                    <Controller
                      control={newKhataForm.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <Input
                          value={String(field.value ?? '')}
                          onChange={(_, d) => field.onChange(d.value)}
                          type="number"
                          appearance="outline"
                          style={{ width: '100%' }}
                          placeholder="50000"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Initial Debt (Opening PKR)</Label>
                    <Controller
                      control={newKhataForm.control}
                      name="currentDebt"
                      render={({ field }) => (
                        <Input
                          value={String(field.value ?? '')}
                          onChange={(_, d) => field.onChange(d.value)}
                          type="number"
                          appearance="outline"
                          style={{ width: '100%' }}
                          placeholder="0"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Shop / Home Address</Label>
                  <Controller
                    control={newKhataForm.control}
                    name="address"
                    render={({ field }) => (
                      <Input {...field} appearance="outline" style={{ width: '100%' }} placeholder="e.g. Shop #4, Main Market, Lahore" />
                    )}
                  />
                </div>
              </DialogContent>

              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsNewKhataOpen(false)}
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
                  disabled={createMutation.isPending}
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
                  {createMutation.isPending ? 'Saving...' : 'Create Khata'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 2: TRANSACTION (RECEIVE PAYMENT OR ADD UDHAAR)
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isPaymentOpen} onOpenChange={(_, d) => setIsPaymentOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '440px' }}>
          <form onSubmit={transForm.handleSubmit(onTransSubmit)}>
            <DialogBody>
              <DialogTitle style={{ fontWeight: 800 }}>
                {transType === 'CREDIT' ? 'Receive Payment (Wasooli)' : 'Add Udhaar (Give Credit)'}
              </DialogTitle>
              <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                {/* Selected Customer Header */}
                <div style={{ padding: '12px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '8px' }}>
                  <Body1 style={{ fontWeight: 700 }}>{selectedKhata?.name}</Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block' }}>
                    Current Balance: <strong style={{ color: '#E51937' }}>PKR {selectedKhata?.currentDebt.toLocaleString()}</strong> • Limit: PKR {selectedKhata?.creditLimit.toLocaleString()}
                  </Caption1>
                </div>

                {/* Amount */}
                <div>
                  <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Amount (PKR)</Label>
                  <Controller
                    control={transForm.control}
                    name="amount"
                    render={({ field }) => (
                      <Input
                        value={String(field.value ?? '')}
                        onChange={(_, d) => field.onChange(d.value)}
                        type="number"
                        appearance="outline"
                        style={{ width: '100%', fontSize: '18px', fontWeight: 700 }}
                        placeholder="e.g. 5000"
                        autoFocus
                      />
                    )}
                  />
                  {transForm.formState.errors.amount && (
                    <span style={{ color: '#E51937', fontSize: '11px' }}>{transForm.formState.errors.amount.message}</span>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <Label required style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Payment Mode</Label>
                  <Controller
                    control={transForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <Select {...field} appearance="outline" style={{ width: '100%' }}>
                        <option value="cash">Cash In Hand</option>
                        <option value="bank">Bank Transfer / Cheque</option>
                        <option value="easypaisa">EasyPaisa</option>
                        <option value="jazzcash">JazzCash</option>
                      </Select>
                    )}
                  />
                </div>

                {/* Description */}
                <div>
                  <Label style={{ fontWeight: 600, display: 'block', marginBottom: '4px' }}>Description / Bill Reference</Label>
                  <Controller
                    control={transForm.control}
                    name="description"
                    render={({ field }) => (
                      <Input
                        {...field}
                        appearance="outline"
                        style={{ width: '100%' }}
                        placeholder={transType === 'CREDIT' ? 'e.g. Cash received by cashier Ali' : 'e.g. 3x Oil Filter & Grocery'}
                      />
                    )}
                  />
                </div>
              </DialogContent>

              <DialogActions style={{ marginTop: '24px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
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
                  disabled={transactionMutation.isPending}
                  style={{
                    backgroundColor: transType === 'CREDIT' ? '#107C41' : '#E51937',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 700,
                    padding: '9px 22px',
                    minWidth: '160px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    boxShadow: transType === 'CREDIT' ? '0 2px 8px rgba(16, 124, 65, 0.25)' : '0 2px 8px rgba(229, 25, 55, 0.25)',
                  }}
                >
                  {transactionMutation.isPending ? 'Processing...' : transType === 'CREDIT' ? 'Confirm Payment Received' : 'Add Udhaar to Khata'}
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL 3: CUSTOMER PASSBOOK / LEDGER STATEMENT
      ════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isPassbookOpen} onOpenChange={(_, d) => setIsPassbookOpen(d.open)}>
        <DialogSurface style={{ borderRadius: tokens.borderRadiusLarge, maxWidth: '680px', width: '100%' }}>
          <DialogBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <DialogTitle style={{ fontWeight: 800 }}>
                  Ledger Passbook Statement
                </DialogTitle>
                <Caption1 style={{ color: tokens.colorNeutralForeground2, display: 'block' }}>
                  {selectedKhata?.name} ({selectedKhata?.phone || 'No phone'}) • {selectedKhata?.address || 'No address'}
                </Caption1>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  size="small"
                  appearance="outline"
                  icon={<Print20Regular />}
                  onClick={printStatement}
                >
                  Print Statement
                </Button>
                {selectedKhata && selectedKhata.currentDebt > 0 && (
                  <Button
                    size="small"
                    appearance="primary"
                    icon={<Chat20Regular />}
                    style={{ backgroundColor: '#25D366', fontWeight: 600 }}
                    onClick={() => sendWhatsAppReminder(selectedKhata)}
                  >
                    WhatsApp Reminder
                  </Button>
                )}
              </div>
            </div>

            <DialogContent style={{ marginTop: '16px', maxHeight: '400px', overflowY: 'auto' }}>
              {/* Balance Summary Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: tokens.colorNeutralBackground3,
                  borderRadius: '8px',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Credit Limit</Caption1>
                  <Body1 style={{ fontWeight: 700 }}>PKR {selectedKhata?.creditLimit.toLocaleString()}</Body1>
                </div>
                <div>
                  <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Current Outstanding</Caption1>
                  <Subtitle1 style={{ fontWeight: 800, color: '#E51937' }}>
                    PKR {selectedKhata?.currentDebt.toLocaleString()}
                  </Subtitle1>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              {isLoadingPassbook ? (
                <div style={{ padding: '30px', textAlign: 'center' }}>Loading passbook ledger...</div>
              ) : passbookTransactions.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: tokens.colorNeutralForeground3 }}>
                  No transactions recorded for this customer yet.
                </div>
              ) : (
                <Table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: tokens.colorNeutralBackground3, borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                      <TableHeaderCell style={{ padding: '10px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2 }}>
                        Date &amp; Time
                      </TableHeaderCell>
                      <TableHeaderCell style={{ padding: '10px 14px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2 }}>
                        Description / Mode
                      </TableHeaderCell>
                      <TableHeaderCell style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2 }}>
                        Debit (Diya)
                      </TableHeaderCell>
                      <TableHeaderCell style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2 }}>
                        Credit (Wasooli)
                      </TableHeaderCell>
                      <TableHeaderCell style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: tokens.colorNeutralForeground2 }}>
                        Balance
                      </TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passbookTransactions.map((tx) => (
                      <TableRow key={tx.id} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke3}` }}>
                        <TableCell style={{ padding: '12px 14px', fontSize: '12px', color: tokens.colorNeutralForeground2 }}>
                          <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: '10px', color: tokens.colorNeutralForeground3 }}>
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell style={{ padding: '12px 14px' }}>
                          <Body2 style={{ fontWeight: 600 }}>{tx.description || 'Transaction'}</Body2>
                          <Caption1 style={{ color: tokens.colorNeutralForeground3, textTransform: 'capitalize', display: 'block', marginTop: '2px' }}>
                            Mode: {tx.paymentMethod}
                          </Caption1>
                        </TableCell>
                        <TableCell style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: tx.type === 'DEBIT' ? '#E51937' : 'inherit' }}>
                          {tx.type === 'DEBIT' ? (
                            <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                              +PKR {tx.amount.toLocaleString()}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: tx.type === 'CREDIT' ? '#107C41' : 'inherit' }}>
                          {tx.type === 'CREDIT' ? (
                            <span style={{ backgroundColor: '#ECFDF5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                              -PKR {tx.amount.toLocaleString()}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, fontSize: '13px' }}>
                          PKR {tx.balanceAfter.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </DialogContent>

            <DialogActions style={{ marginTop: '16px' }}>
              <Button appearance="secondary" onClick={() => setIsPassbookOpen(false)}>
                Close Passbook
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
