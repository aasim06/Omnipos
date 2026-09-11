import { Order } from './types';
import { posApi } from './api';
import { StoreSettings } from '@/features/admin/AdminSettingsView';

export interface ReceiptPrintOptions {
  tableOrToken?: string;
  cashierName?: string;
  storeSettings?: Partial<StoreSettings>;
  paymentMode?: string;
  tenderedAmount?: number;
  currency?: string;
}

/**
 * Generate standard 80mm / 58mm customer thermal receipt HTML
 */
export function generateCustomerReceiptHtml(order: Order, options?: ReceiptPrintOptions): string {
  const storeName = options?.storeSettings?.storeName || 'OMNIPOS RESTAURANT';
  const headerNote = options?.storeSettings?.headerNote || 'Order Fresh • Eat Fresh';
  const footerNote = options?.storeSettings?.footerNote || 'Thank you for shopping with us! Please come again.';
  const phone = options?.storeSettings?.phone || '';
  const address = options?.storeSettings?.address || '';
  const currency = options?.currency || 'PKR';

  const is58mm = options?.storeSettings?.paperWidth === '58mm';
  const targetWidth = is58mm ? '48mm' : '66mm';

  const tableOrToken = options?.tableOrToken || (order.orderType ? order.orderType.toUpperCase() : 'TAKEAWAY');
  const cashier = options?.cashierName || 'POS Terminal';
  const orderTime = new Date(order.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString();

  const linesHtml = (order.lines || [])
    .map(
      (line) => `
      <tr style="border-bottom: 1px dashed #CCC;">
        <td style="padding: 4px 0; font-size: 11.5px; font-weight: 700; line-height: 1.25; vertical-align: top; word-break: break-word;">
          ${line.name}
          ${line.variantLabel ? `<div style="font-size: 10px; color: #333; font-weight: 600;">Var: ${line.variantLabel}</div>` : ''}
          ${line.notes ? `<div style="font-size: 9.5px; font-style: italic; color: #555;">Note: ${line.notes}</div>` : ''}
        </td>
        <td style="padding: 4px 0; font-size: 11px; text-align: center; vertical-align: top;">
          ${line.quantity}
        </td>
        <td style="padding: 4px 0; font-size: 11px; text-align: right; vertical-align: top; white-space: nowrap;">
          ${line.unitPrice.toLocaleString()}
        </td>
        <td style="padding: 4px 0; font-size: 11.5px; font-weight: 800; text-align: right; vertical-align: top; white-space: nowrap;">
          ${(line.unitPrice * line.quantity).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join('');

  const totalQty = (order.lines || []).reduce((sum, l) => sum + (l.quantity || 1), 0);
  const totalAmount = order.totalAmount || 0;
  const paymentMode = (options?.paymentMode || (order as any).paymentMethod || 'Cash').toUpperCase();
  const tendered = options?.tenderedAmount;
  const changeDue = tendered !== undefined && tendered >= totalAmount ? tendered - totalAmount : 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt #${order.id.slice(-6).toUpperCase()}</title>
  <style>
    @page {
      margin: 0;
      size: auto;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      font-family: 'Courier New', Courier, monospace, system-ui, sans-serif;
      width: ${targetWidth};
      max-width: ${targetWidth};
      margin: 0;
      padding: 2mm 1mm 4mm 1mm;
      color: #000;
      background: #fff;
      font-size: 11.5px;
      line-height: 1.3;
      overflow-x: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      text-align: center;
      padding-bottom: 5px;
      margin-bottom: 5px;
      border-bottom: 2px solid #000;
      word-break: break-word;
    }
    .store-name {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      word-break: break-word;
    }
    .store-sub {
      font-size: 10px;
      color: #222;
      margin-top: 1.5px;
      word-break: break-word;
    }
    .token-box {
      border: 1.5px dashed #000;
      padding: 5px;
      margin: 5px 0;
      text-align: center;
    }
    .token-num {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      table-layout: fixed;
      font-size: 10.5px;
      margin-bottom: 5px;
      border-bottom: 1px dashed #000;
      padding-bottom: 3px;
    }
    .meta-table td {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .items-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin: 4px 0;
    }
    .items-head {
      border-bottom: 1.5px solid #000;
      font-size: 10.5px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .totals-table {
      width: 100%;
      table-layout: fixed;
      margin-top: 5px;
      border-top: 1.5px solid #000;
      padding-top: 3px;
      font-size: 11.5px;
    }
    .grand-total {
      font-size: 14px;
      font-weight: 900;
      border-top: 1px dashed #000;
      border-bottom: 1.5px solid #000;
      padding: 3px 0;
      margin-top: 3px;
    }
    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 10px;
      color: #333;
      border-top: 1px dashed #666;
      padding-top: 5px;
      word-break: break-word;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="store-name">${storeName}</div>
    ${address ? `<div class="store-sub">${address}</div>` : ''}
    ${phone ? `<div class="store-sub">Tel: ${phone}</div>` : ''}
    ${headerNote ? `<div class="store-sub" style="font-style: italic; margin-top: 3px;">"${headerNote}"</div>` : ''}
  </div>

  <!-- Token / Table Badge -->
  <div class="token-box">
    <div class="token-num">${tableOrToken}</div>
  </div>

  <!-- Order Meta -->
  <table class="meta-table">
    <tr>
      <td><strong>Invoice:</strong> #${order.id.slice(-6).toUpperCase()}</td>
      <td style="text-align: right;"><strong>Date:</strong> ${orderDate}</td>
    </tr>
    <tr>
      <td><strong>Server:</strong> ${cashier}</td>
      <td style="text-align: right;"><strong>Time:</strong> ${orderTime}</td>
    </tr>
    ${order.customerName ? `<tr><td colspan="2" style="font-weight: bold;">Customer: ${order.customerName}</td></tr>` : ''}
  </table>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr class="items-head">
        <th style="text-align: left; padding-bottom: 4px; width: 44%;">Item</th>
        <th style="text-align: center; padding-bottom: 4px; width: 14%;">Qty</th>
        <th style="text-align: right; padding-bottom: 4px; width: 20%;">Price</th>
        <th style="text-align: right; padding-bottom: 4px; width: 22%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${linesHtml}
    </tbody>
  </table>

  <!-- Totals -->
  <table class="totals-table">
    <tr>
      <td>Total Items:</td>
      <td style="text-align: right; font-weight: bold;">${totalQty} units</td>
    </tr>
    <tr class="grand-total">
      <td>NET TOTAL:</td>
      <td style="text-align: right;">${currency} ${totalAmount.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding-top: 4px;">Payment Method:</td>
      <td style="text-align: right; padding-top: 4px; font-weight: bold;">${paymentMode}</td>
    </tr>
    ${
      tendered !== undefined && tendered >= totalAmount
        ? `
    <tr>
      <td>Cash Tendered:</td>
      <td style="text-align: right;">${currency} ${tendered.toLocaleString()}</td>
    </tr>
    <tr style="font-weight: bold; font-size: 13px;">
      <td>Change Due:</td>
      <td style="text-align: right;">${currency} ${changeDue.toLocaleString()}</td>
    </tr>
    `
        : ''
    }
  </table>

  <!-- Footer -->
  <div class="footer">
    <div>${footerNote}</div>
    <div style="font-size: 9px; color: #888; margin-top: 4px;">OmniPOS Software System</div>
  </div>
</body>
</html>`;
}

/**
 * Direct print of Customer Thermal Receipt
 */
export async function printCustomerReceipt(order: Order, options?: ReceiptPrintOptions): Promise<boolean> {
  const html = generateCustomerReceiptHtml(order, options);
  return await posApi.printReceipt({ html });
}
