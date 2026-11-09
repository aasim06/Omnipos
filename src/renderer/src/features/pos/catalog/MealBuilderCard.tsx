import { PosCounterState } from '@/features/pos/usePosCounter';
import { ProductIcon } from '@/features/pos/posIcons';
import { Add16Filled, Add20Regular, Dismiss20Regular, Subtract20Regular } from '@fluentui/react-icons';

export function MealBuilderCard({ pos }: { pos: PosCounterState }) {
  const {
    module,
    isDark,
    F,
    setSelectedProduct,
    selectedQty,
    setSelectedQty,
    addToCart,
    featured,
  } = pos;

  return (
    <>
      {module === 'fastfood' && featured && (
        <div
          style={{
            backgroundColor: F.bgCard,
            borderRadius: F.radiusMd, // 8px radius
            border: `1px solid ${F.border}`,
            boxShadow: F.shadowCard,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
          }}
        >
          {/* Product Visual Container */}
          <div
            style={{
              width: '130px',
              height: '130px',
              borderRadius: F.radiusMd, // 8px radius
              backgroundColor: F.bgSubtle,
              border: `1px solid ${F.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {featured.imageUrl ? (
              <img
                src={featured.imageUrl}
                alt={featured.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  const fallback = (e.currentTarget as HTMLElement).nextElementSibling;
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{ display: featured.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <ProductIcon name={featured.name} category={featured.category} size={64} color={F.textPrimary} />
            </div>
          </div>

          {/* Product Info & Controls */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: F.textPrimary, lineHeight: 1.2 }}>
                  {featured.name}
                </div>
                <div style={{ fontSize: '13px', color: F.textSecondary, marginTop: '3px' }}>
                  {featured.category || 'Fast Food'} • {featured.openingStock ?? 0} in stock
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '22px', fontWeight: 600, color: F.accentRed }}>
                  PKR {((featured.price || 0) * selectedQty).toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: F.textMuted,
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                  }}
                  title="Deselect item"
                >
                  <Dismiss20Regular style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>

            {/* Real Product Variants (Only if product has actual variants defined in catalog) */}
            {featured.variants && featured.variants.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                  Available Options
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {featured.variants.map((v: any, i: number) => (
                    <div
                      key={v.id || i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: F.radiusSm,
                        backgroundColor: F.bgSubtle,
                        border: `1px solid ${F.border}`,
                        fontSize: '12px',
                        color: F.textPrimary,
                        fontWeight: 600,
                      }}
                    >
                      {v.name || v.label} {v.price ? `(+PKR ${v.price})` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stepper & Add to Order Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
              {/* Fluent Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: F.bgSubtle, borderRadius: F.radiusMd, border: `1px solid ${F.border}` }}>
                <button
                  onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                  style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.textPrimary }}
                >
                  <Subtract20Regular style={{ width: 14, height: 14 }} />
                </button>
                <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 600, color: F.textPrimary }}>
                  {selectedQty}
                </span>
                <button
                  onClick={() => setSelectedQty((q) => q + 1)}
                  style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.textPrimary }}
                >
                  <Add20Regular style={{ width: 14, height: 14 }} />
                </button>
              </div>

              {/* Add to Order Button */}
              {(() => {
                const isFeaturedOut =
                  featured.openingStock !== null &&
                  featured.openingStock !== undefined &&
                  featured.openingStock <= 0;
                return (
                  <button
                    type="button"
                    disabled={isFeaturedOut}
                    onClick={() => {
                      if (!featured || isFeaturedOut) return;
                      addToCart(featured, selectedQty);
                      setSelectedQty(1);
                    }}
                    style={{
                      height: '36px',
                      padding: '0 20px',
                      borderRadius: F.radiusMd,
                      backgroundColor: isFeaturedOut
                        ? isDark
                          ? '#2A2A2A'
                          : '#E2E8F0'
                        : isDark
                        ? F.accentRed
                        : '#1A1A1E',
                      color: isFeaturedOut ? F.textMuted : '#FFFFFF',
                      border: 'none',
                      fontFamily: F.font,
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: isFeaturedOut ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s ease',
                      opacity: isFeaturedOut ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isFeaturedOut) {
                        e.currentTarget.style.backgroundColor = isDark ? F.accentRedHover : '#2D2D35';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isFeaturedOut) {
                        e.currentTarget.style.backgroundColor = isDark ? F.accentRed : '#1A1A1E';
                      }
                    }}
                  >
                    <Add16Filled />
                    <span>{isFeaturedOut ? 'Out of Stock' : 'Add to Order'}</span>
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
