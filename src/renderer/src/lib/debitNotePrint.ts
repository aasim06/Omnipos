import { KEYS, storage } from './storage';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (n: number) => `PKR ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;

export interface DebitNoteLine {
  name: string;
  quantity: number;
  unit?: string;
  batch?: string | null;
  expiry?: string | null;
  rate: number;
}

export interface DebitNote {
  number: string;
  vendorName: string;
  date: string;
  reason: string;
  returnReason?: string;
  note?: string;
  createdBy?: string | null;
  lines: DebitNoteLine[];
}

/**
 * Print a Debit Note for goods returned to a supplier: what went back, at what rate, and the
 * amount the supplier owes us (credited against our balance with them). A4; "Save as PDF" works.
 */
export function printDebitNote(dn: DebitNote): boolean {
  const store = storage.getItem<{ storeName?: string; phone?: string; address?: string }>(KEYS.storeSettings, {});
  const total = dn.lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.rate || 0), 0);
  const rows = dn.lines
    .map(
      (l, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td>${esc(l.name)}</td>
      <td>${esc(l.batch || '—')}</td>
      <td>${l.expiry ? esc(l.expiry) : '—'}</td>
      <td class="c">${esc(Number(l.quantity).toLocaleString())} ${esc(l.unit || '')}</td>
      <td class="r">${esc(money(l.rate))}</td>
      <td class="r">${esc(money(Number(l.quantity) * Number(l.rate)))}</td>
    </tr>`
    )
    .join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Debit Note ${esc(dn.number)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; font-size: 12px; margin: 0; padding: 16px; }
  .head { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 10px; }
  h1 { margin: 0; font-size: 18px; } h2 { margin: 0; font-size: 16px; letter-spacing: 1px; }
  .muted { color: #555; } .r { text-align: right; } .c { text-align: center; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin: 12px 0; }
  .meta div { display: flex; justify-content: space-between; border-bottom: 1px dotted #bbb; padding: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #f1f1f1; border: 1px solid #ccc; padding: 5px; font-size: 11px; text-align: left; }
  td { border: 1px solid #ddd; padding: 5px; }
  .total { margin-left: auto; width: 300px; margin-top: 10px; display: flex; justify-content: space-between; border-top: 2px solid #111; padding-top: 6px; font-weight: 700; font-size: 14px; }
  .sign { display: grid; grid-template-columns: repeat(2, 1fr); gap: 48px; margin-top: 56px; text-align: center; font-size: 11px; }
  .sign span { border-top: 1px solid #111; padding-top: 4px; }
</style></head><body>
  <div class="head">
    <div>
      <h1>${esc(store.storeName || 'Store')}</h1>
      ${store.address ? `<div class="muted">${esc(store.address)}</div>` : ''}
      ${store.phone ? `<div class="muted">${esc(store.phone)}</div>` : ''}
    </div>
    <div class="r"><h2>DEBIT NOTE</h2><div class="muted">Goods returned to supplier</div></div>
  </div>
  <div class="meta">
    <div><span>Debit note #</span><strong>${esc(dn.number)}</strong></div>
    <div><span>Date</span><span>${esc(new Date(dn.date).toLocaleString('en-PK'))}</span></div>
    <div><span>Supplier</span><strong>${esc(dn.vendorName)}</strong></div>
    <div><span>Type</span><span>${esc(dn.reason)}</span></div>
    ${dn.returnReason ? `<div><span>Reason</span><span>${esc(dn.returnReason)}</span></div>` : ''}
    <div><span>Prepared by</span><span>${esc(dn.createdBy || '—')}</span></div>
  </div>
  <table>
    <thead><tr><th class="c">#</th><th>Item</th><th>Batch</th><th>Expiry</th><th class="c">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total"><span>Amount to be credited</span><span>${esc(money(total))}</span></div>
  ${dn.note ? `<p class="muted" style="margin-top:12px">Note: ${esc(dn.note)}</p>` : ''}
  <div class="sign"><span>Store</span><span>Supplier representative</span></div>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;
  const w = window.open('', '_blank', 'width=900,height=800');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
