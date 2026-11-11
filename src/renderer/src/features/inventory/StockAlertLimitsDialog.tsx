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
  Badge,
  Checkbox,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Dismiss20Regular, Search20Regular } from '@fluentui/react-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Product } from '@shared/types';
import { CustomInput } from '@/components/ui';
import { useAppToast } from '@/context/AppNotificationContext';
import { getLowStockDefault, setLowStockDefault, getStockStatus, StockStatus } from '@/lib/stockStatus';

const useStyles = makeStyles({
  surface: { maxWidth: '900px', width: '95vw' },
  intro: { color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '12px' },
  topRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' },
  bulkRow: { display: 'flex', gap: '8px', alignItems: 'end', flexWrap: 'wrap', marginTop: '12px' },
  bulkInput: { width: '140px' },
  tableWrap: { maxHeight: '46vh', overflowY: 'auto', marginTop: '12px', border: `1px solid ${tokens.colorNeutralStroke2}`, borderRadius: tokens.borderRadiusMedium },
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
  limitInput: { maxWidth: '130px' },
  empty: { padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
});

const STATUS_BADGE: Record<StockStatus, { color: 'success' | 'warning' | 'danger' | 'informative'; label: string }> = {
  ok: { color: 'success', label: 'OK' },
  low: { color: 'warning', label: 'Low' },
  out: { color: 'danger', label: 'Out' },
  untracked: { color: 'informative', label: '—' },
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Low-stock alert limits for the whole catalogue: the store default, plus each item's own
 * limit (empty = default, 0 = no alert). Only the limit is saved — stock is never touched.
 */
export function StockAlertLimitsDialog({ isOpen, onClose }: Props): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();

  const [defaultLimit, setDefaultLimit] = useState<string>(() => String(getLowStockDefault()));
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({}); // id -> raw input ('' = default)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkValue, setBulkValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    enabled: isOpen,
  });

  // Only items that track stock can raise a low-stock alert
  const tracked = useMemo(
    () =>
      products
        .filter((p) => p.openingStock !== null && p.openingStock !== undefined)
        .sort((a, b) => (a.category || '').localeCompare(b.category || '') || a.name.localeCompare(b.name)),
    [products]
  );

  const rawFor = (p: Product): string =>
    edits[p.id] !== undefined ? edits[p.id] : p.minThreshold === null || p.minThreshold === undefined ? '' : String(p.minThreshold);

  // Status as it will be after saving (uses the edited limit / default)
  const previewStatus = (p: Product): StockStatus => {
    const raw = rawFor(p);
    const d = Number(defaultLimit);
    const limit = raw === '' ? (Number.isFinite(d) ? d : getLowStockDefault()) : Number(raw);
    if (p.openingStock === null || p.openingStock === undefined) return 'untracked';
    const stock = Number(p.openingStock) || 0;
    if (stock <= 0) return 'out';
    return limit > 0 && stock <= limit ? 'low' : 'ok';
  };

  const q = search.trim().toLowerCase();
  const visible = tracked.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !(p.category || '').toLowerCase().includes(q)) return false;
    if (onlyLow) {
      const s = previewStatus(p);
      if (s !== 'low' && s !== 'out') return false;
    }
    return true;
  });

  const changedIds = Object.keys(edits).filter((id) => {
    const p = tracked.find((x) => x.id === id);
    if (!p) return false;
    const before = p.minThreshold === null || p.minThreshold === undefined ? '' : String(p.minThreshold);
    return edits[id].trim() !== before;
  });
  const defaultChanged = Number(defaultLimit) !== getLowStockDefault();

  const applyBulk = () => {
    if (selected.size === 0) {
      notifyWarning('Tick the items to apply the limit to.');
      return;
    }
    if (bulkValue.trim() !== '' && !(Number(bulkValue) >= 0)) {
      notifyWarning('Enter 0 or more (empty = store default).');
      return;
    }
    setEdits((prev) => {
      const next = { ...prev };
      selected.forEach((id) => (next[id] = bulkValue.trim()));
      return next;
    });
  };

  const reset = () => {
    setEdits({});
    setSelected(new Set());
    setSearch('');
    setBulkValue('');
    setOnlyLow(false);
    setDefaultLimit(String(getLowStockDefault()));
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    const d = Number(defaultLimit);
    if (defaultLimit.trim() === '' || !(d >= 0)) {
      notifyWarning('Store default limit must be 0 or more.');
      return;
    }
    const bad = changedIds.find((id) => edits[id].trim() !== '' && !(Number(edits[id]) >= 0));
    if (bad) {
      notifyWarning(`Limit for "${tracked.find((p) => p.id === bad)?.name}" must be 0 or more.`);
      return;
    }
    setIsSaving(true);
    try {
      if (defaultChanged) await setLowStockDefault(d);
      if (changedIds.length > 0) {
        await posApi.setAlertLimits(
          changedIds.map((id) => ({ id, minThreshold: edits[id].trim() === '' ? null : Number(edits[id]) }))
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] }),
      ]);
      notifySuccess(
        `Alert limits saved${changedIds.length ? `: ${changedIds.length} item(s)` : ''}${defaultChanged ? `, store default ${d}` : ''}.`
      );
      handleClose();
    } catch (err: any) {
      notifyError(err?.message || 'Failed to save alert limits');
    } finally {
      setIsSaving(false);
    }
  };

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  return (
    <Dialog open={isOpen} onOpenChange={(_, d) => !d.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss20Regular />} onClick={handleClose} />}>
            Low stock alert limits
          </DialogTitle>
          <DialogContent>
            <Caption1 className={styles.intro}>
              An item is <strong>Low</strong> when its stock falls to its alert limit. Leave an item&rsquo;s limit empty to use the
              store default; set 0 to switch its alert off. Decimals are fine (e.g. 2.5 KG).
            </Caption1>

            <div className={styles.topRow}>
              <CustomInput
                label="STORE DEFAULT LIMIT"
                type="number"
                step="any"
                min={0}
                value={defaultLimit}
                onChange={(e) => setDefaultLimit(e.target.value)}
              />
              <CustomInput
                label="SEARCH ITEMS"
                placeholder="Name or category..."
                icon={<Search20Regular />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={search ? () => setSearch('') : undefined}
              />
              <Checkbox label="Show only low / out items" checked={onlyLow} onChange={(_, d) => setOnlyLow(!!d.checked)} />
            </div>

            <div className={styles.bulkRow}>
              <div className={styles.bulkInput}>
                <CustomInput
                  label="SET TICKED ITEMS TO"
                  type="number"
                  step="any"
                  min={0}
                  placeholder="empty = default"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                />
              </div>
              <Button appearance="secondary" onClick={applyBulk} disabled={selected.size === 0}>
                Apply to {selected.size} ticked
              </Button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th} style={{ width: 36 }}>
                      <Checkbox
                        aria-label="Tick all shown items"
                        checked={allVisibleSelected}
                        onChange={(_, d) =>
                          setSelected((prev) => {
                            const next = new Set(prev);
                            visible.forEach((p) => (d.checked ? next.add(p.id) : next.delete(p.id)));
                            return next;
                          })
                        }
                      />
                    </th>
                    <th className={styles.th}>Item</th>
                    <th className={styles.th}>Category</th>
                    <th className={`${styles.th} ${styles.num}`}>In stock</th>
                    <th className={styles.th}>Alert limit</th>
                    <th className={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.empty}>
                        No stock-tracked items match.
                      </td>
                    </tr>
                  ) : (
                    visible.map((p) => {
                      const st = STATUS_BADGE[previewStatus(p)];
                      return (
                        <tr key={p.id}>
                          <td className={styles.td}>
                            <Checkbox
                              aria-label={`Tick ${p.name}`}
                              checked={selected.has(p.id)}
                              onChange={(_, d) =>
                                setSelected((prev) => {
                                  const next = new Set(prev);
                                  if (d.checked) next.add(p.id);
                                  else next.delete(p.id);
                                  return next;
                                })
                              }
                            />
                          </td>
                          <td className={styles.td}>{p.name}</td>
                          <td className={styles.td}>{p.category}</td>
                          <td className={`${styles.td} ${styles.num}`}>
                            {p.openingStock} {p.unit || ''}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.limitInput}>
                              <CustomInput
                                type="number"
                                step="any"
                                min={0}
                                aria-label={`Alert limit for ${p.name}`}
                                placeholder={`Default (${defaultLimit || getLowStockDefault()})`}
                                value={rawFor(p)}
                                onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                              />
                            </div>
                          </td>
                          <td className={styles.td}>
                            <Badge appearance="tint" color={st.color}>
                              {st.label}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Caption1 style={{ display: 'block', marginTop: 8 }}>
              {tracked.filter((p) => getStockStatus(p) === 'low').length} low and{' '}
              {tracked.filter((p) => getStockStatus(p) === 'out').length} out of stock right now.
              {changedIds.length > 0 ? ` ${changedIds.length} unsaved change(s).` : ''}
            </Caption1>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={isSaving || (!defaultChanged && changedIds.length === 0)}>
              {isSaving ? 'Saving…' : 'Save limits'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
