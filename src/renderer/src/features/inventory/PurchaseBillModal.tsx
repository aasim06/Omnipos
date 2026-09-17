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
  makeStyles,
  tokens,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Add20Regular,
  Delete20Regular,
  Dismiss20Regular,
  Checkmark20Regular,
  Receipt20Regular,
  BuildingRetail24Regular,
  Print20Regular,
  Calendar20Regular,
} from '@fluentui/react-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Product, PurchaseBill, PurchaseBillLine, StockMovement, ProductVariant } from '@shared/types';
import { uid, formatPKR, nowISO } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { vendorStorage, Vendor } from './vendorStorage';
import { useAppToast } from '@/context/AppNotificationContext';
import { useLicense } from '@/features/auth/LicenseModulesContext';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '1020px',
    width: '95vw',
    maxHeight: '92vh',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'hidden',
    overflowX: 'hidden',
    paddingTop: '20px',
    paddingBottom: '16px',
    paddingLeft: '32px',
    paddingRight: '32px',
    boxSizing: 'border-box',
  },
  dialogTitle: {
    flexShrink: 0,
    marginBottom: '8px',
  },
  dialogBody: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    marginTop: '6px',
    marginBottom: '10px',
    paddingRight: '16px',
    paddingLeft: '4px',
    paddingBottom: '10px',
    boxSizing: 'border-box',
  },
  dialogActions: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    paddingTop: '14px',
    paddingBottom: '4px',
    paddingLeft: '4px',
    paddingRight: '4px',
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
  },
  metaBox: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr',
    gap: '12px',
    alignItems: 'start',
    padding: '14px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
  },
  tableWrapper: {
    overflow: 'visible',
    borderRadius: '8px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
  },
  tableHead: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  th: {
    paddingTop: '10px',
    paddingBottom: '10px',
    paddingLeft: '8px',
    paddingRight: '8px',
    color: tokens.colorNeutralForeground2,
    fontWeight: 600,
    fontSize: '11.5px',
    verticalAlign: 'middle',
  },
  tableRow: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke3,
  },
  tableInput: {
    width: '100%',
    height: '38px',
    paddingTop: '6px',
    paddingBottom: '6px',
    paddingLeft: '10px',
    paddingRight: '10px',
    borderRadius: '6px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontSize: '13px',
    fontWeight: 500,
    boxSizing: 'border-box',
    outlineStyle: 'none',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
    ':focus': {
      borderTopColor: '#E51937',
      borderBottomColor: '#E51937',
      borderLeftColor: '#E51937',
      borderRightColor: '#E51937',
      boxShadow: '0 0 0 2px rgba(229, 25, 55, 0.15)',
    },
  },
  summaryBox: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '16px',
    padding: '14px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
    borderLeftWidth: '1px',
    borderRightWidth: '1px',
    borderTopStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderRightStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2,
    borderBottomColor: tokens.colorNeutralStroke2,
    borderLeftColor: tokens.colorNeutralStroke2,
    borderRightColor: tokens.colorNeutralStroke2,
    alignItems: 'center',
  },
});

interface PurchaseBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialVendorId?: string;
}

export function PurchaseBillModal({ isOpen, onClose, onSuccess, initialVendorId }: PurchaseBillModalProps): React.JSX.Element | null {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyError, notifyWarning } = useAppToast();
  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  const vendors = useMemo(() => vendorStorage.getVendors(), [isOpen]);

  // Form states
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [billNumber, setBillNumber] = useState(() => `PB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [billDate, setBillDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialVendorId) {
        const found = vendors.find((v) => v.id === initialVendorId);
        if (found) {
          setSelectedVendorId(found.id);
          setVendorName(found.name);
          return;
        }
      }
    }
  }, [isOpen, initialVendorId, vendors]);

  // Lines
  const [lines, setLines] = useState<PurchaseBillLine[]>([
    {
      id: uid('pbl_'),
      productName: '',
      quantity: 1,
      unitCost: 0,
      retailPrice: 0,
      batchNumber: '',
      expiryDate: '',
      totalCost: 0,
    },
  ]);

  // Payment states
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'khata' | 'split'>('cash');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products for autocomplete
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  // Calculate totals
  const subtotal = useMemo(() => {
    return lines.reduce((sum, line) => sum + (Number(line.unitCost) || 0) * (Number(line.quantity) || 0), 0);
  }, [lines]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - (Number(discountAmount) || 0));
  }, [subtotal, discountAmount]);

  const balancePayable = useMemo(() => {
    const paid = typeof paidAmount === 'number' ? paidAmount : 0;
    return Math.max(0, grandTotal - paid);
  }, [grandTotal, paidAmount]);

  // Auto-set paid amount when payment mode changes
  const handlePaymentModeChange = (mode: 'cash' | 'bank' | 'khata' | 'split') => {
    setPaymentMode(mode);
    if (mode === 'cash' || mode === 'bank') {
      setPaidAmount(grandTotal);
    } else if (mode === 'khata') {
      setPaidAmount(0);
    }
  };

  // Update line field
  const updateLine = (idx: number, patch: Partial<PurchaseBillLine>) => {
    setLines((prev) => {
      const copy = [...prev];
      const target = { ...copy[idx], ...patch };
      const q = Number(target.quantity) || 0;
      const c = Number(target.unitCost) || 0;
      target.totalCost = q * c;
      copy[idx] = target;
      return copy;
    });
  };

  // Add new empty line
  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: uid('pbl_'),
        productName: '',
        quantity: 1,
        unitCost: 0,
        retailPrice: 0,
        batchNumber: '',
        expiryDate: '',
        totalCost: 0,
      },
    ]);
  };

  // Remove line
  const handleRemoveLine = (idx: number) => {
    if (lines.length === 1) return;
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  // Select Product for a line
  const handleSelectProduct = (idx: number, prod: Product) => {
    updateLine(idx, {
      productId: prod.id,
      productName: prod.name,
      unitCost: prod.costPrice || 0,
      retailPrice: prod.price || 0,
      batchNumber: prod.batchNumber || '',
      expiryDate: prod.expiryDate || '',
    });
  };

  // Save Purchase Bill Handler
  const handleSaveBill = async () => {
    const activeVendorName = vendorName.trim() || (vendors.find((v) => v.id === selectedVendorId)?.name) || 'General Supplier';
    if (!billNumber.trim()) {
      notifyWarning('Please provide a Bill / Invoice Number');
      return;
    }

    const validLines = lines.filter((l) => l.productName.trim() && l.quantity > 0);
    if (validLines.length === 0) {
      notifyWarning('Please enter at least one item with a valid name and quantity');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPaid = typeof paidAmount === 'number' ? paidAmount : 0;
      const status: 'paid' | 'partial' | 'unpaid' =
        finalPaid >= grandTotal ? 'paid' : finalPaid > 0 ? 'partial' : 'unpaid';

      // Auto-resolve or register vendor if typed manually
      let finalVendorId = selectedVendorId;
      if (!finalVendorId && vendorName.trim()) {
        const existing = vendors.find(
          (v) => v.name.trim().toLowerCase() === vendorName.trim().toLowerCase()
        );
        if (existing) {
          finalVendorId = existing.id;
        } else {
          const createdVendor = vendorStorage.saveVendor({
            name: vendorName.trim(),
            companyName: vendorName.trim(),
            currentBalance: 0,
            openingBalance: 0,
          });
          finalVendorId = createdVendor.id;
        }
      }

      // Calculate accurate transaction date-time (preserve current time of day instead of UTC midnight)
      const now = new Date();
      let movementDate = now.toISOString();
      if (billDate) {
        const [y, m, d] = billDate.split('-').map(Number);
        if (y && m && d) {
          const isToday =
            now.getFullYear() === y &&
            now.getMonth() + 1 === m &&
            now.getDate() === d;
          if (isToday) {
            movementDate = now.toISOString();
          } else {
            movementDate = new Date(
              y,
              m - 1,
              d,
              now.getHours(),
              now.getMinutes(),
              now.getSeconds()
            ).toISOString();
          }
        }
      }

      // 1. Create Purchase Bill record
      const purchaseBill: PurchaseBill = {
        id: uid('pb_'),
        billNumber: billNumber.trim(),
        vendorId: finalVendorId || undefined,
        vendorName: activeVendorName,
        billDate,
        lines: validLines,
        subtotal,
        discountAmount: Number(discountAmount) || 0,
        grandTotal,
        paidAmount: finalPaid,
        paymentMode,
        paymentStatus: status,
        notes,
        createdAt: movementDate,
        updatedAt: movementDate,
      };

      vendorStorage.savePurchaseBill(purchaseBill);

      // 2. Record Vendor Ledger entry if vendor selected
      if (finalVendorId) {
        // Record total bill on vendor credit
        vendorStorage.recordTransaction(
          finalVendorId,
          'BILL',
          grandTotal,
          `Purchase Bill #${purchaseBill.billNumber} (${validLines.length} items)`,
          paymentMode,
          purchaseBill.id
        );

        // Record payment debit if any paid
        if (finalPaid > 0) {
          vendorStorage.recordTransaction(
            finalVendorId,
            'PAYMENT',
            finalPaid,
            `Payment for Bill #${purchaseBill.billNumber}`,
            paymentMode,
            purchaseBill.id
          );
        }
      }

      // 3. For each line: add StockMovement (type: 'in') & update product stock/costPrice
      for (const line of validLines) {
        const movement: Omit<StockMovement, 'id'> = {
          module: 'minimart',
          productId: line.productId || uid('prod_'),
          productName: line.productName,
          type: 'in',
          quantity: line.quantity,
          unitCost: line.unitCost,
          unitPrice: line.retailPrice,
          batchNumber: line.batchNumber || undefined,
          expiryDate: line.expiryDate || undefined,
          reason: activeVendorName || 'Supplier Purchase',
          referenceInvoice: billNumber.trim(),
          vendorName: activeVendorName,
          date: movementDate,
        };
        await posApi.saveStockMovement(movement as any);

        // Update product metadata (cost price, selling price, batch, expiry) if product exists
        if (line.productId) {
          const existingProd = products.find((p) => p.id === line.productId);
          if (existingProd) {
            await posApi.saveProduct({
              ...existingProd,
              costPrice: line.unitCost > 0 ? line.unitCost : existingProd.costPrice,
              price: line.retailPrice && line.retailPrice > 0 ? line.retailPrice : existingProd.price,
              batchNumber: line.batchNumber || existingProd.batchNumber,
              expiryDate: line.expiryDate || existingProd.expiryDate,
            });
          }
        }
      }

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-report'] }),
      ]);

      notifySuccess(`Purchase Bill #${billNumber} recorded successfully! Stock and Vendor ledger updated.`);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      notifyError(err?.message || 'Failed to record purchase bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface} style={{ overflowY: 'hidden', overflowX: 'hidden' }}>
        <DialogTitle
          className={styles.dialogTitle}
          action={
            <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={onClose} />
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(229, 25, 55, 0.12)',
                color: '#E51937',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt20Regular />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800 }}>New Purchase Bill (Kharidari Invoice)</div>
              <Caption1 style={{ color: '#64748B' }}>
                Multi-item supplier receiving invoice, batch tracking &amp; vendor ledger
              </Caption1>
            </div>
          </div>
        </DialogTitle>

        <DialogBody className={styles.dialogBody}>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '0 4px', boxSizing: 'border-box', width: '100%' }}>
            {/* ── Vendor & Bill Metadata Bar ── */}
            <div className={styles.metaBox}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <CustomSelect
                  label="Select Supplier / Vendor"
                  value={selectedVendorId}
                  onChange={(val) => {
                    setSelectedVendorId(val);
                    const found = vendors.find((v) => v.id === val);
                    if (found) setVendorName(found.name);
                  }}
                  options={[
                    { value: '', label: '-- Or type new vendor name --' },
                    ...vendors.map((v) => ({
                      value: v.id,
                      label: `${v.name} (Payable: PKR ${(v.currentBalance || 0).toLocaleString()})`,
                    })),
                  ]}
                />
                {!selectedVendorId && (
                  <CustomInput
                    placeholder="Enter supplier / company name..."
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                  />
                )}
              </div>

              <CustomInput
                label="Supplier Bill / Inv #"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. INV-9842"
              />

              <CustomInput
                label="Bill Date"
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
              />

              <CustomInput
                label="Notes / Terms"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 15 days credit"
              />
            </div>

            {/* ── Multi-Item Table ── */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <Subtitle2 style={{ fontWeight: 700 }}>Bill Items ({lines.length})</Subtitle2>
                <Button
                  size="small"
                  appearance="primary"
                  icon={<Add20Regular />}
                  onClick={handleAddLine}
                  style={{ backgroundColor: '#E51937', color: '#fff' }}
                >
                  + Add Item Line
                </Button>
              </div>

              <div className={styles.tableWrapper}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th className={styles.th} style={{ textAlign: 'left', minWidth: '210px', paddingLeft: '10px' }}>Item Name</th>
                      <th className={styles.th} style={{ textAlign: 'center', width: '65px' }}>Qty</th>
                      <th className={styles.th} style={{ textAlign: 'right', width: '100px' }}>Purchase Cost</th>
                      <th className={styles.th} style={{ textAlign: 'right', width: '100px' }}>Retail Price</th>
                      <th className={styles.th} style={{ textAlign: 'center', width: '95px' }}>Batch No</th>
                      <th className={styles.th} style={{ textAlign: 'center', width: '120px' }}>Expiry Date</th>
                      <th className={styles.th} style={{ textAlign: 'right', width: '100px', paddingRight: '8px' }}>Total (PKR)</th>
                      <th className={styles.th} style={{ textAlign: 'center', width: '42px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={line.id} className={styles.tableRow}>
                        {/* Item Name / Autocomplete */}
                        <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                          <ProductAutocomplete
                            placeholder="Select product or type..."
                            value={line.productName}
                            onChange={(val) => updateLine(idx, { productName: val })}
                            onSelectProduct={(p) => handleSelectProduct(idx, p)}
                          />
                        </td>

                        {/* Qty */}
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                            className={styles.tableInput}
                            style={{ textAlign: 'center' }}
                          />
                        </td>

                        {/* Purchase Cost */}
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <input
                            type="number"
                            min="0"
                            value={line.unitCost}
                            onChange={(e) => updateLine(idx, { unitCost: Number(e.target.value) })}
                            className={styles.tableInput}
                            style={{ textAlign: 'right' }}
                          />
                        </td>

                        {/* Retail Price */}
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <input
                            type="number"
                            min="0"
                            value={line.retailPrice || ''}
                            onChange={(e) => updateLine(idx, { retailPrice: Number(e.target.value) })}
                            placeholder="Selling..."
                            className={styles.tableInput}
                            style={{ textAlign: 'right' }}
                          />
                        </td>

                        {/* Batch No */}
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <input
                            type="text"
                            value={line.batchNumber || ''}
                            onChange={(e) => updateLine(idx, { batchNumber: e.target.value })}
                            placeholder="Batch #..."
                            className={styles.tableInput}
                            style={{ textAlign: 'center' }}
                          />
                        </td>

                        {/* Expiry Date */}
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <input
                            type="date"
                            value={line.expiryDate || ''}
                            onChange={(e) => updateLine(idx, { expiryDate: e.target.value })}
                            className={styles.tableInput}
                            style={{ fontSize: '12px' }}
                          />
                        </td>

                        {/* Line Total */}
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, fontSize: '13px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          PKR {line.totalCost.toLocaleString()}
                        </td>

                        {/* Remove */}
                        <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={lines.length === 1}
                            title={lines.length === 1 ? 'At least one item line is required' : 'Remove item line'}
                            style={{
                              width: '32px',
                              height: '32px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px',
                              border: 'none',
                              background: 'transparent',
                              cursor: lines.length === 1 ? 'not-allowed' : 'pointer',
                              color: lines.length === 1 ? '#CBD5E1' : '#EF4444',
                              transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (lines.length > 1) e.currentTarget.style.backgroundColor = '#FEE2E2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Delete20Regular style={{ width: 18, height: 18 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Bill Summary & Payment Allocation ── */}
            <div className={styles.summaryBox}>
              {/* Payment Mode Selector */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Supplier Payment Mode
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
                  {(['cash', 'bank', 'khata', 'split'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handlePaymentModeChange(mode)}
                      style={{
                        height: '34px',
                        borderRadius: '6px',
                        border: `1.5px solid ${paymentMode === mode ? '#E51937' : '#CBD5E1'}`,
                        backgroundColor: paymentMode === mode ? 'rgba(229,25,55,0.1)' : '#FFFFFF',
                        color: paymentMode === mode ? '#E51937' : '#334155',
                        fontWeight: 700,
                        fontSize: '11.5px',
                        textTransform: 'capitalize',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {mode === 'khata' ? 'Udhaar / Khata' : mode}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <CustomInput
                    label="Paid Amount (PKR)"
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Amount paid now..."
                  />
                  <CustomInput
                    label="Bill Discount (PKR)"
                    type="number"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Totals Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#64748B' }}>Items Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>PKR {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#10B981' }}>
                    <span>Supplier Discount:</span>
                    <span style={{ fontWeight: 700 }}>- PKR {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, borderTop: '1px dashed #CBD5E1', paddingTop: '6px' }}>
                  <span>NET BILL TOTAL:</span>
                  <span style={{ color: '#E51937' }}>PKR {grandTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#64748B' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>PKR {(Number(paidAmount) || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                  <span style={{ color: balancePayable > 0 ? '#EF4444' : '#64748B' }}>Balance Payable (Udhaar):</span>
                  <span style={{ color: balancePayable > 0 ? '#EF4444' : '#10B981' }}>PKR {balancePayable.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </DialogBody>

        <DialogActions className={styles.dialogActions}>
          <Button appearance="subtle" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<Checkmark20Regular />}
            onClick={handleSaveBill}
            disabled={isSubmitting}
            style={{ backgroundColor: '#E51937', color: '#FFFFFF', fontWeight: 700 }}
          >
            {isSubmitting ? 'Saving Bill & Stock...' : 'Confirm & Save Purchase Bill'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}
