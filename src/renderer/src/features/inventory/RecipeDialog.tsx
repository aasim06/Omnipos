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
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Delete20Regular, Dismiss20Regular } from '@fluentui/react-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Product, RecipeLine } from '@shared/types';
import { formatPKR } from '@/lib/utils';
import { decodeProductVariants } from '@/lib/variants';
import { parseRecipe, recipeUnitCost } from '@/lib/recipes';
import { CustomInput, CustomSelect } from '@/components/ui';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { useAppToast } from '@/context/AppNotificationContext';

const ALL_SIZES = '__all__';

const useStyles = makeStyles({
  surface: { maxWidth: '820px', width: '95vw' },
  intro: { color: tokens.colorNeutralForeground3, display: 'block', marginBottom: '12px' },
  row: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', alignItems: 'end', marginBottom: '12px' },
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
  qtyInput: { maxWidth: '110px' },
  empty: { padding: '20px', textAlign: 'center', color: tokens.colorNeutralForeground3 },
  costBox: {
    marginTop: '14px',
    padding: '12px 14px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
  },
  costLabel: { color: tokens.colorNeutralForeground3, display: 'block' },
  costValue: { fontWeight: 600, fontSize: '15px' },
  hint: { color: tokens.colorNeutralForeground3, display: 'block', marginTop: '8px' },
});

interface RecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Recipe / bill of materials editor. A menu item's recipe lists the stock-tracked ingredients
 * one unit consumes; every POS sale then deducts them automatically ("Recipe Usage").
 * Lines can apply to every size or to one size/variant only.
 */
export function RecipeDialog({ isOpen, onClose }: RecipeDialogProps): React.JSX.Element {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();

  const [menuItemId, setMenuItemId] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [scope, setScope] = useState<string>(ALL_SIZES);
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: rawProducts = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
    enabled: isOpen,
  });
  const products = useMemo(() => rawProducts.map(decodeProductVariants), [rawProducts]);

  const menuItem = products.find((p) => p.id === menuItemId);
  const variants = menuItem?.variants || [];

  // Menu items: food first, raw ingredients excluded
  const menuCandidates = useMemo(
    () =>
      products
        .filter((p) => p.itemRole !== 'raw_ingredient')
        .sort((a, b) => (a.module === b.module ? a.name.localeCompare(b.name) : a.module === 'fastfood' ? -1 : 1)),
    [products]
  );

  // Ingredients: anything that tracks stock, except the menu item itself
  const ingredientCandidates = useMemo(
    () => products.filter((p) => p.id !== menuItemId && p.openingStock !== undefined && p.openingStock !== null),
    [products, menuItemId]
  );
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const selectMenuItem = (p: Product) => {
    setMenuItemId(p.id);
    setMenuSearch(p.name);
    setLines(parseRecipe(p.recipe));
    setScope(ALL_SIZES);
  };

  const scopeLabel = scope === ALL_SIZES ? undefined : scope;
  const visibleLines = lines
    .map((l, index) => ({ l, index }))
    .filter(({ l }) => (scopeLabel ? (l.variantLabel || '') === scopeLabel : !l.variantLabel));

  const addIngredient = (ing: Product) => {
    if (visibleLines.some(({ l }) => l.ingredientId === ing.id)) {
      notifyWarning(`"${ing.name}" is already in this recipe.`);
      return;
    }
    setLines((prev) => [...prev, { ingredientId: ing.id, ingredientName: ing.name, quantity: 1, variantLabel: scopeLabel }]);
    setIngredientSearch('');
  };

  const updateQty = (index: number, raw: string) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, quantity: raw === '' ? 0 : Number(raw) } : l)));
  };

  // Cost of the scope being viewed (for a size with no own lines, the all-sizes recipe applies)
  const sellPrice = (() => {
    if (!menuItem) return 0;
    if (!scopeLabel) return Number(menuItem.price) || 0;
    const v = variants.find((x) => x.label === scopeLabel);
    return v ? Number(v.price ?? (Number(menuItem.price) || 0) + (Number(v.priceDelta) || 0)) : Number(menuItem.price) || 0;
  })();
  const foodCost = recipeUnitCost(lines, products, scopeLabel);
  const foodCostPct = sellPrice > 0 ? Math.round((foodCost / sellPrice) * 1000) / 10 : 0;
  const usesGenericForSize = !!scopeLabel && visibleLines.length === 0 && lines.some((l) => !l.variantLabel);

  const reset = () => {
    setMenuItemId('');
    setMenuSearch('');
    setIngredientSearch('');
    setScope(ALL_SIZES);
    setLines([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!menuItem) {
      notifyWarning('Select the menu item first.');
      return;
    }
    const bad = lines.find((l) => !(l.quantity > 0));
    if (bad) {
      notifyWarning(
        `Quantity for "${bad.ingredientName || productById.get(bad.ingredientId)?.name || 'ingredient'}" must be above 0.`
      );
      return;
    }
    setIsSaving(true);
    try {
      const clean: RecipeLine[] = lines.map((l) => ({
        ingredientId: l.ingredientId,
        ingredientName: productById.get(l.ingredientId)?.name || l.ingredientName,
        quantity: l.quantity,
        ...(l.variantLabel ? { variantLabel: l.variantLabel } : {}),
      }));
      await posApi.saveProduct({ ...menuItem, recipe: clean, updatedAt: new Date().toISOString() });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      notifySuccess(
        clean.length > 0
          ? `Recipe saved for ${menuItem.name}: ${clean.length} ingredient line(s). Sales will now deduct them.`
          : `Recipe removed from ${menuItem.name}.`
      );
      handleClose();
    } catch (err: any) {
      notifyError(err?.message || 'Failed to save recipe');
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
            Recipes (ingredient deduction)
          </DialogTitle>
          <DialogContent>
            <Caption1 className={styles.intro}>
              Set which ingredients one unit of a menu item uses. Every POS sale then deducts them from stock and records
              a &ldquo;Recipe Usage&rdquo; entry in the Stock Movement Ledger.
            </Caption1>

            <div className={styles.row}>
              <ProductAutocomplete
                id="recipeMenuItemSelect"
                label="MENU ITEM"
                placeholder="Search the dish / menu item..."
                products={menuCandidates}
                value={menuSearch}
                onChange={(val) => setMenuSearch(val)}
                onSelectProduct={selectMenuItem}
              />
              <CustomSelect
                label="APPLIES TO"
                value={scope}
                disabled={!menuItem || variants.length === 0}
                options={[
                  { value: ALL_SIZES, label: variants.length ? 'All sizes' : 'Every unit sold' },
                  ...variants.map((v) => ({ value: v.label, label: `Only size ${v.label}` })),
                ]}
                onChange={(val) => setScope(val || ALL_SIZES)}
              />
            </div>

            {menuItem && (
              <>
                <ProductAutocomplete
                  id="recipeIngredientSelect"
                  label="ADD INGREDIENT"
                  placeholder="Search stock items (bun, patty, cheese...)"
                  products={ingredientCandidates}
                  value={ingredientSearch}
                  clearOnSelect
                  onChange={(val) => setIngredientSearch(val)}
                  onSelectProduct={addIngredient}
                />

                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Ingredient</th>
                      <th className={styles.th}>Qty per unit sold</th>
                      <th className={styles.th}>Unit</th>
                      <th className={`${styles.th} ${styles.num}`}>In stock</th>
                      <th className={`${styles.th} ${styles.num}`}>Cost</th>
                      <th className={styles.th} />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLines.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.empty}>
                          {usesGenericForSize
                            ? `No size-specific lines — size ${scopeLabel} uses the "All sizes" recipe.`
                            : 'No ingredients yet.'}
                        </td>
                      </tr>
                    ) : (
                      visibleLines.map(({ l, index }) => {
                        const ing = productById.get(l.ingredientId);
                        return (
                          <tr key={`${l.ingredientId}-${l.variantLabel || 'all'}`}>
                            <td className={styles.td}>
                              {ing?.name || l.ingredientName || 'Missing item'}
                              {!ing && (
                                <Badge appearance="tint" color="danger" size="small" style={{ marginLeft: 6 }}>
                                  deleted
                                </Badge>
                              )}
                            </td>
                            <td className={styles.td}>
                              <div className={styles.qtyInput}>
                                <CustomInput
                                  type="number"
                                  value={l.quantity ? String(l.quantity) : ''}
                                  onChange={(e) => updateQty(index, e.target.value)}
                                />
                              </div>
                            </td>
                            <td className={styles.td}>{ing?.unit || 'PCS'}</td>
                            <td className={`${styles.td} ${styles.num}`}>{ing?.openingStock ?? '—'}</td>
                            <td className={`${styles.td} ${styles.num}`}>
                              {formatPKR((Number(ing?.costPrice) || 0) * (l.quantity || 0))}
                            </td>
                            <td className={styles.td}>
                              <Button
                                appearance="subtle"
                                size="small"
                                aria-label={`Remove ${ing?.name || 'ingredient'}`}
                                icon={<Delete20Regular />}
                                onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className={styles.costBox}>
                  <div>
                    <Caption1 className={styles.costLabel}>Food cost per unit</Caption1>
                    <span className={styles.costValue}>{formatPKR(foodCost)}</span>
                  </div>
                  <div>
                    <Caption1 className={styles.costLabel}>Selling price</Caption1>
                    <span className={styles.costValue}>{formatPKR(sellPrice)}</span>
                  </div>
                  <div>
                    <Caption1 className={styles.costLabel}>Food cost %</Caption1>
                    <span className={styles.costValue}>{sellPrice > 0 ? `${foodCostPct}%` : '—'}</span>
                  </div>
                  <div>
                    <Caption1 className={styles.costLabel}>Gross margin per unit</Caption1>
                    <span className={styles.costValue}>{formatPKR(sellPrice - foodCost)}</span>
                  </div>
                </div>
                <Caption1 className={styles.hint}>
                  Quantities are in each ingredient&rsquo;s stock unit and may be decimals — e.g. 0.02 for 20 g of
                  cheese stocked in KG.
                </Caption1>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={handleSave} disabled={isSaving || !menuItem}>
              {isSaving ? 'Saving…' : 'Save recipe'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
