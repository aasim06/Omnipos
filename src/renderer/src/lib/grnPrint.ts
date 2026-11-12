import type { PurchaseBill } from '@shared/types';
import { KEYS, storage } from './storage';

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (n: number) => `PKR ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;

const PAYMENT: Record<string, string> = {
  cash: 'Cash',
  bank: 'Bank transfer',
  khata: 'On credit',
  split: 'Part paid',
};

/**
 * Print a Goods Received Note for a supplier delivery: every line with bonus, batch, expiry,
 * cost and sale price, then discount, tax, freight, paid and balance, with signature boxes.
 * A4 by default; the browser's print dialog can save it as PDF.
 */
export function printGrn(bill: PurchaseBill): boolean {
  const store = storage.getItem<{ storeName?: string; phone?: string; address?: string }>(KEYS.storeSettings, {});
  const lines = Array.isArray(bill.lines) ? bill.lines : [];
  const rows = lines
    .map((l, i) => {
      const unit = l.unitMode === 'wholesale' ? ' (box)' : '';
      return `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(l.productName)}${l.variantLabel ? ` <span class="muted">(${esc(l.variantLabel)})</span>` : ''}</td>
        <td class="c">${esc(l.quantity)}${esc(unit)}</td>
        <td class="c">${Number(l.bonusQty) > 0 ? `+${esc(l.bonusQty)}` : '—'}</td>
        <td>${esc(l.batchNumber || '—')}</td>
        <td>${l.expiryDate ? esc(new Date(l.expiryDate).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })) : '—'}</td>
        <td class="r">${esc(money(l.unitCost))}</td>
        <td class="r">${Number(l.retailPrice) > 0 ? esc(money(Number(l.retailPrice))) : '—'}</td>
        <td class="r">${esc(money(Number(l.unitCost) * Number(l.quantity)))}</td>
      </tr>`;
    })
    .join('');
  const freight = Number((bill as any).freightAmount || 0);
  const tax = Number(bill.taxAmount || 0);
  const discount = Number(bill.discountAmount || 0);
  const balance = Math.max(0, Number(bill.grandTotal || 0) - Number(bill.paidAmount || 0));
  const totalUnits = lines.reduce((s, l) => s + Number(l.quantity || 0) + Number(l.bonusQty || 0), 0);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>GRN ${esc(bill.billNumber)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; font-size: 12px; margin: 0; padding: 16px; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; }
  h1 { margin: 0; font-size: 18px; } h2 { margin: 0; font-size: 16px; letter-spacing: 1px; }
  .muted { color: #555; } .r { text-align: right; } .c { text-align: center; }
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin: 12px 0; }
  .meta div { display: flex; justify-content: space-between; border-bottom: 1px dotted #bbb; padding: 2px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #f1f1f1; border: 1px solid #ccc; padding: 5px; font-size: 11px; text-align: left; }
  td { border: 1px solid #ddd; padding: 5px; vertical-align: top; }
  .totals { margin-left: auto; width: 300px; margin-top: 10px; }
  .totals div { display: flex; justify-content: space-between; padding: 3px 0; }
  .grand { border-top: 2px solid #111; font-weight: 700; font-size: 14px; }
  .sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 48px; text-align: center; font-size: 11px; }
  .sign span { border-top: 1px solid #111; padding-top: 4px; }
</style></head><body>
  <div class="head">
    <div>
      <h1>${esc(store.storeName || 'Store')}</h1>
      ${store.address ? `<div class="muted">${esc(store.address)}</div>` : ''}
      ${store.phone ? `<div class="muted">${esc(store.phone)}</div>` : ''}
    </div>
    <div class="r">
      <h2>GOODS RECEIVED NOTE</h2>
      <div class="muted">${lines.length} item${lines.length === 1 ? '' : 's'} · ${esc(totalUnits)} units</div>
    </div>
  </div>
  <div class="meta">
    <div><span>Supplier</span><strong>${esc(bill.vendorName)}</strong></div>
    <div><span>Supplier invoice #</span><strong>${esc(bill.billNumber)}</strong></div>
    <div><span>Invoice date</span><span>${esc(bill.billDate)}</span></div>
    <div><span>Received</span><span>${esc(new Date(bill.createdAt).toLocaleString('en-PK'))}</span></div>
    <div><span>Payment</span><span>${esc(PAYMENT[bill.paymentMode] || bill.paymentMode)}</span></div>
    <div><span>Received by</span><span>${esc(bill.createdBy || '—')}</span></div>
  </div>
  <table>
    <thead><tr><th class="c">#</th><th>Item</th><th class="c">Qty</th><th class="c">Bonus</th><th>Batch</th><th>Expiry</th><th class="r">Cost</th><th class="r">Sale price</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="9" class="c muted">No items</td></tr>'}</tbody>
  </table>
  <div class="totals">
    <div><span>Items subtotal</span><span>${esc(money(bill.subtotal))}</span></div>
    ${discount > 0 ? `<div><span>Supplier discount</span><span>- ${esc(money(discount))}</span></div>` : ''}
    ${tax > 0 ? `<div><span>GST / tax</span><span>+ ${esc(money(tax))}</span></div>` : ''}
    ${freight > 0 ? `<div><span>Freight / other charges</span><span>+ ${esc(money(freight))}</span></div>` : ''}
    <div class="grand"><span>Bill total</span><span>${esc(money(bill.grandTotal))}</span></div>
    <div><span>Paid</span><span>${esc(money(bill.paidAmount))}</span></div>
    <div><strong>Balance payable</strong><strong>${esc(money(balance))}</strong></div>
  </div>
  ${bill.notes ? `<p class="muted" style="margin-top:12px">Note: ${esc(bill.notes)}</p>` : ''}
  <div class="sign"><span>Received by</span><span>Checked by</span><span>Supplier representative</span></div>
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;
  const w = window.open('', '_blank', 'width=900,height=800');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
