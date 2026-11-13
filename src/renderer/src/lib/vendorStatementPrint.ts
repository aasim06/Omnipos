import { KEYS, storage } from './storage';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (n: number) => `PKR ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;

export interface StatementEntry {
  date: string;
  description: string;
  reference?: string;
  /** Added to what we owe (bills, positive adjustments) */
  debit: number;
  /** Taken off what we owe (payments, returns, negative adjustments) */
  credit: number;
  balance: number;
}

/**
 * Print a supplier account statement for a period: opening balance, every bill / payment /
 * adjustment with the running balance, and the closing balance. A4; "Save as PDF" works.
 */
export function printVendorStatement(opts: {
  vendorName: string;
  vendorPhone?: string;
  from?: string;
  to?: string;
  opening: number;
  entries: StatementEntry[];
}): boolean {
  const store = storage.getItem<{ storeName?: string; phone?: string; address?: string }>(KEYS.storeSettings, {});
  const closing = opts.entries.length ? opts.entries[opts.entries.length - 1].balance : opts.opening;
  const totalDebit = opts.entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = opts.entries.reduce((s, e) => s + e.credit, 0);
  const period = `${opts.from ? new Date(`${opts.from}T00:00:00`).toLocaleDateString('en-PK') : 'Beginning'} – ${opts.to ? new Date(`${opts.to}T00:00:00`).toLocaleDateString('en-PK') : 'Today'}`;
  const rows = opts.entries
    .map(
      (e) => `<tr>
      <td>${esc(new Date(e.date).toLocaleDateString('en-PK'))}</td>
      <td>${esc(e.description)}${e.reference ? ` <span class="muted">(${esc(e.reference)})</span>` : ''}</td>
      <td class="r">${e.debit ? esc(money(e.debit)) : ''}</td>
      <td class="r">${e.credit ? esc(money(e.credit)) : ''}</td>
      <td class="r">${esc(money(e.balance))}</td>
    </tr>`
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Statement ${esc(opts.vendorName)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; font-size: 12px; margin: 0; padding: 16px; }
  .head { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 10px; }
  h1 { margin: 0; font-size: 18px; } h2 { margin: 0; font-size: 16px; letter-spacing: 1px; }
  .muted { color: #555; } .r { text-align: right; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin: 12px 0; }
  .meta div { display: flex; justify-content: space-between; border-bottom: 1px dotted #bbb; padding: 2px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f1f1f1; border: 1px solid #ccc; padding: 5px; font-size: 11px; text-align: left; }
  td { border: 1px solid #ddd; padding: 5px; }
  tr.open td, tr.close td { font-weight: 700; background: #fafafa; }
</style></head><body>
  <div class="head">
    <div>
      <h1>${esc(store.storeName || 'Store')}</h1>
      ${store.address ? `<div class="muted">${esc(store.address)}</div>` : ''}
      ${store.phone ? `<div class="muted">${esc(store.phone)}</div>` : ''}
    </div>
    <div class="r"><h2>SUPPLIER STATEMENT</h2><div class="muted">${esc(period)}</div></div>
  </div>
  <div class="meta">
    <div><span>Supplier</span><strong>${esc(opts.vendorName)}</strong></div>
    <div><span>Phone</span><span>${esc(opts.vendorPhone || '—')}</span></div>
    <div><span>Bills / additions</span><span>${esc(money(totalDebit))}</span></div>
    <div><span>Payments / credits</span><span>${esc(money(totalCredit))}</span></div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Details</th><th class="r">Bill (+)</th><th class="r">Paid / credit (−)</th><th class="r">Balance</th></tr></thead>
    <tbody>
      <tr class="open"><td></td><td>Opening balance</td><td></td><td></td><td class="r">${esc(money(opts.opening))}</td></tr>
      ${rows}
      <tr class="close"><td></td><td>Closing balance (we owe)</td><td></td><td></td><td class="r">${esc(money(closing))}</td></tr>
    </tbody>
  </table>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;
  const w = window.open('', '_blank', 'width=900,height=800');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
