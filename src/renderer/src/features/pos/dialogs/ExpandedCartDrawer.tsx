import { PosCounterState } from '@/features/pos/usePosCounter';
import { Add20Regular, Checkmark20Regular, Delete20Regular, Dismiss20Regular, NoteEdit20Regular, Person20Regular, ShoppingBag24Regular, Subtract20Regular, Tag20Regular } from '@fluentui/react-icons';
import { ProductIcon } from '@/features/pos/posIcons';
import { DIALOG_RADIUS, DIALOG_SHADOW, DIALOG_SMOKE, useEscapeToClose } from '@/features/pos/posDialog';

export function ExpandedCartDrawer({ pos }: { pos: PosCounterState }) {
  const {
    module,
    isDark,
    F,
    cart,
    setCart,
    isCartExpanded,
    setIsCartExpanded,
    discountMode,
    discountValue,
    paymentMode,
    selectedKhataId,
    orderType,
    tableNo,
    tokenNo,
    setTenderedAmount,
    setEditingNoteItem,
    setEditingQtyItem,
    setCustomQtyInput,
    selectedCustomer,
    formatCustomerBalance,
    removeFromCart,
    updateCartQty,
    subtotal,
    discountVal,
    total,
    checkout,
    isPending,
  } = pos;

  useEscapeToClose(isCartExpanded, () => setIsCartExpanded(false));

  return (
    <>
      {isCartExpanded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {/* Blurry Backdrop covering the entire POS behind */}
          <div
            onClick={() => setIsCartExpanded(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: DIALOG_SMOKE,
              animation: 'fadeIn 0.2s ease-out',
            }}
          />

          {/* Right-Side Expanded Cart Drawer */}
          <div
            style={{
              position: 'relative',
              width: '540px',
              maxWidth: '92vw',
              height: '100%',
              backgroundColor: F.bgCard,
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.22)',
              borderLeft: `1px solid ${F.border}`,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1,
              animation: 'slideInRight 0.25s cubic-bezier(0, 0, 0, 1)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                height: '60px',
                padding: '0 20px',
                borderBottom: `1px solid ${F.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFA',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(229, 25, 55, 0.12)',
                    color: F.accentRed,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingBag24Regular style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: F.textPrimary, lineHeight: 1.2 }}>
                    Cart Items Details
                  </div>
                  <div style={{ fontSize: '11px', color: F.textMuted }}>
                    {cart.reduce((s, i) => s + i.quantity, 0)} total units • {cart.length} unique items
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCart([]);
                      setTenderedAmount('');
                      setIsCartExpanded(false);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: F.radiusSm,
                      backgroundColor: 'transparent',
                      border: `1px solid ${F.border}`,
                      color: F.textMuted,
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = F.accentRed;
                      e.currentTarget.style.borderColor = F.accentRed;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = F.textMuted;
                      e.currentTarget.style.borderColor = F.border;
                    }}
                  >
                    <Delete20Regular style={{ width: 13, height: 13 }} />
                    <span>Clear All</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsCartExpanded(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    color: F.textPrimary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Close expanded cart"
                >
                  <Dismiss20Regular style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>

            {/* Context bar (Customer, Table, Token) */}
            <div
              style={{
                padding: '8px 20px',
                backgroundColor: F.bgSubtle,
                borderBottom: `1px solid ${F.borderSubtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Person20Regular style={{ width: 14, height: 14, color: F.textMuted }} />
                <span style={{ fontWeight: 600, color: F.textPrimary }}>
                  {selectedCustomer.name}
                </span>
                <span style={{ color: F.textMuted }}>•</span>
                <span style={{ color: F.textSecondary }}>{formatCustomerBalance(selectedCustomer)}</span>
              </div>
              {module === 'fastfood' && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    backgroundColor: F.accentRed,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {orderType === 'dine-in'
                    ? `Dine-In (${tableNo || 'T-1'})`
                    : orderType === 'takeaway'
                    ? `Takeaway #${String(tokenNo).padStart(2, '0')}`
                    : 'Delivery'}
                </span>
              )}
            </div>

            {/* Items List - Roomy & Full Width */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {cart.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: F.textMuted }}>
                  <ShoppingBag24Regular style={{ width: 48, height: 48 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>Cart is empty</div>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div
                    key={`expanded-${item.productId}-${item.variantLabel || ''}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: F.bgCanvas,
                      border: `1px solid ${F.borderSubtle}`,
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    {/* Item Thumbnail */}
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '8px',
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
                        <ProductIcon name={item.name} size={22} color={F.accentRed} module={module} />
                      </div>
                    </div>

                    {/* Name, Portion, Unit Price */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: F.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                        {item.variantLabel && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              color: F.accentRed,
                              backgroundColor: F.accentRedSubtle,
                              padding: '1px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {item.variantLabel}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: F.textMuted }}>
                          PKR {item.unitPrice.toLocaleString()} each
                        </span>
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Tag20Regular style={{ width: 12, height: 12 }} />
                          <span>{item.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Note Modifier Button */}
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
                          padding: '4px 8px',
                          borderRadius: F.radiusSm,
                          border: `1px solid ${item.notes ? '#F59E0B' : F.borderSubtle}`,
                          backgroundColor: item.notes ? (isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB') : F.bgCard,
                          color: item.notes ? '#F59E0B' : F.textMuted,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <NoteEdit20Regular style={{ width: 13, height: 13 }} />
                        <span>{item.notes ? 'Edit' : 'Note'}</span>
                      </button>
                    )}

                    {/* Quantity Stepper */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: F.bgCard, padding: '2px', borderRadius: '6px', border: `1px solid ${F.border}` }}>
                      <button
                        onClick={() => updateCartQty(item.productId, -1, item.variantLabel)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: F.textPrimary,
                        }}
                      >
                        <Subtract20Regular style={{ width: 13, height: 13 }} />
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
                        title="Click to set custom quantity"
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          minWidth: '26px',
                          textAlign: 'center',
                          color: F.textPrimary,
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.productId, 1, item.variantLabel)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: F.textPrimary,
                        }}
                      >
                        <Add20Regular style={{ width: 13, height: 13 }} />
                      </button>
                    </div>

                    {/* Total & Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '85px', justifyContent: 'flex-end' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: F.accentRed, textAlign: 'right' }}>
                        PKR {(item.unitPrice * item.quantity).toLocaleString()}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId, item.variantLabel)}
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          border: `1px solid ${F.borderSubtle}`,
                          backgroundColor: F.bgCard,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: F.textMuted,
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
                        <Delete20Regular style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: `1px solid ${F.border}`,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: F.textSecondary }}>
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} units):</span>
                <span style={{ fontWeight: 600, color: F.textPrimary }}>PKR {subtotal.toLocaleString()}</span>
              </div>
              {discountVal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#10B981' }}>
                  <span>Discount ({discountMode === 'percent' ? `${discountValue}%` : `PKR ${discountValue}`}):</span>
                  <span>- PKR {discountVal.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 600, borderTop: `1px dashed ${F.border}`, paddingTop: '8px' }}>
                <span style={{ color: F.textPrimary }}>NET TOTAL:</span>
                <span style={{ color: F.accentRed, fontSize: '18px' }}>PKR {total.toLocaleString()}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCartExpanded(false)}
                  style={{
                    height: '42px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgCard,
                    color: F.textPrimary,
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Dismiss20Regular style={{ width: 16, height: 16 }} />
                  <span>Back to POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartExpanded(false);
                    checkout();
                  }}
                  disabled={cart.length === 0 || isPending || (paymentMode === 'khata' && !selectedKhataId)}
                  style={{
                    height: '42px',
                    borderRadius: F.radiusSm,
                    border: 'none',
                    backgroundColor: cart.length === 0 || isPending ? (isDark ? '#383838' : '#CBD5E1') : F.accentRed,
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: cart.length === 0 || isPending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(229, 25, 55, 0.28)',
                  }}
                >
                  <Checkmark20Regular style={{ width: 16, height: 16 }} />
                  <span>Confirm Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
