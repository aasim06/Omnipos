import { PosCounterState } from '@/features/pos/usePosCounter';
import { Dismiss20Regular } from '@fluentui/react-icons';

export function BulkQtyDialog({ pos }: { pos: PosCounterState }) {
  const {
    F,
    editingQtyItem,
    setEditingQtyItem,
    customQtyInput,
    setCustomQtyInput,
    handleApplyCustomQty,
  } = pos;

  return (
    <>
      {editingQtyItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '380px',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              boxShadow: F.shadowElevated,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '22px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: F.textPrimary }}>
                  Set Quantity
                </div>
                <div style={{ fontSize: '12px', color: F.textSecondary, marginTop: '2px' }}>
                  {editingQtyItem.name}
                </div>
              </div>
              <button
                onClick={() => setEditingQtyItem(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            {/* Quick Bulk Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                Bulk / Pack Multipliers
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { label: '+1 Unit', qty: editingQtyItem.currentQty + 1 },
                  { label: '+5 Units', qty: editingQtyItem.currentQty + 5 },
                  { label: '+10 Units', qty: editingQtyItem.currentQty + 10 },
                  { label: 'x12 (Dozen)', qty: 12 },
                  { label: 'x24 (Carton)', qty: 24 },
                  { label: 'x48 (Box)', qty: 48 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      handleApplyCustomQty(preset.qty);
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: F.radiusSm,
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgSubtle,
                      color: F.textPrimary,
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Number Input */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>
                Exact Item Count
              </div>
              <input
                type="number"
                min="1"
                value={customQtyInput}
                onChange={(e) => setCustomQtyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseInt(customQtyInput, 10);
                    if (!isNaN(parsed) && parsed > 0) handleApplyCustomQty(parsed);
                  }
                }}
                autoFocus
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: F.radiusSm,
                  border: `1.5px solid ${F.border}`,
                  backgroundColor: F.bgSubtle,
                  color: F.textPrimary,
                  fontSize: '18px',
                  fontWeight: 800,
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setEditingQtyItem(null)}
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
                onClick={() => {
                  const parsed = parseInt(customQtyInput, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    handleApplyCustomQty(parsed);
                  }
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: F.radiusSm,
                  border: 'none',
                  backgroundColor: F.accentRed,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Apply Quantity
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
