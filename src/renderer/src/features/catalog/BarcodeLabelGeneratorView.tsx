import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Subtitle1,
  Caption1,
  Checkbox,
  shorthands } from '@fluentui/react-components';
import {
  BarcodeScanner24Regular,
  Print20Regular,
  Delete20Regular,
  Add20Regular,
  Sparkle20Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { Product } from '@shared/types';
import { formatPKR, uid } from '@/lib/utils';
import { storage, KEYS } from '@/lib/storage';
import { StoreSettings } from '@/features/admin/AdminSettingsView';
import { ProductAutocomplete } from '@/components/common/ProductAutocomplete';
import { BarcodeRender } from '@/components/common/BarcodeRender';
import { CustomSelect } from '@/components/ui';
import { useAppToast } from '@/context/AppNotificationContext';
import type { StockMovement } from '@shared/types';

export interface LabelQueueItem {
  /** product id + size label */
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  variant?: string;
  quantity: number;
  /** Units on hand (null = not stock-tracked) */
  stock?: number | null;
  batch?: string | null;
  expiry?: string | null;
}

/** Code-128 encodes printable ASCII only; anything else would not scan as the item's code. */
const isEncodable = (code: string) => /^[\x20-\x7E]+$/.test(code);
const PRINTED_PRICES_KEY = 'omnipos_label_prices';
const readPrinted = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(PRINTED_PRICES_KEY) || '{}');
  } catch {
    return {};
  }
};
const MAX_PER_ITEM = 500;

export type SheetLayout = 'a4_40' | 'a4_24' | 'a4_65' | 'thermal_50x25' | 'thermal_38x25' | 'thermal_80mm';

const useStyles = makeStyles({
  container: {
    paddingTop: 0,
    paddingRight: '24px',
    paddingBottom: '24px',
    paddingLeft: '24px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    backgroundColor: tokens.colorNeutralBackground2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '20px',
    paddingBottom: '16px',
    paddingLeft: '24px',
    paddingRight: '24px',
    marginLeft: '-24px',
    marginRight: '-24px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  headerTitle: {
    fontWeight: 600,
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground3,
  },
  iconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '8px',
    backgroundColor: tokens.colorStatusDangerBackground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E51937',
  },
  printBtn: {
    backgroundColor: '#E51937',
    color: '#FFFFFF',
    fontWeight: 600,
    borderRadius: '8px',
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '20px',
    alignItems: 'start',
  },
  controlPanel: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    boxShadow: tokens.shadow2,
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  queueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  queueCountText: {
    fontSize: '11.5px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
  },
  totalStickersBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#E51937',
  },
  emptyQueueText: {
    padding: '16px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground4,
    fontSize: '11.5px',
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '260px',
    overflowY: 'auto',
  },
  queueItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  queueItemInfo: {
    flexGrow: 1,
    paddingRight: '8px',
  },
  queueItemName: {
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
  },
  queueItemMeta: {
    fontSize: '10.5px',
    color: tokens.colorNeutralForeground3,
  },
  queueItemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  qtyInput: {
    width: '45px',
    padding: '2px 4px',
    borderRadius: '4px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    textAlign: 'center',
    fontSize: '11.5px',
    fontWeight: 600,
  },
  deleteBtn: {
    borderTopStyle: 'none',
    borderBottomStyle: 'none',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    backgroundColor: 'transparent',
    color: tokens.colorStatusDangerForeground1,
    cursor: 'pointer',
    padding: 0,
  },
  deleteIcon: {
    width: '14px',
    height: '14px',
  },
  layoutSelect: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    fontSize: '12.5px',
    fontWeight: 600,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  previewCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    padding: '20px',
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontWeight: 600,
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
  },
  previewCount: {
    fontSize: '11.5px',
    color: tokens.colorNeutralForeground3,
  },
  sheetPrintArea: {
    display: 'grid',
    gap: '4px',
    backgroundColor: '#FFFFFF',
    ...shorthands.border('1px', 'solid', '#E2E8F0'),
    padding: '10px',
    borderRadius: '6px',
    boxSizing: 'border-box',
  },
  emptyPreview: {
    gridColumn: '1 / -1',
    padding: '48px 20px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  emptyPreviewIcon: {
    fontSize: '32px',
    color: tokens.colorNeutralForeground3,
  },
  emptyPreviewTitle: {
    fontWeight: 600,
    fontSize: '13.5px',
    color: tokens.colorNeutralForeground2,
  },
  emptyPreviewDesc: {
    fontSize: '11.5px',
    color: tokens.colorNeutralForeground3,
    maxWidth: '340px',
  },
  stickerCard: {
    ...shorthands.border('1px', 'dashed', '#CBD5E1'),
    borderRadius: '4px',
    padding: '4px 6px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontFamily: 'system-ui, sans-serif',
    overflowX: 'hidden',
    overflowY: 'hidden',
  },
  stickerStoreName: {
    fontSize: '7.5px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    color: '#000000',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  },
  stickerProductName: {
    fontWeight: 600,
    lineHeight: 1.1,
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    color: '#000000',
    marginTop: '1px',
  },
  stickerBarcodeBox: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginTop: '1px',
    marginBottom: '1px',
  },
  stickerBottomRow: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '4px',
    paddingRight: '4px',
    boxSizing: 'border-box',
    fontWeight: 600,
    lineHeight: 1,
  },
  stickerSku: {
    fontSize: '8px',
    color: '#334155',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  stickerPrice: {
    fontWeight: 600,
    color: '#000000',
    whiteSpace: 'nowrap',
  },
});

export function BarcodeLabelGeneratorView(): React.JSX.Element {
  const styles = useStyles();

  const storeSettings = useMemo(() => {
    return storage.getItem<StoreSettings>(KEYS.storeSettings, {
      storeName: 'OmniPos Retail',
      phone: '+92 300 1234567',
      address: '',
      headerNote: '',
      footerNote: '',
      paperWidth: '80mm',
      autoCut: true,
      drawerKick: true,
      currency: 'PKR',
      taxPercent: 0,
    });
  }, []);

  // Printing Queue
  const [queue, setQueue] = useState<LabelQueueItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Layout Configuration
  const [layout, setLayout] = useState<SheetLayout>('a4_40');

  // Customization Options
  const [showStoreName, setShowStoreName] = useState(true);
  const [showProductName, setShowProductName] = useState(true);
  const [showVariant, setShowVariant] = useState(true);
  const [showSkuText, setShowSkuText] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showBatch, setShowBatch] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { notifySuccess, notifyWarning, notifyError } = useAppToast();
  const { data: movements = [] } = useQuery<StockMovement[]>({ queryKey: ['stock-movements'], queryFn: () => posApi.fetchStockMovements() });

  // Fetch Products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  /**
   * Make sure the item (and each of its sizes) has a code the POS can find, saving any code it
   * gives. A label must carry a code that is on the item, or the scan finds nothing.
   */
  const ensureCodes = async (prod: Product): Promise<Product> => {
    const used = new Set(
      products.flatMap((p) => [p.skuCode, p.barcode, ...(p.variants || []).flatMap((v: any) => [v.skuCode, v.barcode])].filter(Boolean).map(String))
    );
    const fresh = () => {
      let code = '';
      do code = `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`;
      while (used.has(code));
      used.add(code);
      return code;
    };
    let changed = false;
    const base = prod.skuCode || prod.barcode || ((changed = true), fresh());
    const variants = (prod.variants || []).map((v: any) => {
      if (v.skuCode || v.barcode) return v;
      changed = true;
      let code = `${base}-${String(v.label || v.id || 'V').replace(/[^0-9A-Za-z]+/g, '').toUpperCase() || 'V'}`;
      while (used.has(code)) code = `${code}X`;
      used.add(code);
      return { ...v, skuCode: code };
    });
    if (!changed) return prod;
    const updated: Product = { ...prod, skuCode: prod.skuCode || (prod.barcode ? prod.skuCode : base), ...(variants.length ? { variants } : {}) };
    const saved = await posApi.saveProduct(updated);
    notifySuccess(`Code ${saved.skuCode || saved.barcode} saved on "${prod.name}" so its labels scan at the POS.`);
    return saved;
  };

  /** Queue lines for an item: one per size (with its own code / price / stock), else one. */
  const linesFor = (prod: Product, qty?: number, extra?: { batch?: string | null; expiry?: string | null }): LabelQueueItem[] => {
    const stockQty = (n: unknown) => (n === null || n === undefined ? null : Math.max(0, Math.floor(Number(n) || 0)));
    const defaultQty = (stock: number | null) => Math.min(MAX_PER_ITEM, qty ?? (stock && stock > 0 ? stock : 1));
    const batch = extra?.batch ?? prod.batchNumber ?? null;
    const expiry = extra?.expiry ?? prod.expiryDate ?? null;
    if (prod.variants && prod.variants.length > 0) {
      return prod.variants.map((v: any) => {
        const stock = stockQty(v.stock);
        return {
          id: `${prod.id}|${v.label}`,
          productId: prod.id,
          name: prod.name,
          sku: String(v.skuCode || v.barcode || prod.skuCode || prod.barcode || ''),
          price: v.price !== undefined && v.price !== null ? Number(v.price) : Number(prod.price || 0) + Number(v.priceDelta || 0),
          variant: v.label,
          quantity: defaultQty(stock),
          stock,
          batch,
          expiry,
        };
      });
    }
    const stock = stockQty(prod.openingStock);
    return [
      {
        id: `${prod.id}|`,
        productId: prod.id,
        name: prod.name,
        sku: String(prod.skuCode || prod.barcode || ''),
        price: Number(prod.price || 0),
        variant: prod.unit,
        quantity: defaultQty(stock),
        stock,
        batch,
        expiry,
      },
    ];
  };

  const addProducts = async (list: { prod: Product; qty?: number; batch?: string | null; expiry?: string | null }[]) => {
    if (list.length === 0) return;
    setIsAdding(true);
    try {
      const lines: LabelQueueItem[] = [];
      for (const entry of list) {
        const prod = await ensureCodes(entry.prod);
        lines.push(...linesFor(prod, entry.qty, entry));
      }
      setQueue((prev) => {
        const next = [...prev];
        for (const l of lines) {
          const i = next.findIndex((x) => x.id === l.id);
          if (i >= 0) next[i] = { ...next[i], quantity: Math.min(MAX_PER_ITEM, next[i].quantity + (l.quantity || 1)) };
          else next.push(l);
        }
        return next;
      });
    } catch (err: any) {
      notifyError(err?.message || 'Could not add the item');
    } finally {
      setIsAdding(false);
    }
  };

  // Add Product to Queue
  const handleSelectProduct = (prod: Product) => {
    void addProducts([{ prod }]);
  };

  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort().map((c) => ({ value: c, label: c })),
    [products]
  );

  // The most recent delivery: receipts sharing the latest invoice (or the same minute)
  const lastDelivery = useMemo(() => {
    const receipts = movements
      .filter((m) => m.type === 'in' && !m.reversedAt && !m.reversalOf && !['Reversal', 'Sales Return / Customer Refund', 'Stock Count Adjustment'].includes(m.reason || ''))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = receipts[0];
    if (!latest) return [] as StockMovement[];
    const minute = (d: string) => new Date(d).toISOString().slice(0, 16);
    return receipts.filter((m) => (latest.referenceInvoice ? m.referenceInvoice === latest.referenceInvoice : minute(m.date) === minute(latest.date)));
  }, [movements]);

  // Items whose selling price changed since their labels were last printed
  const priceChanged = useMemo(() => {
    const printed = readPrinted();
    return products.filter((p) => printed[p.id] !== undefined && Math.abs(printed[p.id] - Number(p.price || 0)) > 0.005);
  }, [products, queue.length]);

  const updateQuantity = (id: string, qty: number) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(MAX_PER_ITEM, Math.max(1, qty)) } : item)));
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Flatten queue into an array of individual sticker labels
  const allStickers = useMemo(() => {
    const list: LabelQueueItem[] = [];
    queue.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        list.push(item);
      }
    });
    return list;
  }, [queue]);

  const handlePrint = () => {
    const bad = queue.filter((i) => !i.sku || !isEncodable(i.sku));
    if (bad.length > 0) {
      notifyWarning(
        `${bad.map((b) => `"${b.name}${b.variant ? ` (${b.variant})` : ''}"`).join(', ')}: the code has letters a barcode can't carry (use English letters and digits). Fix the SKU or remove the item.`
      );
      return;
    }
    try {
      const printed = readPrinted();
      for (const i of queue) {
        const p = products.find((x) => x.id === i.productId);
        if (p) printed[p.id] = Number(p.price || 0);
      }
      localStorage.setItem(PRINTED_PRICES_KEY, JSON.stringify(printed));
    } catch {}
    const printArea = document.getElementById('barcode-sheet-print-area');
    if (!printArea) {
      window.print();
      return;
    }

    const isThermal = layout.startsWith('thermal');
    const is80mm = layout === 'thermal_80mm';
    const targetWidth = is80mm ? '65mm' : isThermal ? layoutConfig.widthMm : '100%';
    const pageSize = is80mm ? 'auto' : isThermal ? `${layoutConfig.widthMm} ${layoutConfig.heightMm}` : 'A4 portrait';

    const printHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Barcode Stickers</title>
    <style>
      @page {
        size: ${pageSize};
        margin: 0mm !important;
      }
      * {
        box-sizing: border-box !important;
        margin: 0;
        padding: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${targetWidth} !important;
        max-width: ${targetWidth} !important;
        height: auto !important;
        background: #ffffff !important;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        overflow-x: hidden !important;
      }
      #print-canvas {
        display: ${isThermal ? 'block' : 'grid'};
        ${!isThermal ? `grid-template-columns: ${layoutConfig.gridColumns}; gap: 1.5mm; padding: 4mm;` : 'margin: 0; padding: 0;'}
        width: ${targetWidth} !important;
        max-width: ${targetWidth} !important;
      }
      .print-sticker-card {
        width: ${targetWidth} !important;
        max-width: ${targetWidth} !important;
        height: ${layoutConfig.heightMm} !important;
        max-height: ${layoutConfig.heightMm} !important;
        box-sizing: border-box !important;
        padding: 2px 6px !important;
        margin: ${isThermal ? '0 0 2mm 0' : '0'} !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: ${isThermal ? 'always' : 'auto'} !important;
        break-after: ${isThermal ? 'page' : 'auto'} !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: space-between !important;
        text-align: center !important;
        overflow: hidden !important;
        border: ${isThermal ? 'none' : '1px dashed #CBD5E1'} !important;
        background: #ffffff !important;
      }
      svg {
        display: block !important;
        margin: 0 auto !important;
        max-width: 95% !important;
        height: auto !important;
      }
    </style>
  </head>
  <body>
    <div id="print-canvas">
      ${printArea.innerHTML}
    </div>
  </body>
</html>`;

    let iframe = document.getElementById('omnipos-barcode-print-frame') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'omnipos-barcode-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 350);
    } else {
      window.print();
    }
  };

  // Dimensions based on layout
  const layoutConfig = useMemo(() => {
    switch (layout) {
      case 'thermal_80mm':
        return {
          name: 'Thermal 80mm Roll (Bixolon / POS Receipt)',
          gridColumns: '1fr',
          widthMm: '65mm',
          heightMm: '30mm',
          barcodeHeight: 28,
          fontSize: '10px',
          priceSize: '12px',
        };
      case 'a4_40':
        return {
          name: 'A4 Sheet - 40 Labels (4x10)',
          gridColumns: 'repeat(4, 1fr)',
          widthMm: '48.5mm',
          heightMm: '25.4mm',
          barcodeHeight: 24,
          fontSize: '9px',
          priceSize: '10.5px',
        };
      case 'a4_24':
        return {
          name: 'A4 Sheet - 24 Labels (3x8)',
          gridColumns: 'repeat(3, 1fr)',
          widthMm: '70mm',
          heightMm: '37mm',
          barcodeHeight: 34,
          fontSize: '11px',
          priceSize: '13px',
        };
      case 'a4_65':
        return {
          name: 'A4 Sheet - 65 Labels (5x13)',
          gridColumns: 'repeat(5, 1fr)',
          widthMm: '38.1mm',
          heightMm: '21.2mm',
          barcodeHeight: 18,
          fontSize: '7.5px',
          priceSize: '8.5px',
        };
      case 'thermal_50x25':
        return {
          name: 'Thermal Roll (50mm x 25mm)',
          gridColumns: '1fr',
          widthMm: '50mm',
          heightMm: '25mm',
          barcodeHeight: 26,
          fontSize: '9.5px',
          priceSize: '11px',
        };
      case 'thermal_38x25':
        return {
          name: 'Thermal Roll (38mm x 25mm)',
          gridColumns: '1fr',
          widthMm: '38mm',
          heightMm: '25mm',
          barcodeHeight: 22,
          fontSize: '8px',
          priceSize: '9.5px',
        };
    }
  }, [layout]);

  return (
    <div className={styles.container}>
      {/* ── Page Header ── */}
      <div className={`${styles.header} no-print`}>
        <div className={styles.headerLeft}>
          <div className={styles.iconBox}>
            <BarcodeScanner24Regular />
          </div>
          <div>
            <Subtitle1 className={styles.headerTitle}>Barcode Sticker & Label Generator</Subtitle1>
            <div>
              <Caption1 className={styles.headerSubtitle}>
                Generate Code-39 / Code-128 sticker labels for A4 sticker sheets and thermal roll printers
              </Caption1>
            </div>
          </div>
        </div>

        <Button
          appearance="primary"
          icon={<Print20Regular />}
          onClick={handlePrint}
          disabled={allStickers.length === 0}
          className={styles.printBtn}
        >
          Print {allStickers.length} Labels
        </Button>
      </div>

      {/* ── Main Layout (Left: Controls, Right: Sheet Preview) ── */}
      <div className={styles.mainLayout}>
        {/* Left Control Panel */}
        <div className={`${styles.controlPanel} no-print`}>
          {/* Section 1: Add Product */}
          <div>
            <div className={styles.sectionTitle}>1. Add Products to Label Queue</div>
            <ProductAutocomplete
              placeholder="Search product from catalog..."
              value={productSearch}
              onChange={(val) => setProductSearch(val)}
              onSelectProduct={(prod) => {
                handleSelectProduct(prod);
                setProductSearch('');
              }}
            />
          </div>

          {/* Bulk add */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <CustomSelect
                  label="Whole category"
                  value={bulkCategory}
                  onChange={setBulkCategory}
                  options={[{ value: '', label: 'Choose a category…' }, ...categoryOptions]}
                />
              </div>
              <Button
                size="small"
                disabled={!bulkCategory || isAdding}
                onClick={() => void addProducts(products.filter((p) => p.category === bulkCategory).map((prod) => ({ prod })))}
              >
                Add
              </Button>
            </div>
            <Button
              size="small"
              appearance="secondary"
              disabled={lastDelivery.length === 0 || isAdding}
              title="One label per unit received, with its batch and expiry"
              onClick={() =>
                void addProducts(
                  lastDelivery
                    .map((m) => ({ m, prod: products.find((p) => p.id === m.productId) }))
                    .filter((x) => !!x.prod)
                    .map(({ m, prod }) => ({ prod: prod!, qty: Math.max(1, Math.floor(Number(m.quantity) || 1)), batch: m.batchNumber, expiry: m.expiryDate }))
                )
              }
            >
              Add last delivery{lastDelivery.length ? ` (${lastDelivery.length} item${lastDelivery.length === 1 ? '' : 's'}${lastDelivery[0]?.referenceInvoice ? `, inv ${lastDelivery[0].referenceInvoice}` : ''})` : ''}
            </Button>
            {priceChanged.length > 0 && (
              <Button size="small" appearance="primary" disabled={isAdding} onClick={() => void addProducts(priceChanged.map((prod) => ({ prod })))}>
                Price changed since last print ({priceChanged.length})
              </Button>
            )}
          </div>

          {/* Queue List */}
          <div>
            <div className={styles.queueHeader}>
              <span className={styles.queueCountText}>
                Items in Queue ({queue.length})
              </span>
              <span className={styles.totalStickersBadge}>
                Total Stickers: {allStickers.length}
              </span>
            </div>

            {queue.length === 0 ? (
              <div className={styles.emptyQueueText}>
                No items added yet. Select products above.
              </div>
            ) : (
              <div className={styles.queueList}>
                {queue.map((item) => (
                  <div key={item.id} className={styles.queueItem}>
                    <div className={styles.queueItemInfo}>
                      <div className={styles.queueItemName}>
                        {item.name}
                      </div>
                      <div className={styles.queueItemMeta}>
                        {item.variant ? `${item.variant} • ` : ''}
                        {item.sku || 'no code'} • {formatPKR(item.price)}
                        {item.stock !== null && item.stock !== undefined ? ` • ${item.stock} in stock` : ''}
                      </div>
                      {(!item.sku || !isEncodable(item.sku)) && (
                        <div style={{ fontSize: 11, color: tokens.colorPaletteRedForeground1 }}>
                          Code can't be printed as a barcode (English letters / digits only)
                        </div>
                      )}
                    </div>

                    <div className={styles.queueItemActions}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className={styles.qtyInput}
                        aria-label={`Labels for ${item.name}`}
                      />
                      {item.stock && item.stock > 0 && item.quantity !== Math.min(MAX_PER_ITEM, item.stock) ? (
                        <Button size="small" appearance="subtle" title="One label per unit in stock" onClick={() => updateQuantity(item.id, item.stock || 1)}>
                          = stock
                        </Button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className={styles.deleteBtn}
                      >
                        <Delete20Regular className={styles.deleteIcon} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Sheet Layout */}
          <div>
            <div className={styles.sectionTitle}>2. Sticker Sheet Layout</div>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as SheetLayout)}
              className={styles.layoutSelect}
            >
              <option value="thermal_80mm">Thermal 80mm Roll (Bixolon / POS Receipt Printer)</option>
              <option value="thermal_50x25">Thermal Label Roll - 50mm x 25mm (Barcode Gun)</option>
              <option value="thermal_38x25">Thermal Label Roll - 38mm x 25mm (Jewelry / Small Box)</option>
              <option value="a4_40">A4 Sticker Sheet - 40 Labels (4 x 10)</option>
              <option value="a4_24">A4 Sticker Sheet - 24 Labels (3 x 8)</option>
              <option value="a4_65">A4 Sticker Sheet - 65 Labels (5 x 13)</option>
            </select>
          </div>

          {/* Section 3: Label Content Toggles */}
          <div>
            <div className={styles.sectionTitle}>3. What to Print on Sticker</div>
            <div className={styles.checkboxGroup}>
              <Checkbox
                checked={showStoreName}
                onChange={(_, d) => setShowStoreName(!!d.checked)}
                label="Show Store Name Header"
              />
              <Checkbox
                checked={showProductName}
                onChange={(_, d) => setShowProductName(!!d.checked)}
                label="Show Product Title"
              />
              <Checkbox
                checked={showVariant}
                onChange={(_, d) => setShowVariant(!!d.checked)}
                label="Show Size / Spec / Unit"
              />
              <Checkbox
                checked={showSkuText}
                onChange={(_, d) => setShowSkuText(!!d.checked)}
                label="Show SKU / Barcode Number"
              />
              <Checkbox
                checked={showPrice}
                onChange={(_, d) => setShowPrice(!!d.checked)}
                label="Show Selling Price (PKR)"
              />
              <Checkbox
                checked={showBatch}
                onChange={(_, d) => setShowBatch(!!d.checked)}
                label="Show Batch & Expiry (medicines)"
              />
            </div>
          </div>
        </div>

        {/* Right Preview Sheet */}
        <div className={styles.previewCard}>
          <div className={`no-print ${styles.previewHeader}`}>
            <div className={styles.previewTitle}>
              Live Sheet Preview ({layoutConfig.name})
            </div>
            <div className={styles.previewCount}>
              Total Stickers: <strong>{allStickers.length}</strong>
            </div>
          </div>

          {/* Sheet Canvas */}
          {(() => {
            const sheetLayoutClass =
              layout === 'thermal_80mm'
                ? 'thermal-80mm-sheet'
                : layout === 'thermal_50x25'
                ? 'thermal-50x25-sheet'
                : layout === 'thermal_38x25'
                ? 'thermal-38x25-sheet'
                : layout === 'a4_40'
                ? 'a4-sheet-40'
                : layout === 'a4_24'
                ? 'a4-sheet-24'
                : 'a4-sheet-65';

            const cardHeightClass =
              layout === 'thermal_80mm'
                ? 'card-h-thermal-80mm'
                : layout === 'thermal_50x25'
                ? 'card-h-thermal-50x25'
                : layout === 'thermal_38x25'
                ? 'card-h-thermal-38x25'
                : layout === 'a4_40'
                ? 'card-h-a4-40'
                : layout === 'a4_24'
                ? 'card-h-a4-24'
                : 'card-h-a4-65';

            const priceClass =
              layout === 'thermal_80mm'
                ? 'price-thermal-80mm'
                : layout === 'thermal_50x25'
                ? 'price-thermal-50x25'
                : layout === 'thermal_38x25'
                ? 'price-thermal-38x25'
                : layout === 'a4_40'
                ? 'price-a4-40'
                : layout === 'a4_24'
                ? 'price-a4-24'
                : 'price-a4-65';

            return (
              <div
                id="barcode-sheet-print-area"
                className={`${styles.sheetPrintArea} ${sheetLayoutClass}`}
              >
                {allStickers.length === 0 ? (
                  <div className={styles.emptyPreview}>
                    <BarcodeScanner24Regular className={styles.emptyPreviewIcon} />
                    <div className={styles.emptyPreviewTitle}>
                      Queue Khali Hai (No Products Selected)
                    </div>
                    <div className={styles.emptyPreviewDesc}>
                      Left side par "Search product from catalog..." mein apne products select karein, un ke stickers yahan live preview mein show honge.
                    </div>
                  </div>
                ) : (
                  allStickers.map((sticker, idx) => {
                    const barWidth = layout === 'thermal_80mm' ? 1.35 : layout === 'a4_65' ? 1.0 : layout === 'thermal_38x25' ? 1.1 : layout === 'a4_40' ? 1.15 : 1.3;

                    return (
                      <div
                        key={idx}
                        className={`print-sticker-card ${styles.stickerCard} ${cardHeightClass}`}
                      >
                        {/* Store Name */}
                        {showStoreName && (
                          <div className={styles.stickerStoreName}>
                            {storeSettings.storeName}
                          </div>
                        )}

                        {/* Product Title & Variant */}
                        {showProductName && (
                          <div className={styles.stickerProductName}>
                            {sticker.name}
                            {showVariant && sticker.variant ? ` (${sticker.variant})` : ''}
                          </div>
                        )}

                        {/* Barcode Render */}
                        <div className={styles.stickerBarcodeBox}>
                          <BarcodeRender
                            value={sticker.sku}
                            width={barWidth}
                            height={layoutConfig.barcodeHeight}
                            margin={4}
                          />
                        </div>

                        {showBatch && (sticker.batch || sticker.expiry) && (
                          <div style={{ fontSize: 8.5, lineHeight: 1.1, textAlign: 'center' }}>
                            {sticker.batch ? `B: ${sticker.batch}` : ''}
                            {sticker.batch && sticker.expiry ? ' · ' : ''}
                            {sticker.expiry ? `Exp: ${new Date(sticker.expiry).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}` : ''}
                          </div>
                        )}

                        {/* SKU & Price Bottom Row */}
                        <div className={`${styles.stickerBottomRow} ${showSkuText && showPrice ? 'justify-between' : 'justify-center'}`}>
                          {showSkuText && (
                            <span className={styles.stickerSku}>
                              {sticker.sku}
                            </span>
                          )}
                          {showPrice && (
                            <span className={`${styles.stickerPrice} ${priceClass}`}>
                              Rs. {sticker.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Print Stylesheet ── */}
      <style>{`
        @media print {
          @page {
            size: ${layout === 'thermal_80mm' ? 'auto' : layout.startsWith('thermal') ? `${layoutConfig.widthMm} ${layoutConfig.heightMm}` : 'A4 portrait'};
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: fit-content !important;
            overflow: visible !important;
            background: #ffffff !important;
          }
          body * {
            visibility: hidden;
          }
          #barcode-sheet-print-area, #barcode-sheet-print-area * {
            visibility: visible;
          }
          #barcode-sheet-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: ${layout === 'thermal_80mm' ? '65mm' : layout.startsWith('thermal') ? layoutConfig.widthMm : '100%'} !important;
            max-width: ${layout === 'thermal_80mm' ? '65mm' : layout.startsWith('thermal') ? layoutConfig.widthMm : '100%'} !important;
            height: auto !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            gap: 1mm !important;
          }
          .print-sticker-card {
            width: ${layout === 'thermal_80mm' ? '65mm' : layout.startsWith('thermal') ? layoutConfig.widthMm : '100%'} !important;
            max-width: ${layout === 'thermal_80mm' ? '65mm' : layout.startsWith('thermal') ? layoutConfig.widthMm : '100%'} !important;
            box-sizing: border-box !important;
            padding: 2px 6px !important;
            margin: ${layout.startsWith('thermal') ? '0 0 2mm 0' : '0'} !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: ${layout.startsWith('thermal') ? 'always' : 'auto'} !important;
            break-after: ${layout.startsWith('thermal') ? 'page' : 'auto'} !important;
          }
          .print-sticker-card svg {
            max-width: 95% !important;
            height: auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
