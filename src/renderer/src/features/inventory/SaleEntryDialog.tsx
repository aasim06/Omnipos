import React, { useMemo, useState } from 'react';
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
import { CartLine, ModuleKey, Order, Product } from '@shared/types';
import { formatPKR, uid } from '@/lib/utils';
import { CustomInput, CustomSelect } from '@/components/ui';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { useAppToast } from '@/context/AppNotificationContext';
import { useLicense } from '@/features/auth/LicenseModulesContext';
import { creditLimitProblem } from '@/lib/khataRules';
import { getUnitConversion, cartLineBaseQty } from '@/features/pos/usePosCounter';

type PayMode = 'cash' | 'card' | 'online' | 'khata';

interface SaleLine {
  key: string;
  productId: string;
  name: string;
  quantity: number | '';
  unitPrice: number | '';
  unit: 'base' | 'wholesale';
}

const useStyles = makeStyles({
  surface: { maxWidth: '960px', width: '96vw' },
  intro: { color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '12px' },
  top: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px', alignItems: 'end' },
  tableWrap: { maxHeight: '42vh', overflowY: 'auto', marginTop: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium },
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
  unitSel: { fontSize: '12px', padding: '4px', borderRadius: '4px', border: `1px solid ${tokens.colorNeutralStroke1}` },
  empty: { padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
  totals: { display: 'flex', justifyContent: 'flex-end', gap: '24px', marginTop: '12px', alignItems: 'baseline', flexWrap: 'wrap' },
  grand: { fontSize: '20px', fontWeight: 700 },
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sale entry without the POS terminal: list what was sold (now, or a whole day's sales for a past
 * date) and it is saved as a normal paid POS order. Stock, revenue, cash / khata, reports, refunds,
 * recipe ingredients and low-stock alerts therefore all work exactly as for a terminal sale.
 */
export function SaleEntryDialog({ isOpen, onClose }: Props): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();
  const { can } = useLicense();
  const hasFastFood = can('fastfood');
  const hasOmnimart = can('omnimart');

  const [module, setModule] = useState<ModuleKey>(hasOmnimart || !hasFastFood ? 'minimart' : 'fastfood');
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [search, setSearch] = useState('');
  const [payMode, setPayMode] = useState<PayMode>('cash');
  const [khataId, setKhataId] = useState('');
  const [customer, setCustomer] = useState('');
  const [discountPct, setDiscountPct] = useState<number | ''>('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({ queryKey: ['products'], queryFn: () => posApi.fetchProducts(), enabled: isOpen });
  const { data: khatas = [] } = useQuery<any[]>({ queryKey: ['khatas'], queryFn: () => posApi.fetchKhatas(), enabled: isOpen });

  const sellable = useMemo(
    () => products.filter((p) => (p.module || 'minimart') === module && p.isAvailable !== false && p.itemRole !== 'raw_ingredient'),
    [products, module]
  );
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const priceFor = (p: Product, unit: 'base' | 'wholesale') => {
    const conv = getUnitConversion(p);
    if (!conv) return Number(p.price) || 0;
    return unit === 'wholesale' ? conv.wholesalePrice : conv.retailPrice;
  };

  const addProduct = (p: Product) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === p.id && l.unit === 'base');
      if (existing) return prev.map((l) => (l === existing ? { ...l, quantity: (Number(l.quantity) || 0) + 1 } : l));
      return [...prev, { key: uid('sl_'), productId: p.id, name: p.name, quantity: 1, unitPrice: priceFor(p, 'base'), unit: 'base' }];
    });
    setSearch('');
  };

  const patch = (key: string, change: Partial<SaleLine>) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...change } : l)));

  const subtotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const disc = Math.min(100, Math.max(0, Number(discountPct) || 0));
  const total = Math.round((subtotal - (subtotal * disc) / 100) * 100) / 100;

  const reset = () => {
    setLines([]);
    setSearch('');
    setPayMode('cash');
    setKhataId('');
    setCustomer('');
    setDiscountPct('');
    setSaleDate(new Date().toISOString().slice(0, 10));
  };
  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (lines.length === 0) return notifyWarning('Add at least one sold item.');
    const bad = lines.find((l) => !(Number(l.quantity) > 0) || !(Number(l.unitPrice) >= 0) || l.unitPrice === '');
    if (bad) return notifyWarning(`Check quantity and price for "${bad.name}".`);
    if (payMode === 'khata' && !khataId) return notifyWarning('Select the khata customer for a credit sale.');

    // Stock check in base units, all lines of a product together
    const need = new Map<string, number>();
    const cartLines: CartLine[] = lines.map((l) => {
      const p = byId.get(l.productId)!;
      const conv = getUnitConversion(p);
      const wholesale = l.unit === 'wholesale' && !!conv;
      const line: CartLine = {
        productId: l.productId,
        name: l.name,
        unitPrice: Number(l.unitPrice),
        quantity: round3(Number(l.quantity)),
        costPrice: p?.costPrice,
        unitLabel: wholesale ? conv!.wholesale : conv ? conv.retail : p?.unit,
        ...(conv ? { selectedUnit: wholesale ? 'primary' : 'secondary' } : {}),
        ...(wholesale ? { variantLabel: conv!.wholesale, unitFactor: conv!.rate } : {}),
      };
      need.set(l.productId, (need.get(l.productId) || 0) + cartLineBaseQty(line));
      return line;
    });
    for (const [pid, qty] of need) {
      const p = byId.get(pid);
      if (p && p.openingStock !== null && p.openingStock !== undefined && qty > Number(p.openingStock)) {
        return notifyWarning(`Only ${p.openingStock} of "${p.name}" in stock — this entry needs ${qty}.`);
      }
    }

    // Past date = end-of-day posting at 23:59 that day; today = now
    const today = new Date().toISOString().slice(0, 10);
    const when = saleDate && saleDate !== today ? new Date(`${saleDate}T23:59:00`).toISOString() : new Date().toISOString();
    const khata = khatas.find((k: any) => k.id === khataId);
    if (payMode === 'khata') {
      const problem = creditLimitProblem(khata, total);
      if (problem) return notifyWarning(problem);
    }

    setIsSaving(true);
    try {
      const order: Order = {
        id: uid(),
        module,
        lines: cartLines,
        discountPercent: disc,
        totalAmount: total,
        customerName: payMode === 'khata' ? khata?.name || 'Khata Customer' : customer.trim() || 'Walk-In Customer (Sale entry)',
        customerId: payMode === 'khata' ? khataId : undefined,
        paymentMode: payMode === 'online' ? 'online' : payMode,
        orderType: payMode === 'khata' ? 'khata' : 'takeaway',
        stage: 'paid',
        createdAt: when,
        updatedAt: when,
      } as Order;
      await posApi.saveOrder(order);

      if (payMode === 'khata' && khataId && total > 0) {
        await posApi.addKhataTransaction({
          khataId,
          type: 'DEBIT',
          amount: total,
          paymentMethod: 'credit',
          description: `Sale entry #${order.id.slice(-6)} (${cartLines.length} items)`,
          orderId: order.id,
        } as any);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['khatas'] }),
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
      ]);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pos_orders_updated', { detail: order }));
      notifySuccess(`Sale saved: ${cartLines.length} item(s), ${formatPKR(total)} (${payMode}).`);
      handleClose();
    } catch (err: any) {
      notifyError(err?.message || 'Failed to save the sale');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, d) => !d.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss20Regular />} onClick={handleClose} />}>
            Sale entry (without POS terminal)
          </DialogTitle>
          <DialogContent>
            <Caption1 className={styles.intro}>
              Record items sold — one bill, or a whole day&rsquo;s sales for a past date. It is saved as a normal paid sale, so stock,
              cash / khata, reports and returns all stay correct.
            </Caption1>

            <div className={styles.top}>
              {hasFastFood && hasOmnimart && (
                <CustomSelect
                  label="DEPARTMENT"
                  value={module}
                  options={[
                    { value: 'minimart', label: 'Mart / Pharmacy' },
                    { value: 'fastfood', label: 'Fast food' },
                  ]}
                  onChange={(v) => {
                    setModule((v as ModuleKey) || 'minimart');
                    setLines([]);
                  }}
                />
              )}
              <CustomInput label="SALE DATE" type="date" value={saleDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setSaleDate(e.target.value)} />
              <CustomSelect
                label="PAYMENT"
                value={payMode}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'online', label: 'Online / Bank' },
                  { value: 'khata', label: 'Khata (credit)' },
                ]}
                onChange={(v) => setPayMode((v as PayMode) || 'cash')}
              />
              {payMode === 'khata' ? (
                <CustomSelect
                  label="KHATA CUSTOMER *"
                  placeholder="Select customer..."
                  value={khataId}
                  options={khatas.map((k: any) => ({ value: k.id, label: `${k.name}${k.phone ? ` (${k.phone})` : ''}` }))}
                  onChange={(v) => setKhataId(v || '')}
                />
              ) : (
                <CustomInput label="CUSTOMER (OPTIONAL)" placeholder="Walk-in" value={customer} onChange={(e) => setCustomer(e.target.value)} />
              )}
            </div>

            <div style={{ marginTop: 12 }}>
              <ProductAutocomplete
                id="saleEntryItemSelect"
                label="ADD SOLD ITEM"
                placeholder="Search by product name, SKU or barcode..."
                products={sellable}
                value={search}
                clearOnSelect
                onChange={(v) => setSearch(v)}
                onSelectProduct={addProduct}
              />
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Item</th>
                    <th className={`${styles.th} ${styles.num}`}>In stock</th>
                    <th className={styles.th}>Qty sold</th>
                    <th className={styles.th}>Unit</th>
                    <th className={styles.th}>Price</th>
                    <th className={`${styles.th} ${styles.num}`}>Total</th>
                    <th className={styles.th} />
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.empty}>
                        No items yet — search above to add what was sold.
                      </td>
                    </tr>
                  ) : (
                    lines.map((l) => {
                      const p = byId.get(l.productId);
                      const conv = p ? getUnitConversion(p) : null;
                      return (
                        <tr key={l.key}>
                          <td className={styles.td}>{l.name}</td>
                          <td className={`${styles.td} ${styles.num}`}>
                            {p?.openingStock ?? '—'} {conv ? conv.retail : p?.unit || ''}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.small}>
                              <CustomInput
                                type="number"
                                step="any"
                                min={0}
                                aria-label={`Quantity sold of ${l.name}`}
                                value={l.quantity === '' ? '' : String(l.quantity)}
                                onChange={(e) => patch(l.key, { quantity: e.target.value === '' ? '' : Number(e.target.value) })}
                              />
                            </div>
                          </td>
                          <td className={styles.td}>
                            {conv ? (
                              <select
                                className={styles.unitSel}
                                aria-label={`Unit for ${l.name}`}
                                value={l.unit}
                                onChange={(e) => {
                                  const unit = e.target.value as 'base' | 'wholesale';
                                  patch(l.key, { unit, unitPrice: priceFor(p!, unit) });
                                }}
                              >
                                <option value="base">{conv.retail}</option>
                                <option value="wholesale">
                                  {conv.wholesale} (×{conv.rate})
                                </option>
                              </select>
                            ) : (
                              p?.unit || 'PCS'
                            )}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.small}>
                              <CustomInput
                                type="number"
                                step="any"
                                min={0}
                                aria-label={`Price of ${l.name}`}
                                value={l.unitPrice === '' ? '' : String(l.unitPrice)}
                                onChange={(e) => patch(l.key, { unitPrice: e.target.value === '' ? '' : Number(e.target.value) })}
                              />
                            </div>
                          </td>
                          <td className={`${styles.td} ${styles.num}`}>{formatPKR((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0))}</td>
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.totals}>
              <div style={{ width: 140 }}>
                <CustomInput
                  label="DISCOUNT %"
                  type="number"
                  step="any"
                  min={0}
                  max={100}
                  value={discountPct === '' ? '' : String(discountPct)}
                  onChange={(e) => setDiscountPct(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <Caption1>Subtotal {formatPKR(subtotal)}</Caption1>
              <span className={styles.grand}>Total {formatPKR(total)}</span>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={isSaving || lines.length === 0}>
              {isSaving ? 'Saving…' : `Save sale (${formatPKR(total)})`}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
