import { Order } from './types';
import { posApi } from './api';
import { StoreSettings } from '@/features/admin/AdminSettingsView';
import { generateQrDataUrl } from './qrCode';
import { storage, KEYS } from './storage';

export interface ReceiptPrintOptions {
  tableOrToken?: string;
  cashierName?: string;
  storeSettings?: Partial<StoreSettings>;
  paymentMode?: string;
  tenderedAmount?: number;
  currency?: string;
  language?: 'english' | 'urdu' | 'bilingual';
  googleQrDataUrl?: string;
}

/**
 * Generate standard 80mm / 58mm customer thermal receipt HTML with Full Urdu / Bilingual support
 */
export function generateCustomerReceiptHtml(order: Order, options?: ReceiptPrintOptions): string {
  const lang = options?.language || options?.storeSettings?.receiptLanguage || 'english';
  const isUrdu = lang === 'urdu';
  const isBilingual = lang === 'bilingual';
  const isRtl = isUrdu;

  const defaultStoreName = options?.storeSettings?.storeName || 'OMNIPOS RESTAURANT';
  const storeName = isUrdu
    ? options?.storeSettings?.storeNameUrdu || defaultStoreName
    : isBilingual && options?.storeSettings?.storeNameUrdu
      ? `${defaultStoreName}<div style="font-size: 13px; font-weight: 700; margin-top: 2px;">${options.storeSettings.storeNameUrdu}</div>`
      : defaultStoreName;

  const defaultHeaderNote = options?.storeSettings?.headerNote || 'Order Fresh • Eat Fresh';
  const headerNote = isUrdu
    ? options?.storeSettings?.headerNoteUrdu || defaultHeaderNote
    : isBilingual && options?.storeSettings?.headerNoteUrdu
      ? `${defaultHeaderNote} • ${options.storeSettings.headerNoteUrdu}`
      : defaultHeaderNote;

  const defaultFooterNote = options?.storeSettings?.footerNote || 'Thank you for shopping with us! Please come again.';
  const footerNote = isUrdu
    ? options?.storeSettings?.footerNoteUrdu || defaultFooterNote
    : isBilingual && options?.storeSettings?.footerNoteUrdu
      ? `${defaultFooterNote}<div style="margin-top: 3px;">${options.storeSettings.footerNoteUrdu}</div>`
      : defaultFooterNote;

  const phone = options?.storeSettings?.phone || '';
  const address = options?.storeSettings?.address || '';
  const currency = isUrdu ? 'روپے' : options?.currency || 'PKR';

  const is58mm = options?.storeSettings?.paperWidth === '58mm';
  const targetWidth = is58mm ? '48mm' : '72mm';

  let rawType = (order.orderType || 'takeaway').toLowerCase();
  let tableOrToken = options?.tableOrToken;
  if (!tableOrToken) {
    if (rawType === 'dine-in') {
      tableOrToken = isUrdu ? 'ڈائن ان (DINE-IN)' : 'DINE-IN';
    } else if (rawType === 'delivery') {
      tableOrToken = isUrdu ? 'ڈیلیوری (DELIVERY)' : 'DELIVERY';
    } else {
      tableOrToken = isUrdu ? 'ٹیک اوے (TAKEAWAY)' : 'TAKEAWAY';
    }
  }

  const cashier = options?.cashierName || (isUrdu ? 'کاؤنٹر کیشیئر' : 'POS Terminal');
  const orderTime = new Date(order.createdAt || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString();

  // ── Labels Dictionary ──
  const L = {
    invoice: isUrdu ? 'رسید نمبر:' : isBilingual ? 'Invoice / رسید:' : 'Invoice:',
    date: isUrdu ? 'تاریخ:' : isBilingual ? 'Date / تاریخ:' : 'Date:',
    server: isUrdu ? 'کیشیئر:' : isBilingual ? 'Server / کیشیئر:' : 'Server:',
    time: isUrdu ? 'وقت:' : isBilingual ? 'Time / وقت:' : 'Time:',
    customer: isUrdu ? 'گاہک:' : isBilingual ? 'Customer / گاہک:' : 'Customer:',
    item: isUrdu ? 'تفصیل / اشیاء' : isBilingual ? 'Item / اشیاء' : 'Item',
    qty: isUrdu ? 'تعداد' : isBilingual ? 'Qty / تعداد' : 'Qty',
    price: isUrdu ? 'قیمت' : isBilingual ? 'Price / قیمت' : 'Price',
    total: isUrdu ? 'کل رقم' : isBilingual ? 'Total / رقم' : 'Total',
    totalItems: isUrdu ? 'کل اشیاء:' : isBilingual ? 'Total Items / کل آئٹمز:' : 'Total Items:',
    subtotal: isUrdu ? 'سب ٹوٹل:' : isBilingual ? 'Subtotal / سب ٹوٹل:' : 'Subtotal:',
    discount: (pct: number) => isUrdu ? `رعایت (${pct}%):` : isBilingual ? `Discount / رعایت (${pct}%):` : `Discount (${pct}%):`,
    netTotal: isUrdu ? 'کل واجب الادا:' : isBilingual ? 'NET TOTAL / کل رقم:' : 'NET TOTAL:',
    paymentMethod: isUrdu ? 'ادائیگی کا طریقہ:' : isBilingual ? 'Payment / ادائیگی:' : 'Payment Method:',
    cashTendered: isUrdu ? 'وصول شدہ رقم:' : isBilingual ? 'Tendered / وصول:' : 'Cash Tendered:',
    changeDue: isUrdu ? 'بقایا رقم:' : isBilingual ? 'Change / بقایا:' : 'Change Due:',
    unitLabel: isUrdu ? 'عدد' : 'units',
    poweredBy: isUrdu ? 'اومنی پوز سافٹ ویئر سسٹم' : 'OmniPOS Software System',
  };

  const linesHtml = (order.lines || [])
    .map((line: any) => {
      let displayName = line.name;
      if (isUrdu) {
        displayName = line.nameUrdu || line.name;
      } else if (isBilingual) {
        if (line.nameUrdu && line.nameUrdu.trim() !== line.name.trim()) {
          displayName = `<div>${line.name}</div><div style="font-size: 10px; font-weight: 700; color: #222; margin-top: 1px;">${line.nameUrdu}</div>`;
        } else {
          displayName = line.name;
        }
      }

      return `
      <tr style="border-bottom: 1px dashed #CCC;">
        <td style="padding: 4px 0; font-size: ${isUrdu ? '12px' : '11.5px'}; font-weight: 700; line-height: 1.3; vertical-align: top; word-break: break-word; text-align: ${isRtl ? 'right' : 'left'};">
          ${displayName}
          ${line.variantLabel ? `<div style="font-size: 9.5px; color: #333; font-weight: 600;">${isUrdu ? 'قسم:' : 'Var:'} ${line.variantLabel}</div>` : ''}
          ${line.notes ? `<div style="font-size: 9.5px; font-style: italic; color: #555;">${isUrdu ? 'نوٹ:' : 'Note:'} ${line.notes}</div>` : ''}
        </td>
        <td style="padding: 4px 0; font-size: 11px; text-align: center; vertical-align: top; font-weight: 600;">
          ${line.quantity}
        </td>
        <td style="padding: 4px 0; font-size: 11px; text-align: right; vertical-align: top; white-space: nowrap;">
          ${line.unitPrice.toLocaleString()}
        </td>
        <td style="padding: 4px 0; font-size: 11.5px; font-weight: 800; text-align: right; vertical-align: top; white-space: nowrap;">
          ${(line.unitPrice * line.quantity).toLocaleString()}
        </td>
      </tr>
    `;
    })
    .join('');

  const totalQty = (order.lines || []).reduce((sum, l) => sum + (l.quantity || 1), 0);
  const subtotal = (order.lines || []).reduce((sum, l) => sum + (l.unitPrice || 0) * (l.quantity || 1), 0);
  const discountAmount = order.discountPercent && order.discountPercent > 0
    ? Math.round((subtotal * order.discountPercent) / 100)
    : 0;
  const totalAmount = order.totalAmount || 0;
  let paymentMode = (options?.paymentMode || (order as any).paymentMethod || 'Cash').toUpperCase();
  if (isUrdu) {
    if (paymentMode.includes('CASH')) paymentMode = 'نقد (CASH)';
    else if (paymentMode.includes('CARD')) paymentMode = 'کارڈ (CARD)';
    else if (paymentMode.includes('KHATA')) paymentMode = 'کھاتہ / ادھار';
  }
  const tendered = options?.tenderedAmount;
  const changeDue = tendered !== undefined && tendered >= totalAmount ? tendered - totalAmount : 0;

  const fontStack = `'Noto Sans Arabic', 'Segoe UI', Tahoma, 'Urdu Typesetting', 'Courier New', Courier, monospace, system-ui, sans-serif`;

  return `<!DOCTYPE html>
<html lang="${isUrdu ? 'ur' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>Receipt #${order.id.slice(-6).toUpperCase()}</title>
  <style>
    @page {
      margin: 0;
      size: ${is58mm ? '58mm 297mm' : '80mm 297mm'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      font-family: Arial, "Segoe UI", Tahoma, sans-serif;
      direction: ${isRtl ? 'rtl' : 'ltr'};
      width: 100%;
      max-width: ${targetWidth};
      margin: 0 auto;
      padding: 2mm 1mm 4mm 1mm;
      color: #000000 !important;
      background: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.35;
      overflow-x: hidden;
    }
    .header {
      text-align: center;
      padding-bottom: 5px;
      margin-bottom: 5px;
      border-bottom: 2px solid #000;
      word-break: break-word;
    }
    .store-name {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.3px;
      word-break: break-word;
    }
    .store-sub {
      font-size: 11.5px;
      color: #000;
      font-weight: 700;
      margin-top: 1.5px;
      word-break: break-word;
    }
    .token-box {
      border: 2px solid #000;
      padding: 6px;
      margin: 6px 0;
      text-align: center;
    }
    .token-num {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.5px;
    }
    .meta-table {
      width: 100%;
      table-layout: fixed;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 5px;
      border-bottom: 1.5px solid #000;
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
      border-bottom: 2px solid #000;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .totals-table {
      width: 100%;
      table-layout: fixed;
      margin-top: 5px;
      border-top: 2px solid #000;
      padding-top: 3px;
      font-size: 13px;
      font-weight: 700;
    }
    .grand-total {
      font-size: 16px;
      font-weight: 900;
      border-top: 1.5px solid #000;
      border-bottom: 2px solid #000;
      padding: 4px 0;
      margin-top: 4px;
    }
    .google-qr-box {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1.5px solid #000;
      text-align: center;
    }
    .google-qr-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.3px;
    }
    .google-qr-sub {
      font-size: 10px;
      color: #000;
      margin-top: 2px;
    }
    .google-qr-img {
      width: 95px;
      height: 95px;
      margin: 4px auto 2px auto;
      display: block;
    }
    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      color: #000;
      border-top: 1.5px solid #000;
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
    ${phone ? `<div class="store-sub">${isUrdu ? 'فون:' : 'Tel:'} ${phone}</div>` : ''}
    ${headerNote ? `<div class="store-sub" style="font-style: italic; margin-top: 3px;">"${headerNote}"</div>` : ''}
  </div>

  <!-- Token / Table Badge -->
  <div class="token-box">
    <div class="token-num">${tableOrToken}</div>
  </div>

  <!-- Order Meta -->
  <table class="meta-table">
    <tr>
      <td style="text-align: ${isRtl ? 'right' : 'left'};"><strong>${L.invoice}</strong> #${order.id.slice(-6).toUpperCase()}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'};"><strong>${L.date}</strong> ${orderDate}</td>
    </tr>
    <tr>
      <td style="text-align: ${isRtl ? 'right' : 'left'};"><strong>${L.server}</strong> ${cashier}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'};"><strong>${L.time}</strong> ${orderTime}</td>
    </tr>
    ${order.customerName ? `<tr><td colspan="2" style="font-weight: bold; text-align: ${isRtl ? 'right' : 'left'};">${L.customer} ${order.customerName}</td></tr>` : ''}
  </table>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr class="items-head">
        <th style="text-align: ${isRtl ? 'right' : 'left'}; padding-bottom: 4px; width: 44%;">${L.item}</th>
        <th style="text-align: center; padding-bottom: 4px; width: 14%;">${L.qty}</th>
        <th style="text-align: right; padding-bottom: 4px; width: 20%;">${L.price}</th>
        <th style="text-align: right; padding-bottom: 4px; width: 22%;">${L.total}</th>
      </tr>
    </thead>
    <tbody>
      ${linesHtml}
    </tbody>
  </table>

  <!-- Totals -->
  <table class="totals-table">
    <tr>
      <td style="text-align: ${isRtl ? 'right' : 'left'};">${L.totalItems}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'}; font-weight: bold;">${totalQty} ${L.unitLabel}</td>
    </tr>
    ${
      discountAmount > 0
        ? `
    <tr>
      <td style="text-align: ${isRtl ? 'right' : 'left'};">${L.subtotal}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'};">${currency} ${subtotal.toLocaleString()}</td>
    </tr>
    <tr style="font-weight: bold;">
      <td style="text-align: ${isRtl ? 'right' : 'left'};">${L.discount(order.discountPercent)}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'};">-${currency} ${discountAmount.toLocaleString()}</td>
    </tr>
    `
        : ''
    }
    <tr class="grand-total">
      <td style="text-align: ${isRtl ? 'right' : 'left'};">${L.netTotal}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'};">${currency} ${totalAmount.toLocaleString()}</td>
    </tr>
    <tr>
      <td style="padding-top: 4px; text-align: ${isRtl ? 'right' : 'left'};">${L.paymentMethod}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'}; padding-top: 4px; font-weight: bold;">${paymentMode}</td>
    </tr>
    ${
      tendered !== undefined && tendered >= totalAmount
        ? `
    <tr>
      <td style="text-align: ${isRtl ? 'right' : 'left'};">${L.cashTendered}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'};">${currency} ${tendered.toLocaleString()}</td>
    </tr>
    <tr style="font-weight: bold; font-size: 13px;">
      <td style="text-align: ${isRtl ? 'right' : 'left'};">${L.changeDue}</td>
      <td style="text-align: ${isRtl ? 'left' : 'right'};">${currency} ${changeDue.toLocaleString()}</td>
    </tr>
    `
        : ''
    }
  </table>

  <!-- Google Review / Maps QR Code (if configured) -->
  ${(() => {
    const showGoogleQr =
      options?.storeSettings?.showGoogleMapQrOnReceipt !== false &&
      !!(options?.googleQrDataUrl || options?.storeSettings?.googleMapsUrl);

    if (!showGoogleQr || !options?.googleQrDataUrl) return '';

    const isMapAction = options?.storeSettings?.googleQrAction === 'map';
    const qrTitle = isMapAction
      ? isUrdu
        ? 'گوگل میپ پر ہماری لوکیشن دیکھیں'
        : isBilingual
        ? 'Locate on Google Maps / گوگل لوکیشن'
        : 'Locate us on Google Maps'
      : isUrdu
      ? 'گوگل پر ہمیں ریٹنگ دیں'
      : isBilingual
      ? 'Rate Us on Google / گوگل پر ریٹنگ دیں'
      : 'Rate us on Google Maps';

    const qrSub = isUrdu
      ? 'موبائل کیمرہ سے کیو آر کوڈ اسکین کریں'
      : isBilingual
      ? 'Scan with phone camera / کیمرہ سے اسکین کریں'
      : 'Scan with camera to review us';

    return `
  <div class="google-qr-box">
    <div class="google-qr-title">${qrTitle}</div>
    <img class="google-qr-img" src="${options.googleQrDataUrl}" alt="Google Maps QR" />
    <div class="google-qr-sub">${qrSub}</div>
  </div>`;
  })()}

  <!-- Footer -->
  <div class="footer">
    <div>${footerNote}</div>
    <div style="font-size: 9px; color: #888; margin-top: 4px;">${L.poweredBy}</div>
  </div>

  <!-- Feed space for cutter / tear-bar clearance -->
  <div style="height: 18mm; min-height: 50px;"></div>
</body>
</html>`;
}

/**
 * Direct print of Customer Thermal Receipt
 */
export async function printCustomerReceipt(order: Order, options?: ReceiptPrintOptions): Promise<boolean> {
  const storeSettings =
    options?.storeSettings ||
    storage.getItem<StoreSettings>(KEYS.storeSettings, {} as any);

  let googleQrDataUrl = options?.googleQrDataUrl;
  const showGoogleQr =
    storeSettings?.showGoogleMapQrOnReceipt !== false &&
    !!storeSettings?.googleMapsUrl;

  if (showGoogleQr && !googleQrDataUrl && storeSettings?.googleMapsUrl) {
    try {
      googleQrDataUrl = await generateQrDataUrl(storeSettings.googleMapsUrl, {
        width: 130,
        margin: 1,
      });
    } catch {
      /* ignore */
    }
  }

  const html = generateCustomerReceiptHtml(order, {
    ...options,
    storeSettings,
    googleQrDataUrl,
  });

  return await posApi.printReceipt({
    html,
    printerName: storeSettings?.receiptPrinterName,
    silent: storeSettings?.silentPrint ?? true,
  });
}

/**
 * Generate standard 80mm / 58mm Thermal Printer Test Receipt HTML
 */
export function generateTestReceiptHtml(
  settings?: Partial<StoreSettings>,
  targetType: 'receipt' | 'kot' = 'receipt',
): string {
  const is58mm = settings?.paperWidth === '58mm';
  const targetWidth = is58mm ? '48mm' : '72mm';
  const storeName = settings?.storeName || 'OMNIPOS POS SYSTEM';
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const printerName =
    targetType === 'receipt'
      ? settings?.receiptPrinterName || 'Auto-Detected Thermal Printer'
      : settings?.kotPrinterName || settings?.receiptPrinterName || 'Auto-Detected KOT Printer';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>OmniPOS Printer Test</title>
  <style>
    @page {
      margin: 0;
      size: ${is58mm ? '58mm 297mm' : '80mm 297mm'};
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      font-family: Arial, "Segoe UI", Tahoma, sans-serif;
      width: 100%;
      max-width: ${targetWidth};
      margin: 0 auto;
      padding: 2mm 1mm;
      color: #000000 !important;
      background: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.35;
      overflow-x: hidden;
    }
    .header {
      text-align: center;
      padding-bottom: 5px;
      margin-bottom: 5px;
      border-bottom: 2px solid #000;
    }
    .store-name {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 0.3px;
    }
    .badge {
      border: 2px solid #000;
      padding: 6px;
      margin: 6px 0;
      text-align: center;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 0.5px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      font-weight: 700;
      margin: 6px 0;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
    }
    .info-table td {
      padding: 2px 0;
    }
    .label {
      font-weight: 900;
      width: 45%;
    }
    .val {
      text-align: right;
      font-weight: 700;
      word-break: break-all;
    }
    .section-title {
      font-weight: 900;
      font-size: 13px;
      margin-top: 8px;
      margin-bottom: 3px;
      text-transform: uppercase;
      border-bottom: 1.5px solid #000;
    }
    .test-pattern {
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.4;
      margin: 3px 0;
    }
    .align-left { text-align: left; }
    .align-center { text-align: center; }
    .align-right { text-align: right; }
    .bold { font-weight: 900; }
    .inverse {
      background: #000;
      color: #fff !important;
      padding: 3px 6px;
      font-weight: 900;
      display: inline-block;
      margin: 3px 0;
    }
    .urdu-text {
      font-family: 'Noto Nastaliq Urdu', 'Noto Sans Arabic', Tahoma, sans-serif;
      direction: rtl;
      text-align: center;
      font-size: 16px;
      font-weight: 900;
      margin: 6px 0;
    }
    .footer {
      margin-top: 8px;
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      border-top: 2px solid #000;
      padding-top: 6px;
    }
    .feed-space {
      height: 20mm;
      min-height: 60px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${storeName}</div>
    ${settings?.address ? `<div style="font-size: 9.5px; margin-top: 2px;">${settings.address}</div>` : ''}
    ${settings?.phone ? `<div style="font-size: 9.5px;">Tel: ${settings.phone}</div>` : ''}
  </div>

  <div class="badge">
    *** THERMAL TEST (${targetType === 'receipt' ? 'RECEIPT' : 'KITCHEN KOT'}) ***
  </div>

  <table class="info-table">
    <tr>
      <td class="label">Date:</td>
      <td class="val">${dateStr}</td>
    </tr>
    <tr>
      <td class="label">Time:</td>
      <td class="val">${timeStr}</td>
    </tr>
    <tr>
      <td class="label">Printer:</td>
      <td class="val">${printerName}</td>
    </tr>
    <tr>
      <td class="label">Roll Width:</td>
      <td class="val">${settings?.paperWidth || '80mm'}</td>
    </tr>
    <tr>
      <td class="label">Auto-Cut:</td>
      <td class="val">${settings?.autoCut ? 'Enabled (Full Cut)' : 'Disabled'}</td>
    </tr>
    <tr>
      <td class="label">Cash Drawer:</td>
      <td class="val">${settings?.drawerKick ? 'Enabled (24V Kick)' : 'Disabled'}</td>
    </tr>
    <tr>
      <td class="label">Silent Mode:</td>
      <td class="val">${settings?.silentPrint !== false ? 'Enabled (Direct)' : 'Disabled (Prompt)'}</td>
    </tr>
  </table>

  <div class="section-title">1. Alignment &amp; Font Test</div>
  <div class="test-pattern align-left">Left: [OK] ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
  <div class="test-pattern align-center">Center: [OK] 1234567890</div>
  <div class="test-pattern align-right">Right: [OK] abcdefghijklmnopqrstuvwxyz</div>
  <div class="test-pattern bold">Bold Text Test: [PASSED] 100% OK</div>
  <div style="text-align: center; margin: 4px 0;">
    <span class="inverse"> INVERTED WHITE ON BLACK </span>
  </div>

  <div class="section-title">2. Urdu / Bilingual Test</div>
  <div class="urdu-text">تھرمل پرنٹر ٹیسٹ کامیاب ہے</div>
  <div style="text-align: center; font-size: 10px; color: #333;">Thermal Printer Test Successful</div>

  <div class="footer">
    <div style="font-weight: bold; font-size: 11px;">OmniPOS Hardware Engine</div>
    <div style="font-size: 9px; margin-top: 2px;">If this ticket printed cleanly, your printer is 100% ready!</div>
  </div>

  <!-- Feed space so ticket passes cutter/tear bar -->
  <div class="feed-space"></div>
</body>
</html>`;
}

/**
 * Direct print of Thermal Printer Test Ticket
 */
export async function printTestReceipt(
  settings?: Partial<StoreSettings>,
  targetType: 'receipt' | 'kot' = 'receipt',
): Promise<boolean> {
  const currentSettings =
    settings || storage.getItem<StoreSettings>(KEYS.storeSettings, {} as any);

  const html = generateTestReceiptHtml(currentSettings, targetType);
  const targetPrinter =
    targetType === 'receipt'
      ? currentSettings?.receiptPrinterName
      : currentSettings?.kotPrinterName || currentSettings?.receiptPrinterName;

  return await posApi.printReceipt({
    html,
    printerName: targetPrinter,
    silent: currentSettings?.silentPrint ?? true,
  });
}
