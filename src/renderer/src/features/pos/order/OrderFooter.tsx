import { PosCounterState } from '@/features/pos/usePosCounter';
import { ArrowRepeatAll20Regular, CheckmarkCircle20Filled, ChevronDown20Regular, ChevronUp20Regular, Dismiss16Regular, Money20Regular, Notebook20Regular, Payment20Regular } from '@fluentui/react-icons';
import { playBeep } from '@/lib/soundFx';
import { CustomSelect } from '@/components/ui';

export function OrderFooter({ pos }: { pos: PosCounterState }) {
  const {
    isDark,
    F,
    cart,
    discountMode,
    setDiscountMode,
    discountValue,
    setDiscountValue,
    discountInput,
    setDiscountInput,
    isSuccess,
    paymentMode,
    setPaymentMode,
    splitCashAmount,
    setSplitCashAmount,
    splitOnlineAmount,
    setSplitOnlineAmount,
    splitKhataAmount,
    setSplitKhataAmount,
    selectedKhataId,
    setSelectedKhataId,
    orderType,
    tenderedAmount,
    setTenderedAmount,
    isDiscountCollapsed,
    setIsDiscountCollapsed,
    selectedCustomer,
    customerKhatas,
    effectiveDeliveryFee,
    subtotal,
    discountVal,
    total,
    handleClearDiscount,
    handleApplyPreset,
    checkout,
    isPending,
  } = pos;

  return (
    <>
      <div
        style={{
          padding: '14px 18px 18px',
          borderTop: `1px solid ${F.border}`,
          backgroundColor: F.bgCard,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        {/* Collapsible Bill Discount Field */}
        {isDiscountCollapsed ? (
          /* Collapsed Discount Bar */
          discountVal > 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 12px',
                borderRadius: F.radiusSm,
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.35)' : '#A7F3D0'}`,
              }}
            >
              <div
                onClick={() => setIsDiscountCollapsed(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flex: 1 }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 900,
                  }}
                >
                  %
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: isDark ? '#34D399' : '#047857' }}>
                  {discountMode === 'percent' ? `${discountValue}% OFF` : `PKR ${discountValue} OFF`}
                  <span style={{ fontWeight: 600, marginLeft: '6px', fontSize: '11px' }}>
                    (-PKR {discountVal.toLocaleString()})
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Dismiss16Regular
                  style={{ width: 14, height: 14, cursor: 'pointer', color: isDark ? '#34D399' : '#047857' }}
                  title="Remove discount"
                  onClick={handleClearDiscount}
                />
                <button
                  type="button"
                  onClick={() => setIsDiscountCollapsed(false)}
                  title="Edit discount"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#34D399' : '#047857', padding: 0, display: 'flex' }}
                >
                  <ChevronDown20Regular style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsDiscountCollapsed(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 12px',
                borderRadius: F.radiusSm,
                backgroundColor: F.bgSubtle,
                border: `1px dashed ${F.border}`,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = F.accentRed)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = F.border)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                    color: F.accentRed,
                    fontSize: '10.5px',
                    fontWeight: 800,
                  }}
                >
                  %
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, letterSpacing: '0.04em' }}>
                  BILL DISCOUNT
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: F.textMuted, fontSize: '11px' }}>
                <span style={{ fontWeight: 600 }}>+ Add Discount</span>
                <ChevronDown20Regular style={{ width: 14, height: 14 }} />
              </div>
            </div>
          )
        ) : (
          /* Expanded Discount Control Panel */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: F.radiusMd,
              backgroundColor: F.bgSubtle,
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5'}`,
              boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 6px rgba(0,0,0,0.05)',
            }}
          >
            {/* Header: Title + Mode Toggle + Collapse Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    backgroundColor: F.accentRed,
                    color: '#FFF',
                    fontSize: '10px',
                    fontWeight: 900,
                  }}
                >
                  %
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: F.textPrimary, letterSpacing: '0.03em' }}>
                  BILL DISCOUNT
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Percentage vs Fixed Toggle */}
                <div
                  style={{
                    display: 'flex',
                    borderRadius: F.radiusSm,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                    padding: '2px',
                    gap: '2px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountMode('percent');
                      if (discountMode !== 'percent') {
                        setDiscountValue(0);
                        setDiscountInput('');
                      }
                    }}
                    style={{
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: discountMode === 'percent' ? F.accentRed : 'transparent',
                      color: discountMode === 'percent' ? '#FFF' : F.textMuted,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    % Percent
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountMode('fixed');
                      if (discountMode !== 'fixed') {
                        setDiscountValue(0);
                        setDiscountInput('');
                      }
                    }}
                    style={{
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 7px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: discountMode === 'fixed' ? F.accentRed : 'transparent',
                      color: discountMode === 'fixed' ? '#FFF' : F.textMuted,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    PKR Flat
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDiscountCollapsed(true)}
                  title="Collapse discount"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: F.textMuted, padding: '2px', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronUp20Regular style={{ width: 15, height: 15 }} />
                </button>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {discountMode === 'percent'
                ? [5, 10, 15, 20, 25].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyPreset(pct)}
                      style={{
                        flex: 1,
                        padding: '3px 0',
                        borderRadius: F.radiusSm,
                        border: `1px solid ${discountValue === pct ? F.accentRed : F.border}`,
                        backgroundColor: discountValue === pct ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2') : F.bgCard,
                        color: discountValue === pct ? F.accentRed : F.textSecondary,
                        fontSize: '11px',
                        fontWeight: discountValue === pct ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      {pct}%
                    </button>
                  ))
                : [50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleApplyPreset(amt)}
                      style={{
                        flex: 1,
                        padding: '3px 0',
                        borderRadius: F.radiusSm,
                        border: `1px solid ${discountValue === amt ? F.accentRed : F.border}`,
                        backgroundColor: discountValue === amt ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2') : F.bgCard,
                        color: discountValue === amt ? F.accentRed : F.textSecondary,
                        fontSize: '11px',
                        fontWeight: discountValue === amt ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      {amt}
                    </button>
                  ))}
            </div>

            {/* Custom Input + Clear + Done */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="number"
                  min="0"
                  max={discountMode === 'percent' ? 100 : subtotal}
                  value={discountInput}
                  onChange={(e) => {
                    const valStr = e.target.value;
                    setDiscountInput(valStr);
                    const valNum = parseFloat(valStr) || 0;
                    if (discountMode === 'percent') {
                      setDiscountValue(Math.min(100, Math.max(0, valNum)));
                    } else {
                      setDiscountValue(Math.max(0, valNum));
                    }
                  }}
                  placeholder={discountMode === 'percent' ? 'Custom % (e.g. 12)' : 'Custom PKR (e.g. 150)'}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '4px 8px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgCard,
                    color: F.textPrimary,
                    fontSize: '11.5px',
                    fontFamily: F.font,
                    outline: 'none',
                  }}
                />
              </div>

              {discountValue > 0 && (
                <button
                  type="button"
                  onClick={handleClearDiscount}
                  style={{
                    padding: '4px 8px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgCard,
                    color: F.textMuted,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Dismiss16Regular style={{ width: 12, height: 12 }} />
                  <span>Clear</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDiscountCollapsed(true)}
                style={{
                  padding: '4px 12px',
                  borderRadius: F.radiusSm,
                  border: 'none',
                  backgroundColor: F.accentRed,
                  color: '#FFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Financial Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: F.textSecondary }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: F.textPrimary }}>PKR {subtotal.toLocaleString()}</span>
          </div>

          {discountVal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#10B981' }}>
              <span>Discount ({discountMode === 'percent' ? `${discountValue}%` : `PKR ${discountValue}`})</span>
              <span style={{ fontWeight: 700 }}>-PKR {discountVal.toLocaleString()}</span>
            </div>
          )}

          {orderType === 'delivery' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: F.textSecondary }}>
              <span>Delivery Charges</span>
              <span style={{ fontWeight: 600, color: effectiveDeliveryFee === 0 ? F.accentGreen : F.textPrimary }}>
                {effectiveDeliveryFee === 0 ? 'FREE' : `PKR ${effectiveDeliveryFee}`}
              </span>
            </div>
          )}

          <div style={{ height: '1px', backgroundColor: F.borderSubtle, margin: '2px 0' }} />

          {/* Total Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: F.textPrimary }}>TOTAL</span>
            <span style={{ fontSize: '19px', fontWeight: 900, color: F.textPrimary }}>
              PKR {total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: F.textSecondary, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Payment Method
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            <button
              type="button"
              onClick={() => {
                setPaymentMode('cash');
                playBeep();
              }}
              style={{
                padding: '6px 0',
                borderRadius: F.radiusSm,
                border: `1px solid ${paymentMode === 'cash' ? F.accentRed : F.border}`,
                backgroundColor: paymentMode === 'cash' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                color: paymentMode === 'cash' ? F.accentRed : F.textPrimary,
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.12s ease',
              }}
            >
              <Money20Regular style={{ width: 14, height: 14 }} />
              <span>Cash</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMode('card');
                playBeep();
              }}
              style={{
                padding: '6px 0',
                borderRadius: F.radiusSm,
                border: `1px solid ${paymentMode === 'card' ? F.accentRed : F.border}`,
                backgroundColor: paymentMode === 'card' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                color: paymentMode === 'card' ? F.accentRed : F.textPrimary,
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.12s ease',
              }}
            >
              <Payment20Regular style={{ width: 14, height: 14 }} />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMode('khata');
                playBeep();
              }}
              style={{
                padding: '6px 0',
                borderRadius: F.radiusSm,
                border: `1px solid ${paymentMode === 'khata' ? F.accentRed : F.border}`,
                backgroundColor: paymentMode === 'khata' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                color: paymentMode === 'khata' ? F.accentRed : F.textPrimary,
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.12s ease',
              }}
            >
              <Notebook20Regular style={{ width: 14, height: 14 }} />
              <span>Khata</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPaymentMode('split');
                const half = Math.round(total / 2);
                setSplitCashAmount(half);
                setSplitOnlineAmount(total - half);
                setSplitKhataAmount(0);
                playBeep();
              }}
              style={{
                padding: '6px 0',
                borderRadius: F.radiusSm,
                border: `1px solid ${paymentMode === 'split' ? F.accentRed : F.border}`,
                backgroundColor: paymentMode === 'split' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                color: paymentMode === 'split' ? F.accentRed : F.textPrimary,
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.12s ease',
              }}
            >
              <ArrowRepeatAll20Regular style={{ width: 14, height: 14 }} />
              <span>Split</span>
            </button>
          </div>

          {/* Quick Cash Tender & Change Due Calculator */}
          {paymentMode === 'cash' && cart.length > 0 && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase' }}>
                  Cash Tendered (Received)
                </span>
                {tenderedAmount !== '' && (
                  <span
                    onClick={() => setTenderedAmount('')}
                    style={{ fontSize: '10.5px', color: F.textMuted, cursor: 'pointer' }}
                  >
                    Reset
                  </span>
                )}
              </div>

              {/* Quick Denominations */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setTenderedAmount(total);
                    playBeep();
                  }}
                  style={{
                    padding: '4px 0',
                    borderRadius: '4px',
                    border: `1px solid ${tenderedAmount === total ? F.accentRed : F.border}`,
                    backgroundColor: tenderedAmount === total ? F.accentRedSubtle : F.bgSubtle,
                    color: tenderedAmount === total ? F.accentRed : F.textPrimary,
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Exact
                </button>
                {[500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setTenderedAmount(amt);
                      playBeep();
                    }}
                    style={{
                      padding: '4px 0',
                      borderRadius: '4px',
                      border: `1px solid ${tenderedAmount === amt ? F.accentRed : F.border}`,
                      backgroundColor: tenderedAmount === amt ? F.accentRedSubtle : F.bgSubtle,
                      color: tenderedAmount === amt ? F.accentRed : F.textPrimary,
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {amt >= 1000 ? `${amt / 1000}k` : amt}
                  </button>
                ))}
              </div>

              <input
                type="number"
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Or enter cash received..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${F.border}`,
                  backgroundColor: F.bgSubtle,
                  color: F.textPrimary,
                  fontSize: '12px',
                  fontFamily: F.font,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />

              {/* Return Change Banner */}
              {typeof tenderedAmount === 'number' && tenderedAmount >= total && (
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: F.radiusSm,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                    Change Due (Wapsi)
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
                    PKR {(tenderedAmount - total).toLocaleString()}
                  </span>
                </div>
              )}

              {typeof tenderedAmount === 'number' && tenderedAmount > 0 && tenderedAmount < total && (
                <div style={{ fontSize: '11px', color: F.accentRed, fontWeight: 600, textAlign: 'right' }}>
                  Short by PKR {(total - tenderedAmount).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Split Payment Controls */}
          {paymentMode === 'split' && cart.length > 0 && (
            <div
              style={{
                marginTop: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px',
                borderRadius: F.radiusSm,
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                border: `1px solid ${F.border}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', fontWeight: 700 }}>
                <span style={{ color: F.textSecondary, textTransform: 'uppercase' }}>Split Amount Allocation</span>
                <span style={{ color: F.accentRed }}>Total: PKR {total.toLocaleString()}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '10px', color: F.textMuted, display: 'block', marginBottom: '2px' }}>Cash (PKR)</label>
                  <input
                    type="number"
                    value={splitCashAmount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setSplitCashAmount(val);
                      if (typeof val === 'number') {
                        const rem = Math.max(0, total - val - (Number(splitKhataAmount) || 0));
                        setSplitOnlineAmount(rem);
                      }
                    }}
                    placeholder="Cash amount..."
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgSubtle,
                      color: F.textPrimary,
                      fontSize: '11.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', color: F.textMuted, display: 'block', marginBottom: '2px' }}>Card / Online</label>
                  <input
                    type="number"
                    value={splitOnlineAmount}
                    onChange={(e) => setSplitOnlineAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Online amount..."
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgSubtle,
                      color: F.textPrimary,
                      fontSize: '11.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {selectedCustomer.id && (
                <div>
                  <label style={{ fontSize: '10px', color: F.textMuted, display: 'block', marginBottom: '2px' }}>
                    Khata / Udhar ({selectedCustomer.name})
                  </label>
                  <input
                    type="number"
                    value={splitKhataAmount}
                    onChange={(e) => setSplitKhataAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Khata amount..."
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgSubtle,
                      color: F.textPrimary,
                      fontSize: '11.5px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}

              {/* Validation Status */}
              {(() => {
                const sum = (Number(splitCashAmount) || 0) + (Number(splitOnlineAmount) || 0) + (Number(splitKhataAmount) || 0);
                const diff = total - sum;
                if (diff === 0) {
                  return (
                    <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckmarkCircle20Filled style={{ width: 14, height: 14 }} />
                      <span>Exact match (PKR {sum.toLocaleString()})</span>
                    </div>
                  );
                }
                if (diff > 0) {
                  return (
                    <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600 }}>
                      Remaining to allocate: PKR {diff.toLocaleString()}
                    </div>
                  );
                }
                return (
                  <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
                    Exceeds total by PKR {Math.abs(diff).toLocaleString()}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Khata Customer Selection */}
          {paymentMode === 'khata' && (
            <div style={{ marginTop: '10px' }}>
              <CustomSelect
                label="Khata Customer"
                required
                value={selectedKhataId}
                onChange={(val) => setSelectedKhataId(val)}
                placeholder="-- Select Khata Customer --"
                options={customerKhatas.map((k: any) => ({
                  value: k.id,
                  label: `${k.name} (Debt: PKR ${k.currentDebt?.toLocaleString()} | Limit: PKR ${k.creditLimit?.toLocaleString()})`,
                }))}
                error={!selectedKhataId ? '* Please select customer to debit bill' : undefined}
              />
            </div>
          )}
        </div>

        {/* Primary Interactive Button: Red Brand Accent (#E51937) */}
        <button
          disabled={
            cart.length === 0 ||
            isPending ||
            (paymentMode === 'khata' && !selectedKhataId) ||
            (paymentMode === 'split' &&
              (Number(splitCashAmount) || 0) +
                (Number(splitOnlineAmount) || 0) +
                (Number(splitKhataAmount) || 0) !==
                total)
          }
          onClick={() => checkout()}
          style={{
            width: '100%',
            height: '46px',
            borderRadius: F.radiusMd,
            backgroundColor: cart.length === 0 || isPending ? (isDark ? '#383838' : '#CBD5E1') : F.accentRed,
            color: '#FFFFFF',
            border: 'none',
            fontFamily: F.font,
            fontWeight: 700,
            fontSize: '15px',
            cursor: cart.length === 0 || isPending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: cart.length === 0 || isPending ? 'none' : '0 4px 12px rgba(229, 25, 55, 0.28)',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (cart.length > 0 && !isPending) e.currentTarget.style.backgroundColor = F.accentRedHover;
          }}
          onMouseLeave={(e) => {
            if (cart.length > 0 && !isPending) e.currentTarget.style.backgroundColor = F.accentRed;
          }}
        >
          {isSuccess ? (
            <>
              <CheckmarkCircle20Filled style={{ width: 18, height: 18 }} />
              <span>Order Placed!</span>
            </>
          ) : isPending ? (
            <span>Processing...</span>
          ) : (
            <span>Confirm Order</span>
          )}
        </button>
      </div>
    </>
  );
}
