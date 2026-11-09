import React from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { ArrowExpand20Regular, Clock20Regular, Delete20Regular, Pause20Regular } from '@fluentui/react-icons';

/**
 * Order pane header (Windows 11): title + item count, then subtle command buttons.
 * Handlers are unchanged (expand drawer, recall parked, hold / KOT with F4, clear).
 */
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

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const hoverFill = isDark ? 'rgba(255,255,255,0.061)' : 'rgba(0,0,0,0.037)';

  const commandButton = (opts: {
    onClick: () => void;
    title: string;
    icon: React.ReactNode;
    label?: string;
    tone?: 'default' | 'danger';
  }) => (
    <button
      type="button"
      onClick={opts.onClick}
      title={opts.title}
      aria-label={opts.title}
      style={{
        height: '32px',
        minWidth: '32px',
        padding: opts.label ? '0 8px' : 0,
        borderRadius: '4px',
        border: 'none',
        backgroundColor: 'transparent',
        color: F.textPrimary,
        fontSize: '13px',
        fontFamily: F.font,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverFill;
        if (opts.tone === 'danger') e.currentTarget.style.color = F.accentRed;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = F.textPrimary;
      }}
    >
      {opts.icon}
      {opts.label && <span>{opts.label}</span>}
    </button>
  );

  return (
    <div
      style={{
        height: '48px',
        padding: '0 8px 0 16px',
        borderBottom: `1px solid ${F.borderSubtle}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: '8px',
      }}
    >
      {/* Title & item count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <span style={{ fontSize: '16px', fontWeight: 600, color: F.textPrimary, whiteSpace: 'nowrap' }}>Order</span>
        <span
          style={{
            fontSize: '12px',
            lineHeight: '18px',
            fontWeight: 600,
            color: F.textSecondary,
            backgroundColor: F.bgSubtle,
            padding: '0 8px',
            borderRadius: '9px',
            whiteSpace: 'nowrap',
          }}
        >
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Commands */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        {parkedOrders.length > 0 &&
          commandButton({
            onClick: () => setShowParkedModal(true),
            title: 'View held / parked orders',
            icon: (
              <span style={{ position: 'relative', display: 'flex' }}>
                <Clock20Regular style={{ width: 16, height: 16 }} />
                {/* Win11 InfoBadge with the number of held orders */}
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-8px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    boxSizing: 'border-box',
                    borderRadius: '8px',
                    backgroundColor: F.accentRed,
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 600,
                    lineHeight: '16px',
                    textAlign: 'center',
                  }}
                >
                  {parkedOrders.length}
                </span>
              </span>
            ),
            label: 'Recall',
          })}

        {cart.length > 0 &&
          commandButton({
            onClick: handleParkOrder,
            title:
              module === 'fastfood'
                ? 'Hold table and send live KOT to kitchen screen (F4)'
                : 'Hold order without charging to serve next customer (F4)',
            icon: <Pause20Regular style={{ width: 16, height: 16 }} />,
            label: module === 'fastfood' ? 'Hold / KOT' : 'Hold',
          })}

        {cart.length > 0 &&
          commandButton({
            onClick: () => setIsCartExpanded(true),
            title: 'Open the full order list',
            icon: <ArrowExpand20Regular style={{ width: 16, height: 16 }} />,
          })}

        {cart.length > 0 &&
          commandButton({
            onClick: () => {
              setCart([]);
              setTenderedAmount('');
              handleClearDiscount();
            },
            title: 'Clear order',
            icon: <Delete20Regular style={{ width: 16, height: 16 }} />,
            tone: 'danger',
          })}
      </div>
    </div>
  );
}
