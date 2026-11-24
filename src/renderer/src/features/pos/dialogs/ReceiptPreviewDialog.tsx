import { PosCounterState } from '@/features/pos/usePosCounter';
import {
  CheckmarkCircle20Filled,
  Dismiss20Regular,
  Receipt20Regular,
  Print20Regular,
  ArrowRepeatAll20Regular,
} from '@fluentui/react-icons';
import { DIALOG_SHADOW, DIALOG_SMOKE, useEscapeToClose } from '@/features/pos/posDialog';
import { generateBarcodeDataUrl } from '@/lib/barcodeGenerator';
import { printCustomerReceipt } from '@/lib/receiptPrinter';

export function ReceiptPreviewDialog({ pos }: { pos: PosCounterState }) {
  const {
    module,
    isDark,
    F,
    lastOrder,
    showReceiptModal,
    setShowReceiptModal,
    paymentMode,
    storeSettings,
    modalReceiptLang,
    setModalReceiptLang,
    modalGoogleQrDataUrl,
    orderType,
    tableNo,
    tokenNo,
    tenderedAmount,
    subtotal,
  } = pos;

  useEscapeToClose(showReceiptModal && !!lastOrder, () => setShowReceiptModal(false));

  return (
    <>
      {showReceiptModal && lastOrder && (
        <div
          onClick={() => setShowReceiptModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: DIALOG_SMOKE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '450px',
              maxWidth: '92vw',
              maxHeight: '88vh',
              backgroundColor: F.bgCard,
              borderRadius: '8px',
              boxShadow: DIALOG_SHADOW,
              border: `1px solid ${F.border}`,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.18s ease-out',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: `1px solid ${F.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(229, 25, 55, 0.12)',
                    color: F.accentRed,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Receipt20Regular />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13.5px', color: F.textPrimary, lineHeight: 1.2 }}>
                    {modalReceiptLang === 'urdu' ? 'رسید اور انوائس' : modalReceiptLang === 'bilingual' ? 'Receipt & Invoice / رسید' : 'Receipt & Invoice'}
                  </div>
                  <div style={{ fontSize: '11px', color: F.textMuted }}>
                    Order #{lastOrder.id.slice(-6).toUpperCase()} • {lastOrder.orderType?.toUpperCase() || 'TAKEAWAY'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Language Switcher */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#262626' : '#F1F5F9',
                    borderRadius: '6px',
                    padding: '2px',
                    gap: '2px',
                    border: `1px solid ${isDark ? '#404040' : '#E2E8F0'}`,
                  }}
                >
                  {(['english', 'urdu', 'bilingual'] as const).map((lang) => {
                    const isActive = modalReceiptLang === lang;
                    const label = lang === 'english' ? 'English' : lang === 'urdu' ? 'اردو' : 'دونوں';
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setModalReceiptLang(lang)}
                        style={{
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: isActive ? 700 : 500,
                          cursor: 'pointer',
                          backgroundColor: isActive ? '#E51937' : 'transparent',
                          color: isActive ? '#FFFFFF' : (isDark ? '#CBD5E1' : '#475569'),
                          transition: 'all 0.15s ease',
                        }}
                        title={lang === 'english' ? 'English Receipt' : lang === 'urdu' ? 'اردو رسید' : 'Bilingual Receipt'}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowReceiptModal(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: F.textMuted,
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Dismiss20Regular />
                </button>
              </div>
            </div>

            {/* Thermal Receipt Paper Card Preview */}
            {(() => {
              const isUrdu = modalReceiptLang === 'urdu';
              const isBilingual = modalReceiptLang === 'bilingual';
              const isRtl = isUrdu;
              const currencySymbol = isUrdu ? 'روپے' : (storeSettings.currency || 'PKR');

              const defaultStoreName = module === 'fastfood' ? 'OMNIPOS COUNTER' : 'OMNIPOS SUPERMARKET';
              const previewStoreName = isUrdu
                ? (storeSettings.storeNameUrdu || storeSettings.storeName || defaultStoreName)
                : (storeSettings.storeName || defaultStoreName);
              const previewStoreNameSub = isBilingual ? storeSettings.storeNameUrdu : undefined;

              const defaultHeader = module === 'fastfood' ? 'Order Fresh • Eat Fresh' : 'Fresh Daily • Best Wholesale Prices';
              const previewHeader = isUrdu
                ? (storeSettings.headerNoteUrdu || storeSettings.headerNote || defaultHeader)
                : isBilingual && storeSettings.headerNoteUrdu
                ? `${storeSettings.headerNote || defaultHeader} • ${storeSettings.headerNoteUrdu}`
                : (storeSettings.headerNote || defaultHeader);

              const defaultFooter = 'Thank you for shopping with us!';
              const previewFooter = isUrdu
                ? (storeSettings.footerNoteUrdu || storeSettings.footerNote || 'تشریف آوری کا شکریہ! خریدا ہوا مال واپس یا تبدیل نہیں ہو سکتا۔')
                : (storeSettings.footerNote || defaultFooter);
              const previewFooterSub = isBilingual ? storeSettings.footerNoteUrdu : undefined;

              const orderTimeStr = new Date(lastOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const previewOrderLabel = isUrdu ? 'رسید نمبر:' : isBilingual ? 'Order / رسید:' : 'ORDER:';
              const previewTokenLabel =
                lastOrder.orderType === 'dine-in'
                  ? (isUrdu ? `میز نمبر: ${tableNo}` : isBilingual ? `Table / میز: ${tableNo}` : `TABLE: ${tableNo}`)
                  : lastOrder.orderType === 'takeaway'
                  ? (isUrdu ? `ٹوکن نمبر: #${tokenNo}` : isBilingual ? `Token / ٹوکن: #${tokenNo}` : `TOKEN: #${tokenNo}`)
                  : (isUrdu ? 'ڈیلیوری (DELIVERY)' : isBilingual ? 'Delivery / ڈیلیوری' : 'DELIVERY');

              const previewCustomer = lastOrder.customerName
                ? (isUrdu
                    ? (lastOrder.customerName === 'Walk-In Customer' ? 'عام گاہک' : lastOrder.customerName)
                    : lastOrder.customerName)
                : '';

              const totalQty = lastOrder.lines.reduce((s, l) => s + l.quantity, 0);
              const subtotal = lastOrder.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
              const discountAmt = lastOrder.discountPercent && lastOrder.discountPercent > 0
                ? Math.round((subtotal * lastOrder.discountPercent) / 100)
                : 0;

              return (
                <div
                  style={{
                    padding: '14px 18px',
                    backgroundColor: isDark ? '#141414' : '#F1F5F9',
                    overflowY: 'auto',
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  <div
                    dir={isRtl ? 'rtl' : 'ltr'}
                    style={{
                      padding: '14px 16px',
                      backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
                      fontFamily: isUrdu || isBilingual
                        ? `'Noto Sans Arabic', 'Urdu Typesetting', 'Segoe UI', Tahoma, Courier New, monospace, system-ui`
                        : 'Courier New, Courier, monospace, system-ui',
                      fontSize: '12px',
                      lineHeight: 1.45,
                      color: isDark ? '#EDEDED' : '#1E293B',
                      borderRadius: '10px',
                      border: `1px dashed ${isDark ? '#3E3E3E' : '#CBD5E1'}`,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      maxHeight: '280px',
                      overflowY: 'auto',
                    }}
                  >
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', color: isDark ? '#FFFFFF' : '#0F172A', wordBreak: 'break-word' }}>
                      {previewStoreName}
                    </div>
                    {previewStoreNameSub && (
                      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '13px', color: isDark ? '#EEE' : '#1E293B', marginTop: '1px', fontFamily: 'Urdu Typesetting, Tahoma, sans-serif' }}>
                        {previewStoreNameSub}
                      </div>
                    )}
                    {storeSettings.address && (
                      <div style={{ textAlign: 'center', fontSize: '11px', color: isDark ? '#AAA' : '#475569', marginTop: '2px' }}>
                        {storeSettings.address}
                      </div>
                    )}
                    {storeSettings.phone && (
                      <div style={{ textAlign: 'center', fontSize: '11px', color: isDark ? '#AAA' : '#475569' }}>
                        {storeSettings.phone}
                      </div>
                    )}

                    <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#64748B'}` }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                      <span>Bill #{lastOrder.id.slice(-6).toUpperCase()}</span>
                      <span style={{ fontWeight: 800, color: isDark ? '#4ADE80' : '#16A34A' }}>PAID</span>
                    </div>
                    <div style={{ fontSize: '10px', color: isDark ? '#94A3B8' : '#64748B', marginTop: '2px', fontWeight: 600 }}>
                      {new Date(lastOrder.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {orderTimeStr}
                    </div>

                    <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#64748B'}` }} />

                    {lastOrder.lines.map((line, idx) => {
                      const urduName = line.nameUrdu ? line.nameUrdu.trim() : '';

                      return (
                        <div key={`${line.productId}-${idx}`} style={{ marginBottom: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ fontWeight: 700, flex: 1, wordBreak: 'break-word', fontSize: '12px' }}>
                              {line.name} {line.variantLabel ? `(${line.variantLabel})` : ''}
                            </span>
                            <span style={{ fontWeight: 800, whiteSpace: 'nowrap', fontSize: '12px' }}>
                              {(line.unitPrice * line.quantity).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: isDark ? '#94A3B8' : '#475569', marginTop: '1px' }}>
                            <span>
                              {line.quantity} × {line.unitPrice.toLocaleString()}
                            </span>
                            {urduName ? (
                              <span style={{ fontFamily: 'Urdu Typesetting, Tahoma, sans-serif', fontSize: '12px', fontWeight: 700 }}>
                                {urduName}
                              </span>
                            ) : (
                              <span />
                            )}
                          </div>
                          {line.notes && (
                            <div style={{ fontSize: '10px', color: '#F59E0B', fontStyle: 'italic', marginTop: '1px' }}>
                              * {line.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#64748B'}` }} />

                    {/* Totals */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '15px', margin: '4px 0', color: isDark ? '#FFF' : '#0F172A' }}>
                      <span>TOTAL</span>
                      <span style={{ color: F.accentRed }}>{currencySymbol} {lastOrder.totalAmount?.toLocaleString()}</span>
                    </div>

                    {discountAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#10B981', margin: '2px 0' }}>
                        <span>Discount ({lastOrder.discountPercent}%)</span>
                        <span>- {currencySymbol} {discountAmt.toLocaleString()}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, color: isDark ? '#CBD5E1' : '#334155', marginTop: '2px' }}>
                      <span>Paid by {paymentMode === 'cash' ? 'Cash' : paymentMode === 'card' ? 'Card' : 'Khata'}</span>
                      <span>{typeof tenderedAmount === 'number' && tenderedAmount >= (lastOrder.totalAmount || 0) ? tenderedAmount.toLocaleString() : (lastOrder.totalAmount || 0).toLocaleString()}</span>
                    </div>

                    {paymentMode === 'cash' && typeof tenderedAmount === 'number' && tenderedAmount >= (lastOrder.totalAmount || 0) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, color: isDark ? '#CBD5E1' : '#334155' }}>
                        <span>Change</span>
                        <span>{(tenderedAmount - (lastOrder.totalAmount || 0)).toLocaleString()}</span>
                      </div>
                    )}

                    <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#64748B'}` }} />

                    {/* Footer note */}
                    <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: isDark ? '#94A3B8' : '#475569', marginTop: '4px' }}>
                      {previewFooter}
                    </div>

                    {storeSettings.showGoogleMapQrOnReceipt !== false && (storeSettings.googleMapsUrl || storeSettings.googleReviewUrl) && modalGoogleQrDataUrl && (
                      <div style={{ textAlign: 'center', margin: '10px 0 4px', paddingTop: '8px', borderTop: `1px dashed ${isDark ? '#444' : '#CBD5E1'}` }}>
                        <div style={{ fontSize: '10.5px', fontWeight: 800, color: isDark ? '#E2E8F0' : '#0F172A' }}>
                          {storeSettings.googleQrAction === 'map'
                            ? (isUrdu ? 'گوگل میپ پر لوکیشن' : isBilingual ? 'Locate on Google Maps / لوکیشن' : 'Locate us on Google Maps')
                            : (isUrdu ? 'گوگل پر ریٹنگ دیں' : isBilingual ? 'Rate Us on Google / ریٹنگ دیں' : 'Rate us on Google Maps')}
                        </div>
                        <img
                          src={modalGoogleQrDataUrl}
                          alt="Google Review QR"
                          style={{ width: '80px', height: '80px', margin: '4px auto', display: 'block', background: '#FFF', padding: '2px', borderRadius: '4px' }}
                        />
                        <div style={{ fontSize: '8.5px', color: isDark ? '#888' : '#64748B' }}>
                          {isUrdu ? 'موبائل کیمرہ سے اسکین کریں' : isBilingual ? 'Scan with phone / اسکین کریں' : 'Scan with phone camera'}
                        </div>
                      </div>
                    )}

                    {/* Scannable Bill Barcode Box */}
                    {lastOrder?.id && (
                      <div
                        style={{
                          textAlign: 'center',
                          margin: '10px 0 4px',
                          paddingTop: '8px',
                          borderTop: `1px dashed ${isDark ? '#444' : '#CBD5E1'}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            color: isDark ? '#AAA' : '#64748B',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {isUrdu ? 'بل بارکوڈ (اسکین کے لیے)' : 'BILL BARCODE'}
                        </div>
                        {(() => {
                          const bUrl = generateBarcodeDataUrl(lastOrder.id, {
                            width: 1.4,
                            height: 32,
                            displayValue: false,
                          });
                          return bUrl ? (
                            <img
                              src={bUrl}
                              alt="Bill Barcode"
                              style={{
                                maxWidth: '85%',
                                height: '32px',
                                margin: '4px auto 2px',
                                display: 'block',
                                background: '#FFF',
                                padding: '2px',
                                borderRadius: '2px',
                              }}
                            />
                          ) : null;
                        })()}
                        <div
                          style={{
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            color: isDark ? '#CCC' : '#333',
                            fontWeight: 600,
                          }}
                        >
                          {lastOrder.id}
                        </div>
                      </div>
                    )}

                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: isDark ? '#888' : '#94A3B8', wordBreak: 'break-word' }}>
                      <div>{previewFooter}</div>
                      {previewFooterSub && <div style={{ marginTop: '2px' }}>{previewFooterSub}</div>}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer: Action buttons */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: `1px solid ${F.border}`,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#10B981',
                  fontWeight: 600,
                  fontFamily: F.font,
                }}
              >
                <CheckmarkCircle20Filled style={{ width: 16, height: 16 }} />
                <span>Bill #{lastOrder.id.slice(-6).toUpperCase()}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (lastOrder.lines && lastOrder.lines.length > 0) {
                      pos.setCart(lastOrder.lines);
                      if (lastOrder.discountPercent) {
                        pos.setDiscountMode('percent');
                        pos.setDiscountValue(lastOrder.discountPercent);
                        pos.setDiscountInput(String(lastOrder.discountPercent));
                      }
                      setShowReceiptModal(false);
                      pos.notifySuccess(`✓ ${lastOrder.lines.length} items loaded into cart!`);
                    }
                  }}
                  title="Load items to active cart for re-order or edit"
                  style={{
                    padding: '0 12px',
                    height: '34px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'rgba(229, 25, 55, 0.1)',
                    color: F.accentRed,
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ArrowRepeatAll20Regular style={{ width: 15, height: 15 }} />
                  <span>Load to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    printCustomerReceipt(lastOrder, { storeSettings, language: modalReceiptLang });
                    pos.notifySuccess('Reprinting receipt…');
                  }}
                  title="Print thermal receipt"
                  style={{
                    padding: '0 12px',
                    height: '34px',
                    borderRadius: '6px',
                    border: `1px solid ${F.border}`,
                    backgroundColor: isDark ? '#262626' : '#FFFFFF',
                    color: F.textPrimary,
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Print20Regular style={{ width: 15, height: 15 }} />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  style={{
                    padding: '0 16px',
                    height: '34px',
                    borderRadius: '6px',
                    border: `1px solid ${F.border}`,
                    backgroundColor: isDark ? '#262626' : '#FFFFFF',
                    color: F.textPrimary,
                    cursor: 'pointer',
                    fontFamily: F.font,
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
