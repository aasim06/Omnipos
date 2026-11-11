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
import { posApi } from '@/lib/api';
import { Product } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { CustomInput } from '@/components/ui';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { useAppToast } from '@/context/AppNotificationContext';

/** Reason written on every movement this dialog creates. */
export const STOCK_COUNT_REASON = 'Stock Count Adjustment';

interface CountLine {
  productId: string;
  name: string;
  module: Product['module'];
  systemQty: number;
  countedQty: number | '';
  unitCost: number;
}

const useStyles = makeStyles({
  surface: { maxWidth: '760px', width: '95vw' },
  intro: { color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '12px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '13px' },
  th: {
    textAlign: 'left',
    padding: '8px',
    color: tokens.colorNeutralForeground3,
    fontWeight: 600,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  td: { padding: '6px 8px', borderBottom: `1px solid ${tokens.colorNeutralStroke3}`, verticalAlign: 'middle' },
  num: { textAlign: 'right' },
  plus: { color: tokens.colorPaletteGreenForeground1, fontWeight: 600 },
  minus: { color: tokens.colorPaletteRedForeground1, fontWeight: 600 },
  countInput: { maxWidth: '110px' },
  empty: { padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
  summary: { marginTop: '12px', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' },
});

interface StockCountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Physical stock count: the user enters what is actually on the shelf, and every difference
 * from the system quantity is posted as an in/out movement with reason "Stock Count Adjustment",
 * so the ledger explains the correction.
 */
export function StockCountDialog({ isOpen, onClose }: StockCountDialogProps): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();
  const [lines, setLines] = useState<CountLine[]>([]);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    enabled: isOpen,
  });

  // Only products that track stock can be counted
  const countable = useMemo(
    () => products.filter((p) => p.openingStock !== undefined && p.openingStock !== null),
    [products]
  );

  const addProduct = (prod: Product) => {
    if (prod.openingStock === undefined || prod.openingStock === null) {
      notifyWarning(`"${prod.name}" does not track stock.`);
      return;
    }
    setLines((prev) =>
      prev.some((l) => l.productId === prod.id)
        ? prev
        : [
            ...prev,
            {
              productId: prod.id,
              name: prod.name,
              module: prod.module,
              systemQty: Number(prod.openingStock) || 0,
              countedQty: '',
              unitCost: Number(prod.costPrice) || 0,
            },
          ]
    );
    setSearch('');
  };

  const diffOf = (l: CountLine) => (l.countedQty === '' ? 0 : Number(l.countedQty) - l.systemQty);
  const changed = lines.filter((l) => l.countedQty !== '' && diffOf(l) !== 0);
  const valueImpact = changed.reduce((sum, l) => sum + diffOf(l) * l.unitCost, 0);

  const reset = () => {
    setLines([]);
    setSearch('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (lines.some((l) => l.countedQty !== '' && (Number(l.countedQty) < 0 || !Number.isInteger(Number(l.countedQty))))) {
      notifyWarning('Counted quantity must be a whole number of 0 or more.');
      return;
    }
    if (changed.length === 0) {
      notifyWarning('No differences to post. Enter counted quantities that differ from the system.');
      return;
    }
    setIsSaving(true);
    try {
      const stamp = new Date().toISOString();
      for (const l of changed) {
        const diff = diffOf(l);
        await posApi.saveStockMovement({
          module: l.module,
          type: diff > 0 ? 'in' : 'out',
          productId: l.productId,
          productName: l.name,
          quantity: Math.abs(diff),
          unitCost: l.unitCost || undefined,
          reason: STOCK_COUNT_REASON,
          referenceInvoice: `Physical count: system ${l.systemQty}, counted ${l.countedQty}`,
          date: stamp,
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stock-movements'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] }),
      ]);
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('pos_inventory_updated'));
      notifySuccess(`Stock count posted: ${changed.length} item(s) adjusted.`);
      handleClose();
    } catch (err: any) {
      notifyError(err?.message || 'Failed to post stock count');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, d) => !d.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle
            action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss20Regular />} onClick={handleClose} />}
          >
            Physical stock count
          </DialogTitle>
          <DialogContent>
            <Caption1 className={styles.intro}>
              Add items, enter the quantity actually on the shelf, and post. Each difference is recorded in the
              Stock Movement Ledger as a &ldquo;{STOCK_COUNT_REASON}&rdquo;.
            </Caption1>

            <ProductAutocomplete
              id="stockCountItemSelect"
              label="ADD ITEM TO COUNT"
              placeholder="Search by product name, SKU or barcode..."
              products={countable}
              value={search}
              clearOnSelect
              onChange={(val) => setSearch(val)}
              onSelectProduct={addProduct}
            />

            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Item</th>
                  <th className={`${styles.th} ${styles.num}`}>System qty</th>
                  <th className={styles.th}>Counted qty</th>
                  <th className={`${styles.th} ${styles.num}`}>Difference</th>
                  <th className={`${styles.th} ${styles.num}`}>Value</th>
                  <th className={styles.th} />
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.empty}>
                      No items added yet.
                    </td>
                  </tr>
                ) : (
                  lines.map((l) => {
                    const diff = diffOf(l);
                    return (
                      <tr key={l.productId}>
                        <td className={styles.td}>{l.name}</td>
                        <td className={`${styles.td} ${styles.num}`}>{l.systemQty}</td>
                        <td className={styles.td}>
                          <div className={styles.countInput}>
                            <CustomInput
                              type="number"
                              placeholder={String(l.systemQty)}
                              value={l.countedQty === '' ? '' : String(l.countedQty)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                setLines((prev) =>
                                  prev.map((x) =>
                                    x.productId === l.productId ? { ...x, countedQty: raw === '' ? '' : Number(raw) } : x
                                  )
                                );
                              }}
                            />
                          </div>
                        </td>
                        <td className={`${styles.td} ${styles.num} ${diff > 0 ? styles.plus : diff < 0 ? styles.minus : ''}`}>
                          {l.countedQty === '' ? '—' : diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className={`${styles.td} ${styles.num}`}>
                          {l.countedQty === '' || diff === 0 ? '—' : formatPKR(diff * l.unitCost)}
                        </td>
                        <td className={styles.td}>
                          <Button
                            appearance="subtle"
                            size="small"
                            aria-label={`Remove ${l.name}`}
                            icon={<Delete20Regular />}
                            onClick={() => setLines((prev) => prev.filter((x) => x.productId !== l.productId))}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className={styles.summary}>
              <Caption1>
                {changed.length} item(s) with a difference
              </Caption1>
              <Caption1>
                Net value impact: <strong>{formatPKR(valueImpact)}</strong>
              </Caption1>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={isSaving || changed.length === 0}>
              {isSaving ? 'Posting…' : `Post ${changed.length || ''} adjustment(s)`}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
