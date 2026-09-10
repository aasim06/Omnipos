import React, { useState, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Subtitle1,
  Caption1,
  Checkbox,
} from '@fluentui/react-components';
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

export interface LabelQueueItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  variant?: string;
  quantity: number;
}

export type SheetLayout = 'a4_40' | 'a4_24' | 'a4_65' | 'thermal_50x25' | 'thermal_38x25' | 'thermal_80mm';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    backgroundColor: tokens.colorNeutralBackground2,
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: 'rgba(229, 25, 55, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#E51937',
  },
  mainLayout: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '20px',
    alignItems: 'start',
  },
  controlPanel: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    boxShadow: tokens.shadow2,
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  previewCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
    padding: '20px',
    boxShadow: tokens.shadow2,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorNeutralStroke2,
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

  // Fetch Products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => posApi.fetchProducts(),
  });

  // Add Product to Queue
  const handleSelectProduct = (prod: Product) => {
    const sku = prod.skuCode || prod.barcode || `SKU-${prod.id.slice(-6).toUpperCase()}`;
    setQueue((prev) => {
      const exists = prev.find((item) => item.sku === sku);
      if (exists) {
        return prev.map((item) => (item.sku === sku ? { ...item, quantity: item.quantity + 4 } : item));
      }
      return [
        ...prev,
        {
          id: prod.id,
          name: prod.name,
          sku,
          price: prod.price,
          variant: prod.unit,
          quantity: 4,
        },
      ];
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, qty) } : item)));
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
    const printArea = document.getElementById('barcode-sheet-print-area');
    if (!printArea) {
      window.print();
      return;
    }

    const isThermal = layout.startsWith('thermal');
    const is80mm = layout === 'thermal_80mm';
    const targetWidth = is80mm ? '72mm' : isThermal ? layoutConfig.widthMm : '100%';
    const pageSize = is80mm ? '80mm auto' : isThermal ? `${layoutConfig.widthMm} ${layoutConfig.heightMm}` : 'A4 portrait';

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
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${targetWidth} !important;
        height: auto !important;
        background: #ffffff !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #print-canvas {
        display: ${isThermal ? 'block' : 'grid'};
        ${!isThermal ? `grid-template-columns: ${layoutConfig.gridColumns}; gap: 1.5mm; padding: 4mm;` : 'margin: 0 auto;'}
        width: 100% !important;
      }
      .print-sticker-card {
        width: ${targetWidth} !important;
        height: ${layoutConfig.heightMm} !important;
        max-height: ${layoutConfig.heightMm} !important;
        box-sizing: border-box !important;
        padding: 2px 4px !important;
        margin: ${isThermal ? '0 auto 1mm auto' : '0'} !important;
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
        max-width: 100% !important;
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
          widthMm: '72mm',
          heightMm: '30mm',
          barcodeHeight: 28,
          fontSize: '10.5px',
          priceSize: '12.5px',
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
            <Subtitle1 style={{ fontWeight: 800 }}>Barcode Sticker & Label Generator</Subtitle1>
            <div>
              <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
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
          style={{
            backgroundColor: '#E51937',
            color: '#FFFFFF',
            fontWeight: 700,
            borderRadius: '8px',
          }}
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

          {/* Queue List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: tokens.colorNeutralForeground3 }}>
                Items in Queue ({queue.length})
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#E51937' }}>
                Total Stickers: {allStickers.length}
              </span>
            </div>

            {queue.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: tokens.colorNeutralForeground4, fontSize: '11.5px' }}>
                No items added yet. Select products above.
              </div>
            ) : (
              <div className={styles.queueList}>
                {queue.map((item) => (
                  <div key={item.id} className={styles.queueItem}>
                    <div style={{ flex: 1, paddingRight: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: tokens.colorNeutralForeground3 }}>
                        {item.sku} • {formatPKR(item.price)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        style={{
                          width: '45px',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          border: `1px solid ${tokens.colorNeutralStroke1}`,
                          textAlign: 'center',
                          fontSize: '11.5px',
                          fontWeight: 700,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                      >
                        <Delete20Regular style={{ width: 14, height: 14 }} />
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
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '8px',
                border: `1px solid ${tokens.colorNeutralStroke1}`,
                fontSize: '12.5px',
                fontWeight: 600,
                backgroundColor: tokens.colorNeutralBackground1,
                color: tokens.colorNeutralForeground1,
              }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            </div>
          </div>
        </div>

        {/* Right Preview Sheet */}
        <div className={styles.previewCard}>
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: '13px', color: tokens.colorNeutralForeground1 }}>
              Live Sheet Preview ({layoutConfig.name})
            </div>
            <div style={{ fontSize: '11.5px', color: tokens.colorNeutralForeground3 }}>
              Total Stickers: <strong>{allStickers.length}</strong>
            </div>
          </div>

          {/* Sheet Canvas */}
          <div
            id="barcode-sheet-print-area"
            style={{
              display: 'grid',
              gridTemplateColumns: layoutConfig.gridColumns,
              gap: '4px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              padding: '10px',
              borderRadius: '6px',
              boxSizing: 'border-box',
              width: layout.startsWith('thermal') ? layoutConfig.widthMm : '100%',
              maxWidth: layout.startsWith('thermal') ? layoutConfig.widthMm : '100%',
              margin: layout.startsWith('thermal') ? '0 auto' : '0',
            }}
          >
            {allStickers.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: tokens.colorNeutralForeground4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <BarcodeScanner24Regular style={{ fontSize: '32px', color: tokens.colorNeutralForeground3 }} />
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: tokens.colorNeutralForeground2 }}>
                  Queue Khali Hai (No Products Selected)
                </div>
                <div style={{ fontSize: '11.5px', color: tokens.colorNeutralForeground3, maxWidth: '340px' }}>
                  Left side par "Search product from catalog..." mein apne products select karein, un ke stickers yahan live preview mein show honge.
                </div>
              </div>
            ) : (
              allStickers.map((sticker, idx) => {
              const barWidth = layout === 'thermal_80mm' ? 1.55 : layout === 'a4_65' ? 1.0 : layout === 'thermal_38x25' ? 1.1 : layout === 'a4_40' ? 1.15 : 1.3;

              return (
                <div
                  key={idx}
                  className="print-sticker-card"
                  style={{
                    border: '1px dashed #CBD5E1',
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
                    minHeight: layoutConfig.heightMm,
                    maxHeight: layoutConfig.heightMm,
                    overflow: 'hidden',
                  }}
                >
                  {/* Store Name */}
                  {showStoreName && (
                    <div
                      style={{
                        fontSize: '7.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        color: '#000000',
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                      }}
                    >
                      {storeSettings.storeName}
                    </div>
                  )}

                  {/* Product Title & Variant */}
                  {showProductName && (
                    <div
                      style={{
                        fontSize: layoutConfig.fontSize,
                        fontWeight: 700,
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                        color: '#000000',
                        marginTop: '1px',
                      }}
                    >
                      {sticker.name}
                      {showVariant && sticker.variant ? ` (${sticker.variant})` : ''}
                    </div>
                  )}

                  {/* Barcode Render (Code 128 standard with quiet zones for 100% scanner gun compatibility) */}
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '1px 0' }}>
                    <BarcodeRender
                      value={sticker.sku}
                      width={barWidth}
                      height={layoutConfig.barcodeHeight}
                      margin={4}
                    />
                  </div>

                  {/* SKU & Price Bottom Row */}
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: showSkuText && showPrice ? 'space-between' : 'center',
                      alignItems: 'center',
                      fontSize: layoutConfig.fontSize,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {showSkuText && (
                      <span style={{ fontSize: '8px', color: '#334155', letterSpacing: '0.5px' }}>
                        {sticker.sku}
                      </span>
                    )}
                    {showPrice && (
                      <span style={{ fontSize: layoutConfig.priceSize, fontWeight: 900, color: '#000000' }}>
                        Rs. {sticker.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      </div>

      {/* ── Print Stylesheet ── */}
      <style>{`
        @media print {
          @page {
            size: ${layout === 'thermal_80mm' ? '80mm auto' : layout.startsWith('thermal') ? `${layoutConfig.widthMm} ${layoutConfig.heightMm}` : 'A4 portrait'};
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
            width: ${layout === 'thermal_80mm' ? '72mm' : layout.startsWith('thermal') ? layoutConfig.widthMm : '100%'} !important;
            max-width: ${layout === 'thermal_80mm' ? '72mm' : layout.startsWith('thermal') ? layoutConfig.widthMm : '100%'} !important;
            height: auto !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            gap: 1mm !important;
          }
          .print-sticker-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: ${layout.startsWith('thermal') ? 'always' : 'auto'} !important;
            break-after: ${layout.startsWith('thermal') ? 'page' : 'auto'} !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
