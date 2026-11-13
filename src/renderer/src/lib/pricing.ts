/** Margin of a selling price over cost, in percent (null when either is missing). */
export function marginPercent(price: unknown, cost: unknown): number | null {
  const p = Number(price);
  const c = Number(cost);
  if (!(p > 0) || !(c > 0)) return null;
  return Math.round(((p - c) / p) * 1000) / 10;
}

/** A warning when the item would sell at or below what it costs, otherwise null. */
export function belowCostWarning(name: string, price: unknown, cost: unknown): string | null {
  const m = marginPercent(price, cost);
  if (m === null || m > 0) return null;
  return `"${name || 'This item'}" would sell at PKR ${Number(price).toLocaleString()} but costs PKR ${Number(cost).toLocaleString()} (${m}% margin). Every sale loses money.`;
}
