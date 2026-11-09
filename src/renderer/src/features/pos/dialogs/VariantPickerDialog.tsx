import { PosCounterState } from '@/features/pos/usePosCounter';
import { Dismiss20Regular } from '@fluentui/react-icons';

export function VariantPickerDialog({ pos }: { pos: PosCounterState }) {
  const {
    isDark,
    F,
    variantPickerProduct,
    setVariantPickerProduct,
    addToCart,
  } = pos;

  return (
    <>
      {variantPickerProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
          onClick={() => setVariantPickerProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '420px',
              maxWidth: '92vw',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusLg,
              border: `1px solid ${F.border}`,
              boxShadow: F.shadowElevated,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '18px', color: F.textPrimary }}>
                  {variantPickerProduct.name}
                </div>
                <div style={{ fontSize: '12px', color: F.textSecondary, marginTop: '2px' }}>
                  {variantPickerProduct.category} • Select size or option to add to order
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVariantPickerProduct(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: F.textMuted, padding: '4px' }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
              {variantPickerProduct.variants?.map((v) => {
                const finalPrice = v.price !== undefined && v.price > 0 ? v.price : (variantPickerProduct.price + (v.priceDelta || 0));
                const isVarOut =
                  v.stock !== undefined && v.stock !== null
                    ? v.stock <= 0
                    : variantPickerProduct.openingStock !== null &&
                      variantPickerProduct.openingStock !== undefined &&
                      variantPickerProduct.openingStock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isVarOut}
                    onClick={() => {
                      if (isVarOut) return;
                      addToCart(
                        variantPickerProduct,
                        1,
                        v.label,
                        finalPrice
                      );
                      setVariantPickerProduct(null);
                    }}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border: `1.5px solid ${F.border}`,
                      backgroundColor: F.bgSubtle,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: isVarOut ? 'not-allowed' : 'pointer',
                      opacity: isVarOut ? 0.4 : 1,
                      transition: 'all 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isVarOut) {
                        e.currentTarget.style.borderColor = F.accentRed;
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF5F5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isVarOut) {
                        e.currentTarget.style.borderColor = F.border;
                        e.currentTarget.style.backgroundColor = F.bgSubtle;
                      }
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 800, color: F.textPrimary }}>
                      {v.label}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#FF4D64' : F.accentRed }}>
                      PKR {finalPrice.toLocaleString()}
                    </span>
                    {(v.stock !== undefined || variantPickerProduct.openingStock !== undefined) && (
                      <span style={{ fontSize: '10px', color: isVarOut ? '#EF4444' : F.textMuted, fontWeight: 600 }}>
                        {isVarOut ? 'Out of stock' : `${v.stock ?? variantPickerProduct.openingStock} left`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
