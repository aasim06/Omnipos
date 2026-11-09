import { PosCounterState } from '@/features/pos/usePosCounter';
import { ArrowExpand20Regular, Clock20Regular, Pause20Regular } from '@fluentui/react-icons';

export function OrderPaneHeader({ pos }: { pos: PosCounterState }) {
  const {
    module,
    isDark,
    F,
    cart,
    setCart,
    setIsCartExpanded,
    parkedOrders,
    setShowParkedModal,
    setTenderedAmount,
    handleParkOrder,
    handleClearDiscount,
  } = pos;

  return (
    <>
      <div
        style={{
          height: '52px',
          padding: '0 12px',
          borderBottom: `1px solid ${F.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: '8px',
        }}
      >
        {/* Left: Title & Items Count Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 0 }}>
          <span style={{ fontSize: '14.5px', fontWeight: 800, color: F.textPrimary, letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
            My Order
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: F.accentRed,
              backgroundColor: F.accentRedSubtle,
              padding: '2.5px 7px',
              borderRadius: F.radiusSm,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              display: 'inline-block',
              lineHeight: 1.2,
            }}
          >
            {cart.reduce((s, i) => s + i.quantity, 0)} {cart.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Right: Action Buttons (Expand, Recall, Hold, Clear) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {/* Expand Drawer Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCartExpanded(true)}
              title="Expand cart list with full details (Right drawer view)"
              style={{
                height: '29px',
                padding: '0 8px',
                borderRadius: F.radiusSm,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                border: `1px solid ${F.border}`,
                color: F.textPrimary,
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.15)' : '#E2E8F0';
                e.currentTarget.style.color = F.accentRed;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
                e.currentTarget.style.color = F.textPrimary;
              }}
            >
              <ArrowExpand20Regular style={{ width: 13, height: 13, color: F.accentRed, flexShrink: 0 }} />
              <span>Expand</span>
            </button>
          )}

          {/* Recall Parked Orders Button */}
          {parkedOrders.length > 0 && (
            <button
              type="button"
              onClick={() => setShowParkedModal(true)}
              title="View held / parked orders"
              style={{
                height: '29px',
                padding: '0 7px',
                borderRadius: F.radiusSm,
                backgroundColor: '#F59E0B',
                color: '#000000',
                border: 'none',
                fontWeight: 800,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Clock20Regular style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span>Recall ({parkedOrders.length})</span>
            </button>
          )}

          {/* Hold / KOT Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleParkOrder}
              title={module === 'fastfood' ? 'Hold table and send live KOT to Kitchen screen' : 'Hold order without charging to serve next customer'}
              style={{
                height: '29px',
                padding: '0 8px',
                borderRadius: F.radiusSm,
                backgroundColor: module === 'fastfood' ? F.accentRedSubtle : F.bgSubtle,
                border: `1px solid ${module === 'fastfood' ? F.accentRed : F.border}`,
                color: module === 'fastfood' ? F.accentRed : F.textSecondary,
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.12s ease',
              }}
            >
              <Pause20Regular style={{ width: 13, height: 13, flexShrink: 0 }} />
              <span>{module === 'fastfood' ? 'Hold / KOT' : 'Hold'}</span>
            </button>
          )}

          {/* Clear Button */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setCart([]);
                setTenderedAmount('');
                handleClearDiscount();
              }}
              title="Clear order cart"
              style={{
                height: '29px',
                padding: '0 5px',
                fontSize: '11px',
                fontWeight: 600,
                color: F.textMuted,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: F.font,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = F.accentRed)}
              onMouseLeave={(e) => (e.currentTarget.style.color = F.textMuted)}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </>
  );
}
