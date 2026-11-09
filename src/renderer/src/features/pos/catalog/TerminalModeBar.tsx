import { PosCounterState } from '@/features/pos/usePosCounter';
import { Food24Regular, ShoppingBag24Regular } from '@fluentui/react-icons';

export function TerminalModeBar({ pos }: { pos: PosCounterState }) {
  const {
    module,
    navigate,
    isDark,
    F,
    hasFastFood,
    hasOmnimart,
  } = pos;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '7px 24px',
          backgroundColor: isDark ? '#1C1D21' : '#F5F6F8',
          borderBottom: `1px solid ${F.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: F.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Terminal Mode:
          </span>
          {(hasFastFood || hasOmnimart) && (
            hasFastFood && hasOmnimart ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#242424' : '#FFFFFF',
                  padding: '3px',
                  borderRadius: '8px',
                  gap: '4px',
                  border: `1px solid ${F.border}`,
                  boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate('/pos/fastfood')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '5px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: module === 'fastfood' ? F.accentRed : 'transparent',
                    color: module === 'fastfood' ? '#FFFFFF' : F.textSecondary,
                    fontWeight: module === 'fastfood' ? 700 : 500,
                    fontSize: '12.5px',
                    fontFamily: F.font,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: module === 'fastfood' ? '0 2px 8px rgba(229, 25, 55, 0.35)' : 'none',
                  }}
                >
                  <Food24Regular style={{ width: 16, height: 16 }} />
                  <span>Fast Food Restaurant</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      backgroundColor: module === 'fastfood' ? 'rgba(255,255,255,0.22)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                      color: module === 'fastfood' ? '#FFFFFF' : F.textMuted,
                      fontWeight: 700,
                    }}
                  >
                    KOT &middot; Tables
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/pos/omnimart')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    padding: '5px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: module === 'minimart' ? F.accentRed : 'transparent',
                    color: module === 'minimart' ? '#FFFFFF' : F.textSecondary,
                    fontWeight: module === 'minimart' ? 700 : 500,
                    fontSize: '12.5px',
                    fontFamily: F.font,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: module === 'minimart' ? '0 2px 8px rgba(229, 25, 55, 0.35)' : 'none',
                  }}
                >
                  <ShoppingBag24Regular style={{ width: 16, height: 16 }} />
                  <span>Retail Mini Mart</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      backgroundColor: module === 'minimart' ? 'rgba(255,255,255,0.22)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                      color: module === 'minimart' ? '#FFFFFF' : F.textMuted,
                      fontWeight: 700,
                    }}
                  >
                    Barcode Scanner
                  </span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 14px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#242424' : '#FFFFFF',
                  border: `1px solid ${F.border}`,
                  color: F.textPrimary,
                  fontWeight: 700,
                  fontSize: '12.5px',
                  fontFamily: F.font,
                }}
              >
                {hasFastFood ? <Food24Regular style={{ width: 16, height: 16, color: F.accentRed }} /> : <ShoppingBag24Regular style={{ width: 16, height: 16, color: '#2563EB' }} />}
                <span>{hasFastFood ? 'Fast Food Restaurant POS' : 'Retail Mini Mart POS'}</span>
              </div>
            )
          )}
        </div>

        {/* Right Status Badge & Direct KDS Link */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {module === 'fastfood' ? (
            <button
              type="button"
              onClick={() => navigate('/kitchen')}
              title="Click to open live Kitchen Display System (KDS) screen"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                color: isDark ? '#34D399' : '#047857',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: F.font,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 4px rgba(16, 185, 129, 0.15)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 10px #10B981',
                }}
              />
              <span>Open Kitchen Screen (KDS) &rarr;</span>
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                color: F.textSecondary,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
              <span>Barcode Scanner Ready (F2)</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
