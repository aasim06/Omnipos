import type { Order, OrderRefund } from '@shared/types';
import { billPriceFactor, lineRefundValue, parseRefundItems } from '@shared/refunds';
import { KEYS, storage } from './storage';

interface StoreHeader {
  storeName?: string;
  phone?: string;
  address?: string;
  footerNote?: string;
  paperWidth?: '80mm' | '58mm';
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (n: number) => `PKR ${Number(n || 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;

const PAYOUT: Record<string, string> = {
  cash: 'Cash refunded from drawer',
  card: 'Reversed to card / bank',
  online: 'Reversed online',
  khata: 'Credited to customer khata',
};

/**
 * Print a credit note for a sales return. Uses the receipt paper width from store settings
 * (58 / 80 mm); "Save as PDF" in the print dialog gives an A4-friendly copy as well.
 */
export function printCreditNote(refund: OrderRefund, order?: Order | null): boolean {
  const store = storage.getItem<StoreHeader>(KEYS.storeSettings, {});
  const items = parseRefundItems(refund.items) as any[];
  const factor = order?.lines?.length ? billPriceFactor(order.lines as any, Number(order.totalAmount || 0)) : 1;
  const rows = items
    .map((it) => {
      const value = lineRefundValue(it, Number(it.quantity || 0), factor);
      const rate = lineRefundValue(it, 1, factor);
      return `<tr>
        <td>${esc(it.name)}${it.variantLabel ? ` <span class="muted">(${esc(it.variantLabel)})</span>` : ''}</td>
        <td class="r">${esc(it.quantity)}</td>
        <td class="r">${esc(money(rate))}</td>
        <td class="r">${esc(money(value))}</td>
      </tr>`;
    })
    .join('');
  const width = store.paperWidth === '58mm' ? '58mm' : '80mm';
  const number = refund.creditNoteNo || 'Pending number';
  const when = new Date(refund.createdAt);

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Credit Note ${esc(number)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; margin: 0 auto; padding: 10px; max-width: ${width}; font-size: 12px; }
  h1 { font-size: 15px; margin: 0; text-align: center; }
  .c { text-align: center; } .r { text-align: right; } .muted { color: #555; }
  .title { margin: 10px 0 6px; padding: 4px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; text-align: center; font-weight: 700; letter-spacing: 1px; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { text-align: left; border-bottom: 1px solid #000; font-size: 11px; padding: 3px 0; }
  td { padding: 3px 0; vertical-align: top; }
  .total { border-top: 1px dashed #000; margin-top: 6px; padding-top: 6px; display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; }
  .meta div { display: flex; justify-content: space-between; gap: 8px; }
  .sign { margin-top: 26px; display: flex; justify-content: space-between; font-size: 11px; }
  .sign span { border-top: 1px solid #000; padding-top: 2px; min-width: 40%; text-align: center; }
  @media print { body { padding: 0; } }
</style></head><body>
  <h1>${esc(store.storeName || 'Store')}</h1>
  ${store.address ? `<div class="c muted">${esc(store.address)}</div>` : ''}
  ${store.phone ? `<div class="c muted">${esc(store.phone)}</div>` : ''}
  <div class="title">CREDIT NOTE</div>
  <div class="meta">
    <div><span>Credit note #</span><strong>${esc(number)}</strong></div>
    <div><span>Date</span><span>${esc(when.toLocaleString('en-PK'))}</span></div>
    <div><span>Against invoice</span><span>#${esc(String(refund.orderId).slice(-8))}</span></div>
    <div><span>Customer</span><span>${esc(refund.customerName || 'Walk-In Customer')}</span></div>
    <div><span>Reason</span><span>${esc(refund.reason || 'Customer return')}</span></div>
  </div>
  <table>
    <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" class="muted">Items not recorded</td></tr>'}</tbody>
  </table>
  <div class="total"><span>Total refunded</span><span>${esc(money(Number(refund.refundAmount || 0)))}</span></div>
  <div class="muted" style="margin-top:4px">${esc(PAYOUT[String(refund.paymentMode).toLowerCase()] || String(refund.paymentMode))}</div>
  <div class="sign"><span>Customer</span><span>Authorised</span></div>
  ${store.footerNote ? `<div class="c muted" style="margin-top:10px">${esc(store.footerNote)}</div>` : ''}
  <script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=420,height=700');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}
