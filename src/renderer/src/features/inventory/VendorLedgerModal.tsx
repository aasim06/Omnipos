import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Subtitle2,
  Caption1,
  Body1,
  Badge,
} from '@fluentui/react-components';
import {
  Dismiss20Regular,
  MoneyHand20Regular,
  Print20Regular,
  Receipt20Regular,
  History20Regular,
  ArrowUp20Regular,
  ArrowDown20Regular,
  Checkmark20Regular,
} from '@fluentui/react-icons';
import { formatPKR } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { vendorStorage, Vendor, VendorTransaction } from './vendorStorage';
import { useAppToast } from '@/context/AppNotificationContext';

interface VendorLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  onVendorUpdated?: () => void;
}

export function VendorLedgerModal({ isOpen, onClose, vendor, onVendorUpdated }: VendorLedgerModalProps): React.JSX.Element {
  const { notifySuccess, notifyWarning } = useAppToast();

  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Transactions list
  const transactions = useMemo(() => {
    if (!vendor) return [];
    return vendorStorage.getTransactions(vendor.id);
  }, [vendor, refreshKey, isOpen]);

  // Current vendor state
  const currentVendor = useMemo(() => {
    if (!vendor) return null;
    const all = vendorStorage.getVendors();
    return all.find((v) => v.id === vendor.id) || vendor;
  }, [vendor, refreshKey, isOpen]);

  const handleRecordPayment = () => {
    if (!currentVendor) return;
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      notifyWarning('Please enter a valid payment amount');
      return;
    }

    const desc = paymentNote.trim() || `Payment via ${paymentMethod.toUpperCase()}`;
    vendorStorage.recordTransaction(
      currentVendor.id,
      'PAYMENT',
      amt,
      desc,
      paymentMethod
    );

    notifySuccess(`Recorded payment of ${formatPKR(amt)} to ${currentVendor.name}`);
    setPaymentAmount('');
    setPaymentNote('');
    setShowPaymentForm(false);
    setRefreshKey((k) => k + 1);
    if (onVendorUpdated) {
      onVendorUpdated();
    }
  };

  if (!currentVendor) return <></>;

  const currentBal = currentVendor.currentBalance ?? currentVendor.openingBalance ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface style={{ maxWidth: '850px', width: '95vw', padding: '24px', borderRadius: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E1DFDD', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History20Regular style={{ color: '#0078D4' }} />
              <DialogTitle style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                Vendor Account Ledger (Khata)
              </DialogTitle>
            </div>
            <Caption1 style={{ color: '#605E5C', marginTop: '4px', display: 'block' }}>
              Chronological ledger of Kharidari (Purchase Bills), Payments made, and real-time running balance.
            </Caption1>
          </div>
          <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={onClose} />
        </div>

        <DialogBody>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Vendor Profile Header Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              padding: '14px 16px',
              backgroundColor: '#F8F9FA',
              borderRadius: '10px',
              border: '1px solid #EDEBE9'
            }}>
              <div>
                <Caption1 style={{ color: '#8A8886', textTransform: 'uppercase', fontWeight: 600 }}>Vendor Name</Caption1>
                <Body1 style={{ fontWeight: 700, color: '#323130', display: 'block', fontSize: '15px' }}>{currentVendor.name}</Body1>
                {currentVendor.contactPerson && (
                  <Caption1 style={{ color: '#605E5C' }}>Rep: {currentVendor.contactPerson}</Caption1>
                )}
              </div>

              <div>
                <Caption1 style={{ color: '#8A8886', textTransform: 'uppercase', fontWeight: 600 }}>Contact & Type</Caption1>
                <Body1 style={{ color: '#323130', display: 'block' }}>{currentVendor.phone || 'No phone'}</Body1>
                <Badge appearance="tint" color="brand" style={{ marginTop: '2px' }}>{currentVendor.category || 'Supplier'}</Badge>
              </div>

              <div>
                <Caption1 style={{ color: '#8A8886', textTransform: 'uppercase', fontWeight: 600 }}>Total Bills Recorded</Caption1>
                <Body1 style={{ fontWeight: 700, color: '#323130', display: 'block', fontSize: '15px' }}>
                  {transactions.filter((t) => t.type === 'BILL').length}
                </Body1>
                <Caption1 style={{ color: '#605E5C' }}>
                  {transactions.filter((t) => t.type === 'PAYMENT').length} payments made
                </Caption1>
              </div>

              <div style={{
                backgroundColor: currentBal > 0 ? '#FDF3F4' : '#F1F9F4',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${currentBal > 0 ? '#F9D9DC' : '#CEEAD6'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Caption1 style={{ color: currentBal > 0 ? '#A4262C' : '#107C41', fontWeight: 700, textTransform: 'uppercase' }}>
                  {currentBal > 0 ? 'Payable Balance (Wajib-ul-Ada)' : 'Account Settled (Nill)'}
                </Caption1>
                <span style={{ fontSize: '18px', fontWeight: 800, color: currentBal > 0 ? '#D13438' : '#107C41' }}>
                  {formatPKR(currentBal)}
                </span>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Subtitle2 style={{ fontWeight: 700 }}>Transaction History</Subtitle2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  appearance={showPaymentForm ? 'secondary' : 'primary'}
                  icon={<MoneyHand20Regular />}
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                  style={{
                    backgroundColor: showPaymentForm ? undefined : '#107C41',
                    color: showPaymentForm ? undefined : '#FFFFFF',
                    borderRadius: '8px',
                    fontWeight: 600,
                  }}
                >
                  {showPaymentForm ? 'Hide Payment Form' : '+ Record Payment to Vendor'}
                </Button>
                <Button
                  appearance="subtle"
                  icon={<Print20Regular />}
                  onClick={() => window.print()}
                >
                  Print Statement
                </Button>
              </div>
            </div>

            {/* Inline Payment Form */}
            {showPaymentForm && (
              <div style={{
                backgroundColor: '#FAFCFA',
                border: '1px solid #107C41',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <Subtitle2 style={{ color: '#107C41', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MoneyHand20Regular /> Record Cash / Bank Payment to {currentVendor.name}
                </Subtitle2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '12px', alignItems: 'flex-end' }}>
                  <CustomInput
                    label="Payment Amount (PKR) *"
                    type="number"
                    placeholder="Enter amount..."
                    value={paymentAmount !== '' ? String(paymentAmount) : ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value) || '')}
                  />

                  <CustomSelect
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(val) => setPaymentMethod(val as any)}
                    options={[
                      { value: 'cash', label: 'Cash Payment' },
                      { value: 'bank', label: 'Bank Transfer / Raast' },
                      { value: 'cheque', label: 'Cheque' },
                    ]}
                  />

                  <CustomInput
                    label="Reference / Check # / Note"
                    placeholder="e.g. Paid in full for PB-2026..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />

                  <Button
                    appearance="primary"
                    icon={<Checkmark20Regular />}
                    onClick={handleRecordPayment}
                    style={{ backgroundColor: '#107C41', color: '#FFF', fontWeight: 700, height: '36px' }}
                  >
                    Save Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Ledger Transactions Table */}
            <div style={{
              maxHeight: '340px',
              overflowY: 'auto',
              border: '1px solid #EDEBE9',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F3F2F1', borderBottom: '1px solid #EDEBE9', textAlign: 'left', color: '#605E5C', fontWeight: 700 }}>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px' }}>Type</th>
                    <th style={{ padding: '10px 12px' }}>Details / Reference</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Bill Debit (+)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Payment Credit (-)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#8A8886' }}>
                        No transactions recorded yet for this vendor. Record a Purchase Bill or Payment above.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isBill = tx.type === 'BILL';
                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #F3F2F1', color: '#323130' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <Badge
                              appearance="tint"
                              color={isBill ? 'danger' : 'success'}
                              icon={isBill ? <ArrowUp20Regular /> : <ArrowDown20Regular />}
                            >
                              {isBill ? 'Purchase Bill' : 'Payment'}
                            </Badge>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontWeight: 600 }}>{tx.description}</span>
                            {tx.paymentMethod && (
                              <span style={{ color: '#8A8886', fontSize: '11px', marginLeft: '6px' }}>
                                ({tx.paymentMethod.toUpperCase()})
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: isBill ? '#D13438' : '#8A8886' }}>
                            {isBill ? formatPKR(tx.amount) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: !isBill ? '#107C41' : '#8A8886' }}>
                            {!isBill ? formatPKR(tx.amount) : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: tx.balanceAfter > 0 ? '#D13438' : '#107C41' }}>
                            {formatPKR(tx.balanceAfter)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </DialogContent>

          <DialogActions style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EDEBE9', paddingTop: '12px' }}>
            <Caption1 style={{ color: '#8A8886' }}>
              Tip: Pressing 'Print Statement' formats this ledger for standard thermal or A4 customer copy.
            </Caption1>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
