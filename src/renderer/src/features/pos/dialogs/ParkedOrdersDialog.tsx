import { PosCounterState } from '@/features/pos/usePosCounter';
import { Clock20Regular, Delete20Regular, Dismiss20Regular } from '@fluentui/react-icons';
import { DIALOG_RADIUS, DIALOG_SHADOW, DIALOG_SMOKE, useEscapeToClose } from '@/features/pos/posDialog';

export function ParkedOrdersDialog({ pos }: { pos: PosCounterState }) {
  const {
    F,
    orderType,
    parkedOrders,
    showParkedModal,
    setShowParkedModal,
    handleResumeParkedOrder,
    handleDiscardParkedOrder,
    subtotal,
  } = pos;

  useEscapeToClose(showParkedModal, () => setShowParkedModal(false));

  return (
    <>
      {showParkedModal && (
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
              width: '480px',
              maxHeight: '80vh',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              border: `1px solid ${F.border}`,
              boxShadow: DIALOG_SHADOW,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock20Regular style={{ color: F.accentRed }} />
                <span style={{ fontWeight: 600, fontSize: '16px', color: F.textPrimary }}>
                  Held / Parked Orders ({parkedOrders.length})
                </span>
              </div>
              <button
                onClick={() => setShowParkedModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px' }}>
              {parkedOrders.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: F.textMuted, fontSize: '13px' }}>
                  No parked orders currently held.
                </div>
              ) : (
                parkedOrders.map((parked) => (
                  <div
                    key={parked.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: F.radiusSm,
                      backgroundColor: F.bgSubtle,
                      border: `1px solid ${F.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: F.textPrimary }}>
                          {parked.label}
                        </span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: F.accentRedSubtle, color: F.accentRed, fontWeight: 600 }}>
                          {parked.orderType}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: F.textSecondary, marginTop: '3px' }}>
                        Held at {parked.parkedAt} • {parked.lines.reduce((s, l) => s + l.quantity, 0)} items • PKR {parked.subtotal.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: F.textMuted, marginTop: '2px' }}>
                        {parked.lines.map((l) => `${l.quantity}x ${l.name}`).join(', ')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleResumeParkedOrder(parked)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: F.radiusSm,
                          border: 'none',
                          backgroundColor: F.accentRed,
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => handleDiscardParkedOrder(parked.id)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: F.radiusSm,
                          border: `1px solid ${F.border}`,
                          backgroundColor: F.bgCard,
                          color: F.textMuted,
                          cursor: 'pointer',
                        }}
                        title="Discard"
                      >
                        <Delete20Regular style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${F.border}`, paddingTop: '10px' }}>
              <button
                onClick={() => setShowParkedModal(false)}
                style={{ padding: '6px 16px', borderRadius: F.radiusSm, border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '12px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
