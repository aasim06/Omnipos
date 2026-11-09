import { PosCounterState } from '@/features/pos/usePosCounter';
import { Add20Regular, ArrowExpand20Regular, Delete20Regular, NoteEdit20Regular, ShoppingBag24Regular, Subtract20Regular, Tag20Regular } from '@fluentui/react-icons';
import { ProductIcon } from '@/features/pos/posIcons';

export function OrderLineList({ pos }: { pos: PosCounterState }) {
  const {
    module,
    isDark,
    F,
    cart,
    setIsCartExpanded,
    setEditingNoteItem,
    setEditingQtyItem,
    setCustomQtyInput,
    removeFromCart,
    updateCartQty,
  } = pos;

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {cart.length >= 3 && (
          <div
            onClick={() => setIsCartExpanded(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              borderRadius: F.radiusSm,
              backgroundColor: isDark ? 'rgba(229, 25, 55, 0.12)' : '#FEF2F2',
              border: `1px solid ${isDark ? 'rgba(229, 25, 55, 0.3)' : '#FECDD3'}`,
              color: F.accentRed,
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.12s ease',
            }}
            title="Click to view all items in expanded drawer"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowExpand20Regular style={{ width: 14, height: 14 }} />
              <span>{cart.length} items in cart • Click to expand full view</span>
            </div>
            <span style={{ fontSize: '11px', textDecoration: 'underline' }}>View Full</span>
          </div>
        )}
        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: F.textMuted, padding: '40px 20px' }}>
            <ShoppingBag24Regular style={{ width: 44, height: 44, color: F.textMuted }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: F.textSecondary }}>Order is Empty</div>
            <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: 1.4 }}>
              Select items from the catalog or scan barcodes to build customer bill
            </div>
          </div>
        ) : (
          cart.map((item, index) => (
            <div
              key={`${item.productId}-${item.variantLabel || ''}-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: F.radiusMd,
                backgroundColor: F.bgCanvas,
                border: `1px solid ${F.borderSubtle}`,
              }}
            >
              {/* Item Thumbnail */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: F.radiusSm,
                  backgroundColor: F.bgCard,
                  border: `1px solid ${F.border}`,
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
                  <ProductIcon name={item.name} size={18} color={F.accentRed} />
                </div>
              </div>

              {/* Name, Portion & Line Price */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: F.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                {item.variantLabel && (
                  <div style={{ fontSize: '11px', color: F.textSecondary, marginTop: '1px' }}>
                    {item.variantLabel}
                  </div>
                )}
                {item.notes && (
                  <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Tag20Regular style={{ width: 13, height: 13 }} />
                    <span>{item.notes}</span>
                  </div>
                )}
                <div style={{ fontSize: '12px', fontWeight: 800, color: F.accentRed, marginTop: '2px' }}>
                  PKR {(item.unitPrice * item.quantity).toLocaleString()}
                </div>
              </div>

              {/* Note Modifier Button (Fast Food / Kitchen Prep Only) */}
              {module === 'fastfood' && (
                <button
                  type="button"
                  onClick={() =>
                    setEditingNoteItem({
                      productId: item.productId,
                      variantLabel: item.variantLabel,
                      currentNote: item.notes || '',
                    })
                  }
                  title="Add / Edit Kitchen Prep Note"
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${item.notes ? '#F59E0B' : F.borderSubtle}`,
                    backgroundColor: item.notes ? 'rgba(245, 158, 11, 0.15)' : F.bgCard,
                    color: item.notes ? '#F59E0B' : F.textMuted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <NoteEdit20Regular style={{ width: 14, height: 14 }} />
                </button>
              )}

              {/* Stepper & Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <button
                  onClick={() => updateCartQty(item.productId, -1, item.variantLabel)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgCard,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: F.textPrimary,
                  }}
                >
                  <Subtract20Regular style={{ width: 12, height: 12 }} />
                </button>
                <span
                  onClick={() => {
                    setEditingQtyItem({
                      productId: item.productId,
                      variantLabel: item.variantLabel,
                      currentQty: item.quantity,
                      name: item.name,
                    });
                    setCustomQtyInput(String(item.quantity));
                  }}
                  title="Click to set custom quantity or dozen/carton pack"
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    minWidth: '22px',
                    textAlign: 'center',
                    color: F.textPrimary,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    backgroundColor: F.bgSubtle,
                    border: `1px solid ${F.borderSubtle}`,
                    userSelect: 'none',
                  }}
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateCartQty(item.productId, 1, item.variantLabel)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgCard,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: F.textPrimary,
                  }}
                >
                  <Add20Regular style={{ width: 12, height: 12 }} />
                </button>
                <button
                  onClick={() => removeFromCart(item.productId, item.variantLabel)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.borderSubtle}`,
                    backgroundColor: F.bgCard,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: F.textMuted,
                    marginLeft: '2px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = F.accentRed;
                    e.currentTarget.style.borderColor = isDark ? 'rgba(229,25,55,0.4)' : '#FEE2E2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = F.textMuted;
                    e.currentTarget.style.borderColor = F.borderSubtle;
                  }}
                >
                  <Delete20Regular style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
