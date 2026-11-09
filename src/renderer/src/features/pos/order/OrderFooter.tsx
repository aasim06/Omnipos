import React from 'react';
import { Popover, PopoverSurface, PopoverTrigger } from '@fluentui/react-components';
import { PosCounterState } from '@/features/pos/usePosCounter';
import {
  ArrowRepeatAll20Regular,
  CheckmarkCircle20Filled,
  ChevronDown16Regular,
  ChevronUp20Regular,
  Dismiss16Regular,
  Money20Regular,
  Notebook20Regular,
  Payment20Regular,
  Tag20Regular,
} from '@fluentui/react-icons';
import { playBeep } from '@/lib/soundFx';
import { CustomSelect } from '@/components/ui';

type FooterFlyout = 'tender' | 'split' | 'khata' | null;

/**
 * Order footer, Windows 11 style.
 * Always visible: totals, payment method, one action row and the Confirm button.
 * Discount, cash tender, split amounts and khata customer open in flyouts above the
 * footer, so the line-item list keeps the height. The controls inside the flyouts
 * (and every handler / calculation) are unchanged from the previous inline footer.
 */
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

  const [flyout, setFlyout] = React.useState<FooterFlyout>(null);
  const openChange = (which: Exclude<FooterFlyout, null>) => (_: unknown, data: { open: boolean }) =>
    setFlyout(data.open ? which : null);

  const subtleHover = isDark ? 'rgba(255,255,255,0.061)' : 'rgba(0,0,0,0.037)';
  const splitSum = (Number(splitCashAmount) || 0) + (Number(splitOnlineAmount) || 0) + (Number(splitKhataAmount) || 0);
  const splitDiff = total - splitSum;
  const selectedKhata = customerKhatas.find((k: any) => k.id === selectedKhataId);
  const confirmDisabled =
    cart.length === 0 ||
    isPending ||
    (paymentMode === 'khata' && !selectedKhataId) ||
    (paymentMode === 'split' && splitSum !== total);

  /* ── shared Win11 bits ── */
  const surfaceStyle: React.CSSProperties = {
    width: 'min(340px, 90vw)',
    padding: '12px',
    boxSizing: 'border-box',
    borderRadius: '8px',
    fontFamily: F.font,
  };
  const flyoutTitle = (text: string) => (
    <div style={{ fontSize: '14px', fontWeight: 600, color: F.textPrimary, marginBottom: '10px' }}>{text}</div>
  );
  const actionButton = (opts: { active: boolean; warn?: boolean; disabled?: boolean }): React.CSSProperties => ({
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '32px',
    padding: '0 10px',
    borderRadius: '4px',
    border: `1px solid ${opts.warn ? F.accentRed : F.border}`,
    backgroundColor: opts.active ? subtleHover : 'transparent',
    color: opts.disabled ? F.textMuted : F.textPrimary,
    fontSize: '13px',
    fontFamily: F.font,
    cursor: opts.disabled ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
  });
  const actionLabel: React.CSSProperties = { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' };

  const paymentButton = (mode: 'cash' | 'card' | 'khata' | 'split', label: string, icon: React.ReactNode, onSelect: () => void) => {
    const active = paymentMode === mode;
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        style={{
          height: '30px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: active ? F.bgCard : 'transparent',
          boxShadow: active ? (isDark ? '0 0 0 1px rgba(255,255,255,0.08)' : '0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.06)') : 'none',
          color: active ? F.textPrimary : F.textSecondary,
          fontSize: '13px',
          fontWeight: active ? 600 : 400,
          fontFamily: F.font,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
        }}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div
      style={{
        padding: '12px 16px 16px',
        borderTop: `1px solid ${F.border}`,
        backgroundColor: F.bgCard,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flexShrink: 0,
      }}
    >
      {/* ── Summary ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: F.textSecondary }}>
          <span>Subtotal</span>
          <span style={{ color: F.textPrimary }}>PKR {subtotal.toLocaleString()}</span>
        </div>

        {discountVal > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: F.accentGreen }}>
            <span>Discount ({discountMode === 'percent' ? `${discountValue}%` : `PKR ${discountValue}`})</span>
            <span style={{ fontWeight: 600 }}>-PKR {discountVal.toLocaleString()}</span>
          </div>
        )}

        {orderType === 'delivery' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: F.textSecondary }}>
            <span>Delivery charges</span>
            <span style={{ color: effectiveDeliveryFee === 0 ? F.accentGreen : F.textPrimary }}>
              {effectiveDeliveryFee === 0 ? 'FREE' : `PKR ${effectiveDeliveryFee}`}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: F.textPrimary }}>Total</span>
          <span style={{ fontSize: '28px', lineHeight: '36px', fontWeight: 600, color: F.textPrimary, fontVariantNumeric: 'tabular-nums' }}>
            PKR {total.toLocaleString()}
          </span>
        </div>

        {/* Change due stays visible for the cashier (cash only) */}
        {paymentMode === 'cash' && cart.length > 0 && typeof tenderedAmount === 'number' && tenderedAmount >= total && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: F.accentGreen }}>
            <span>Change due (wapsi) · received PKR {tenderedAmount.toLocaleString()}</span>
            <span style={{ fontSize: '16px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              PKR {(tenderedAmount - total).toLocaleString()}
            </span>
          </div>
        )}
        {paymentMode === 'cash' && cart.length > 0 && typeof tenderedAmount === 'number' && tenderedAmount > 0 && tenderedAmount < total && (
          <div style={{ fontSize: '13px', color: F.accentRed, textAlign: 'right' }}>
            Short by PKR {(total - tenderedAmount).toLocaleString()}
          </div>
        )}
      </div>

      {/* ── Payment method (segmented) ── */}
      <div
        role="group"
        aria-label="Payment method"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', padding: '2px', borderRadius: '6px', backgroundColor: F.bgSubtle }}
      >
        {paymentButton('cash', 'Cash', <Money20Regular style={{ width: 16, height: 16 }} />, () => {
          setPaymentMode('cash');
          playBeep();
        })}
        {paymentButton('card', 'Card', <Payment20Regular style={{ width: 16, height: 16 }} />, () => {
          setPaymentMode('card');
          playBeep();
        })}
        {paymentButton('khata', 'Khata', <Notebook20Regular style={{ width: 16, height: 16 }} />, () => {
          setPaymentMode('khata');
          playBeep();
          setFlyout('khata');
        })}
        {paymentButton('split', 'Split', <ArrowRepeatAll20Regular style={{ width: 16, height: 16 }} />, () => {
          setPaymentMode('split');
          const half = Math.round(total / 2);
          setSplitCashAmount(half);
          setSplitOnlineAmount(total - half);
          setSplitKhataAmount(0);
          playBeep();
          if (cart.length > 0) setFlyout('split');
        })}
      </div>

      {/* ── Action row: discount + the extra step of the chosen payment method ── */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {/* Discount flyout (open state = the existing isDiscountCollapsed flag) */}
        <Popover
          open={!isDiscountCollapsed}
          onOpenChange={(_, data) => setIsDiscountCollapsed(!data.open)}
          positioning="above-start"
          trapFocus
        >
          <PopoverTrigger disableButtonEnhancement>
            <button type="button" style={actionButton({ active: discountVal > 0 })}>
              <Tag20Regular style={{ width: 16, height: 16, flexShrink: 0, color: discountVal > 0 ? F.accentGreen : F.textSecondary }} />
              <span style={actionLabel}>
                {discountVal > 0
                  ? (discountMode === 'percent' ? `${discountValue}% off` : `PKR ${discountValue} off`)
                  : 'Discount'}
              </span>
              <ChevronDown16Regular style={{ width: 12, height: 12, flexShrink: 0, color: F.textSecondary }} />
            </button>
          </PopoverTrigger>
          <PopoverSurface style={surfaceStyle}>
            {/* Expanded Discount Control Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Header: Title + Mode Toggle + Collapse Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: F.textPrimary }}>Bill discount</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Percentage vs Fixed Toggle */}
                  <div style={{ display: 'flex', borderRadius: '6px', backgroundColor: F.bgSubtle, padding: '2px', gap: '2px' }}>
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
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: discountMode === 'percent' ? 600 : 400,
                        cursor: 'pointer',
                        backgroundColor: discountMode === 'percent' ? F.bgCard : 'transparent',
                        color: F.textPrimary,
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
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: discountMode === 'fixed' ? 600 : 400,
                        cursor: 'pointer',
                        backgroundColor: discountMode === 'fixed' ? F.bgCard : 'transparent',
                        color: F.textPrimary,
                      }}
                    >
                      PKR Flat
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDiscountCollapsed(true)}
                    title="Close"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: F.textSecondary, padding: '2px', display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronUp20Regular style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {(discountMode === 'percent' ? [5, 10, 15, 20, 25] : [50, 100, 200, 500]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      flex: 1,
                      height: '28px',
                      borderRadius: '4px',
                      border: `1px solid ${discountValue === preset ? F.accentRed : F.border}`,
                      backgroundColor: discountValue === preset ? F.accentRedSubtle : F.bgCard,
                      color: F.textPrimary,
                      fontSize: '12px',
                      fontWeight: discountValue === preset ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {discountMode === 'percent' ? `${preset}%` : preset}
                  </button>
                ))}
              </div>

              {/* Custom Input + Clear + Done */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    flex: 1,
                    minWidth: 0,
                    height: '32px',
                    boxSizing: 'border-box',
                    padding: '0 10px',
                    borderRadius: '4px',
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgCard,
                    color: F.textPrimary,
                    fontSize: '13px',
                    fontFamily: F.font,
                    outline: 'none',
                  }}
                />

                {discountValue > 0 && (
                  <button
                    type="button"
                    onClick={handleClearDiscount}
                    style={{
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '4px',
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgCard,
                      color: F.textPrimary,
                      fontSize: '13px',
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
                    height: '32px',
                    padding: '0 14px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: F.accentRed,
                    color: '#FFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </PopoverSurface>
        </Popover>

        {/* Cash: tender & change calculator */}
        {paymentMode === 'cash' && (
          <Popover open={flyout === 'tender'} onOpenChange={openChange('tender')} positioning="above-end" trapFocus>
            <PopoverTrigger disableButtonEnhancement>
              <button type="button" disabled={cart.length === 0} style={actionButton({ active: tenderedAmount !== '', disabled: cart.length === 0 })}>
                <Money20Regular style={{ width: 16, height: 16, flexShrink: 0, color: F.textSecondary }} />
                <span style={actionLabel}>
                  {typeof tenderedAmount === 'number' ? `Received ${tenderedAmount.toLocaleString()}` : 'Cash received'}
                </span>
                <ChevronDown16Regular style={{ width: 12, height: 12, flexShrink: 0, color: F.textSecondary }} />
              </button>
            </PopoverTrigger>
            <PopoverSurface style={surfaceStyle}>
              {flyoutTitle('Cash received')}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Quick Denominations */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTenderedAmount(total);
                      playBeep();
                    }}
                    style={{
                      height: '32px',
                      borderRadius: '4px',
                      border: `1px solid ${tenderedAmount === total ? F.accentRed : F.border}`,
                      backgroundColor: tenderedAmount === total ? F.accentRedSubtle : F.bgCard,
                      color: F.textPrimary,
                      fontSize: '13px',
                      fontWeight: tenderedAmount === total ? 600 : 400,
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
                        height: '32px',
                        borderRadius: '4px',
                        border: `1px solid ${tenderedAmount === amt ? F.accentRed : F.border}`,
                        backgroundColor: tenderedAmount === amt ? F.accentRedSubtle : F.bgCard,
                        color: F.textPrimary,
                        fontSize: '13px',
                        fontWeight: tenderedAmount === amt ? 600 : 400,
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
                    height: '32px',
                    padding: '0 10px',
                    borderRadius: '4px',
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgCard,
                    color: F.textPrimary,
                    fontSize: '13px',
                    fontFamily: F.font,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Return Change */}
                {typeof tenderedAmount === 'number' && tenderedAmount >= total && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: F.accentGreen }}>
                    <span>Change due (wapsi)</span>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>PKR {(tenderedAmount - total).toLocaleString()}</span>
                  </div>
                )}
                {typeof tenderedAmount === 'number' && tenderedAmount > 0 && tenderedAmount < total && (
                  <div style={{ fontSize: '13px', color: F.accentRed, textAlign: 'right' }}>
                    Short by PKR {(total - tenderedAmount).toLocaleString()}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setTenderedAmount('')}
                    disabled={tenderedAmount === ''}
                    style={{ height: '32px', padding: '0 12px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: tenderedAmount === '' ? F.textMuted : F.textPrimary, fontSize: '13px', cursor: tenderedAmount === '' ? 'default' : 'pointer' }}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlyout(null)}
                    style={{ height: '32px', padding: '0 14px', borderRadius: '4px', border: 'none', backgroundColor: F.accentRed, color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </PopoverSurface>
          </Popover>
        )}

        {/* Split: amount allocation */}
        {paymentMode === 'split' && (
          <Popover open={flyout === 'split'} onOpenChange={openChange('split')} positioning="above-end" trapFocus>
            <PopoverTrigger disableButtonEnhancement>
              <button
                type="button"
                disabled={cart.length === 0}
                style={actionButton({ active: true, warn: cart.length > 0 && splitDiff !== 0, disabled: cart.length === 0 })}
              >
                <ArrowRepeatAll20Regular style={{ width: 16, height: 16, flexShrink: 0, color: F.textSecondary }} />
                <span style={actionLabel}>
                  {cart.length === 0
                    ? 'Split amounts'
                    : splitDiff === 0
                      ? 'Split: amounts match'
                      : splitDiff > 0
                        ? `Split: PKR ${splitDiff.toLocaleString()} left`
                        : `Split: PKR ${Math.abs(splitDiff).toLocaleString()} over`}
                </span>
                <ChevronDown16Regular style={{ width: 12, height: 12, flexShrink: 0, color: F.textSecondary }} />
              </button>
            </PopoverTrigger>
            <PopoverSurface style={surfaceStyle}>
              {flyoutTitle(`Split payment · Total PKR ${total.toLocaleString()}`)}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: F.textSecondary, display: 'block', marginBottom: '4px' }}>Cash (PKR)</label>
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
                      style={{ width: '100%', height: '32px', padding: '0 10px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: F.textSecondary, display: 'block', marginBottom: '4px' }}>Card / Online</label>
                    <input
                      type="number"
                      value={splitOnlineAmount}
                      onChange={(e) => setSplitOnlineAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Online amount..."
                      style={{ width: '100%', height: '32px', padding: '0 10px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                {selectedCustomer.id && (
                  <div>
                    <label style={{ fontSize: '12px', color: F.textSecondary, display: 'block', marginBottom: '4px' }}>
                      Khata / Udhar ({selectedCustomer.name})
                    </label>
                    <input
                      type="number"
                      value={splitKhataAmount}
                      onChange={(e) => setSplitKhataAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Khata amount..."
                      style={{ width: '100%', height: '32px', padding: '0 10px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {/* Validation Status */}
                {splitDiff === 0 ? (
                  <div style={{ fontSize: '13px', color: F.accentGreen, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckmarkCircle20Filled style={{ width: 14, height: 14 }} />
                    <span>Exact match (PKR {splitSum.toLocaleString()})</span>
                  </div>
                ) : splitDiff > 0 ? (
                  <div style={{ fontSize: '13px', color: isDark ? '#FCE100' : '#9D5D00' }}>
                    Remaining to allocate: PKR {splitDiff.toLocaleString()}
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: F.accentRed }}>
                    Exceeds total by PKR {Math.abs(splitDiff).toLocaleString()}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setFlyout(null)}
                    style={{ height: '32px', padding: '0 14px', borderRadius: '4px', border: 'none', backgroundColor: F.accentRed, color: '#FFF', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </PopoverSurface>
          </Popover>
        )}

        {/* Khata: customer to debit */}
        {paymentMode === 'khata' && (
          <Popover open={flyout === 'khata'} onOpenChange={openChange('khata')} positioning="above-end">
            <PopoverTrigger disableButtonEnhancement>
              <button type="button" style={actionButton({ active: !!selectedKhataId, warn: !selectedKhataId })}>
                <Notebook20Regular style={{ width: 16, height: 16, flexShrink: 0, color: selectedKhataId ? F.textSecondary : F.accentRed }} />
                <span style={{ ...actionLabel, color: selectedKhataId ? F.textPrimary : F.accentRed }}>
                  {selectedKhata ? selectedKhata.name : 'Choose khata customer'}
                </span>
                <ChevronDown16Regular style={{ width: 12, height: 12, flexShrink: 0, color: F.textSecondary }} />
              </button>
            </PopoverTrigger>
            <PopoverSurface style={{ ...surfaceStyle, minHeight: '120px' }}>
              <CustomSelect
                label="Khata Customer"
                required
                value={selectedKhataId}
                onChange={(val) => {
                  setSelectedKhataId(val);
                  setFlyout(null);
                }}
                placeholder="-- Select Khata Customer --"
                options={customerKhatas.map((k: any) => ({
                  value: k.id,
                  label: `${k.name} (Debt: PKR ${k.currentDebt?.toLocaleString()} | Limit: PKR ${k.creditLimit?.toLocaleString()})`,
                }))}
                error={!selectedKhataId ? '* Please select customer to debit bill' : undefined}
              />
            </PopoverSurface>
          </Popover>
        )}
      </div>

      {/* ── Confirm (primary / accent button) ── */}
      <button
        disabled={confirmDisabled}
        onClick={() => checkout()}
        title="Confirm order (F9 or Ctrl+Enter)"
        style={{
          width: '100%',
          height: '44px',
          borderRadius: '4px',
          backgroundColor: cart.length === 0 || isPending ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : F.accentRed,
          color: cart.length === 0 || isPending ? F.textMuted : '#FFFFFF',
          border: 'none',
          fontFamily: F.font,
          fontWeight: 600,
          fontSize: '15px',
          cursor: confirmDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'background-color 0.167s cubic-bezier(0, 0, 0, 1)',
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
          <>
            <span>Confirm order</span>
            <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.8, padding: '1px 6px', borderRadius: '4px', border: '1px solid currentColor' }}>F9</span>
          </>
        )}
      </button>
    </div>
  );
}
