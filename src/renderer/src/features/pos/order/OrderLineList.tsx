import React from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { Add20Regular, Delete20Regular, NoteEdit20Regular, ShoppingBag24Regular, Subtract20Regular, Tag20Regular } from '@fluentui/react-icons';
import { ProductIcon } from '@/features/pos/posIcons';

/**
 * Order lines as a Windows 11 ListView: 48px rows, no per-row card, hover fill,
 * quantity stepper and line total aligned on the right.
 * Handlers are unchanged (qty -/+, custom qty dialog, kitchen note, remove).
 */
export function OrderLineList({ pos }: { pos: PosCounterState }) {
  const {
    module,
    isDark,
    F,
    cart,
    setEditingNoteItem,
    setEditingQtyItem,
    setCustomQtyInput,
    removeFromCart,
    updateCartQty,
    products,
    switchCartLineUnit,
    getUnitConversion,
  } = pos;

  const hoverFill = isDark ? 'rgba(255,255,255,0.061)' : 'rgba(0,0,0,0.037)';
  const noteColor = isDark ? '#FCE100' : '#9D5D00'; // SystemFillColorCaution

  const iconButton = (opts: {
    onClick: () => void;
    title: string;
    icon: React.ReactNode;
    active?: boolean;
    danger?: boolean;
  }) => (
    <button
      type="button"
      onClick={opts.onClick}
      title={opts.title}
      aria-label={opts.title}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: 'transparent',
        color: opts.active ? noteColor : F.textSecondary,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverFill;
        if (opts.danger) e.currentTarget.style.color = F.accentRed;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = opts.active ? noteColor : F.textSecondary;
      }}
    >
      {opts.icon}
    </button>
  );

  if (cart.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <ShoppingBag24Regular style={{ width: 40, height: 40, color: F.textMuted }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: F.textPrimary }}>No items yet</div>
        <div style={{ fontSize: '12px', color: F.textSecondary, lineHeight: 1.4 }}>
          Pick items from the catalog or scan a barcode to start the bill.
        </div>
      </div>
    );
  }

  return (
    <div role="list" aria-label="Order items" style={{ flex: 1, overflowY: 'auto', padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {cart.map((item, index) => (
        <div
          key={`${item.productId}-${item.variantLabel || ''}-${index}`}
          role="listitem"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minHeight: '48px',
            padding: '6px 4px 6px 8px',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = hoverFill)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {/* Thumbnail */}
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              backgroundColor: F.bgSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = (e.currentTarget as HTMLElement).nextElementSibling;
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{ display: item.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <ProductIcon name={item.name} size={16} color={F.textSecondary} module={module} />
            </div>
          </div>

          {/* Name, option, note, unit price */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', color: F.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.name}
            </div>
            <div style={{ fontSize: '12px', color: F.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.variantLabel ? `${item.variantLabel} · ` : ''}PKR {item.unitPrice.toLocaleString()} each
            </div>
            {(() => {
              const conv = getUnitConversion(products.find((p) => p.id === item.productId));
              if (!conv) return null;
              const isCarton = item.selectedUnit === 'primary';
              const pill = (label: string, active: boolean, to: 'primary' | 'secondary') => (
                <button
                  type="button"
                  onClick={() => !active && switchCartLineUnit(item.productId, item.variantLabel, to)}
                  aria-pressed={active}
                  title={to === 'primary' ? `Sell by ${conv.wholesale} (1 = ${conv.rate} ${conv.retail}) at PKR ${conv.wholesalePrice.toLocaleString()}` : `Sell by ${conv.retail} at PKR ${conv.retailPrice.toLocaleString()}`}
                  style={{
                    fontSize: '11px',
                    padding: '1px 8px',
                    border: `1px solid ${active ? F.accentRed : F.border}`,
                    backgroundColor: active ? F.accentRed : 'transparent',
                    color: active ? '#FFFFFF' : F.textSecondary,
                    cursor: active ? 'default' : 'pointer',
                    borderRadius: to === 'primary' ? '0 4px 4px 0' : '4px 0 0 4px',
                  }}
                >
                  {label}
                </button>
              );
              return (
                <div style={{ display: 'inline-flex', marginTop: '3px' }} role="group" aria-label="Sell unit">
                  {pill(conv.retail, !isCarton, 'secondary')}
                  {pill(`${conv.wholesale} ×${conv.rate}`, isCarton, 'primary')}
                </div>
              );
            })()}
            {item.notes && (
              <div style={{ fontSize: '12px', color: noteColor, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                <Tag20Regular style={{ width: 12, height: 12, flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.notes}</span>
              </div>
            )}
          </div>

          {/* Kitchen prep note (fast food only) */}
          {module === 'fastfood' &&
            iconButton({
              onClick: () =>
                setEditingNoteItem({
                  productId: item.productId,
                  variantLabel: item.variantLabel,
                  currentNote: item.notes || '',
                }),
              title: 'Add / edit kitchen prep note',
              icon: <NoteEdit20Regular style={{ width: 16, height: 16 }} />,
              active: !!item.notes,
            })}

          {/* Quantity stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '28px',
              border: `1px solid ${F.border}`,
              borderRadius: '4px',
              backgroundColor: F.bgCard,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => updateCartQty(item.productId, -1, item.variantLabel)}
              title="Decrease quantity"
              aria-label="Decrease quantity"
              style={{ width: '26px', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.textPrimary }}
            >
              <Subtract20Regular style={{ width: 12, height: 12 }} />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingQtyItem({
                  productId: item.productId,
                  variantLabel: item.variantLabel,
                  currentQty: item.quantity,
                  name: item.name,
                });
                setCustomQtyInput(String(item.quantity));
              }}
              title="Set a custom quantity or dozen / carton pack"
              style={{
                minWidth: '28px',
                height: '100%',
                padding: '0 4px',
                border: 'none',
                borderLeft: `1px solid ${F.borderSubtle}`,
                borderRight: `1px solid ${F.borderSubtle}`,
                background: 'transparent',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: F.font,
                color: F.textPrimary,
                cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item.quantity}
            </button>
            <button
              type="button"
              onClick={() => updateCartQty(item.productId, 1, item.variantLabel)}
              title="Increase quantity"
              aria-label="Increase quantity"
              style={{ width: '26px', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.textPrimary }}
            >
              <Add20Regular style={{ width: 12, height: 12 }} />
            </button>
          </div>

          {/* Line total */}
          <div
            style={{
              minWidth: '72px',
              textAlign: 'right',
              fontSize: '14px',
              fontWeight: 600,
              color: F.textPrimary,
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {(item.unitPrice * item.quantity).toLocaleString()}
          </div>

          {/* Remove */}
          {iconButton({
            onClick: () => removeFromCart(item.productId, item.variantLabel),
            title: 'Remove item',
            icon: <Delete20Regular style={{ width: 16, height: 16 }} />,
            danger: true,
          })}
        </div>
      ))}
    </div>
  );
}
