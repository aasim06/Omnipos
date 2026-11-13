import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Caption1,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Delete20Regular, Dismiss20Regular } from '@fluentui/react-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { posApi, round3 } from '@/lib/api';
import { ModuleKey, Product } from '@shared/types';
import { formatPKR, uid } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { useAppToast, useConfirmDialog } from '@/context/AppNotificationContext';
import { printDebitNote } from '@/lib/debitNotePrint';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { vendorStorage } from './vendorStorage';
import {
  PRODUCT_RECALL,
  RETURN_TO_VENDOR,
  RETURN_SUB_REASONS,
  defaultReasonFor,
  reasonBusinessFor,
  reasonInfo,
  reasonOptions,
  valueLabelFor,
} from './stockOutReasons';

type Batch = { id: string; batchNumber: string | null; expiryDate: string | null; remaining: number };

interface OutLine {
  key: string;
  productId: string;
  name: string;
  stock: number | null;
  unit?: string;
  quantity: number | '';
  unitCost: number | '';
  batches: Batch[];
  batchNumber: string;
}

const useStyles = makeStyles({
  surface: { maxWidth: '980px', width: '96vw' },
  intro: { color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '12px' },
  top: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' },
  tableWrap: { maxHeight: '40vh', overflowY: 'auto', marginTop: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: {
    textAlign: 'left',
    padding: '8px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    position: 'sticky',
    top: 0,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  td: { padding: '4px 8px', borderBottom: `1px solid ${tokens.colorNeutralStroke3}`, verticalAlign: 'middle' },
  num: { textAlign: 'right' },
  small: { maxWidth: '110px' },
  batchSel: { fontSize: '12px', padding: '4px', borderRadius: '4px', border: `1px solid ${tokens.colorNeutralStroke1}`, maxWidth: '210px' },
  empty: { padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
  totals: { display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '12px', alignItems: 'baseline' },
  grand: { fontSize: '18px', fontWeight: 700 },
});

export interface BulkStockOutPreset {
  reason: string;
  note?: string;
  lines: { productId: string; batchNumber?: string | null; quantity: number }[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Open with a reason and lines already filled (e.g. write off every expired batch) */
  preset?: BulkStockOutPreset | null;
}

/**
 * Bulk stock out: many items removed for ONE reason in one go (month-end expiry clear-out, a box of
 * breakage, a return of several items to a supplier). Each line becomes a normal stock-out entry,
 * with the same rules as a single entry (note / batch / vendor by reason).
 */
export function BulkStockOutDialog({ isOpen, onClose, preset }: Props): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();
  const confirmModal = useConfirmDialog();
  const { can, businessProfiles = [] } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  const [module, setModule] = useState<ModuleKey>(hasOmnimart || !hasFastFood ? 'minimart' : 'fastfood');
  const business = reasonBusinessFor(module, businessProfiles);
  const [reason, setReason] = useState(() => defaultReasonFor(business));
  const [vendorName, setVendorName] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<OutLine[]>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const info = reasonInfo(reason);
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => posApi.fetchProducts(), enabled: isOpen });
  const candidates = useMemo(
    () => products.filter((p) => (p.module || 'minimart') === module && p.openingStock !== null && p.openingStock !== undefined),
    [products, module]
  );

  const addProduct = async (p: Product) => {
    if (lines.some((l) => l.productId === p.id)) {
      notifyWarning(`"${p.name}" is already in the list.`);
      return;
    }
    setSearch('');
    const batches = (await posApi.fetchStockBatches(p.id)).filter((b) => b.remaining > 0 && (b.batchNumber || b.expiryDate));
    setLines((prev) => [
      ...prev,
      {
        key: uid('bo_'),
        productId: p.id,
        name: p.name,
        stock: p.openingStock ?? null,
        unit: p.unit,
        quantity: 1,
        unitCost: Number(p.costPrice) || 0,
        batches,
        batchNumber: '',
      },
    ]);
  };

  // Fill reason and lines from a preset once the products are loaded
  const appliedPreset = useRef<BulkStockOutPreset | null>(null);
  useEffect(() => {
    if (!isOpen || !preset || appliedPreset.current === preset || products.length === 0) return;
    appliedPreset.current = preset;
    void (async () => {
      const built: OutLine[] = [];
      for (const pl of preset.lines) {
        const p = products.find((x) => x.id === pl.productId);
        if (!p) continue;
        const batches = (await posApi.fetchStockBatches(p.id)).filter((b) => b.remaining > 0 && (b.batchNumber || b.expiryDate));
        built.push({
          key: uid('bo_'),
          productId: p.id,
          name: p.name,
          stock: p.openingStock ?? null,
          unit: p.unit,
          quantity: pl.quantity,
          unitCost: Number(p.costPrice) || 0,
          batches,
          batchNumber: pl.batchNumber || '',
        });
      }
      const first = products.find((x) => x.id === preset.lines[0]?.productId);
      if (first?.module) setModule(first.module as ModuleKey);
      setReason(preset.reason);
      if (preset.note) setNote(preset.note);
      setLines(built);
    })();
  }, [isOpen, preset, products]);
  useEffect(() => {
    if (!isOpen) appliedPreset.current = null;
  }, [isOpen]);

  const patch = (key: string, change: Partial<OutLine>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...change } : l)));
  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);

  const reset = () => {
    setLines([]);
    setSearch('');
    setVendorName('');
    setReturnReason('');
    setNote('');
    setReason(defaultReasonFor(business));
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (lines.length === 0) return notifyWarning('Add the items to remove.');
    if (info.requiresNote && !note.trim()) return notifyWarning(`Add a note explaining the "${info.label}" deduction.`);
    const vendor = info.vendor && vendorName ? vendorStorage.findVendor({ name: vendorName }) : undefined;
    if (info.vendor === 'required' && !vendor) return notifyWarning('Select the vendor these items go back to.');
    for (const l of lines) {
      const q = Number(l.quantity);
      if (!(q > 0)) return notifyWarning(`Enter a quantity for "${l.name}".`);
      if (l.stock !== null && q > l.stock) return notifyWarning(`Only ${l.stock} of "${l.name}" in stock.`);
      if (info.requiresBatch && l.batches.length > 0 && !l.batchNumber) return notifyWarning(`Select the batch for "${l.name}".`);
      if (vendor && !(Number(l.unitCost) > 0)) return notifyWarning(`Enter the unit cost of "${l.name}" so the vendor can be credited.`);
    }

    setIsSaving(true);
    let saved = 0;
    let credit = 0;
    // One debit note number for the whole return (the backend gives it with the first line)
    let debitNote = '';
    const dnLines: { name: string; quantity: number; unit?: string; batch?: string | null; rate: number }[] = [];
    try {
      const stamp = new Date().toISOString();
      for (const l of lines) {
        const qty = round3(Number(l.quantity));
        const m = await posApi.saveStockMovement({
          ...(vendor && debitNote ? { referenceInvoice: debitNote } : {}),
          module,
          type: 'out',
          productId: l.productId,
          productName: l.name,
          quantity: qty,
          // A return is credited at the typed rate; other deductions at the average cost (backend)
          unitCost: vendor ? Number(l.unitCost) || null : null,
          reason,
          note: [
            'Bulk stock out',
            info.vendor && returnReason ? `Return reason: ${returnReason}` : '',
            l.batchNumber ? `Batch: ${l.batchNumber}` : '',
            note.trim(),
          ]
            .filter(Boolean)
            .join(' • '),
          ...(l.batchNumber ? { batchNumber: l.batchNumber } : {}),
          ...(vendor ? { vendorName: vendor.name, vendorId: vendor.id } : {}),
          date: stamp,
        });
        saved++;
        credit += Math.round((Number(m.quantity) || 0) * (Number(m.unitCost) || 0) * 100) / 100;
        if (vendor && /^DN-/.test(m.referenceInvoice || '')) {
          debitNote = debitNote || m.referenceInvoice!;
          dnLines.push({ name: l.name, quantity: qty, unit: l.unit, batch: l.batchNumber || null, rate: Number(m.unitCost) || 0 });
        }
      }
      // Each line credited the supplier with its stock entry (backend); refresh the balances
      if (vendor && credit > 0) void vendorStorage.syncWithServer();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pos_inventory_updated'));
      notifySuccess(`Stock out saved: ${saved} item(s) as "${info.label}".`);
      if (vendor && debitNote) {
        const ok = await confirmModal({
          title: `Debit note ${debitNote}`,
          message: `${saved} item(s) returned to ${vendor.name}. Print the debit note for the supplier?`,
          confirmLabel: 'Print debit note',
        });
        if (ok) {
          printDebitNote({
            number: debitNote,
            vendorName: vendor.name,
            date: stamp,
            reason: info.label,
            returnReason: returnReason || undefined,
            note: note.trim() || undefined,
            lines: dnLines,
          });
        }
      }
      handleClose();
    } catch (err: any) {
      notifyError(`${saved} of ${lines.length} saved. ${err?.message || 'The rest failed.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, d) => !d.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss20Regular />} onClick={handleClose} />}>
            Bulk stock out
          </DialogTitle>
          <DialogContent>
            <Caption1 className={styles.intro}>
              Remove several items for one reason — e.g. clearing expired stock or returning items to a supplier. Selling items?
              Use <strong>Sale entry</strong> instead so the revenue is recorded.
            </Caption1>

            <div className={styles.top}>
              {hasFastFood && hasOmnimart && (
                <CustomSelect
                  label="DEPARTMENT"
                  value={module}
                  options={[
                    { value: 'minimart', label: 'Mart / Pharmacy' },
                    { value: 'fastfood', label: 'Kitchen' },
                  ]}
                  onChange={(v) => {
                    const m = (v as ModuleKey) || 'minimart';
                    setModule(m);
                    setLines([]);
                    setReason(defaultReasonFor(reasonBusinessFor(m, businessProfiles)));
                  }}
                />
              )}
              <CustomSelect
                label="REASON (ALL ITEMS) *"
                value={reason}
                options={reasonOptions(business, reason)}
                onChange={(v) => setReason(v || defaultReasonFor(business))}
              />
              {info.vendor && (
                <CustomSelect
                  label={info.vendor === 'required' ? 'RETURN TO VENDOR *' : 'CREDIT FROM VENDOR (OPTIONAL)'}
                  placeholder="Select vendor..."
                  value={vendorName}
                  options={vendorStorage.getVendors().map((v) => ({ value: v.name, label: v.name }))}
                  onChange={(v) => setVendorName(v || '')}
                />
              )}
              {reason === RETURN_TO_VENDOR && (
                <CustomSelect
                  label="RETURN REASON"
                  placeholder="Why is it going back?"
                  value={returnReason}
                  options={RETURN_SUB_REASONS.map((r) => ({ value: r, label: r }))}
                  onChange={(v) => setReturnReason(v || '')}
                />
              )}
              <CustomInput
                label={info.requiresNote ? 'NOTE *' : 'NOTE (OPTIONAL)'}
                placeholder="e.g. Month-end expiry clear-out"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <ProductAutocomplete
                id="bulkOutItemSelect"
                label="ADD ITEM"
                placeholder="Search by product name, SKU or barcode..."
                products={candidates}
                value={search}
                clearOnSelect
                onChange={(v) => setSearch(v)}
                onSelectProduct={(p) => void addProduct(p)}
              />
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Item</th>
                    <th className={`${styles.th} ${styles.num}`}>In stock</th>
                    <th className={styles.th}>Qty out</th>
                    <th className={styles.th}>Unit cost</th>
                    <th className={styles.th}>{info.requiresBatch ? 'Batch *' : 'Batch'}</th>
                    <th className={`${styles.th} ${styles.num}`}>Value</th>
                    <th className={styles.th} />
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        No items yet.
                      </td>
                    </tr>
                  ) : (
                    lines.map((l) => (
                      <tr key={l.key}>
                        <td className={styles.td}>{l.name}</td>
                        <td className={`${styles.td} ${styles.num}`}>
                          {l.stock ?? '—'} {l.unit || ''}
                        </td>
                        <td className={styles.td}>
                          <div className={styles.small}>
                            <CustomInput
                              type="number"
                              step="any"
                              min={0}
                              aria-label={`Quantity out of ${l.name}`}
                              value={l.quantity === '' ? '' : String(l.quantity)}
                              onChange={(e) => patch(l.key, { quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                            />
                          </div>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.small}>
                            <CustomInput
                              type="number"
                              step="any"
                              min={0}
                              aria-label={`Unit cost of ${l.name}`}
                              disabled={!info.vendor}
                              title={info.vendor ? 'Rate credited by the supplier' : 'Valued at the average cost'}
                              value={l.unitCost === '' ? '' : String(l.unitCost)}
                              onChange={(e) => patch(l.key, { unitCost: e.target.value === '' ? '' : Number(e.target.value) })}
                            />
                          </div>
                        </td>
                        <td className={styles.td}>
                          {l.batches.length > 0 ? (
                            <select
                              className={styles.batchSel}
                              aria-label={`Batch for ${l.name}`}
                              value={l.batchNumber}
                              onChange={(e) => patch(l.key, { batchNumber: e.target.value })}
                            >
                              <option value="">{info.requiresBatch ? 'Select batch…' : 'Earliest expiry first'}</option>
                              {l.batches.map((b) => (
                                <option key={b.id} value={b.batchNumber || b.expiryDate || b.id}>
                                  {b.batchNumber || 'No batch no.'}
                                  {b.expiryDate ? ` · exp ${b.expiryDate}` : ''} · {b.remaining} left
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Caption1>—</Caption1>
                          )}
                        </td>
                        <td className={`${styles.td} ${styles.num}`}>{formatPKR((Number(l.quantity) || 0) * (Number(l.unitCost) || 0))}</td>
                        <td className={styles.td}>
                          <Button
                            appearance="subtle"
                            size="small"
                            aria-label={`Remove ${l.name}`}
                            icon={<Delete20Regular />}
                            onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.totals}>
              <Caption1>{valueLabelFor(reason).replace(' (PKR)', '')}</Caption1>
              <span className={styles.grand}>{formatPKR(total)}</span>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={isSaving || lines.length === 0}>
              {isSaving ? 'Saving…' : `Remove ${lines.length || ''} item(s)`}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
