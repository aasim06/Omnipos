import { PosCounterState } from '@/features/pos/usePosCounter';
import { CheckmarkCircle20Filled, Dismiss20Regular, Receipt20Regular } from '@fluentui/react-icons';
import { DIALOG_SHADOW, DIALOG_SMOKE, useEscapeToClose } from '@/features/pos/posDialog';

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
                      <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '13px', color: isDark ? '#EEE' : '#1E293B', marginTop: '1px' }}>
                        {previewStoreNameSub}
                      </div>
                    )}
                    {storeSettings.address && (
                      <div style={{ textAlign: 'center', fontSize: '10.5px', color: isDark ? '#AAA' : '#64748B', marginTop: '1px' }}>
                        {storeSettings.address}
                      </div>
                    )}
                    {storeSettings.phone && (
                      <div style={{ textAlign: 'center', fontSize: '10.5px', color: isDark ? '#AAA' : '#64748B' }}>
                        {isUrdu ? 'فون:' : 'Tel:'} {storeSettings.phone}
                      </div>
                    )}
                    <div style={{ textAlign: 'center', fontSize: '10.5px', color: isDark ? '#999' : '#64748B', marginTop: '2px', fontStyle: 'italic' }}>
                      {previewHeader}
                    </div>

                    <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#CBD5E1'}` }} />

                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: isDark ? '#FFF' : '#0F172A', padding: '3px 0', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderRadius: '4px', border: `1px dashed ${isDark ? '#555' : '#E2E8F0'}` }}>
                      {previewTokenLabel}
                      {previewCustomer ? ` • ${previewCustomer}` : ''}
                    </div>

                    <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#CBD5E1'}` }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>{previewOrderLabel} #{lastOrder.id.slice(-6).toUpperCase()}</span>
                      <span>{orderTimeStr}</span>
                    </div>

                    <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#CBD5E1'}` }} />

                    {lastOrder.lines.map((line, idx) => {
                      const lineDisplayName = isUrdu
                        ? (line.nameUrdu || line.name)
                        : isBilingual && line.nameUrdu && line.nameUrdu.trim() !== line.name.trim()
                        ? `${line.name} (${line.nameUrdu})`
                        : line.name;

                      return (
                        <div key={`${line.productId}-${idx}`} style={{ marginBottom: '5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ fontWeight: 600, flex: 1, wordBreak: 'break-word' }}>
                              {line.quantity}x {lineDisplayName} {line.variantLabel ? `(${line.variantLabel})` : ''}
                            </span>
                            <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                              {currencySymbol} {(line.unitPrice * line.quantity).toLocaleString()}
                            </span>
                          </div>
                          {line.notes && (
                            <div style={{ fontSize: '10px', color: '#F59E0B', paddingRight: isRtl ? '8px' : 0, paddingLeft: !isRtl ? '8px' : 0 }}>
                              * {line.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#CBD5E1'}` }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: isDark ? '#AAA' : '#64748B' }}>
                      <span>{isUrdu ? 'کل اشیاء:' : isBilingual ? 'Total Items / کل آئٹمز:' : 'Total Items:'}</span>
                      <span>{totalQty} {isUrdu ? 'عدد' : 'units'}</span>
                    </div>

                    {discountAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#10B981', marginTop: '2px' }}>
                        <span>{isUrdu ? `رعایت (${lastOrder.discountPercent}%):` : isBilingual ? `Discount / رعایت (${lastOrder.discountPercent}%):` : `Discount (${lastOrder.discountPercent}%):`}</span>
                        <span>- {currencySymbol} {discountAmt.toLocaleString()}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '14px', marginTop: '4px', color: isDark ? '#FFF' : '#0F172A' }}>
                      <span>{isUrdu ? 'کل واجب الادا:' : isBilingual ? 'NET TOTAL / کل رقم:' : 'NET TOTAL:'}</span>
                      <span style={{ color: F.accentRed }}>{currencySymbol} {lastOrder.totalAmount?.toLocaleString()}</span>
                    </div>

                    {paymentMode === 'cash' && typeof tenderedAmount === 'number' && tenderedAmount >= (lastOrder.totalAmount || 0) && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                          <span>{isUrdu ? 'وصول شدہ رقم:' : isBilingual ? 'Tendered / وصول:' : 'Cash Tendered:'}</span>
                          <span>{currencySymbol} {tenderedAmount.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#10B981', marginTop: '1px' }}>
                          <span>{isUrdu ? 'بقایا رقم:' : isBilingual ? 'Change / بقایا:' : 'Change Due:'}</span>
                          <span>{currencySymbol} {(tenderedAmount - (lastOrder.totalAmount || 0)).toLocaleString()}</span>
                        </div>
                      </>
                    )}

                    {storeSettings.showGoogleMapQrOnReceipt !== false && storeSettings.googleMapsUrl && modalGoogleQrDataUrl && (
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

                    <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: isDark ? '#888' : '#94A3B8', wordBreak: 'break-word' }}>
                      <div>{previewFooter}</div>
                      {previewFooterSub && <div style={{ marginTop: '2px' }}>{previewFooterSub}</div>}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer: Simple close button & status */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: `1px solid ${F.border}`,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  color: '#10B981',
                  fontWeight: 600,
                  fontFamily: F.font,
                }}
              >
                <CheckmarkCircle20Filled style={{ width: 17, height: 17 }} />
                <span>رسید پرنٹر پر خودکار پرنٹ ہو رہی ہے...</span>
              </div>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                style={{
                  padding: '0 20px',
                  height: '36px',
                  borderRadius: '8px',
                  border: `1px solid ${F.border}`,
                  backgroundColor: isDark ? '#262626' : '#FFFFFF',
                  color: F.textPrimary,
                  cursor: 'pointer',
                  fontFamily: F.font,
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <span>Close / بند کریں</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
