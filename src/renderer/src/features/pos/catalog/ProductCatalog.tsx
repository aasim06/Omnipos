import { PosCounterState } from '@/features/pos/usePosCounter';
import { playBeep } from '@/lib/soundFx';
import { Add16Filled, Scales20Regular } from '@fluentui/react-icons';
import { FastFoodVisualCard } from '@/features/pos/catalog/FastFoodVisualCard';
import { lowStockLimit } from '@/lib/stockStatus';

export function ProductCatalog({ pos, highlightSelected = true }: { pos: PosCounterState; highlightSelected?: boolean }) {
  const {
    module,
    isDark,
    F,
    activeCategory,
    selectedProduct,
    setSelectedProduct,
    setSelectedQty,
    viewMode,
    setWeighingProduct,
    setWeightAmount,
    setVariantPickerProduct,
    filteredProducts,
    isWeighableOrLiquid,
    inCartMap,
    addToCart,
    removeFromCart,
    updateCartQty,
  } = pos;

  return (
    <>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: F.textPrimary }}>
            {module === 'fastfood' ? 'Menu Items' : 'Store Catalog'} ({filteredProducts.length})
          </div>
          <div style={{ fontSize: '12px', color: F.textMuted }}>
            Showing items in {activeCategory}
          </div>
        </div>

        {module === 'minimart' && viewMode === 'table' ? (
          /* ── High-Density Supermarket Table View ── */
          <div
            style={{
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              border: `1px solid ${F.border}`,
              overflow: 'hidden',
              boxShadow: F.shadowCard,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', fontFamily: F.font }}>
              <thead>
                <tr style={{ backgroundColor: F.bgSubtle, borderBottom: `1px solid ${F.border}`, color: F.textSecondary, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>SKU / Barcode</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Product Name</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Rack Location</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Stock</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: F.textMuted }}>
                      No products found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isFood = product.module === 'fastfood';
                    const isOut = !isFood && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= 0;
                    const isLowStock = !isFood && !isOut && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= lowStockLimit(product);
                    const inCartCount = inCartMap[product.id] || 0;
                    const isWeightItem = isWeighableOrLiquid(product.unit);

                    return (
                      <tr
                        key={product.id}
                        style={{
                          borderBottom: `1px solid ${F.borderSubtle}`,
                          backgroundColor: inCartCount > 0 ? (isDark ? 'rgba(229, 25, 55, 0.08)' : '#FFF5F5') : 'transparent',
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: '12px', color: F.textMuted }}>
                          {product.skuCode || '—'}
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: F.textPrimary }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{product.name}</span>
                            {product.unit && (
                              <span style={{ fontSize: '10px', color: F.textSecondary, backgroundColor: F.bgSubtle, padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>
                                {product.unit.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', color: F.textSecondary, fontSize: '12px' }}>
                          {product.category || 'Retail'}
                        </td>
                        <td style={{ padding: '10px 16px', color: F.textMuted, fontSize: '12px' }}>
                          {product.rackLocation || '—'}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: isOut ? '#FEE2E2' : isLowStock ? '#FEF3C7' : '#DCFCE7',
                              color: isOut ? '#EF4444' : isLowStock ? '#D97706' : '#16A34A',
                            }}
                          >
                            {isOut ? 'OUT OF STOCK' : isFood && (product.openingStock === null || product.openingStock === undefined) ? 'Fresh / Made to Order' : `${product.openingStock ?? '—'} left`}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: F.accentRed }}>
                          PKR {product.price.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                          {isWeightItem ? (
                            <button
                              type="button"
                              onClick={() => {
                                setWeighingProduct(product);
                                setWeightAmount(1.0);
                                playBeep();
                              }}
                              style={{
                                padding: '5px 12px',
                                borderRadius: F.radiusSm,
                                border: 'none',
                                backgroundColor: '#10B981',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              <Scales20Regular style={{ width: 14, height: 14 }} />
                              <span>Weigh</span>
                            </button>
                          ) : (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                disabled={isOut}
                                onClick={() => {
                                  if (product.hasVariants && product.variants && product.variants.length > 0) {
                                    setVariantPickerProduct(product);
                                  } else {
                                    addToCart(product, 1);
                                  }
                                }}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: F.radiusSm,
                                  border: `1px solid ${inCartCount > 0 ? F.accentRed : F.border}`,
                                  backgroundColor: inCartCount > 0 ? F.accentRed : F.bgSubtle,
                                  color: inCartCount > 0 ? '#FFFFFF' : F.textPrimary,
                                  fontWeight: 600,
                                  fontSize: '12px',
                                  cursor: isOut ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Add16Filled style={{ width: 14, height: 14 }} />
                                <span>{inCartCount > 0 ? `Add (${inCartCount})` : 'Add'}</span>
                              </button>
                              {isWeightItem && (
                                <button
                                  type="button"
                                  title="Open Scale / Fractional Calculator"
                                  onClick={() => {
                                    setWeighingProduct(product);
                                    setWeightAmount(1.0);
                                    playBeep();
                                  }}
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: F.radiusSm,
                                    border: `1px solid ${F.borderSubtle}`,
                                    backgroundColor: F.bgSubtle,
                                    color: F.textSecondary,
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Scales20Regular style={{ width: 14, height: 14 }} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Visual Grid View: compact POS tiles ── */
          <div style={{ display: 'grid', gridTemplateColumns: filteredProducts.length === 0 ? '1fr' : 'repeat(auto-fill, minmax(164px, 1fr))', gap: '12px' }}>
            {filteredProducts.length === 0 ? (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  backgroundColor: F.bgCard,
                  borderRadius: F.radiusMd,
                  border: `1px dashed ${F.border}`,
                  color: F.textMuted,
                }}
              >
                <p style={{ fontSize: '15px', fontWeight: 600, color: F.textPrimary, margin: '0 0 6px 0' }}>
                  No Products in Catalog
                </p>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  Store catalog is empty. Click "+ Add New Item" from the left menu to create your products.
                </p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = highlightSelected && selectedProduct?.id === product.id;
                const isWeightItem = isWeighableOrLiquid(product.unit) || product.pricingType === 'perkg' || product.pricingType === 'amountse';

                return (
                  <FastFoodVisualCard
                    key={product.id}
                    product={product}
                    isSelected={isSelected}
                    isDark={isDark}
                    F={F}
                    inCartMap={inCartMap}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    updateCartQty={updateCartQty}
                    setSelectedProduct={setSelectedProduct}
                    setSelectedQty={setSelectedQty}
                    playBeep={playBeep}
                    isWeightItem={isWeightItem}
                    setWeighingProduct={setWeighingProduct}
                    setWeightAmount={setWeightAmount}
                    setVariantPickerProduct={setVariantPickerProduct}
                  />
                );
              })
            )}
          </div>
        )}
      </div>
    </>
  );
}
