import { Order } from './types';
import { posApi } from './api';
import { StoreSettings } from '@/features/admin/AdminSettingsView';
import { generateQrDataUrl } from './qrCode';
import { getEffectiveGoogleQrUrl } from './googleMapsUrl';
import { generateBarcodeDataUrl } from './barcodeGenerator';
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
  billBarcodeDataUrl?: string;
}

/**
 * Generate standard 80mm / 58mm customer thermal receipt HTML with Full Urdu / Bilingual support
 */
export function generateCustomerReceiptHtml(order: Order, options?: ReceiptPrintOptions): string {
  const lang = options?.language || options?.storeSettings?.receiptLanguage || 'english';
  const isUrdu = lang === 'urdu';
  const isBilingual = lang === 'bilingual';
  const isRtl = isUrdu;

  const defaultStoreName = options?.storeSettings?.storeName || 'Omnipos Store';
  const storeName = options?.storeSettings?.storeName || defaultStoreName;
  const storeNameUrdu = options?.storeSettings?.storeNameUrdu || '';

  const address = options?.storeSettings?.address || '';
  const phone = options?.storeSettings?.phone || '';
  const currency = isUrdu ? 'روپے' : options?.currency || options?.storeSettings?.currency || 'Rs.';

  const is58mm = options?.storeSettings?.paperWidth === '58mm';
  const configuredWidth = options?.storeSettings?.printerPrintWidth;
  const targetWidth =
    configuredWidth && configuredWidth !== 'auto'
      ? configuredWidth
      : is58mm
        ? '48mm'
        : '72mm';
  const shiftRight = options?.storeSettings?.printerShiftRight || '0mm';
  const spaceTop = options?.storeSettings?.printerSpaceTop || '0mm';
  const extraBottom = options?.storeSettings?.printerExtraBottom || '0mm';

  const billNo = order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#000000';
  const orderDate = new Date(order.createdAt || Date.now());
  const dateFormatted = orderDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeFormatted = orderDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateTimeStr = `${dateFormatted}, ${timeFormatted}`;

  const isPaid = ((order as any).paymentStatus || (order as any).status || 'paid').toLowerCase() !== 'unpaid';
  const statusLabel = isUrdu
    ? isPaid ? 'ادا شدہ (PAID)' : 'غیر ادا شدہ (UNPAID)'
    : isPaid ? 'PAID' : 'UNPAID';

  const customer =
    order.customerName && order.customerName !== 'Walk-In Customer' && order.customerName !== 'Guest'
      ? order.customerName
      : '';

  const subtotal = (order.lines || []).reduce(
    (sum, l) => sum + (l.unitPrice || 0) * (l.quantity || 1),
    0,
  );
  const discountAmount =
    order.discountPercent && order.discountPercent > 0
      ? Math.round((subtotal * order.discountPercent) / 100)
      : 0;
  const totalAmount = order.totalAmount || subtotal - discountAmount;

  let rawPaymentMode = (options?.paymentMode || (order as any).paymentMethod || 'Cash').toLowerCase();
  let paymentModeLabel = 'Cash';
  if (rawPaymentMode.includes('card')) paymentModeLabel = 'Card';
  else if (rawPaymentMode.includes('khata')) paymentModeLabel = 'Khata';

  if (isUrdu) {
    if (paymentModeLabel === 'Cash') paymentModeLabel = 'نقد (Cash)';
    else if (paymentModeLabel === 'Card') paymentModeLabel = 'کارڈ (Card)';
    else if (paymentModeLabel === 'Khata') paymentModeLabel = 'کھاتہ (Khata)';
  }

  const tendered = options?.tenderedAmount;
  const changeDue = tendered !== undefined && tendered >= totalAmount ? tendered - totalAmount : 0;

  const defaultFooterNote = 'Thank you for your visit! Goods once sold are not refundable.';
  const footerNote = isUrdu
    ? options?.storeSettings?.footerNoteUrdu || options?.storeSettings?.footerNote || 'تشریف آوری کا شکریہ! خریدا ہوا مال واپس یا تبدیل نہیں ہو سکتا۔'
    : options?.storeSettings?.footerNote || defaultFooterNote;

  const itemsHtml = (order.lines || [])
    .map((line: any) => {
      let displayName = line.name || 'Item';
      if (line.variantLabel) {
        displayName += ` (${line.variantLabel})`;
      }
      const urduName = line.nameUrdu ? line.nameUrdu.trim() : '';
      const lineTotal = ((line.unitPrice || 0) * (line.quantity || 1)).toLocaleString();
      const qtyStr = line.quantity;
      const unitPriceStr = (line.unitPrice || 0).toLocaleString();

      return `
      <div class="item-row">
        <div class="item-header">
          <span class="item-name">${displayName}</span>
          <span class="item-total">${lineTotal}</span>
        </div>
        <div class="item-sub">
          <span>${qtyStr} × ${unitPriceStr}</span>
          ${urduName ? `<span class="urdu-item">${urduName}</span>` : '<span></span>'}
        </div>
        ${line.notes ? `<div style="font-size: 9.5px; font-style: italic; color: #555;">Note: ${line.notes}</div>` : ''}
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="${isUrdu ? 'ur' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>Receipt ${billNo}</title>
  <style>
    @page {
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
    }
    body {
      font-family: Arial, "Segoe UI", Tahoma, sans-serif;
      direction: ${isRtl ? 'rtl' : 'ltr'};
      width: ${targetWidth};
      max-width: ${targetWidth};
      margin: 0;
      padding: 0;
      padding-left: ${shiftRight};
      padding-top: ${spaceTop};
      padding-bottom: ${extraBottom};
      box-sizing: border-box;
      color: #000000 !important;
      background: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.35;
      overflow: hidden;
    }
    .header {
      text-align: center;
      margin-bottom: 6px;
    }
    .store-name {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.2px;
    }
    .urdu-name {
      font-size: 14px;
      font-weight: 800;
      font-family: 'Urdu Typesetting', Tahoma, sans-serif;
      margin-top: 2px;
    }
    .meta-sub {
      font-size: 11px;
      margin-top: 2px;
      font-weight: 600;
    }
    .dash-line {
      border-bottom: 1px dashed #444;
      margin: 6px 0;
    }
    .bill-meta {
      font-size: 11px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
    }
    .item-row {
      margin: 5px 0;
      font-size: 12px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      font-weight: 800;
    }
    .item-name {
      flex: 1;
      word-break: break-word;
      padding-right: 6px;
    }
    .item-total {
      white-space: nowrap;
      font-weight: 800;
    }
    .item-sub {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 600;
      color: #333;
      margin-top: 1px;
    }
    .urdu-item {
      font-family: 'Urdu Typesetting', Tahoma, sans-serif;
      font-size: 12px;
      text-align: right;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: 900;
      margin: 4px 0;
    }
    .tender-row {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      font-weight: 700;
      margin: 2px 0;
    }
    .footer-text {
      text-align: center;
      font-size: 11px;
      font-weight: 700;
      margin-top: 6px;
      line-height: 1.4;
    }
    .qr-container {
      text-align: center;
      margin-top: 8px;
    }
    .qr-img {
      width: 85px;
      height: 85px;
      margin: 0 auto;
      display: block;
    }
    .barcode-container {
      text-align: center;
      margin-top: 8px;
    }
    .barcode-img {
      max-width: 90%;
      height: 35px;
      margin: 0 auto;
      display: block;
    }
  </style>
</head>
<body>
  <!-- Store Header -->
  <div class="header">
    <div class="store-name">${storeName}</div>
    ${storeNameUrdu ? `<div class="urdu-name">${storeNameUrdu}</div>` : ''}
    ${address ? `<div class="meta-sub">${address}</div>` : ''}
    ${phone ? `<div class="meta-sub">${phone}</div>` : ''}
  </div>

  <div class="dash-line"></div>

  <!-- Bill Metadata (Bill # and PAID/Date) -->
  <div class="bill-meta">
    <span>Bill ${billNo}</span>
    <span style="font-weight: 800;">${statusLabel}</span>
  </div>
  <div style="font-size: 10px; color: #333; margin-top: 2px; font-weight: 600;">
    ${dateTimeStr}
  </div>
  ${customer ? `<div style="font-size: 11px; font-weight: 700; margin-top: 2px;">Customer: ${customer}</div>` : ''}

  <div class="dash-line"></div>

  <!-- Items list (clean 2-line layout) -->
  ${itemsHtml}

  <div class="dash-line"></div>

  <!-- Totals Section -->
  <div class="total-row">
    <span>TOTAL</span>
    <span>${currency} ${totalAmount.toLocaleString()}</span>
  </div>

  ${
    discountAmount > 0
      ? `
  <div class="tender-row">
    <span>Discount (${order.discountPercent}%)</span>
    <span>-${currency} ${discountAmount.toLocaleString()}</span>
  </div>`
      : ''
  }

  ${
    tendered !== undefined && tendered >= totalAmount
      ? `
  <div class="tender-row">
    <span>Paid by ${paymentModeLabel}</span>
    <span>${tendered.toLocaleString()}</span>
  </div>
  <div class="tender-row">
    <span>Change</span>
    <span>${changeDue.toLocaleString()}</span>
  </div>`
      : `
  <div class="tender-row">
    <span>Paid by ${paymentModeLabel}</span>
    <span>${totalAmount.toLocaleString()}</span>
  </div>`
  }

  <div class="dash-line"></div>

  <!-- Footer Note -->
  <div class="footer-text">${footerNote}</div>

  <!-- Google Review / Maps QR Code (if configured) -->
  ${
    options?.googleQrDataUrl && options?.storeSettings?.showGoogleMapQrOnReceipt !== false
      ? `
  <div class="qr-container">
    <img class="qr-img" src="${options.googleQrDataUrl}" alt="Google QR" />
    <div style="font-size: 9px; color: #444; margin-top: 2px;">
      ${options?.storeSettings?.googleQrAction === 'map' ? 'Scan to view location on Google Maps' : 'Scan to rate & review us on Google'}
    </div>
  </div>`
      : ''
  }

  <!-- Bill Barcode for Scanner Lookup -->
  ${
    options?.billBarcodeDataUrl
      ? `
  <div class="barcode-container">
    <img class="barcode-img" src="${options.billBarcodeDataUrl}" alt="Bill Barcode" />
    <div style="font-size: 9px; font-family: monospace; color: #444; margin-top: 2px;">${order.id}</div>
  </div>`
      : ''
  }

  <!-- Feed space for tear-bar / auto-cutter -->
  <div style="height: calc(18mm + ${extraBottom}); min-height: 50px;"></div>
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
  const effectiveGoogleUrl = getEffectiveGoogleQrUrl(storeSettings);
  const showGoogleQr =
    storeSettings?.showGoogleMapQrOnReceipt !== false &&
    !!effectiveGoogleUrl;

  if (showGoogleQr && !googleQrDataUrl && effectiveGoogleUrl) {
    try {
      googleQrDataUrl = await generateQrDataUrl(effectiveGoogleUrl, {
        width: 130,
        margin: 1,
      });
    } catch {
      /* ignore */
    }
  }

  let billBarcodeDataUrl = options?.billBarcodeDataUrl;
  if (!billBarcodeDataUrl && order?.id) {
    try {
      billBarcodeDataUrl = generateBarcodeDataUrl(order.id, {
        width: 1.5,
        height: 38,
        displayValue: false,
      });
    } catch {
      /* ignore */
    }
  }

  const html = generateCustomerReceiptHtml(order, {
    ...options,
    storeSettings,
    googleQrDataUrl,
    billBarcodeDataUrl,
  });

  return await posApi.printReceipt({
    html,
    printerName: storeSettings?.receiptPrinterName,
    silent: storeSettings?.silentPrint ?? true,
    copies: storeSettings?.receiptCopies || 1,
    is58mm: storeSettings?.paperWidth === '58mm',
    printWidth: storeSettings?.printerPrintWidth || 'auto',
  });
}

/**
 * Generate sample customer receipt HTML for live preview and "Print sample receipt"
 */
export function generateSampleReceiptHtml(
  settings?: Partial<StoreSettings>,
  sampleQrDataUrl?: string,
): string {
  const is58mm = settings?.paperWidth === '58mm';
  const configuredWidth = settings?.printerPrintWidth;
  const targetWidth =
    configuredWidth && configuredWidth !== 'auto'
      ? configuredWidth
      : is58mm
        ? '48mm'
        : '72mm';
  const shiftRight = settings?.printerShiftRight || '0mm';
  const spaceTop = settings?.printerSpaceTop || '0mm';
  const extraBottom = settings?.printerExtraBottom || '0mm';

  const storeName = settings?.storeName || 'Al-Jannat Sweets & Bakers';
  const storeNameUrdu = settings?.storeNameUrdu || 'الجنت سویٹس اینڈ بیکرز';
  const address = settings?.address || 'Grain Market Phularwan';
  const phone = settings?.phone || '0307-4099638';
  const footerNote = settings?.footerNote || 'Serving quality with a smile. Thank you!';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sample Thermal Receipt</title>
  <style>
    @page { margin: 0; }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
    }
    body {
      font-family: Arial, "Segoe UI", Tahoma, sans-serif;
      width: ${targetWidth};
      max-width: ${targetWidth};
      margin: 0;
      padding: 0;
      padding-left: ${shiftRight};
      padding-top: ${spaceTop};
      padding-bottom: ${extraBottom};
      box-sizing: border-box;
      color: #000000 !important;
      background: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.35;
      overflow: hidden;
    }
    .header { text-align: center; margin-bottom: 6px; }
    .store-name { font-size: 16px; font-weight: 900; }
    .urdu-name { font-size: 14px; font-weight: 800; font-family: 'Urdu Typesetting', Tahoma, sans-serif; margin-top: 2px; }
    .meta-sub { font-size: 11px; margin-top: 2px; font-weight: 600; }
    .dash-line { border-bottom: 1px dashed #000; margin: 6px 0; }
    .bill-meta { font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; margin-bottom: 3px; }
    .item-row { margin: 4px 0; font-size: 12px; }
    .item-header { display: flex; justify-content: space-between; font-weight: 800; }
    .item-sub { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #222; }
    .urdu-item { font-family: 'Urdu Typesetting', Tahoma, sans-serif; font-size: 12px; text-align: right; }
    .total-row { display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; margin: 4px 0; }
    .tender-row { display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; margin: 2px 0; }
    .footer-text { text-align: center; font-size: 11px; font-weight: 700; margin-top: 6px; }
    .qr-container { text-align: center; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="store-name">${storeName}</div>
    ${storeNameUrdu ? `<div class="urdu-name">${storeNameUrdu}</div>` : ''}
    ${address ? `<div class="meta-sub">${address}</div>` : ''}
    ${phone ? `<div class="meta-sub">${phone}</div>` : ''}
  </div>

  <div class="dash-line"></div>

  <div class="bill-meta">
    <span>Bill #I-0123</span>
    <span>PAID</span>
  </div>
  <div class="bill-meta" style="font-size: 10px; opacity: 0.9;">
    <span>24-Nov-2026, 11:05 am</span>
  </div>

  <div class="dash-line"></div>

  <div class="item-row">
    <div class="item-header">
      <span>Gulab Jamun (1/2 Kg)</span>
      <span>600</span>
    </div>
    <div class="item-sub">
      <span>1 × 600</span>
      <span class="urdu-item">گلاب جامن</span>
    </div>
  </div>

  <div class="item-row">
    <div class="item-header">
      <span>Cake Rusk</span>
      <span>450</span>
    </div>
    <div class="item-sub">
      <span>500 g × 900</span>
      <span class="urdu-item">کیک رس</span>
    </div>
  </div>

  <div class="item-row">
    <div class="item-header">
      <span>Coca-Cola 500ml</span>
      <span>240</span>
    </div>
    <div class="item-sub">
      <span>2 × 120</span>
      <span></span>
    </div>
  </div>

  <div class="dash-line"></div>

  <div class="total-row">
    <span>TOTAL</span>
    <span>Rs. 1,290</span>
  </div>

  <div class="tender-row">
    <span>Paid by Cash</span>
    <span>1,500</span>
  </div>
  <div class="tender-row">
    <span>Change</span>
    <span>210</span>
  </div>

  <div class="dash-line"></div>

  <div class="footer-text">${footerNote}</div>

  ${
    sampleQrDataUrl
      ? `<div class="qr-container"><img src="${sampleQrDataUrl}" style="width: 85px; height: 85px; margin: 4px auto; display: block;" alt="QR" /></div>`
      : ''
  }

  <div style="height: calc(18mm + ${extraBottom}); min-height: 50px;"></div>
</body>
</html>`;
}

/**
 * Generate test edges page HTML for hardware roll/margins calibration
 */
export function generateTestEdgesPageHtml(settings?: Partial<StoreSettings>): string {
  const is58mm = settings?.paperWidth === '58mm';
  const configuredWidth = settings?.printerPrintWidth;
  const targetWidth =
    configuredWidth && configuredWidth !== 'auto'
      ? configuredWidth
      : is58mm
        ? '48mm'
        : '72mm';
  const shiftRight = settings?.printerShiftRight || '0mm';
  const spaceTop = settings?.printerSpaceTop || '0mm';
  const extraBottom = settings?.printerExtraBottom || '0mm';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>OmniPOS Edge Calibration Test</title>
  <style>
    @page { margin: 0; }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
    }
    body {
      font-family: Arial, monospace, sans-serif;
      width: ${targetWidth};
      max-width: ${targetWidth};
      margin: 0;
      padding: 0;
      padding-left: ${shiftRight};
      padding-top: ${spaceTop};
      padding-bottom: ${extraBottom};
      box-sizing: border-box;
      color: #000000 !important;
      background: #ffffff !important;
      font-size: 11px;
      line-height: 1.3;
      overflow: hidden;
    }
    .edge-box {
      border: 2px solid #000;
      padding: 4px;
      text-align: center;
      margin: 4px 0;
      font-weight: 800;
    }
    .edge-top {
      border-top: 4px solid #000;
      background: #eee;
    }
    .edge-bottom {
      border-bottom: 4px solid #000;
      background: #eee;
    }
    .side-ruler {
      display: flex;
      justify-content: space-between;
      border-left: 3px solid #000;
      border-right: 3px solid #000;
      padding: 6px 4px;
      margin: 4px 0;
      font-size: 10px;
      font-weight: 700;
    }
    .guide-box {
      border: 1px dashed #000;
      padding: 6px;
      font-size: 9.5px;
      margin: 4px 0;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="edge-box edge-top">
    ▲ ▲ ▲ TOP EDGE ▲ ▲ ▲<br/>
    <span style="font-size: 9px; font-weight: normal;">If cut at top, increase "Space at top"</span>
  </div>

  <div class="side-ruler">
    <span>◄ LEFT</span>
    <span style="font-weight: 900;">CALIBRATION</span>
    <span>RIGHT ►</span>
  </div>

  <div style="border-left: 2px solid #000; border-right: 2px solid #000; padding: 4px; font-size: 10px;">
    <div><strong>Target Width:</strong> ${targetWidth} (${settings?.paperWidth || '80mm'})</div>
    <div><strong>Shift Right:</strong> ${shiftRight}</div>
    <div><strong>Space Top:</strong> ${spaceTop}</div>
    <div><strong>Extra Bottom:</strong> ${extraBottom}</div>
    <div style="font-family: monospace; font-size: 9px; margin-top: 4px;">|10mm---20mm---30mm---40mm---50mm---60mm---70mm|</div>
  </div>

  <div class="guide-box">
    <strong>Adjustment Guide:</strong><br/>
    • <strong>Cut on right?</strong> Choose smaller Print width.<br/>
    • <strong>Cut on left?</strong> Increase Shift right.<br/>
    • <strong>Too close to top?</strong> Increase Space at top.<br/>
    • <strong>Cutter cuts last line?</strong> Increase Extra paper at bottom.
  </div>

  <div class="edge-box edge-bottom">
    ▼ ▼ ▼ BOTTOM EDGE ▼ ▼ ▼<br/>
    <span style="font-size: 9px; font-weight: normal;">Cutter must cut AFTER this box</span>
  </div>

  <div style="height: calc(20mm + ${extraBottom}); min-height: 60px;"></div>
</body>
</html>`;
}

/**
 * Print Sample Receipt
 */
export async function printSampleReceipt(settings?: Partial<StoreSettings>): Promise<boolean> {
  const currentSettings =
    settings || storage.getItem<StoreSettings>(KEYS.storeSettings, {} as any);

  let qrDataUrl = '';
  const effectiveGoogleUrl = getEffectiveGoogleQrUrl(currentSettings);
  if (effectiveGoogleUrl) {
    try {
      qrDataUrl = await generateQrDataUrl(effectiveGoogleUrl, { width: 120, margin: 1 });
    } catch {
      /* ignore */
    }
  }
  if (!qrDataUrl) {
    try {
      qrDataUrl = await generateQrDataUrl('https://maps.google.com', { width: 120, margin: 1 });
    } catch {
      /* ignore */
    }
  }

  const html = generateSampleReceiptHtml(currentSettings, qrDataUrl);
  return await posApi.printReceipt({
    html,
    printerName: currentSettings?.receiptPrinterName,
    silent: currentSettings?.silentPrint ?? true,
    copies: currentSettings?.receiptCopies || 1,
    is58mm: currentSettings?.paperWidth === '58mm',
    printWidth: currentSettings?.printerPrintWidth || 'auto',
  });
}

/**
 * Print Calibration Test Page (Edges)
 */
export async function printTestEdgesPage(settings?: Partial<StoreSettings>): Promise<boolean> {
  const currentSettings =
    settings || storage.getItem<StoreSettings>(KEYS.storeSettings, {} as any);

  const html = generateTestEdgesPageHtml(currentSettings);
  return await posApi.printReceipt({
    html,
    printerName: currentSettings?.receiptPrinterName,
    silent: currentSettings?.silentPrint ?? true,
    copies: 1,
    is58mm: currentSettings?.paperWidth === '58mm',
    printWidth: currentSettings?.printerPrintWidth || 'auto',
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
  const configuredWidth = settings?.printerPrintWidth;
  const targetWidth =
    configuredWidth && configuredWidth !== 'auto'
      ? configuredWidth
      : is58mm
        ? '48mm'
        : '72mm';
  const shiftRight = settings?.printerShiftRight || '0mm';
  const spaceTop = settings?.printerSpaceTop || '0mm';
  const extraBottom = settings?.printerExtraBottom || '0mm';

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
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #000000 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html {
      margin: 0;
      padding: 0;
      background: #ffffff !important;
    }
    body {
      font-family: Arial, "Segoe UI", Tahoma, sans-serif;
      width: ${targetWidth};
      max-width: ${targetWidth};
      margin: 0;
      padding: 0;
      padding-left: ${shiftRight};
      padding-top: ${spaceTop};
      padding-bottom: ${extraBottom};
      box-sizing: border-box;
      color: #000000 !important;
      background: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.35;
      overflow: hidden;
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
    copies: 1,
    is58mm: currentSettings?.paperWidth === '58mm',
    printWidth: currentSettings?.printerPrintWidth || 'auto',
  });
}
