import React, { useState, useEffect } from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { Box20Regular, Dismiss20Regular, CheckmarkCircle20Filled, Add20Regular, Subtract20Regular } from '@fluentui/react-icons';
import { DIALOG_SHADOW, DIALOG_SMOKE, useEscapeToClose } from '@/features/pos/posDialog';

export function DualUnitDialog({ pos }: { pos: PosCounterState }) {
  const {
    isDark,
    F,
    dualUnitProduct,
    setDualUnitProduct,
    addDualUnitToCart,
    getUnitConversion,
  } = pos;

  const [selectedUnit, setSelectedUnit] = useState<'primary' | 'secondary'>('secondary');
  const [qty, setQty] = useState<number>(1);

  // Reset defaults when product opens
  useEffect(() => {
    if (dualUnitProduct) {
      setSelectedUnit('secondary');
      setQty(1);
    }
  }, [dualUnitProduct]);

  useEscapeToClose(!!dualUnitProduct, () => setDualUnitProduct(null));

  const conv = dualUnitProduct ? getUnitConversion(dualUnitProduct) : null;

  const unitPrice = conv ? (selectedUnit === 'primary' ? conv.wholesalePrice : conv.retailPrice) : 0;
  const unitLabel = conv ? (selectedUnit === 'primary' ? conv.wholesale : conv.retail) : '';
  const unitFactor = conv ? (selectedUnit === 'primary' ? conv.rate : 1) : 1;
  const totalBaseQty = qty * unitFactor;
  const lineTotal = unitPrice * qty;

  const availableStock = dualUnitProduct?.openingStock !== null && dualUnitProduct?.openingStock !== undefined
    ? Number(dualUnitProduct.openingStock)
    : null;
  const isOutOfStock = availableStock !== null && totalBaseQty > availableStock && dualUnitProduct?.module !== 'fastfood';

  const handleConfirm = () => {
    if (!dualUnitProduct || !conv || qty <= 0) return;
    const ok = addDualUnitToCart(dualUnitProduct, selectedUnit, qty);
    if (ok) {
      setDualUnitProduct(null);
    }
  };

  useEffect(() => {
    if (!dualUnitProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dualUnitProduct, selectedUnit, qty, conv]);

  if (!dualUnitProduct || !conv) return null;

  return (
    <div
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
        style={{
          width: '460px',
          maxWidth: '92vw',
          backgroundColor: F.bgCard,
          borderRadius: F.radiusMd,
          boxShadow: DIALOG_SHADOW,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '24px',
          border: `1px solid ${F.border}`,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: isDark ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE',
                color: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box20Regular style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: F.textPrimary }}>
                Select Selling Unit
              </div>
              <div style={{ fontSize: '12px', color: F.textSecondary }}>
                Choose wholesale pack or loose piece
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDualUnitProduct(null)}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: F.textMuted,
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
          >
            <Dismiss20Regular />
          </button>
        </div>

        {/* Product Details Header Card */}
        <div
          style={{
            backgroundColor: F.bgSubtle,
            padding: '12px 14px',
            borderRadius: F.radiusSm,
            border: `1px solid ${F.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: F.textPrimary }}>
              {dualUnitProduct.name}
            </div>
            <div style={{ fontSize: '12px', color: F.textSecondary, marginTop: '2px' }}>
              Category: <b>{dualUnitProduct.category || 'General'}</b>
              {availableStock !== null && (
                <span> &bull; In Stock: <b style={{ color: availableStock <= 0 ? F.accentRed : '#10B981' }}>{availableStock} {conv.retail}</b></span>
              )}
            </div>
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
              color: F.textPrimary,
            }}
          >
            1 {conv.wholesale} = {conv.rate} {conv.retail}
          </div>
        </div>

        {/* 2 Big Unit Selection Option Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Card 1: Retail Piece */}
          <button
            type="button"
            onClick={() => setSelectedUnit('secondary')}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: `2px solid ${selectedUnit === 'secondary' ? F.accentRed : F.border}`,
              backgroundColor: selectedUnit === 'secondary' ? (isDark ? 'rgba(229, 25, 55, 0.12)' : '#FFF5F5') : F.bgCard,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: selectedUnit === 'secondary' ? F.accentRed : (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                  color: selectedUnit === 'secondary' ? '#FFF' : F.textSecondary,
                  letterSpacing: '0.04em',
                }}
              >
                Retail Piece
              </span>
              {selectedUnit === 'secondary' && (
                <CheckmarkCircle20Filled style={{ color: F.accentRed, width: 18, height: 18 }} />
              )}
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: F.textPrimary }}>
                {conv.retail}
              </div>
              <div style={{ fontSize: '11px', color: F.textSecondary, marginTop: '2px' }}>
                Single loose piece
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 800, color: selectedUnit === 'secondary' ? F.accentRed : F.textPrimary }}>
              PKR {conv.retailPrice.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500, color: F.textSecondary }}>each</span>
            </div>
          </button>

          {/* Card 2: Wholesale Box */}
          <button
            type="button"
            onClick={() => setSelectedUnit('primary')}
            style={{
              padding: '14px',
              borderRadius: '10px',
              border: `2px solid ${selectedUnit === 'primary' ? F.accentRed : F.border}`,
              backgroundColor: selectedUnit === 'primary' ? (isDark ? 'rgba(229, 25, 55, 0.12)' : '#FFF5F5') : F.bgCard,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '100px',
              transition: 'all 0.15s ease',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: selectedUnit === 'primary' ? F.accentRed : (isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                  color: selectedUnit === 'primary' ? '#FFF' : F.textSecondary,
                  letterSpacing: '0.04em',
                }}
              >
                Wholesale Pack
              </span>
              {selectedUnit === 'primary' && (
                <CheckmarkCircle20Filled style={{ color: F.accentRed, width: 18, height: 18 }} />
              )}
            </div>
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: F.textPrimary }}>
                {conv.wholesale}
              </div>
              <div style={{ fontSize: '11px', color: F.textSecondary, marginTop: '2px' }}>
                Pack of {conv.rate} {conv.retail}
              </div>
            </div>
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 800, color: selectedUnit === 'primary' ? F.accentRed : F.textPrimary }}>
              PKR {conv.wholesalePrice.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500, color: F.textSecondary }}>each</span>
            </div>
          </button>
        </div>

        {/* Quantity Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: F.textPrimary }}>
              Quantity ({unitLabel})
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 5, 10].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQty(preset)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: `1px solid ${qty === preset ? F.accentRed : F.border}`,
                    backgroundColor: qty === preset ? (isDark ? 'rgba(229, 25, 55, 0.2)' : '#FFE4E6') : F.bgSubtle,
                    color: qty === preset ? F.accentRed : F.textSecondary,
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '42px',
              border: `1px solid ${F.border}`,
              borderRadius: '8px',
              backgroundColor: F.bgCard,
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              disabled={qty <= 1}
              style={{
                width: '44px',
                height: '100%',
                border: 'none',
                background: F.bgSubtle,
                cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: qty <= 1 ? F.textMuted : F.textPrimary,
              }}
            >
              <Subtract20Regular />
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                flex: 1,
                height: '100%',
                border: 'none',
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 700,
                color: F.textPrimary,
                backgroundColor: 'transparent',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setQty((prev) => prev + 1)}
              style={{
                width: '44px',
                height: '100%',
                border: 'none',
                background: F.bgSubtle,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: F.textPrimary,
              }}
            >
              <Add20Regular />
            </button>
          </div>
        </div>

        {/* Calculation & Deduction Summary Box */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: isOutOfStock ? '#FEF2F2' : (isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'),
            border: `1px solid ${isOutOfStock ? '#FCA5A5' : F.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: F.textSecondary }}>
              Inventory Impact
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: isOutOfStock ? '#DC2626' : F.textPrimary }}>
              Deducts <b>{totalBaseQty} {conv.retail}</b> from stock
              {availableStock !== null && (
                <span style={{ fontSize: '11px', fontWeight: 400, color: isOutOfStock ? '#DC2626' : F.textSecondary }}>
                  {' '}({availableStock} available)
                </span>
              )}
            </div>
            {isOutOfStock && (
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626', marginTop: '2px' }}>
                ⚠️ Not enough stock available
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: F.textSecondary }}>
              Line Total
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: F.accentRed, fontVariantNumeric: 'tabular-nums' }}>
              PKR {lineTotal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => setDualUnitProduct(null)}
            style={{
              flex: 1,
              height: '40px',
              borderRadius: '8px',
              border: `1px solid ${F.border}`,
              backgroundColor: 'transparent',
              color: F.textSecondary,
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isOutOfStock}
            style={{
              flex: 2,
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isOutOfStock ? '#CBD5E1' : F.accentRed,
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: isOutOfStock ? 'none' : '0 2px 6px rgba(229, 25, 55, 0.35)',
            }}
          >
            <span>Add to Order &bull; PKR {lineTotal.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
