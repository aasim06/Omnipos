/**
 * Stock-out (deduction) reasons, grouped the way they are accounted for and filtered by the
 * kind of business:
 *   - loss:   write-off (expense) — damaged, expired, spoiled, theft, missing
 *   - usage:  internal consumption — kitchen, staff meal, store use, free sample, donation
 *   - return: goes back to the supplier for credit — purchase return, product recall
 * Physical count mismatches are NOT a stock-out reason: they go through "Stock count", which can
 * raise stock as well as lower it.
 *
 * `value` is what is saved on the movement, so existing values are kept unchanged.
 */
import type { CategoryProfile } from '@shared/types';

export type ReasonKind = 'loss' | 'usage' | 'return';
export type ReasonBusiness = 'food' | 'pharmacy' | 'retail';

export interface StockOutReason {
  value: string;
  label: string;
  kind: ReasonKind;
  /** Businesses that see this reason. */
  for: ReasonBusiness[];
  /** A note must explain the deduction. */
  requiresNote?: boolean;
  /** A batch must be chosen (expiry / recall). */
  requiresBatch?: boolean;
  /** The goods go back to a vendor, who is credited. */
  vendor?: 'required' | 'optional';
}

export const RETURN_TO_VENDOR = 'Return to Vendor';
export const PRODUCT_RECALL = 'Product Recall';
export const OTHER_REASON = 'Other Reason';

const ALL: ReasonBusiness[] = ['food', 'pharmacy', 'retail'];

export const STOCK_OUT_REASONS: StockOutReason[] = [
  // ── Loss / write-off
  { value: 'Damage / Broken', label: 'Damaged / Broken', kind: 'loss', for: ALL },
  { value: 'Expired Goods', label: 'Expired (cannot be returned)', kind: 'loss', for: ALL, requiresBatch: true },
  { value: 'Spoiled / Wastage', label: 'Spoiled / Wastage', kind: 'loss', for: ['food', 'retail'] },
  { value: 'Theft', label: 'Theft (known)', kind: 'loss', for: ALL, requiresNote: true },
  { value: 'Lost / Missing', label: 'Lost / Missing (unknown cause)', kind: 'loss', for: ALL },
  // ── Internal use
  { value: 'Kitchen Usage', label: 'Kitchen Consumption', kind: 'usage', for: ['food'] },
  { value: 'Staff Meal', label: 'Staff Meal', kind: 'usage', for: ['food'] },
  { value: 'Store Use', label: 'Store / Office Use', kind: 'usage', for: ['pharmacy', 'retail'] },
  { value: 'Free Sample', label: 'Free Sample', kind: 'usage', for: ['pharmacy', 'food'] },
  { value: 'Promotion / Gift', label: 'Promotion / Gift', kind: 'usage', for: ['retail'] },
  { value: 'Donation', label: 'Donation / Charity', kind: 'usage', for: ALL },
  // ── Back to the supplier
  { value: RETURN_TO_VENDOR, label: 'Return to Vendor (Purchase Return)', kind: 'return', for: ALL, vendor: 'required' },
  { value: PRODUCT_RECALL, label: 'Product Recall (batch)', kind: 'return', for: ['pharmacy', 'food', 'retail'], requiresBatch: true, vendor: 'optional' },
  // ── Anything else
  { value: OTHER_REASON, label: 'Other (note required)', kind: 'loss', for: ALL, requiresNote: true },
];

/** Older reasons still found on saved entries; shown as-is, not offered for new entries. */
const LEGACY_REASONS: StockOutReason[] = [
  { value: 'Audit Adjustment', label: 'Audit Adjustment (old — use Stock count)', kind: 'loss', for: ALL },
  { value: 'Theft / Lost', label: 'Theft / Lost (old)', kind: 'loss', for: ALL },
];

/** Why a purchase return goes back (stored in the note). */
export const RETURN_SUB_REASONS = ['Expired', 'Near expiry', 'Damaged in transit', 'Wrong item / short-dated', 'Excess stock', 'Quality issue'];

/** Business the reasons are shown for: the kitchen department, a pharmacy licence, or general retail. */
export function reasonBusinessFor(module: string | undefined, profiles: CategoryProfile[] = []): ReasonBusiness {
  if (module === 'fastfood') return 'food';
  if (profiles.includes('pharmacy')) return 'pharmacy';
  return 'retail';
}

export function reasonsFor(business: ReasonBusiness): StockOutReason[] {
  return STOCK_OUT_REASONS.filter((r) => r.for.includes(business));
}

/** Default reason for a new entry. */
export function defaultReasonFor(business: ReasonBusiness): string {
  return business === 'food' ? 'Kitchen Usage' : 'Damage / Broken';
}

/** Details for any saved reason value (current, legacy or unknown). */
export function reasonInfo(value?: string | null): StockOutReason {
  return (
    STOCK_OUT_REASONS.find((r) => r.value === value) ||
    LEGACY_REASONS.find((r) => r.value === value) || { value: value || '', label: value || 'Deduction', kind: 'loss', for: ALL }
  );
}

const GROUP_LABEL: Record<ReasonKind, string> = { loss: 'Loss / write-off', usage: 'Internal use', return: 'Back to supplier' };

/** Select options for a business, grouped; keeps the current value selectable when it is legacy. */
export function reasonOptions(business: ReasonBusiness, current?: string | null): { value: string; label: string }[] {
  const list = reasonsFor(business);
  const opts = (['loss', 'usage', 'return'] as ReasonKind[]).flatMap((kind) =>
    list.filter((r) => r.kind === kind && r.value !== OTHER_REASON).map((r) => ({ value: r.value, label: `${GROUP_LABEL[kind]} · ${r.label}` }))
  );
  opts.push({ value: OTHER_REASON, label: reasonInfo(OTHER_REASON).label });
  if (current && !opts.some((o) => o.value === current)) opts.push({ value: current, label: reasonInfo(current).label });
  return opts;
}

/** Label of the value box under the form: what the deducted value means for this reason. */
export function valueLabelFor(value?: string | null): string {
  const kind = reasonInfo(value).kind;
  if (kind === 'return') return 'VENDOR CREDIT (PKR)';
  if (kind === 'usage') return 'COST OF ITEMS USED (PKR)';
  return 'ESTIMATED LOSS (PKR)';
}

/** Badge colour for a reason in the logs. */
export function reasonColor(value?: string | null): 'danger' | 'warning' | 'informative' | 'important' {
  const r = reasonInfo(value);
  if (r.kind === 'return') return 'informative';
  if (r.kind === 'usage') return 'warning';
  return r.value === 'Expired Goods' ? 'important' : 'danger';
}
