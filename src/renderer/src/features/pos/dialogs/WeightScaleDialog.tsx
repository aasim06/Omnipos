import { PosCounterState } from '@/features/pos/usePosCounter';
import { Add16Filled, Box20Regular, Dismiss20Regular, DrinkToGo24Regular, Money20Regular, Scales20Regular } from '@fluentui/react-icons';
import { playBeep } from '@/lib/soundFx';

export function WeightScaleDialog({ pos }: { pos: PosCounterState }) {
  const {
    isDark,
    F,
    weighingProduct,
    setWeighingProduct,
    weightAmount,
    setWeightAmount,
    weightCalcMode,
    setWeightCalcMode,
    targetRupees,
    setTargetRupees,
    isWeightUnit,
    isLiquidUnit,
    handleConfirmWeight,
  } = pos;

  return (
    <>
      {weighingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              boxShadow: F.shadowElevated,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isLiquidUnit(weighingProduct.unit) ? (
                  <DrinkToGo24Regular style={{ color: F.accentRed, width: 22, height: 22 }} />
                ) : isWeightUnit(weighingProduct.unit) ? (
                  <Scales20Regular style={{ color: F.accentRed, width: 22, height: 22 }} />
                ) : (
                  <Box20Regular style={{ color: F.accentRed, width: 22, height: 22 }} />
                )}
                <span style={{ fontWeight: 800, fontSize: '16px', color: F.textPrimary }}>
                  {isLiquidUnit(weighingProduct.unit)
                    ? 'Liquid Volume Dispenser'
                    : isWeightUnit(weighingProduct.unit)
                    ? 'Digital Weight Scale'
                    : 'Quantity Selector'}
                </span>
              </div>
              <button
                onClick={() => setWeighingProduct(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            {/* Product Rate Information Card */}
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
                <div style={{ fontWeight: 800, fontSize: '15px', color: F.textPrimary }}>
                  {weighingProduct.name}
                </div>
                <div style={{ fontSize: '12px', color: F.textSecondary, marginTop: '2px' }}>
                  Base Rate: <b style={{ color: F.accentRed }}>PKR {weighingProduct.price.toLocaleString()}</b> per {weighingProduct.unit || 'unit'}
                </div>
              </div>
              <Box20Regular style={{ color: F.textMuted, width: 26, height: 26 }} />
            </div>

            {/* Calculation Mode Switcher (By Weight vs By Rupees Amount) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: F.bgSubtle,
                borderRadius: '8px',
                padding: '3px',
                border: `1px solid ${F.border}`,
              }}
            >
              <button
                type="button"
                onClick={() => setWeightCalcMode('weight')}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: weightCalcMode === 'weight' ? (isDark ? '#27272A' : '#FFFFFF') : 'transparent',
                  color: weightCalcMode === 'weight' ? F.accentRed : F.textSecondary,
                  fontWeight: weightCalcMode === 'weight' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: weightCalcMode === 'weight' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Scales20Regular style={{ width: 14, height: 14 }} />
                <span>By Weight ({weighingProduct.unit || 'KG'})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeightCalcMode('rupees');
                  const currentPrice = Math.round(weighingProduct.price * weightAmount);
                  setTargetRupees(currentPrice || 50);
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: weightCalcMode === 'rupees' ? (isDark ? '#27272A' : '#FFFFFF') : 'transparent',
                  color: weightCalcMode === 'rupees' ? F.accentRed : F.textSecondary,
                  fontWeight: weightCalcMode === 'rupees' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: weightCalcMode === 'rupees' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Money20Regular style={{ width: 14, height: 14 }} />
                <span>By Rupees (PKR Amount)</span>
              </button>
            </div>

            {weightCalcMode === 'weight' ? (
              /* ── Mode 1: Traditional Weighing / Scale ── */
              (() => {
                const isLiquid = isLiquidUnit(weighingProduct.unit);
                const isWeight = isWeightUnit(weighingProduct.unit);
                const presets = isLiquid
                  ? [
                      { label: '250 ml (¼ Liter)', val: 0.25 },
                      { label: '500 ml (½ Liter)', val: 0.5 },
                      { label: '750 ml (¾ Liter)', val: 0.75 },
                      { label: '1.0 Liter', val: 1.0 },
                      { label: '1.5 Liter', val: 1.5 },
                      { label: '2.0 Liter', val: 2.0 },
                      { label: '5.0 Liter', val: 5.0 },
                    ]
                  : isWeight
                  ? [
                      { label: '250g (¼ kg)', val: 0.25 },
                      { label: '500g (½ kg)', val: 0.5 },
                      { label: '750g (¾ kg)', val: 0.75 },
                      { label: '1.0 kg', val: 1.0 },
                      { label: '2.0 kg', val: 2.0 },
                      { label: '5.0 kg', val: 5.0 },
                      { label: '10 kg (Bulk)', val: 10.0 },
                      { label: '50 kg (Bag)', val: 50.0 },
                    ]
                  : [
                      { label: `1 ${weighingProduct.unit || 'PCS'}`, val: 1 },
                      { label: `2 ${weighingProduct.unit || 'PCS'}`, val: 2 },
                      { label: `3 ${weighingProduct.unit || 'PCS'}`, val: 3 },
                      { label: `5 ${weighingProduct.unit || 'PCS'}`, val: 5 },
                      { label: `10 ${weighingProduct.unit || 'PCS'}`, val: 10 },
                      { label: `12 ${weighingProduct.unit || 'PCS'}`, val: 12 },
                    ];

                return (
                  <>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                        Quick Presets ({isLiquid ? 'Volume / Liters' : isWeight ? 'Weight / Kilograms' : 'Quantity / ' + (weighingProduct.unit || 'Units')})
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: presets.length > 6 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '6px' }}>
                        {presets.map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => {
                              setWeightAmount(preset.val);
                              playBeep();
                            }}
                            style={{
                              padding: '8px 4px',
                              borderRadius: F.radiusSm,
                              border: `1.5px solid ${weightAmount === preset.val ? F.accentRed : F.border}`,
                              backgroundColor: weightAmount === preset.val ? (isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF1F2') : F.bgCard,
                              color: weightAmount === preset.val ? (isDark ? '#FF4D64' : F.accentRed) : F.textPrimary,
                              fontWeight: weightAmount === preset.val ? 800 : 500,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                              textAlign: 'center',
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Scale / Measure Input */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>
                        {isLiquid ? 'Measured Volume' : isWeight ? 'Weighed Quantity' : 'Selected Quantity'} ({weighingProduct.unit || 'unit'})
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step={isLiquid || isWeight ? '0.05' : '1'}
                          min={isLiquid || isWeight ? '0.01' : '1'}
                          value={weightAmount}
                          onChange={(e) => setWeightAmount(Math.max(isLiquid || isWeight ? 0.01 : 1, parseFloat(e.target.value) || 0))}
                          style={{
                            flex: 1,
                            height: '42px',
                            padding: '0 12px',
                            borderRadius: F.radiusSm,
                            border: `1.5px solid ${F.border}`,
                            backgroundColor: F.bgSubtle,
                            color: F.textPrimary,
                            fontSize: '16px',
                            fontWeight: 800,
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: F.textSecondary }}>
                          {weighingProduct.unit || (isLiquid ? 'Liter' : isWeight ? 'kg' : 'PCS')}
                        </span>
                      </div>
                    </div>

                    {/* Live Calculated Price Display */}
                    <div
                      style={{
                        backgroundColor: isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF1F2',
                        borderRadius: F.radiusSm,
                        border: '1px solid rgba(229, 25, 55, 0.3)',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: F.textPrimary }}>
                        Calculated Price:
                      </span>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: F.accentRed }}>
                        PKR {Math.round(weighingProduct.price * weightAmount).toLocaleString()}
                      </span>
                    </div>
                  </>
                );
              })()
            ) : (
              /* ── Mode 2: Reverse Price / Rupees Budget ("50 Rupay ke Chawal") ── */
              (() => {
                const rupeePresets = [50, 100, 150, 200, 300, 500, 1000];
                const unit = weighingProduct.unit || 'kg';
                const isWeight = isWeightUnit(unit);
                const isLiquid = isLiquidUnit(unit);

                const handleRupeeSelect = (rs: number) => {
                  setTargetRupees(rs);
                  const calculatedQty = Number((rs / (weighingProduct.price || 1)).toFixed(3));
                  setWeightAmount(calculatedQty);
                  playBeep();
                };

                return (
                  <>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                        Customer Budget Presets (PKR)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {rupeePresets.map((rs) => (
                          <button
                            key={rs}
                            type="button"
                            onClick={() => handleRupeeSelect(rs)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: F.radiusSm,
                              border: `1.5px solid ${targetRupees === rs ? F.accentRed : F.border}`,
                              backgroundColor: targetRupees === rs ? (isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF1F2') : F.bgCard,
                              color: targetRupees === rs ? (isDark ? '#FF4D64' : F.accentRed) : F.textPrimary,
                              fontWeight: targetRupees === rs ? 800 : 500,
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                              textAlign: 'center',
                            }}
                          >
                            Rs. {rs}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Rupee Budget Input */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Customer Target Amount (PKR)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: F.accentRed }}>
                          PKR
                        </span>
                        <input
                          type="number"
                          step="5"
                          min="1"
                          placeholder="e.g. 50"
                          value={targetRupees || ''}
                          onChange={(e) => {
                            const val = Math.max(1, parseFloat(e.target.value) || 0);
                            setTargetRupees(val);
                            const calculatedQty = Number((val / (weighingProduct.price || 1)).toFixed(3));
                            setWeightAmount(calculatedQty);
                          }}
                          style={{
                            flex: 1,
                            height: '42px',
                            padding: '0 12px',
                            borderRadius: F.radiusSm,
                            border: `1.5px solid ${F.border}`,
                            backgroundColor: F.bgSubtle,
                            color: F.textPrimary,
                            fontSize: '16px',
                            fontWeight: 800,
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>

                    {/* Calculated Weight Result Card */}
                    <div
                      style={{
                        backgroundColor: isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF1F2',
                        borderRadius: F.radiusSm,
                        border: '1px solid rgba(229, 25, 55, 0.3)',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10.5px', color: F.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                          Exact {isLiquid ? 'Volume' : 'Weight'} to give:
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: F.accentRed, marginTop: '2px' }}>
                          {weightAmount} {unit}{' '}
                          <span style={{ fontSize: '13px', fontWeight: 600, color: F.textPrimary }}>
                            ({Math.round(weightAmount * 1000)} {isLiquid ? 'ml' : isWeight ? 'grams' : 'units'})
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10.5px', color: F.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                          Total Bill
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: F.textPrimary, marginTop: '2px' }}>
                          PKR {targetRupees.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setWeighingProduct(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${F.border}`,
                  backgroundColor: F.bgCard,
                  color: F.textPrimary,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWeight}
                style={{
                  padding: '8px 20px',
                  borderRadius: F.radiusSm,
                  border: 'none',
                  backgroundColor: F.accentRed,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(229, 25, 55, 0.3)',
                }}
              >
                <Add16Filled />
                <span>
                  {isLiquidUnit(weighingProduct.unit)
                    ? 'Add Measured Item'
                    : isWeightUnit(weighingProduct.unit)
                    ? 'Add Weighed Item'
                    : 'Add to Order'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
