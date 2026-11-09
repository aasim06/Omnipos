import { PosCounterState } from '@/features/pos/usePosCounter';
import { Add16Filled, BarcodeScanner20Regular, CheckmarkCircle20Filled, Dismiss16Regular, Dismiss20Regular } from '@fluentui/react-icons';

export function ScannerBar({ pos }: { pos: PosCounterState }) {
  const {
    isDark,
    F,
    isSuccess,
    barcodeInput,
    setBarcodeInput,
    lastScannedFeedback,
    scannerInputRef,
    handleBarcodeScan,
  } = pos;

  return (
    <>
      <div>
        <div
          style={{
            backgroundColor: F.bgCard,
            borderRadius: F.radiusMd,
            border: `1px solid ${F.border}`,
            boxShadow: F.shadowCard,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarcodeScanner20Regular style={{ color: F.accentRed, width: 22, height: 22 }} />
              <span style={{ fontWeight: 800, fontSize: '14px', color: F.textPrimary }}>
                RAPID BARCODE / SKU SCANNER
              </span>
              <span style={{ fontSize: '11px', color: F.textMuted, backgroundColor: F.bgSubtle, padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                Press F2 or / to Focus
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: F.textSecondary }}>
              Multiplier: Type <b style={{ color: F.accentRed }}>3*barcode</b> to add 3 units at once
            </div>
          </div>

          <form onSubmit={handleBarcodeScan} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: F.bgSubtle,
                borderRadius: F.radiusSm,
                border: `1.5px solid ${barcodeInput ? F.accentRed : F.border}`,
                padding: '8px 14px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <BarcodeScanner20Regular style={{ color: F.textMuted, width: 18, height: 18 }} />
              <input
                ref={scannerInputRef}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode with scanner gun or type SKU and press Enter..."
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontFamily: F.font,
                  fontSize: '13.5px',
                  color: F.textPrimary,
                  fontWeight: 600,
                }}
              />
              {barcodeInput && (
                <Dismiss16Regular
                  style={{ cursor: 'pointer', color: F.textMuted }}
                  onClick={() => setBarcodeInput('')}
                />
              )}
            </div>

            <button
              type="submit"
              style={{
                height: '42px',
                padding: '0 20px',
                borderRadius: F.radiusSm,
                backgroundColor: F.accentRed,
                color: '#FFFFFF',
                border: 'none',
                fontFamily: F.font,
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Add16Filled />
              <span>Scan & Add</span>
            </button>
          </form>

          {/* Live Scanner Feedback Toast */}
          {lastScannedFeedback && (
            <div
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: lastScannedFeedback.isSuccess
                  ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                  : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2'),
                color: lastScannedFeedback.isSuccess ? '#10B981' : '#EF4444',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {lastScannedFeedback.isSuccess ? (
                <CheckmarkCircle20Filled style={{ width: 16, height: 16, flexShrink: 0 }} />
              ) : (
                <Dismiss20Regular style={{ width: 16, height: 16, flexShrink: 0 }} />
              )}
              <span>{lastScannedFeedback.text}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
