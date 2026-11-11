import { Product, RecipeLine } from './types';

/** Reason written on the 'out' movements created when a sale consumes recipe ingredients. */
export const RECIPE_USAGE_REASON = 'Recipe Usage';

/** Parse a product's recipe (array, or JSON string from the DB) into clean lines. */
export function parseRecipe(raw: Product['recipe'] | unknown): RecipeLine[] {
  let value: any = raw;
  try {
    if (typeof value === 'string') value = value.trim() ? JSON.parse(value) : [];
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((r: any) => r && r.ingredientId && Number(r.quantity) > 0)
    .map((r: any) => ({
      ingredientId: String(r.ingredientId),
      ingredientName: r.ingredientName ? String(r.ingredientName) : undefined,
      quantity: Number(r.quantity),
      variantLabel: r.variantLabel ? String(r.variantLabel) : undefined,
    }));
}

/**
 * Recipe lines that apply to a sold variant: the lines for that exact variant when any exist,
 * otherwise the lines that apply to every variant. Mirrors the backend.
 */
export function recipeLinesFor(recipe: RecipeLine[], variantLabel?: string | null): RecipeLine[] {
  const label = (variantLabel || '').trim().toLowerCase();
  const generic = recipe.filter((r) => !r.variantLabel);
  if (!label) return generic;
  const specific = recipe.filter((r) => (r.variantLabel || '').trim().toLowerCase() === label);
  return specific.length > 0 ? specific : generic;
}

/** Deterministic id shared with the backend so offline and server entries merge. */
export function recipeMovementId(orderId: string, lineIndex: number, ingredientIndex: number): string {
  return `sale_${orderId}_${lineIndex}_r${ingredientIndex}`;
}

/** Ingredient cost of one unit of a menu item (optionally for one variant). */
export function recipeUnitCost(recipe: RecipeLine[], products: Pick<Product, 'id' | 'costPrice'>[], variantLabel?: string): number {
  const byId = new Map(products.map((p) => [p.id, Number(p.costPrice) || 0]));
  return recipeLinesFor(recipe, variantLabel).reduce((sum, r) => sum + r.quantity * (byId.get(r.ingredientId) || 0), 0);
}
