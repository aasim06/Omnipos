import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Badge,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Dismiss20Regular,
  MoneyHand20Regular,
  Print20Regular,
  History20Regular,
  ArrowUp20Regular,
  ArrowDown20Regular,
  Checkmark20Regular,
} from '@fluentui/react-icons';
import { formatPKR } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { CustomDateField } from '@/components/ui/CustomDateField';
import { vendorStorage, Vendor } from './vendorStorage';
import { useAppToast, useConfirmDialog } from '@/context/AppNotificationContext';
import { printVendorStatement, StatementEntry } from '@/lib/vendorStatementPrint';
import type { KhataAging } from '@shared/khataAging';

interface VendorLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onVendorUpdated?: () => void;
  /** Payables aging for this supplier, when the backend gave it */
  aging?: KhataAging | null;
}

const useStyles = makeStyles({
  surface: { maxWidth: '920px', width: '95vw' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '12px',
    marginBottom: '12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  titleRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  sub: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '10px',
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '10px 12px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    minWidth: 0,
  },
  tileOwed: { ...shorthands.border('1px', 'solid', tokens.colorPaletteRedBorder1) },
  tileLabel: { fontSize: '11.5px', color: tokens.colorNeutralForeground3, textTransform: 'uppercase', fontWeight: 600 },
  tileValue: { fontSize: '15px', fontWeight: 600, color: tokens.colorNeutralForeground1 },
  danger: { color: tokens.colorPaletteRedForeground1 },
  success: { color: tokens.colorPaletteGreenForeground1 },
  warn: { color: tokens.colorPaletteMarigoldForeground1 },
  bar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '8px', flexWrap: 'wrap' },
  barRight: { display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' },
  section: { fontWeight: 600, color: tokens.colorNeutralForeground1 },
  payForm: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1.3fr 1.3fr auto',
    gap: '10px',
    alignItems: 'end',
    padding: '12px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    '@media (max-width: 800px)': { gridTemplateColumns: '1fr 1fr' },
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  chip: {
    fontSize: '12px',
    padding: '3px 8px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  tableWrap: {
    maxHeight: '320px',
    overflowY: 'auto',
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: {
    position: 'sticky',
    top: 0,
    textAlign: 'left',
    padding: '8px 10px',
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  td: { padding: '7px 10px', borderBottom: `1px solid ${tokens.colorNeutralStroke3}`, color: tokens.colorNeutralForeground1 },
  right: { textAlign: 'right', whiteSpace: 'nowrap' },
  muted: { color: tokens.colorNeutralForeground3 },
  strong: { fontWeight: 600 },
});

const owesMore = (t: { type: string; amount: number }) => t.type === 'BILL' || (t.type === 'ADJUSTMENT' && Number(t.amount) >= 0);

export function VendorLedgerModal({ isOpen, onClose, vendor, onVendorUpdated, aging }: VendorLedgerModalProps): React.JSX.Element {
  const styles = useStyles();
  const { notifySuccess, notifyWarning } = useAppToast();
  const confirmModal = useConfirmDialog();

  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [payBillId, setPayBillId] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const currentVendor = useMemo(() => {
    if (!vendor) return null;
    return vendorStorage.getAllVendors().find((v) => v.id === vendor.id) || vendor;
  }, [vendor, refreshKey, isOpen]);

  // Oldest first, for running balances and the statement
  const allTx = useMemo(() => {
    if (!vendor) return [];
    return [...vendorStorage.getTransactions(vendor.id)].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [vendor, refreshKey, isOpen]);

  const unpaidBills = useMemo(() => {
    if (!vendor) return [];
    return vendorStorage
      .getPurchaseBills()
      .filter((b) => b.vendorId === vendor.id && Number(b.grandTotal || 0) - Number(b.paidAmount || 0) > 0.005)
      .sort((a, b) => String(a.billDate).localeCompare(String(b.billDate)));
  }, [vendor, refreshKey, isOpen]);

  // Period view: opening balance before `from`, entries within the range
  const period = useMemo(() => {
    const start = from ? new Date(`${from}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
    const end = to ? new Date(`${to}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
    const before = allTx.filter((t) => new Date(t.date).getTime() < start);
    const inRange = allTx.filter((t) => {
      const ts = new Date(t.date).getTime();
      return ts >= start && ts <= end;
    });
    const opening = before.length ? Number(before[before.length - 1].balanceAfter) || 0 : 0;
    return { opening, entries: inRange };
  }, [allTx, from, to]);

  if (!currentVendor) return <></>;
  const currentBal = vendorStorage.getBalance(currentVendor);

  const handleRecordPayment = async () => {
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      notifyWarning('Enter a payment amount');
      return;
    }
    if (amt > currentBal + 0.005) {
      const ok = await confirmModal({
        title: 'Pay more than is owed?',
        message: `${currentVendor.name} is owed ${formatPKR(Math.max(0, currentBal))}. Paying ${formatPKR(amt)} leaves ${formatPKR(amt - Math.max(0, currentBal))} as an advance with this supplier.`,
        confirmLabel: 'Pay as advance',
      });
      if (!ok) return;
    }
    setIsPaying(true);
    try {
      const desc = paymentNote.trim() || `Payment via ${paymentMethod.toUpperCase()}`;
      const tx = await vendorStorage.recordPayment(currentVendor.id, amt, paymentMethod, desc, payBillId || undefined);
      // Bills' paid amounts changed on the backend: refresh the cache
      await vendorStorage.syncWithServer();
      const settled = (tx.allocations || []).map((a) => `${a.billNumber} (${formatPKR(a.amount)})`).join(', ');
      notifySuccess(`Paid ${formatPKR(amt)} to ${currentVendor.name}${settled ? ` · settles ${settled}` : ''}`);
      setPaymentAmount('');
      setPaymentNote('');
      setPayBillId('');
      setShowPaymentForm(false);
      setRefreshKey((k) => k + 1);
      onVendorUpdated?.();
    } catch (err: any) {
      notifyWarning(err?.message || 'Could not record the payment');
    } finally {
      setIsPaying(false);
    }
  };

  const handlePrint = () => {
    const entries: StatementEntry[] = period.entries.map((t) => ({
      date: t.date,
      description: t.description || t.type,
      reference: t.paymentMethod ? t.paymentMethod.toUpperCase() : undefined,
      debit: owesMore(t) ? Math.abs(Number(t.amount)) : 0,
      credit: owesMore(t) ? 0 : Math.abs(Number(t.amount)),
      balance: Number(t.balanceAfter) || 0,
    }));
    const ok = printVendorStatement({
      vendorName: currentVendor.name,
      vendorPhone: currentVendor.phone,
      from: from || undefined,
      to: to || undefined,
      opening: period.opening,
      entries,
    });
    if (!ok) notifyWarning('Allow pop-ups to print the statement.');
  };

  const shown = [...period.entries].reverse(); // newest first on screen
  const terms = currentVendor.creditDays ?? 30;

  return (
    <Dialog open={isOpen} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <div className={styles.header}>
          <div>
            <div className={styles.titleRow}>
              <History20Regular />
              <DialogTitle>{currentVendor.name}: supplier ledger</DialogTitle>
            </div>
            <span className={styles.sub}>
              {[currentVendor.contactPerson && `Rep: ${currentVendor.contactPerson}`, currentVendor.phone, `Credit terms: ${terms} days`]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
          <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={onClose} aria-label="Close" />
        </div>

        <DialogBody>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Summary */}
            <div className={styles.summary}>
              <div className={mergeClasses(styles.tile, currentBal > 0 && styles.tileOwed)}>
                <span className={styles.tileLabel}>{currentBal > 0 ? 'We owe' : currentBal < 0 ? 'Advance with supplier' : 'Settled'}</span>
                <span className={mergeClasses(styles.tileValue, currentBal > 0 ? styles.danger : styles.success)}>{formatPKR(Math.abs(currentBal))}</span>
              </div>
              <div className={styles.tile}>
                <span className={styles.tileLabel}>Overdue (&gt; {terms} days)</span>
                <span className={mergeClasses(styles.tileValue, aging?.overdue && styles.danger)}>
                  {aging ? formatPKR(aging.overdueAmount) : '—'}
                </span>
              </div>
              <div className={styles.tile}>
                <span className={styles.tileLabel}>Oldest unpaid</span>
                <span className={styles.tileValue}>{aging && aging.outstanding > 0 ? `${aging.daysOutstanding} days` : '—'}</span>
              </div>
              <div className={styles.tile}>
                <span className={styles.tileLabel}>Unpaid bills</span>
                <span className={styles.tileValue}>{unpaidBills.length}</span>
              </div>
            </div>

            {aging && aging.outstanding > 0 && (
              <div className={styles.chips}>
                <span className={styles.chip}>0–30 days: {formatPKR(aging.buckets.d0_30)}</span>
                <span className={styles.chip}>31–60: {formatPKR(aging.buckets.d31_60)}</span>
                <span className={styles.chip}>61–90: {formatPKR(aging.buckets.d61_90)}</span>
                <span className={styles.chip}>90+: {formatPKR(aging.buckets.d90p)}</span>
              </div>
            )}

            {/* Actions */}
            <div className={styles.bar}>
              <span className={styles.section}>Transactions</span>
              <div className={styles.barRight}>
                <div style={{ width: 150 }}>
                  <CustomDateField value={from} onChange={setFrom} max={to || undefined} aria-label="Statement from" placeholder="From" />
                </div>
                <div style={{ width: 150 }}>
                  <CustomDateField value={to} onChange={setTo} min={from || undefined} aria-label="Statement to" placeholder="To" />
                </div>
                <Button appearance="secondary" icon={<Print20Regular />} onClick={handlePrint}>
                  Print statement
                </Button>
                <Button appearance={showPaymentForm ? 'secondary' : 'primary'} icon={<MoneyHand20Regular />} onClick={() => setShowPaymentForm((v) => !v)}>
                  {showPaymentForm ? 'Cancel payment' : 'Pay supplier'}
                </Button>
              </div>
            </div>

            {showPaymentForm && (
              <div className={styles.payForm}>
                <CustomInput
                  label="Amount (PKR)"
                  required
                  type="number"
                  placeholder={currentBal > 0 ? String(Math.round(currentBal)) : '0'}
                  value={paymentAmount !== '' ? String(paymentAmount) : ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value) || '')}
                />
                <CustomSelect
                  label="Paid by"
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as any)}
                  options={[
                    { value: 'cash', label: 'Cash (from drawer)' },
                    { value: 'bank', label: 'Bank transfer / Raast' },
                    { value: 'cheque', label: 'Cheque' },
                  ]}
                />
                <CustomSelect
                  label="Against bill"
                  value={payBillId}
                  onChange={setPayBillId}
                  options={[
                    { value: '', label: 'Oldest bills first' },
                    ...unpaidBills.map((b) => ({
                      value: b.id,
                      label: `${b.billNumber} · due ${formatPKR(Number(b.grandTotal || 0) - Number(b.paidAmount || 0))}`,
                    })),
                  ]}
                />
                <CustomInput label="Reference / note" placeholder="Cheque no., transfer ref…" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} />
                <Button appearance="primary" icon={<Checkmark20Regular />} onClick={handleRecordPayment} disabled={isPaying}>
                  {isPaying ? 'Saving…' : 'Save payment'}
                </Button>
              </div>
            )}

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Date</th>
                    <th className={styles.th}>Type</th>
                    <th className={styles.th}>Details</th>
                    <th className={mergeClasses(styles.th, styles.right)}>Bill (+)</th>
                    <th className={mergeClasses(styles.th, styles.right)}>Paid / credit (−)</th>
                    <th className={mergeClasses(styles.th, styles.right)}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={mergeClasses(styles.td, styles.muted)} style={{ textAlign: 'center', padding: 28 }}>
                        No transactions {from || to ? 'in this period' : 'yet'}.
                      </td>
                    </tr>
                  ) : (
                    shown.map((tx) => {
                      const adds = owesMore(tx);
                      const isAdj = tx.type === 'ADJUSTMENT';
                      return (
                        <tr key={tx.id}>
                          <td className={styles.td} style={{ whiteSpace: 'nowrap' }}>
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className={styles.td}>
                            <Badge
                              appearance="tint"
                              color={isAdj ? 'warning' : adds ? 'danger' : 'success'}
                              icon={adds ? <ArrowUp20Regular /> : <ArrowDown20Regular />}
                            >
                              {isAdj ? 'Adjustment' : adds ? 'Bill' : 'Payment'}
                            </Badge>
                          </td>
                          <td className={styles.td}>
                            <span className={styles.strong}>{tx.description}</span>
                            {tx.paymentMethod && <span className={styles.muted}> · {tx.paymentMethod.toUpperCase()}</span>}
                          </td>
                          <td className={mergeClasses(styles.td, styles.right, adds ? styles.danger : styles.muted)}>
                            {adds ? formatPKR(Math.abs(tx.amount)) : '—'}
                          </td>
                          <td className={mergeClasses(styles.td, styles.right, !adds ? styles.success : styles.muted)}>
                            {!adds ? formatPKR(Math.abs(tx.amount)) : '—'}
                          </td>
                          <td className={mergeClasses(styles.td, styles.right, styles.strong, tx.balanceAfter > 0 ? styles.danger : styles.success)}>
                            {formatPKR(tx.balanceAfter)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {(from || to) && (
                    <tr>
                      <td className={mergeClasses(styles.td, styles.muted)} colSpan={5}>
                        Opening balance on {from || 'start'}
                      </td>
                      <td className={mergeClasses(styles.td, styles.right, styles.strong)}>{formatPKR(period.opening)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
