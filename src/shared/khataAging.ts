/**
 * Receivables aging for a customer khata, shared by the backend and the Khata screen.
 *
 * Payments settle the oldest udhaar first (FIFO). Whatever udhaar is still unpaid is bucketed by
 * how old it is; the part older than the customer's credit term (dueDays) is overdue. A payment
 * larger than everything owed leaves an advance that later udhaar uses up first.
 */

export interface AgingEntry {
  id?: string;
  /** Set on a correction entry: the id of the entry it cancels */
  reversalOf?: string | null;
  type: 'DEBIT' | 'CREDIT' | string;
  amount: number;
  date: string | Date;
}

export interface KhataAging {
  /** Unpaid udhaar by age in days */
  buckets: { d0_30: number; d31_60: number; d61_90: number; d90p: number };
  /** Total unpaid udhaar (equals the balance when the ledger is complete) */
  outstanding: number;
  /** Unpaid udhaar older than the credit term */
  overdueAmount: number;
  overdue: boolean;
  /** Date of the oldest unpaid udhaar, if any */
  oldestUnpaid: string | null;
  /** Age in days of the oldest unpaid udhaar */
  daysOutstanding: number;
  /** Money paid in advance (more paid than owed) */
  advance: number;
}

const DAY = 86_400_000;
const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeKhataAging(
  entries: AgingEntry[],
  dueDays: number | null | undefined,
  opts: { now?: Date; balance?: number; openedAt?: string | Date } = {}
): KhataAging {
  const now = (opts.now || new Date()).getTime();
  const term = Number(dueDays) > 0 ? Number(dueDays) : 30;

  // A corrected entry and its reversal cancel out; neither is a sale or a payment
  const cancelled = new Set<string>();
  for (const e of entries) {
    if (e.reversalOf) {
      cancelled.add(e.reversalOf);
      if (e.id) cancelled.add(e.id);
    }
  }
  const list = entries
    .filter((e) => !(e.id && cancelled.has(e.id)) && !e.reversalOf)
    .filter((e) => Number(e.amount) > 0 && (e.type === 'DEBIT' || e.type === 'CREDIT'))
    .map((e) => ({ type: e.type, amount: Number(e.amount), t: new Date(e.date).getTime() || now }))
    .sort((a, b) => a.t - b.t);

  // Accounts from before the ledger kept an opening line: the difference between the stored
  // balance and the ledger is treated as dated when the account was opened.
  if (opts.balance !== undefined) {
    const ledger = list.reduce((s, e) => s + (e.type === 'DEBIT' ? e.amount : -e.amount), 0);
    const gap = r2(Number(opts.balance) - ledger);
    if (Math.abs(gap) >= 0.01) {
      const t = new Date(opts.openedAt || (list[0] ? list[0].t : now)).getTime() || now;
      list.unshift({ type: gap > 0 ? 'DEBIT' : 'CREDIT', amount: Math.abs(gap), t: Math.min(t, list[0]?.t ?? t) });
    }
  }

  const open: { t: number; left: number }[] = [];
  let advance = 0;
  for (const e of list) {
    if (e.type === 'DEBIT') {
      let amt = e.amount;
      const use = Math.min(advance, amt);
      advance = r2(advance - use);
      amt = r2(amt - use);
      if (amt > 0) open.push({ t: e.t, left: amt });
    } else {
      let amt = e.amount;
      while (amt > 0 && open.length > 0) {
        const head = open[0];
        const take = Math.min(head.left, amt);
        head.left = r2(head.left - take);
        amt = r2(amt - take);
        if (head.left <= 0) open.shift();
      }
      if (amt > 0) advance = r2(advance + amt);
    }
  }

  const buckets = { d0_30: 0, d31_60: 0, d61_90: 0, d90p: 0 };
  let overdueAmount = 0;
  for (const d of open) {
    const age = Math.floor((now - d.t) / DAY);
    if (age <= 30) buckets.d0_30 = r2(buckets.d0_30 + d.left);
    else if (age <= 60) buckets.d31_60 = r2(buckets.d31_60 + d.left);
    else if (age <= 90) buckets.d61_90 = r2(buckets.d61_90 + d.left);
    else buckets.d90p = r2(buckets.d90p + d.left);
    if (age > term) overdueAmount = r2(overdueAmount + d.left);
  }
  const outstanding = r2(open.reduce((s, d) => s + d.left, 0));
  const oldest = open[0];
  return {
    buckets,
    outstanding,
    overdueAmount,
    overdue: overdueAmount > 0,
    oldestUnpaid: oldest ? new Date(oldest.t).toISOString() : null,
    daysOutstanding: oldest ? Math.floor((now - oldest.t) / DAY) : 0,
    advance,
  };
}
