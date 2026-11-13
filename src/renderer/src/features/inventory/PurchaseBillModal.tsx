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
import { posApi, round3 } from '@/lib/api';
import { Product, PurchaseBill, PurchaseBillLine, StockMovement, ProductVariant } from '@shared/types';
import { uid, formatPKR, nowISO } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { CustomDateField } from '@/components/ui/CustomDateField';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { vendorStorage, Vendor } from './vendorStorage';
import { useAppToast } from '@/context/AppNotificationContext';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { detectCategoryProfile } from '@/lib/categoryProfiles';
import { printGrn } from '@/lib/grnPrint';

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
      borderTopColor: tokens.colorCompoundBrandStroke,
      borderBottomColor: tokens.colorCompoundBrandStroke,
      borderLeftColor: tokens.colorCompoundBrandStroke,
      borderRightColor: tokens.colorCompoundBrandStroke,
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
  const { can, businessProfiles = [] } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  const vendors = useMemo(() => vendorStorage.getVendors(), [isOpen]);

  // Form states
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [billNumber, setBillNumber] = useState('');
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
  // GST / tax on the supplier bill. A tax-registered business claims it back, so it stays out of
  // stock cost; otherwise it is part of what the goods cost.
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [taxClaimable, setTaxClaimable] = useState(false);
  // Freight / loading / other charges for this delivery: spread over the items as landed cost
  const [freightAmount, setFreightAmount] = useState<number>(0);
  const [printAfterSave, setPrintAfterSave] = useState(true);
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
    return Math.max(0, subtotal - (Number(discountAmount) || 0) + (Number(taxAmount) || 0) + (Number(freightAmount) || 0));
  }, [subtotal, discountAmount, taxAmount, freightAmount]);

  // Landed cost factor: what each rupee of item price really cost after discount, freight and
  // (non-claimable) tax, spread over the lines in proportion to their value
  const landedFactor = useMemo(() => {
    if (!(subtotal > 0)) return 1;
    const costed = grandTotal - (taxClaimable ? Number(taxAmount) || 0 : 0);
    return Math.max(0, costed / subtotal);
  }, [subtotal, grandTotal, taxAmount, taxClaimable]);

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
    const selVariant = (prod as any).selectedVariant as ProductVariant | undefined;
    const targetVariant = selVariant || (prod.variants && prod.variants.length > 0 ? prod.variants[0] : undefined);
    const cleanBaseName = prod.name.replace(/\s*\([^)]*\)$/, '');
    const finalName = targetVariant ? `${cleanBaseName} (${targetVariant.label})` : prod.name;
    const vPrice = targetVariant
      ? (targetVariant.price !== undefined ? targetVariant.price : (prod.price + (targetVariant.priceDelta || 0)))
      : (prod.price || 0);
    const vCost = targetVariant && targetVariant.costDelta !== undefined
      ? ((prod.costPrice || 0) + targetVariant.costDelta)
      : (prod.costPrice || 0);

    updateLine(idx, {
      productId: prod.id,
      productName: finalName,
      variantId: targetVariant?.id,
      variantLabel: targetVariant?.label,
      unitCost: vCost,
      retailPrice: vPrice,
      batchNumber: prod.batchNumber || '',
      expiryDate: prod.expiryDate || '',
    });
  };

  // Switch variant for an existing line
  const handleSwitchVariant = (idx: number, prod: Product, v: ProductVariant) => {
    const cleanBaseName = prod.name.replace(/\s*\([^)]*\)$/, '');
    const vPrice = v.price !== undefined ? v.price : (prod.price + (v.priceDelta || 0));
    const vCost = v.costDelta !== undefined ? ((prod.costPrice || 0) + v.costDelta) : (prod.costPrice || 0);
    updateLine(idx, {
      productName: `${cleanBaseName} (${v.label})`,
      variantId: v.id,
      variantLabel: v.label,
      retailPrice: vPrice,
      unitCost: vCost,
    });
  };

  // Quick-add another variant as a new line
  const handleAddVariantLine = (prod: Product, v: ProductVariant) => {
    const cleanBaseName = prod.name.replace(/\s*\([^)]*\)$/, '');
    const vPrice = v.price !== undefined ? v.price : (prod.price + (v.priceDelta || 0));
    const vCost = v.costDelta !== undefined ? ((prod.costPrice || 0) + v.costDelta) : (prod.costPrice || 0);
    setLines((prev) => [
      ...prev,
      {
        id: uid('pbl_'),
        productId: prod.id,
        productName: `${cleanBaseName} (${v.label})`,
        variantId: v.id,
        variantLabel: v.label,
        quantity: 1,
        unitCost: vCost,
        retailPrice: vPrice,
        batchNumber: prod.batchNumber || '',
        expiryDate: prod.expiryDate || '',
        totalCost: vCost,
      },
    ]);
  };

  /** Base units per entered unit for a line (1, or the carton/box conversion rate). */
  const lineConversionRate = (line: PurchaseBillLine, prod?: Product): number => {
    const rate = Number(prod?.conversionRate || 0);
    return line.unitMode === 'wholesale' && prod?.primaryUnit && rate > 1 ? rate : 1;
  };

  // Save Purchase Bill Handler
  const handleSaveBill = async () => {
    const activeVendorName = vendorName.trim() || (vendors.find((v) => v.id === selectedVendorId)?.name) || 'General Supplier';
    if (!billNumber.trim()) {
      notifyWarning('Please provide a Bill / Invoice Number');
      return;
    }
    if (vendorStorage.isBillNumberTaken(billNumber) || (await vendorStorage.isBillNumberTakenOnServer(billNumber))) {
      notifyWarning(`Bill #${billNumber.trim()} is already recorded. Use a different Bill / Invoice Number.`);
      return;
    }

    const validLines = lines.filter((l) => l.productName.trim() && l.quantity > 0);
    if (validLines.length === 0) {
      notifyWarning('Please enter at least one item with a valid name and quantity');
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const l of validLines) {
      if (!(Number(l.unitCost) > 0)) {
        notifyWarning(`Enter the purchase cost for "${l.productName}".`);
        return;
      }
      const prod = l.productId ? products.find((x) => x.id === l.productId) : undefined;
      const isMedicine =
        (prod?.module || 'minimart') !== 'fastfood' &&
        (businessProfiles.includes('pharmacy') || detectCategoryProfile(prod?.category || '') === 'pharmacy');
      if (isMedicine && (!l.batchNumber?.trim() || !l.expiryDate)) {
        notifyWarning(`Batch number and expiry date are required for "${l.productName}".`);
        return;
      }
      if (l.expiryDate && new Date(`${l.expiryDate}T00:00:00`).getTime() < today.getTime()) {
        notifyWarning(`"${l.productName}" batch has already expired. Expired stock should not be received.`);
        return;
      }
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

      // 1. Purchase bill record
      const purchaseBill: PurchaseBill = {
        id: uid('pb_'),
        billNumber: billNumber.trim(),
        vendorId: finalVendorId || undefined,
        vendorName: activeVendorName,
        billDate,
        lines: validLines,
        subtotal,
        discountAmount: Number(discountAmount) || 0,
        taxAmount: Number(taxAmount) || 0,
        freightAmount: Number(freightAmount) || 0,
        grandTotal,
        paidAmount: finalPaid,
        paymentMode,
        paymentStatus: status,
        notes: [notes?.trim(), Number(taxAmount) > 0 && taxClaimable ? 'Input tax claimable (kept out of stock cost)' : null]
          .filter(Boolean)
          .join(' • ') || undefined,
        createdAt: movementDate,
        updatedAt: movementDate,
      };

      // 2. Vendor ledger rows (ids fixed up-front so the atomic save and the local cache match)
      const ledgerRows: { id: string; type: 'BILL' | 'PAYMENT'; amount: number; description: string }[] = [];
      if (finalVendorId) {
        ledgerRows.push({
          id: uid('vtx_'),
          type: 'BILL',
          amount: grandTotal,
          description: `Purchase Bill #${purchaseBill.billNumber} (${validLines.length} items)`,
        });
        if (finalPaid > 0) {
          ledgerRows.push({ id: uid('vtx_'), type: 'PAYMENT', amount: finalPaid, description: `Payment for Bill #${purchaseBill.billNumber}` });
        }
      }

      // 3. Stock-in entries, in base units at landed (post-discount) cost
      const productMap = new Map<string, Product>();
      products.forEach((p) => productMap.set(p.id, { ...p }));
      // Discount, freight and non-claimable tax are spread across lines by value (landedFactor)

      const planned = validLines.map((line) => {
        const prod = line.productId ? productMap.get(line.productId) : undefined;
        const rate = lineConversionRate(line, prod);
        const bonus = Math.max(0, Number(line.bonusQty) || 0);
        const baseQty = round3((Number(line.quantity) + bonus) * rate);
        // Cost is entered per the line's unit for the paid quantity; spread over paid + bonus units
        const landedUnitCost =
          baseQty > 0 ? Math.round(((Number(line.unitCost || 0) * Number(line.quantity) * landedFactor) / baseQty) * 100) / 100 : 0;
        const movement: Omit<StockMovement, 'id'> & { id: string } = {
          id: uid('mov_'),
          module: prod?.module || (hasFastFood && !hasOmnimart ? 'fastfood' : 'minimart'),
          productId: line.productId || uid('prod_'),
          productName: line.productName,
          type: 'in',
          quantity: baseQty,
          unitCost: landedUnitCost,
          unitPrice: line.retailPrice,
          batchNumber: line.batchNumber || undefined,
          expiryDate: line.expiryDate || undefined,
          reason: activeVendorName || 'Supplier Purchase',
          referenceInvoice: billNumber.trim(),
          vendorName: activeVendorName,
          note:
            [
              rate > 1 && prod?.primaryUnit
                ? `Received: ${Number(line.quantity) + bonus} ${prod.primaryUnit} × ${rate} = ${baseQty} ${prod.secondaryUnit || prod.unit || 'PCS'}`
                : null,
              bonus > 0 ? `Bonus: +${bonus} free (paid ${line.quantity})` : null,
            ]
              .filter(Boolean)
              .join(' • ') || undefined,
          variantAllocations: line.variantLabel ? { [line.variantLabel]: baseQty } : undefined,
          date: movementDate,
        };
        return { line, prod, baseQty, landedUnitCost, movement };
      });

      const vendorForServer = finalVendorId ? vendorStorage.findVendor({ id: finalVendorId }) : undefined;
      const remote = await posApi.receivePurchaseBill({
        bill: purchaseBill,
        vendor: vendorForServer,
        movements: planned.map((p) => p.movement),
        vendorTransactions: ledgerRows.map((r) => ({
          ...r,
          vendorId: finalVendorId,
          billId: purchaseBill.id,
          paymentMethod: paymentMode,
          date: movementDate,
        })),
        productUpdates: planned
          .filter((p) => p.prod && p.line.retailPrice && p.line.retailPrice > 0 && !p.line.variantLabel)
          .map((p) => ({ id: p.prod!.id, price: p.line.retailPrice })),
      });
      if (remote && !remote.ok) {
        if (remote.status === 409) {
          notifyWarning(`Bill #${billNumber.trim()} is already recorded. Use a different Bill / Invoice Number.`);
          return;
        }
        throw new Error(remote.error || 'The backend could not record this purchase bill.');
      }
      const savedOnServer = !!remote;

      // 4. Mirror into the local cache (re-posts are no-ops on the backend: same ids)
      vendorStorage.savePurchaseBill(purchaseBill);
      for (const r of ledgerRows) {
        vendorStorage.recordTransaction(finalVendorId, r.type, r.amount, r.description, paymentMode, purchaseBill.id, { id: r.id });
      }

      for (const { line, prod, baseQty, landedUnitCost, movement } of planned) {
        // Size stock for the local copy (the backend applies the size split itself)
        let updatedVariants: ProductVariant[] | undefined = undefined;
        if (prod?.variants && prod.variants.length > 0) {
          updatedVariants = prod.variants.map((v) => {
            const isTarget =
              (line.variantId && v.id === line.variantId) ||
              (line.variantLabel && v.label.toLowerCase() === line.variantLabel.toLowerCase());
            return isTarget ? { ...v, stock: Math.max(0, (Number(v.stock) || 0) + baseQty) } : v;
          });
        }
        await posApi.saveStockMovement({ ...movement, variants: updatedVariants } as any);

        if (prod) {
          const currentProdStock = Number(prod.openingStock) || 0;
          const updatedProd: Product = {
            ...prod,
            openingStock: round3(currentProdStock + baseQty),
            // Weighted average of existing stock and this receipt at landed (post-discount) cost
            costPrice:
              landedUnitCost > 0
                ? currentProdStock > 0 && Number(prod.costPrice) > 0
                  ? Math.round(((currentProdStock * Number(prod.costPrice) + baseQty * landedUnitCost) / (currentProdStock + baseQty)) * 100) / 100
                  : landedUnitCost
                : prod.costPrice,
            price: line.retailPrice && line.retailPrice > 0 && !line.variantLabel ? line.retailPrice : prod.price,
            batchNumber: line.batchNumber || prod.batchNumber,
            expiryDate: line.expiryDate || prod.expiryDate,
            variants: updatedVariants || prod.variants,
          };
          productMap.set(prod.id, updatedProd);
          if (savedOnServer) {
            // Stock, cost and price are already correct on the backend; only refresh the local copy
            await posApi.patchLocalProduct(prod.id, {
              price: updatedProd.price,
              batchNumber: updatedProd.batchNumber,
              expiryDate: updatedProd.expiryDate,
            });
          } else {
            // Offline: queue the whole product so the backend catches up later
            await posApi.saveProduct(updatedProd);
          }
        }
      }

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-report'] }),
      ]);

      if (paymentMode === 'cash' && finalPaid > 0) {
        try {
          const drawer = posApi.fetchCashDrawer();
          if (drawer?.status !== 'closed') {
            drawer.cashOut = Number(drawer.cashOut || 0) + Math.min(finalPaid, grandTotal || finalPaid);
            localStorage.setItem('omnipos_cash_drawer', JSON.stringify(drawer));
          }
        } catch {}
      }
      notifySuccess(`Delivery #${billNumber} received. Stock and supplier balance updated.`);
      if (printAfterSave && !printGrn(purchaseBill)) notifyWarning('Allow pop-ups to print the GRN.');
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
                backgroundColor: tokens.colorStatusDangerBackground1,
                color: tokens.colorBrandForeground1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt20Regular />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 600 }}>Receive delivery (GRN)</div>
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                All items on one supplier invoice: stock, batches, bonus, new sale prices and the supplier balance in one save
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

              <CustomDateField label="Bill Date" value={billDate} onChange={setBillDate} max={new Date().toISOString().slice(0, 10)} />

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
                <Subtitle2 style={{ fontWeight: 600 }}>Bill Items ({lines.length})</Subtitle2>
                <Button
                  size="small"
                  appearance="primary"
                  icon={<Add20Regular />}
                  onClick={handleAddLine}
                  style={{ backgroundColor: tokens.colorBrandBackground, color: '#fff' }}
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
                      <th className={styles.th} style={{ textAlign: 'center', width: '60px' }} title="Free units from the supplier (e.g. 10 + 1)">Bonus</th>
                      <th className={styles.th} style={{ textAlign: 'right', width: '100px' }}>Purchase Cost</th>
                      <th className={styles.th} style={{ textAlign: 'right', width: '100px' }}>Retail Price</th>
                      <th className={styles.th} style={{ textAlign: 'center', width: '95px' }}>Batch No</th>
                      <th className={styles.th} style={{ textAlign: 'center', width: '120px' }}>Expiry Date</th>
                      <th className={styles.th} style={{ textAlign: 'right', width: '100px', paddingRight: '8px' }}>Total (PKR)</th>
                      <th className={styles.th} style={{ textAlign: 'center', width: '68px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => {
                      const linkedProduct = line.productId ? products.find((p) => p.id === line.productId) : undefined;
                      const hasVariants = linkedProduct?.variants && linkedProduct.variants.length > 0;

                      return (
                      <tr key={line.id} className={styles.tableRow}>
                        {/* Item Name / Autocomplete */}
                        <td style={{ padding: '6px 8px', verticalAlign: 'middle' }}>
                          <ProductAutocomplete
                            placeholder="Select product or type..."
                            value={line.productName}
                            onChange={(val) => updateLine(idx, { productName: val })}
                            onSelectProduct={(p) => handleSelectProduct(idx, p)}
                          />
                          {hasVariants && linkedProduct && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px', flexWrap: 'nowrap' }}>
                              <span style={{ fontSize: '9px', color: tokens.colorNeutralForeground2, fontWeight: 600, marginRight: '2px' }}>Size:</span>
                              {linkedProduct.variants!.map((v) => {
                                const isSelected = line.variantId
                                  ? line.variantId === v.id
                                  : (line.variantLabel === v.label || line.productName.includes(`(${v.label})`));
                                const vPrice = v.price !== undefined ? v.price : (linkedProduct.price + (v.priceDelta || 0));
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => handleSwitchVariant(idx, linkedProduct, v)}
                                    style={{
                                      padding: '1px 5px',
                                      fontSize: '10px',
                                      fontWeight: isSelected ? 600 : 400,
                                      borderRadius: '3px',
                                      border: `1px solid ${isSelected ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1}`,
                                      backgroundColor: isSelected ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground2,
                                      color: isSelected ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground1,
                                      cursor: 'pointer',
                                      lineHeight: '1.2',
                                    }}
                                    title={`Set to ${v.label} (Rs. ${vPrice.toLocaleString()})`}
                                  >
                                    {v.label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        {/* Qty */}
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.quantity}
                            onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                            className={styles.tableInput}
                            style={{ textAlign: 'center' }}
                          />
                          {(() => {
                            const prod = line.productId ? products.find((x) => x.id === line.productId) : undefined;
                            const rate = Number(prod?.conversionRate || 0);
                            if (!prod?.primaryUnit || rate <= 1 || line.variantLabel) return null;
                            const base = prod.secondaryUnit || prod.unit || 'PCS';
                            return (
                              <select
                                aria-label="Quantity unit"
                                value={line.unitMode || 'base'}
                                onChange={(e) => updateLine(idx, { unitMode: e.target.value as 'base' | 'wholesale' })}
                                className={styles.tableInput}
                                style={{ marginTop: 4, fontSize: 11, padding: '2px 4px' }}
                                title={`1 ${prod.primaryUnit} = ${rate} ${base}`}
                              >
                                <option value="base">{base}</option>
                                <option value="wholesale">{prod.primaryUnit} (×{rate})</option>
                              </select>
                            );
                          })()}
                        </td>

                        {/* Bonus / free qty */}
                        <td style={{ padding: '6px 6px', verticalAlign: 'middle' }}>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.bonusQty || ''}
                            placeholder="0"
                            onChange={(e) => updateLine(idx, { bonusQty: Number(e.target.value) || 0 })}
                            className={styles.tableInput}
                            style={{ textAlign: 'center' }}
                            aria-label="Bonus quantity"
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
                          {(() => {
                            const prod = line.productId ? products.find((x) => x.id === line.productId) : undefined;
                            const rate = lineConversionRate(line, prod);
                            const units = (Number(line.quantity) + (Number(line.bonusQty) || 0)) * rate;
                            const factor = landedFactor;
                            const cost = units > 0 ? (Number(line.unitCost) * Number(line.quantity) * factor) / units : 0;
                            const sale = Number(line.retailPrice) || 0;
                            if (!(cost > 0) || !(sale > 0)) return null;
                            const margin = Math.round(((sale - cost) / sale) * 1000) / 10;
                            return (
                              <div
                                style={{
                                  fontSize: 10.5,
                                  marginTop: 3,
                                  textAlign: 'right',
                                  color: margin <= 0 ? tokens.colorPaletteRedForeground1 : tokens.colorNeutralForeground3,
                                }}
                                title={`Cost per unit after discount and bonus: Rs. ${Math.round(cost * 100) / 100}`}
                              >
                                {margin <= 0 ? 'No margin' : `Margin ${margin}%`}
                              </div>
                            );
                          })()}
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
                          <CustomDateField
                            value={line.expiryDate || ''}
                            onChange={(v) => updateLine(idx, { expiryDate: v })}
                            min={new Date().toISOString().slice(0, 10)}
                            aria-label={`Expiry date for ${line.productName || 'item'}`}
                          />
                        </td>

                        {/* Line Total */}
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, fontSize: '13px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          PKR {line.totalCost.toLocaleString()}
                        </td>

                        {/* Remove & Add Size */}
                        <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                            {hasVariants && linkedProduct && (
                              <button
                                type="button"
                                onClick={() => {
                                  const unselectedVariant = linkedProduct.variants!.find(
                                    (v) =>
                                      !lines.some(
                                        (l) =>
                                          l.productId === linkedProduct.id &&
                                          (l.variantId === v.id ||
                                            l.variantLabel === v.label ||
                                            l.productName.includes(`(${v.label})`))
                                      )
                                  );
                                  handleAddVariantLine(linkedProduct, unselectedVariant || linkedProduct.variants![0]);
                                }}
                                title="Add another size of this item as a new line in bill"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '6px',
                                  border: 'none',
                                  background: tokens.colorStatusDangerBackground1,
                                  color: tokens.colorBrandForeground1,
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                }}
                              >
                                <Add20Regular style={{ width: 15, height: 15 }} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              disabled={lines.length === 1}
                              title={lines.length === 1 ? 'At least one item line is required' : 'Remove item line'}
                              style={{
                                width: '28px',
                                height: '28px',
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
                              <Delete20Regular style={{ width: 17, height: 17 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Bill Summary & Payment Allocation ── */}
            <div className={styles.summaryBox}>
              {/* Payment Mode Selector */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: tokens.colorNeutralForeground2, marginBottom: '8px' }}>
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
                        border: `1.5px solid ${paymentMode === mode ? tokens.colorBrandStroke1 : tokens.colorNeutralStroke1}`,
                        backgroundColor: paymentMode === mode ? tokens.colorBrandBackground2 : tokens.colorNeutralBackground1,
                        color: paymentMode === mode ? tokens.colorBrandForeground1 : tokens.colorNeutralForeground1,
                        fontWeight: 600,
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
                  <CustomInput
                    label="GST / Tax (PKR)"
                    type="number"
                    min="0"
                    value={taxAmount || ''}
                    onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <CustomInput
                    label="Freight / Other Charges (PKR)"
                    type="number"
                    min="0"
                    value={freightAmount || ''}
                    onChange={(e) => setFreightAmount(Number(e.target.value) || 0)}
                    placeholder="0"
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: tokens.colorNeutralForeground2 }}>
                    <input type="checkbox" checked={taxClaimable} onChange={(e) => setTaxClaimable(e.target.checked)} />
                    Tax is claimable (GST-registered: keep it out of stock cost)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: tokens.colorNeutralForeground2 }}>
                    <input type="checkbox" checked={printAfterSave} onChange={(e) => setPrintAfterSave(e.target.checked)} />
                    Print GRN after saving
                  </label>
                </div>
              </div>

              {/* Totals Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: tokens.colorNeutralForeground2 }}>Items Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>PKR {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: tokens.colorStatusSuccessForeground1 }}>
                    <span>Supplier Discount:</span>
                    <span style={{ fontWeight: 600 }}>- PKR {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: tokens.colorNeutralForeground2 }}>GST / Tax{taxClaimable ? ' (claimable)' : ''}:</span>
                    <span style={{ fontWeight: 600 }}>+ PKR {taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {freightAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: tokens.colorNeutralForeground2 }}>Freight / Other:</span>
                    <span style={{ fontWeight: 600 }}>+ PKR {freightAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 600, borderTop: `1px dashed ${tokens.colorNeutralStroke1}`, paddingTop: '6px' }}>
                  <span>NET BILL TOTAL:</span>
                  <span style={{ color: tokens.colorBrandForeground1 }}>PKR {grandTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: tokens.colorNeutralForeground2 }}>Amount Paid:</span>
                  <span style={{ fontWeight: 600, color: tokens.colorStatusSuccessForeground1 }}>PKR {(Number(paidAmount) || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                  <span style={{ color: balancePayable > 0 ? tokens.colorPaletteRedForeground1 : tokens.colorNeutralForeground3 }}>Balance Payable (Udhaar):</span>
                  <span style={{ color: balancePayable > 0 ? tokens.colorPaletteRedForeground1 : tokens.colorPaletteGreenForeground1 }}>PKR {balancePayable.toLocaleString()}</span>
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
            style={{ backgroundColor: tokens.colorBrandBackground, color: '#FFFFFF', fontWeight: 600 }}
          >
            {isSubmitting ? 'Saving delivery…' : 'Confirm & receive delivery'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
}
