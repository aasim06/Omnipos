import { Order } from './types';
import { posApi } from './api';

export interface KotPrintOptions {
  tableOrToken?: string;
  cashierName?: string;
  printerName?: string;
  storeName?: string;
}

/**
 * Generate standard 80mm/58mm thermal printer KOT HTML
 */
export function generateKotHtml(order: Order, options?: KotPrintOptions): string {
  const storeName = options?.storeName || 'OMNIPOS RESTAURANT';
  const tableOrToken = options?.tableOrToken || order.orderType || 'Order';
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
      <tr style="border-bottom: 1px dashed #000;">
        <td style="padding: 6px 0; font-size: 16px; font-weight: 900; vertical-align: top; width: 32px;">
          ${line.quantity}x
        </td>
        <td style="padding: 6px 0; font-size: 15px; font-weight: 700; line-height: 1.3;">
          ${line.name}
          ${line.variantLabel ? `<div style="font-size: 13px; font-weight: 600; color: #333;">• Variant: ${line.variantLabel}</div>` : ''}
          ${line.notes ? `<div style="font-size: 13px; font-style: italic; font-weight: 800; background: #eee; padding: 2px 4px; border-radius: 3px; margin-top: 2px;">NOTE: ${line.notes}</div>` : ''}
        </td>
      </tr>
    `,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>KOT #${order.id.slice(-6)}</title>
      <style>
        @page {
          margin: 0;
          size: 80mm auto;
        }
        body {
          font-family: 'Courier New', Courier, monospace, system-ui;
          width: 78mm;
          margin: 0 auto;
          padding: 8px 6px 20px;
          color: #000;
          background: #fff;
          box-sizing: border-box;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          margin-bottom: 6px;
        }
        .kot-title {
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .token-box {
          border: 2px dashed #000;
          padding: 8px;
          margin: 8px 0;
          text-align: center;
        }
        .token-num {
          font-size: 24px;
          font-weight: 900;
        }
        .token-type {
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .meta-table {
          width: 100%;
          font-size: 12px;
          margin-bottom: 8px;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
        }
        .footer {
          margin-top: 12px;
          border-top: 2px solid #000;
          padding-top: 6px;
          text-align: center;
          font-size: 12px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="font-size: 13px; font-weight: bold;">${storeName}</div>
        <div class="kot-title">*** KITCHEN ORDER (KOT) ***</div>
      </div>

      <div class="token-box">
        <div class="token-type">${order.orderType?.toUpperCase() || 'DINE-IN'}</div>
        <div class="token-num">${tableOrToken}</div>
      </div>

      <table class="meta-table">
        <tr>
          <td><strong>Order ID:</strong> #${order.id.slice(-6)}</td>
          <td style="text-align: right;"><strong>Time:</strong> ${orderTime}</td>
        </tr>
        <tr>
          <td><strong>Date:</strong> ${orderDate}</td>
          <td style="text-align: right;"><strong>Server:</strong> ${cashier}</td>
        </tr>
        ${order.customerName ? `<tr><td colspan="2"><strong>Customer:</strong> ${order.customerName}</td></tr>` : ''}
      </table>

      <table class="items-table">
        ${linesHtml}
      </table>

      <div class="footer">
        TOTAL ITEMS: ${order.lines?.reduce((sum, l) => sum + (l.quantity || 1), 0) || 0}
        <div style="font-size: 10px; margin-top: 4px; font-weight: normal;">* Sent immediately to Kitchen Display & Printer *</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Print Kitchen KOT directly to thermal printer
 */
export async function printKitchenKot(order: Order, options?: KotPrintOptions): Promise<boolean> {
  const html = generateKotHtml(order, options);
  try {
    return await posApi.printReceipt({
      html,
      silent: true,
      printerName: options?.printerName,
    });
  } catch (err) {
    console.warn('[KOT Printer] Failed to dispatch KOT print:', err);
    return false;
  }
}
