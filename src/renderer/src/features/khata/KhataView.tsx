import React, { useState } from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Button,
  Badge,
  Label,
  Body1,
  Body2,
  Caption1,
  Subtitle1,
  Text,
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
import { posApi } from '@/lib/api';
import { TablePageSkeleton } from '@/components/skeletons/PageSkeletons';
import { CustomInput, CustomSelect, DynamicBar } from '@/components/ui';
import { useAppToast, useConfirmDialog } from '../../context/AppNotificationContext';

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'retail', label: 'Retail Customer' },
  { value: 'wholesale', label: 'Wholesale Dukandar' },
  { value: 'employee', label: 'Staff / Employee' },
];

const DUE_DAYS_OPTIONS = [
  { value: '7', label: '7 Days' },
  { value: '15', label: '15 Days' },
  { value: '30', label: '30 Days' },
  { value: '60', label: '60 Days' },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash In Hand' },
  { value: 'bank', label: 'Bank Transfer / Cheque' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'jazzcash', label: 'JazzCash' },
];

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

import { useKhataStyles, useStyles } from './khata.styles';

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
  const styles = useKhataStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();
  const confirmModal = useConfirmDialog();

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

  // Fetch Khatas: Offline-First Cache (<5ms)
  const { data: khatas = [], isLoading, refetch: refetchKhatas } = useQuery<CustomerKhata[]>({
    queryKey: ['khatas'],
    queryFn: async () => {
      return (await posApi.fetchKhatas()) as CustomerKhata[];
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Listen for instant cross-screen khata updates
  React.useEffect(() => {
    const handleUpdate = () => {
      refetchKhatas();
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
    };
    window.addEventListener('pos_khata_updated', handleUpdate);
    return () => window.removeEventListener('pos_khata_updated', handleUpdate);
  }, [queryClient, refetchKhatas]);

  // Fetch Passbook Transactions for selected customer: Offline-First
  const { data: passbookTransactions = [], isLoading: isLoadingPassbook, refetch: refetchPassbook } = useQuery<KhataTx[]>({
    queryKey: ['khata-transactions', selectedKhata?.id],
    queryFn: async () => {
      if (!selectedKhata) return [];
      return (await posApi.fetchKhataTransactions(selectedKhata.id)) as KhataTx[];
    },
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: !!selectedKhata && isPassbookOpen,
  });

  // Create Khata Mutation: Instant Offline Write + Cloud Sync
  const createMutation = useMutation({
    mutationFn: async (data: NewKhataFormData) => {
      return await posApi.saveKhata(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['khatas'] });
      await queryClient.refetchQueries({ queryKey: ['khatas'] });
      await refetchKhatas();
      setIsNewKhataOpen(false);
      newKhataForm.reset();
      notifySuccess('Customer Khata created successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to create khata account');
    },
  });

  // Add Transaction Mutation: Instant Offline Debt Update + Cloud Sync
  const transactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!selectedKhata) return;
      return await posApi.addKhataTransaction({
        khataId: selectedKhata.id,
        type: transType,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        description: data.description,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['khatas'] });
      await queryClient.refetchQueries({ queryKey: ['khatas'] });
      await refetchKhatas();
      if (selectedKhata) {
        await queryClient.invalidateQueries({ queryKey: ['khata-transactions', selectedKhata.id] });
        await queryClient.refetchQueries({ queryKey: ['khata-transactions', selectedKhata.id] });
        await refetchPassbook();
      }
      setIsPaymentOpen(false);
      transForm.reset();
      notifySuccess('Khata transaction recorded successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to record transaction');
    },
  });

  // Delete Khata Mutation: Instant Offline Delete + Cloud Sync
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await posApi.deleteKhata(id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['khatas'] });
      await queryClient.refetchQueries({ queryKey: ['khatas'] });
      await refetchKhatas();
      notifySuccess('Khata account deleted successfully');
    },
    onError: (err: any) => {
      notifyError(err.message || 'Failed to delete khata account');
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
      notifyWarning('Is customer ka phone number registered nahi hai.');
      return;
    }
    const cleanPhone = khata.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.startsWith('92') ? cleanPhone : cleanPhone.startsWith('0') ? `92${cleanPhone.slice(1)}` : `92${cleanPhone}`;
    const text = encodeURIComponent(
      `As-salamu alaykum ${khata.name} sahab,\n\nAapke Omnipos store account mein PKR ${khata.currentDebt.toLocaleString()} ka baqaya (Udhaar) wajib-ul-ada hai.\nBaraye meharbani baqaya ki adaigi jald az jald farma dein.\n\nShukriya!\nOmnipos Retail & Restaurant`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${text}`, '_blank');
  };

  // Print Statement Handler: Generates clean, professional A4 Customer Ledger Statement for printing / PDF
  const printStatement = () => {
    if (!selectedKhata) return;

    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) {
      notifyWarning('Please allow popups in your browser to print statement');
      return;
    }

    const totalDebits = passbookTransactions
      .filter((tx) => tx.type === 'DEBIT')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalCredits = passbookTransactions
      .filter((tx) => tx.type === 'CREDIT')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const rowsHtml = passbookTransactions
      .map(
        (tx) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; vertical-align: top;">
            <strong>${new Date(tx.createdAt).toLocaleDateString()}</strong><br/>
            <span style="color: #6b7280; font-size: 11px;">${new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; vertical-align: top;">
            <strong style="color: #111827;">${tx.description || 'Transaction'}</strong><br/>
            <span style="color: #6b7280; font-size: 11px; text-transform: capitalize;">Payment Mode: ${tx.paymentMethod}</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: right; color: #dc2626; font-weight: 700; vertical-align: top;">
            ${tx.type === 'DEBIT' ? `+PKR ${tx.amount.toLocaleString()}` : '—'}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: right; color: #16a34a; font-weight: 700; vertical-align: top;">
            ${tx.type === 'CREDIT' ? `-PKR ${tx.amount.toLocaleString()}` : '—'}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; text-align: right; font-weight: 800; color: #111827; vertical-align: top;">
            PKR ${tx.balanceAfter.toLocaleString()}
          </td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Customer Ledger Statement - ${selectedKhata.name}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
            margin: 0;
            padding: 24px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 16px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            color: #E51937;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 12px;
            color: #4b5563;
            margin-top: 3px;
          }
          .statement-meta {
            text-align: right;
          }
          .statement-meta h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #111827;
          }
          .statement-meta p {
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #6b7280;
          }
          .customer-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 18px;
            margin-bottom: 16px;
          }
          .customer-box strong {
            font-size: 16px;
            color: #111827;
          }
          .customer-box p {
            margin: 3px 0 0 0;
            font-size: 12px;
            color: #4b5563;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          .summary-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px 14px;
            background: #f9fafb;
          }
          .summary-card .label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6b7280;
          }
          .summary-card .val {
            font-size: 16px;
            font-weight: 800;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #f3f4f6;
            border-bottom: 2px solid #d1d5db;
            padding: 10px 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #374151;
            text-align: left;
          }
          th.right { text-align: right; }
          .footer {
            display: flex;
            justify-content: space-between;
            border-top: 1px dashed #d1d5db;
            padding-top: 16px;
            font-size: 11px;
            color: #6b7280;
            margin-top: 36px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">OMNIPOS</h1>
            <div class="brand-sub">Commercial Ledger &amp; Customer Passbook Statement</div>
          </div>
          <div class="statement-meta">
            <h2>ACCOUNT STATEMENT</h2>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
        </div>

        <div class="customer-box">
          <div>
            <strong>${selectedKhata.name}</strong>
            <p>Phone: ${selectedKhata.phone || 'N/A'} &nbsp;|&nbsp; CNIC: ${selectedKhata.cnic || 'N/A'}</p>
            <p>Address: ${selectedKhata.address || 'N/A'}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Account Status</div>
            <div style="font-size: 14px; font-weight: 800; color: ${selectedKhata.currentDebt > 0 ? '#dc2626' : '#16a34a'}; margin-top: 3px;">
              ${selectedKhata.currentDebt > 0 ? 'OUTSTANDING BALANCE DUE' : 'ACCOUNT SETTLED'}
            </div>
          </div>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <div class="label">Credit Limit</div>
            <div class="val">PKR ${selectedKhata.creditLimit.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Udhaar (Diya)</div>
            <div class="val" style="color: #dc2626;">+PKR ${totalDebits.toLocaleString()}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Wasooli (Received)</div>
            <div class="val" style="color: #16a34a;">-PKR ${totalCredits.toLocaleString()}</div>
          </div>
          <div class="summary-card" style="background: #fef2f2; border-color: #fca5a5;">
            <div class="label" style="color: #dc2626;">Net Outstanding Balance</div>
            <div class="val" style="color: #b91c1c;">PKR ${selectedKhata.currentDebt.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 140px;">Date &amp; Time</th>
              <th>Description / Mode</th>
              <th class="right" style="width: 130px;">Debit (Diya)</th>
              <th class="right" style="width: 130px;">Credit (Wasooli)</th>
              <th class="right" style="width: 130px;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="5" style="text-align:center; padding: 24px; color: #9ca3af;">No transactions recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <div>Omnipos Enterprise POS · Computer Generated Statement</div>
          <div>Customer Signature: _______________________</div>
          <div>Authorized Signature: _______________________</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
            className={styles.headerTitle}
          >
            Khata / Udhaar Commercial Ledger
          </Subtitle1>
          <Caption1 className={styles.headerSubtitle}>
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
          className={styles.addCustomerBtn}
        >
          Add New Customer Khata
        </Button>
      </div>

      {/* ── 4 KPI Summary Metric Cards ── */}
      <div className={styles.summaryGrid}>
        <div className={styles.statCard}>
          <Caption1 className={styles.statLabel}>
            Total Customers on Credit
          </Caption1>
          <Subtitle1 className={styles.statVal}>
            {khatas.length}
          </Subtitle1>
          <Caption1 className={styles.statSub}>Registered accounts</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 className={styles.statLabel}>
            Total Market Receivables (Udhaar)
          </Caption1>
          <Subtitle1 className={mergeClasses(styles.statVal, styles.statValRed)}>
            PKR {totalMarketDebt.toLocaleString()}
          </Subtitle1>
          <Caption1 className={styles.statSub}>Outstanding balance to recover</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 className={styles.statLabel}>
            Approved Credit Limit Cap
          </Caption1>
          <Subtitle1 className={mergeClasses(styles.statVal, styles.statValBrand)}>
            PKR {totalCreditExtended.toLocaleString()}
          </Subtitle1>
          <Caption1 className={styles.statSub}>Total risk ceiling</Caption1>
        </div>

        <div className={styles.statCard}>
          <Caption1 className={styles.statLabel}>
            High-Risk / Near Limit Accounts
          </Caption1>
          <Subtitle1 className={mergeClasses(styles.statVal, highRiskCustomers > 0 ? styles.statValWarn : styles.statValSuccess)}>
            {highRiskCustomers}
          </Subtitle1>
          <Caption1 className={styles.statSub}>&gt;80% credit limit utilized</Caption1>
        </div>
      </div>

      {/* ── Main Khata Table Card ── */}
      <div className={styles.tableCard}>
        <div className={styles.filterBar}>
          <div className={styles.searchWrap}>
            <CustomInput
              label="Search Customers"
              placeholder="Name, phone, or CNIC..."
              icon={<Search20Regular />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={searchTerm ? () => setSearchTerm('') : undefined}
            />
          </div>

          <div className={styles.filterWrap}>
            <CustomSelect
              label="Filter Account Type"
              value={typeFilter}
              options={[
                { value: 'all', label: `All Accounts (${khatas.length})` },
                { value: 'retail', label: 'Retail Customers' },
                { value: 'wholesale', label: 'Wholesale / Dukandar' },
                { value: 'employee', label: 'Staff / Employee' },
              ]}
              onChange={(val) => setTypeFilter(val as any)}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <Table className={styles.table}>
            <TableHeader>
              <TableRow className={styles.tableHeaderRow}>
                <TableHeaderCell className={styles.thProfile}>
                  Customer Profile
                </TableHeaderCell>
                <TableHeaderCell className={styles.thContact}>
                  Contact &amp; CNIC
                </TableHeaderCell>
                <TableHeaderCell className={styles.thUsage}>
                  Credit Limit &amp; Usage
                </TableHeaderCell>
                <TableHeaderCell className={styles.thDebt}>
                  Outstanding Debt
                </TableHeaderCell>
                <TableHeaderCell className={styles.thActions}>
                  Actions &amp; Reminders
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKhatas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className={styles.emptyTableCell}>
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
                      className={styles.tableBodyRow}
                    >
                      {/* Customer Info */}
                      <TableCell className={styles.tdProfile}>
                        <div className={styles.avatarWrap}>
                          <div className={styles.profileAvatar}>
                            {khata.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className={styles.profileInfoCol}>
                            <div className={styles.profileTitleRow}>
                              <span className={styles.profileName}>
                                {khata.name}
                              </span>
                              <Badge
                                size="small"
                                appearance="tint"
                                color={khata.customerType === 'wholesale' ? 'brand' : khata.customerType === 'employee' ? 'informative' : 'subtle'}
                                className={styles.profileBadge}
                              >
                                {khata.customerType || 'RETAIL'}
                              </Badge>
                            </div>
                            {khata.address && (
                              <div className={styles.profileAddressRow}>
                                <Location16Regular className={styles.locationIcon} />
                                <span className={styles.addressText}>
                                  {khata.address}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contact & CNIC */}
                      <TableCell className={styles.tdCell}>
                        <div className={styles.colGap3}>
                          <span className={styles.contactPhone}>
                            {khata.phone || 'No phone'}
                          </span>
                          {khata.cnic && (
                            <span className={styles.contactCnic}>
                              CNIC: {khata.cnic}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Credit Limit & Mini Progress Bar */}
                      <TableCell className={styles.tdCell}>
                        <div className={styles.usageContainer}>
                          <div className={styles.usageHeaderRow}>
                            <span
                              className={mergeClasses(
                                styles.usagePercent,
                                isOverLimit ? styles.usagePercentOver : isNearLimit ? styles.usagePercentNear : undefined
                              )}
                            >
                              {percent}% Used
                            </span>
                            <span className={styles.usageCap}>
                              Cap: PKR {limit.toLocaleString()}
                            </span>
                          </div>
                          <div className={styles.progressBarTrack}>
                            <DynamicBar
                              className={mergeClasses(
                                styles.progressBarFill,
                                isOverLimit ? styles.progressBarAlert : isNearLimit ? styles.progressBarWarn : styles.progressBarNormal
                              )}
                              width={percent}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Debt Badge */}
                      <TableCell className={styles.tdCell}>
                        <div className={styles.colGap3}>
                          <span
                            className={mergeClasses(
                              styles.debtBadge,
                              khata.currentDebt > 0 ? styles.debtBadgeDue : styles.debtBadgeClear
                            )}
                          >
                            PKR {khata.currentDebt.toLocaleString()}
                          </span>
                          {khata.dueDays && (
                            <span className={styles.termText}>
                              Term: {khata.dueDays} days
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className={styles.tdActions}>
                        <div className={styles.actionsGroup}>
                          {/* Passbook / Ledger History */}
                          <button
                            type="button"
                            title="View Ledger Statement Passbook"
                            onClick={() => {
                              setSelectedKhata(khata);
                              setIsPassbookOpen(true);
                            }}
                            className={styles.btnPassbook}
                          >
                            <BookOpen20Regular className={styles.icon15} />
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
                            className={styles.btnReceive}
                          >
                            <ArrowCircleDown20Regular className={styles.icon15} />
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
                            className={styles.btnUdhaar}
                          >
                            <ArrowCircleUp20Regular className={styles.icon15} />
                            <span>Udhaar</span>
                          </button>

                          {/* WhatsApp 1-Click Reminder */}
                          {khata.currentDebt > 0 && (
                            <button
                              type="button"
                              title="Send WhatsApp Payment Reminder"
                              onClick={() => sendWhatsAppReminder(khata)}
                              className={styles.btnWhatsApp}
                            >
                              <Chat20Regular className={styles.icon16} />
                            </button>
                          )}

                          {/* Delete Account */}
                          <button
                            type="button"
                            title="Delete Customer Account"
                            onClick={async () => {
                              const ok = await confirmModal({
                                title: 'Delete Khata Account',
                                message: `Kya aap "${khata.name}" ka khata account delete karna chahte hain? Tamam record aur passbook transactions permanently remove ho jayein gi.`,
                                confirmLabel: 'Delete Khata',
                                intent: 'danger',
                              });
                              if (ok) {
                                deleteMutation.mutate(khata.id);
                              }
                            }}
                            className={styles.btnDelete}
                          >
                            <Delete16Regular className={styles.icon15} />
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
        <DialogSurface className={styles.dialogSurface520}>
          <form onSubmit={newKhataForm.handleSubmit(onNewKhataSubmit)}>
            <DialogBody>
              <DialogTitle className={styles.dialogTitleBold}>Create New Customer Khata Account</DialogTitle>
              <DialogContent className={styles.dialogContent}>
                {/* Full Name */}
                <div>
                  <Controller
                    control={newKhataForm.control}
                    name="name"
                    render={({ field }) => (
                      <CustomInput
                        label="Customer / Business Name"
                        required
                        placeholder="e.g. Muhammad Naveed / Green Mart"
                        value={field.value || ''}
                        onChange={field.onChange}
                        error={newKhataForm.formState.errors.name?.message}
                      />
                    )}
                  />
                </div>

                {/* Phone & CNIC */}
                <div className={styles.grid2Col}>
                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="phone"
                      render={({ field }) => (
                        <CustomInput
                          label="Phone Number"
                          required
                          placeholder="0300-1234567"
                          value={field.value || ''}
                          onChange={field.onChange}
                          error={newKhataForm.formState.errors.phone?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="cnic"
                      render={({ field }) => (
                        <CustomInput
                          label="CNIC (National ID)"
                          placeholder="35201-1234567-1"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Account Type & Payment Term */}
                <div className={styles.grid2Col}>
                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="customerType"
                      render={({ field }) => (
                        <CustomSelect
                          label="Customer Type"
                          value={field.value}
                          options={CUSTOMER_TYPE_OPTIONS}
                          onChange={(val) => field.onChange(val)}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="dueDays"
                      render={({ field }) => (
                        <CustomSelect
                          label="Credit Term"
                          value={String(field.value)}
                          options={DUE_DAYS_OPTIONS}
                          onChange={(val) => field.onChange(Number(val))}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Credit Limit & Initial Opening Debt */}
                <div className={styles.grid2Col}>
                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="creditLimit"
                      render={({ field }) => (
                        <CustomInput
                          label="Credit Limit (PKR)"
                          required
                          type="number"
                          placeholder="50000"
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                          error={newKhataForm.formState.errors.creditLimit?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      control={newKhataForm.control}
                      name="currentDebt"
                      render={({ field }) => (
                        <CustomInput
                          label="Initial Debt (Opening PKR)"
                          type="number"
                          placeholder="0"
                          value={field.value !== undefined ? String(field.value) : ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Controller
                    control={newKhataForm.control}
                    name="address"
                    render={({ field }) => (
                      <CustomInput
                        label="Shop / Home Address"
                        placeholder="e.g. Shop #4, Main Market, Lahore"
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </DialogContent>

              <DialogActions className={styles.dialogActions}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsNewKhataOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={createMutation.isPending}
                  className={styles.modalSubmitBtn}
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
        <DialogSurface className={styles.dialogSurface440}>
          <form onSubmit={transForm.handleSubmit(onTransSubmit)}>
            <DialogBody>
              <DialogTitle className={styles.dialogTitleBold}>
                {transType === 'CREDIT' ? 'Receive Payment (Wasooli)' : 'Add Udhaar (Give Credit)'}
              </DialogTitle>
              <DialogContent className={styles.dialogContent}>
                {/* Selected Customer Header */}
                <div className={styles.selectedCustCard}>
                  <Body1 className={styles.selectedCustTitle}>{selectedKhata?.name}</Body1>
                  <Caption1 className={styles.selectedCustSub}>
                    Current Balance: <strong className={styles.currentBalStrong}>PKR {selectedKhata?.currentDebt.toLocaleString()}</strong> • Limit: PKR {selectedKhata?.creditLimit.toLocaleString()}
                  </Caption1>
                </div>

                {/* Amount */}
                <div>
                  <Controller
                    control={transForm.control}
                    name="amount"
                    render={({ field }) => (
                      <CustomInput
                        label="Amount (PKR)"
                        required
                        type="number"
                        placeholder="e.g. 5000"
                        autoFocus
                        value={field.value !== undefined ? String(field.value) : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        error={transForm.formState.errors.amount?.message}
                      />
                    )}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <Controller
                    control={transForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <CustomSelect
                        label="Payment Mode"
                        required
                        value={field.value}
                        options={PAYMENT_METHOD_OPTIONS}
                        onChange={(val) => field.onChange(val)}
                      />
                    )}
                  />
                </div>

                {/* Description */}
                <div>
                  <Controller
                    control={transForm.control}
                    name="description"
                    render={({ field }) => (
                      <CustomInput
                        label="Description / Bill Reference"
                        placeholder={transType === 'CREDIT' ? 'e.g. Cash received by cashier Ali' : 'e.g. 3x Oil Filter & Grocery'}
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </DialogContent>

              <DialogActions className={styles.dialogActions}>
                <Button
                  appearance="subtle"
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={transactionMutation.isPending}
                  className={transType === 'CREDIT' ? styles.transSubmitGreen : styles.transSubmitRed}
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
        <DialogSurface className={styles.passbookSurface}>
          <div className={styles.passbookInner}>
            {/* 1. Header: Title, Customer Details, Action Buttons */}
            <div className={styles.passbookHeader}>
              <div className={styles.passbookTitleCol}>
                <div className={styles.passbookTitleRow}>
                  <h2 className={styles.passbookTitle}>
                    Ledger Passbook Statement
                  </h2>
                  <span
                    className={mergeClasses(
                      styles.passbookStatusBadge,
                      (selectedKhata?.currentDebt || 0) > 0 ? styles.passbookStatusDue : styles.passbookStatusSettled
                    )}
                  >
                    {(selectedKhata?.currentDebt || 0) > 0 ? 'Outstanding Due' : 'Account Settled'}
                  </span>
                </div>
                <div className={styles.passbookSubtitle}>
                  <strong className={styles.profileName}>{selectedKhata?.name}</strong>
                  {' · '}{selectedKhata?.phone || 'No phone'}
                  {' · '}{selectedKhata?.address || 'No address'}
                </div>
              </div>

              <div className={styles.passbookActionsRow}>
                <Button
                  size="medium"
                  appearance="secondary"
                  icon={<Print20Regular />}
                  onClick={printStatement}
                  className={styles.passbookPrintBtn}
                >
                  Print Statement
                </Button>
                {selectedKhata && selectedKhata.currentDebt > 0 && (
                  <Button
                    size="medium"
                    appearance="primary"
                    icon={<Chat20Regular />}
                    className={styles.passbookWhatsAppBtn}
                    onClick={() => sendWhatsAppReminder(selectedKhata)}
                  >
                    WhatsApp Reminder
                  </Button>
                )}
              </div>
            </div>

            {/* 2. 4 KPI Summary Metric Cards (Full Width Row) */}
            <div className={styles.passbookMetricGrid}>
              <div className={styles.passbookStatCard}>
                <span className={styles.passbookStatTitle}>
                  Credit Limit
                </span>
                <div className={styles.passbookStatVal}>
                  PKR {selectedKhata?.creditLimit.toLocaleString()}
                </div>
              </div>

              <div className={styles.passbookStatCard}>
                <span className={styles.passbookStatTitle}>
                  Total Udhaar (Diya)
                </span>
                <div className={styles.passbookStatValRed}>
                  +PKR {passbookTransactions.filter((tx) => tx.type === 'DEBIT').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                </div>
              </div>

              <div className={styles.passbookStatCard}>
                <span className={styles.passbookStatTitle}>
                  Total Wasooli (Received)
                </span>
                <div className={styles.passbookStatValGreen}>
                  -PKR {passbookTransactions.filter((tx) => tx.type === 'CREDIT').reduce((s, t) => s + t.amount, 0).toLocaleString()}
                </div>
              </div>

              <div className={styles.passbookStatCardAlert}>
                <span className={styles.passbookStatTitleAlert}>
                  Net Outstanding
                </span>
                <div className={styles.passbookStatValNet}>
                  PKR {selectedKhata?.currentDebt.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 3. Table Container */}
            <div className={styles.passbookTableWrap}>
              {isLoadingPassbook ? (
                <div className={styles.passbookLoadingText}>
                  Loading passbook ledger...
                </div>
              ) : passbookTransactions.length === 0 ? (
                <div className={styles.passbookEmptyText}>
                  No transactions recorded for this customer yet.
                </div>
              ) : (
                <div className={styles.passbookTableCard}>
                  <Table className={styles.passbookTable}>
                    <TableHeader>
                      <TableRow className={styles.passbookTheadTr}>
                        <TableHeaderCell className={styles.passbookThDate}>
                          Date &amp; Time
                        </TableHeaderCell>
                        <TableHeaderCell className={styles.passbookThDesc}>
                          Description / Mode
                        </TableHeaderCell>
                        <TableHeaderCell className={styles.passbookThDebit}>
                          Debit (Diya)
                        </TableHeaderCell>
                        <TableHeaderCell className={styles.passbookThCredit}>
                          Credit (Wasooli)
                        </TableHeaderCell>
                        <TableHeaderCell className={styles.passbookThBal}>
                          Balance
                        </TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {passbookTransactions.map((tx) => (
                        <TableRow key={tx.id} className={styles.passbookTbodyTr}>
                          <TableCell className={styles.passbookTdDate}>
                            <div className={styles.passbookDatePrimary}>
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </div>
                            <div className={styles.passbookTimeSecondary}>
                              {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell className={styles.passbookTdDesc}>
                            <div className={styles.passbookDescTitle}>
                              {tx.description || 'Transaction'}
                            </div>
                            <div className={styles.passbookDescMode}>
                              Payment Mode: <strong className={styles.selectedCustTitle}>{tx.paymentMethod}</strong>
                            </div>
                          </TableCell>
                          <TableCell className={styles.passbookTdRight}>
                            {tx.type === 'DEBIT' ? (
                              <span className={styles.debitTag}>
                                +PKR {tx.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span className={styles.dashText}>—</span>
                            )}
                          </TableCell>
                          <TableCell className={styles.passbookTdRight}>
                            {tx.type === 'CREDIT' ? (
                              <span className={styles.creditTag}>
                                -PKR {tx.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span className={styles.dashText}>—</span>
                            )}
                          </TableCell>
                          <TableCell className={styles.passbookTdBal}>
                            PKR {tx.balanceAfter.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* 4. Footer */}
            <div className={styles.passbookFooter}>
              <span className={styles.passbookRecordCount}>
                Showing {passbookTransactions.length} transaction record{passbookTransactions.length !== 1 ? 's' : ''}
              </span>
              <Button
                appearance="secondary"
                onClick={() => setIsPassbookOpen(false)}
                className={styles.passbookCloseBtn}
              >
                Close Passbook
              </Button>
            </div>
          </div>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
