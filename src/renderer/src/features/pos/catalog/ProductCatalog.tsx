import React from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { playBeep } from '@/lib/soundFx';
import {
  Add16Filled,
  Box20Regular,
  Scales20Regular,
  Trophy20Regular,
  Tag20Regular,
} from '@fluentui/react-icons';
import { FastFoodVisualCard } from '@/features/pos/catalog/FastFoodVisualCard';
import { lowStockLimit } from '@/lib/stockStatus';

/** Semicircular segmented gauge arc chart (from reference Image 2) - now truly dynamic */
function GaugeArc({
  percent = 75,
  color = '#10B981',
  isDark = false,
  width = 44,
  height = 22,
}: {
  percent?: number;
  color?: string;
  isDark?: boolean;
  width?: number;
  height?: number;
}) {
  const clamped = Math.max(5, Math.min(100, percent));
  const rad = Math.PI * (1 - clamped / 100);
  const cx = 22;
  const cy = 22;
  const r = 16;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);
  const activePath = `M 6 22 A 16 16 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`;

  return (
    <svg width={width} height={height} viewBox="0 0 44 24" style={{ overflow: 'visible', flexShrink: 0 }}>
      {/* Background track arc with segmented dash */}
      <path
        d="M 6 22 A 16 16 0 0 1 38 22"
        fill="none"
        stroke={isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0'}
        strokeWidth="4"
        strokeDasharray="2.5 1.5"
        strokeLinecap="round"
      />
      {/* Dynamic foreground progress arc with segmented dash */}
      <path
        d={activePath}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray="2.5 1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

  // Stats for the "Product Statistic" banner (Image 2)
  const topProduct = React.useMemo(() => {
    if (filteredProducts.length === 0) return null;
    return filteredProducts.reduce((max, p) => ((p.openingStock ?? 0) > (max.openingStock ?? 0) ? p : max), filteredProducts[0]);
  }, [filteredProducts]);

  const totalStockUnits = React.useMemo(() => {
    return filteredProducts.reduce((sum, p) => sum + (Number(p.openingStock) || 0), 0);
  }, [filteredProducts]);

  const avgHealthPercent = React.useMemo(() => {
    if (filteredProducts.length === 0) return 0;
    const totalScore = filteredProducts.reduce((acc, p) => {
      const isFood = p.module === 'fastfood';
      if (isFood || p.openingStock === null || p.openingStock === undefined) return acc + 90;
      if (p.openingStock <= 0) return acc + 8;
      const lowLimit = lowStockLimit(p);
      if (p.openingStock <= lowLimit) {
        const ratio = Math.max(0.1, p.openingStock / Math.max(1, lowLimit));
        return acc + Math.round(15 + ratio * 30);
      }
      if (p.openingStock > 50) {
        const ratio = Math.min(1, (p.openingStock - 50) / 100);
        return acc + Math.round(75 + ratio * 23);
      }
      const ratio = Math.min(1, Math.max(0, (p.openingStock - lowLimit) / Math.max(1, (50 - lowLimit))));
      return acc + Math.round(50 + ratio * 24);
    }, 0);
    return Math.round(totalScore / filteredProducts.length);
  }, [filteredProducts]);

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

        {viewMode === 'table' || module === 'minimart' ? (
          /* ── Modern SaaS List View with Wrapper Card & Side Margins (Image 2 style) ── */
          <div style={{ width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
            <div
              style={{
                width: '100%',
                backgroundColor: F.bgCard,
                borderRadius: '16px',
                border: `1px solid ${F.border}`,
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.35)' : '0 1px 4px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
            >
              {/* ── Product Statistic Banner (like Image 2) ── */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9'}`,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.015)' : '#FAFAFA',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: F.textPrimary, letterSpacing: '-0.01em' }}>
                    Product Statistic
                  </div>
                  <div style={{ fontSize: '11px', color: F.textMuted, fontWeight: 500 }}>
                    Real-time inventory & stock health overview
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
                  {/* 1. Active Products */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '58px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Tag20Regular style={{ width: 14, height: 14, color: '#3B82F6' }} />
                      <span>Active Catalog</span>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: F.textPrimary, marginTop: '4px' }}>
                      {filteredProducts.length} <span style={{ fontSize: '11px', fontWeight: 500, color: F.textMuted }}>Items</span>
                    </div>
                  </div>

                  {/* 2. Top Stock Item (No Emoji, Fluent Trophy Icon) */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '58px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Trophy20Regular style={{ width: 14, height: 14, color: '#F59E0B' }} />
                      <span>Top Stock Item</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: F.textPrimary, marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={topProduct?.name}>
                      {topProduct ? topProduct.name : '—'}
                    </div>
                  </div>

                  {/* 3. Catalog Stock Health (Dynamic Gauge Arc) */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      minHeight: '58px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Stock Health
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: avgHealthPercent > 60 ? '#10B981' : avgHealthPercent > 40 ? '#F59E0B' : '#EF4444' }}>
                          {avgHealthPercent}%
                        </span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: avgHealthPercent > 60 ? '#10B981' : avgHealthPercent > 40 ? '#F59E0B' : '#EF4444', backgroundColor: avgHealthPercent > 60 ? 'rgba(16, 185, 129, 0.12)' : avgHealthPercent > 40 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                          {avgHealthPercent > 60 ? 'Healthy' : avgHealthPercent > 40 ? 'Fair' : 'Low'}
                        </span>
                      </div>
                    </div>
                    <GaugeArc percent={avgHealthPercent} color={avgHealthPercent > 60 ? '#10B981' : avgHealthPercent > 40 ? '#F59E0B' : '#EF4444'} isDark={isDark} />
                  </div>

                  {/* 4. Total Stock Units */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '58px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <Box20Regular style={{ width: 14, height: 14, color: '#10B981' }} />
                      <span>Total Stock</span>
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: F.textPrimary, marginTop: '4px' }}>
                      {totalStockUnits.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500, color: F.textMuted }}>Units</span>
                    </div>
                  </div>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div
                  style={{
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: F.textMuted,
                  }}
                >
                  <p style={{ fontSize: '15px', fontWeight: 600, color: F.textPrimary, margin: '0 0 6px 0' }}>
                    No Products Found
                  </p>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    No items in this category yet.
                  </p>
                </div>
              ) : (
                filteredProducts.map((product, idx) => {
                  const isFood = product.module === 'fastfood';
                  const isOut = !isFood && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= 0;
                  const isLowStock = !isFood && !isOut && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= lowStockLimit(product);
                  const inCartCount = inCartMap[product.id] || 0;
                  const isWeightItem = isWeighableOrLiquid(product.unit);
                  const photo = product.imageBase64 || product.imageUrl;

                  // Truly dynamic stock health calculation for each product
                  let perfLabel = 'Stock Healthy';
                  let perfColor = '#10B981';
                  let perfPercent = 75;

                  if (isOut) {
                    perfLabel = 'Out of Stock';
                    perfColor = '#EF4444';
                    perfPercent = 8;
                  } else if (isLowStock) {
                    const lowLimit = lowStockLimit(product);
                    const ratio = Math.max(0.1, (product.openingStock ?? 1) / Math.max(1, lowLimit));
                    perfPercent = Math.round(15 + ratio * 30); // 15% - 45%
                    perfLabel = 'Low Stock';
                    perfColor = '#F59E0B';
                  } else if (product.openingStock && product.openingStock > 50) {
                    const ratio = Math.min(1, ((product.openingStock ?? 50) - 50) / 100);
                    perfPercent = Math.round(75 + ratio * 23); // 75% - 98%
                    perfLabel = 'Stock Healthy';
                    perfColor = '#10B981';
                  } else {
                    const lowLimit = lowStockLimit(product);
                    const ratio = Math.min(1, Math.max(0, ((product.openingStock ?? 10) - lowLimit) / Math.max(1, (50 - lowLimit))));
                    perfPercent = Math.round(50 + ratio * 24); // 50% - 74%
                    perfLabel = 'Stock Normal';
                    perfColor = '#10B981';
                  }

                  const initials = product.name
                    .replace(/\(.*?\)/g, ' ')
                    .split(/[^A-Za-z0-9؀-ۿ]+/)
                    .filter((w) => /^[A-Za-z؀-ۿ]/.test(w))
                    .map((w) => w[0].toUpperCase())
                    .slice(0, 2)
                    .join('') || '?';

                  const isLast = idx === filteredProducts.length - 1;

                  return (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (isOut) return;
                        if (isWeightItem) {
                          setWeighingProduct(product);
                          setWeightAmount(1.0);
                          playBeep();
                        } else if (product.hasVariants && product.variants && product.variants.length > 0) {
                          setVariantPickerProduct(product);
                        } else {
                          addToCart(product, 1);
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 18px',
                        boxSizing: 'border-box',
                        borderBottom: isLast ? 'none' : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9'}`,
                        borderLeft: inCartCount > 0 ? `4px solid ${F.accentRed}` : '4px solid transparent',
                        backgroundColor: inCartCount > 0
                          ? (isDark ? 'rgba(229, 25, 55, 0.08)' : '#FFF5F5')
                          : 'transparent',
                        cursor: isOut ? 'not-allowed' : 'pointer',
                        opacity: isOut ? 0.6 : 1,
                        transition: 'background-color 0.12s ease',
                        userSelect: 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (!isOut && inCartCount === 0) {
                          e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (inCartCount === 0) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {/* Col 1: Thumbnail + Product Name & Category */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1.5, minWidth: '120px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '12px',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                          }}
                        >
                          {photo ? (
                            <img src={photo} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '15px', fontWeight: 700, color: isDark ? '#E2E8F0' : '#475569' }}>
                              {initials}
                            </span>
                          )}
                        </div>

                        <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: F.textPrimary,
                                lineHeight: '18px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {product.name}
                            </span>
                            {product.unit && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: F.textSecondary,
                                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  letterSpacing: '0.02em',
                                  flexShrink: 0,
                                }}
                              >
                                {product.unit.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: F.textMuted, marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 500 }}>{product.category || 'General'}</span>
                            {product.rackLocation && (
                              <>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span>Rack {product.rackLocation}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Divider 1 */}
                      <div style={{ width: '1px', height: '28px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', margin: '0 10px', flexShrink: 0 }} />

                      {/* Col 2: Performance Text & SKU */}
                      <div style={{ width: '125px', flexShrink: 0, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: perfColor, lineHeight: '16px' }}>
                          {perfLabel}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '11px', color: F.textMuted }}>
                          <span style={{ fontFamily: 'monospace', color: isDark ? '#94A3B8' : '#64748B' }}>
                            {product.skuCode || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Divider 2 */}
                      <div style={{ width: '1px', height: '28px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', margin: '0 10px', flexShrink: 0 }} />

                      {/* Col 3: Dynamic Semicircular Gauge Arc & Percent */}
                      <div style={{ width: '54px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <GaugeArc percent={perfPercent} color={perfColor} isDark={isDark} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: perfColor, marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                          {perfPercent}%
                        </span>
                      </div>

                      {/* Divider 3 */}
                      <div style={{ width: '1px', height: '28px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', margin: '0 10px', flexShrink: 0 }} />

                      {/* Col 4: Stock with Box Icon */}
                      <div style={{ width: '85px', flexShrink: 0 }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: F.textMuted }}>
                          Stock
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                          <Box20Regular
                            style={{
                              width: 14,
                              height: 14,
                              color: isOut ? '#EF4444' : isLowStock ? '#F59E0B' : '#10B981',
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: isOut ? '#EF4444' : isLowStock ? '#D97706' : isDark ? '#E2E8F0' : '#1E293B',
                            }}
                          >
                            {isOut ? 'Out' : `${product.openingStock ?? '—'}`}
                          </span>
                        </div>
                      </div>

                      {/* Divider 4 */}
                      <div style={{ width: '1px', height: '28px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', margin: '0 10px', flexShrink: 0 }} />

                      {/* Col 5: Product Price & Action Button (Guaranteed NO cut-off!) */}
                      <div
                        style={{
                          width: '160px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '8px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ textAlign: 'right', minWidth: '55px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: F.textMuted }}>
                            Price
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: F.accentRed, fontVariantNumeric: 'tabular-nums' }}>
                            PKR {Number(product.price || 0).toLocaleString()}
                          </div>
                        </div>

                        {/* Action buttons */}
                        {isWeightItem ? (
                          <button
                            type="button"
                            onClick={() => {
                              setWeighingProduct(product);
                              setWeightAmount(1.0);
                              playBeep();
                            }}
                            style={{
                              height: '30px',
                              padding: '0 10px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                              fontWeight: 600,
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexShrink: 0,
                              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            <Scales20Regular style={{ width: 13, height: 13 }} />
                            <span>Weigh</span>
                          </button>
                        ) : inCartCount > 0 ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9',
                              padding: '2px',
                              borderRadius: '6px',
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : F.border}`,
                              flexShrink: 0,
                            }}
                          >
                            <button
                              type="button"
                              title="Decrease"
                              onClick={() => updateCartQty(product.id, inCartCount - 1)}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: F.bgCard,
                                color: F.textPrimary,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '13px',
                              }}
                            >
                              -
                            </button>
                            <span
                              style={{
                                minWidth: '20px',
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '11px',
                                color: F.accentRed,
                              }}
                            >
                              {inCartCount}
                            </span>
                            <button
                              type="button"
                              title="Add another"
                              onClick={() => addToCart(product, 1)}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: F.accentRed,
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '13px',
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
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
                              height: '30px',
                              padding: '0 12px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: F.accentRed,
                              color: '#FFFFFF',
                              fontWeight: 600,
                              fontSize: '12px',
                              cursor: isOut ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexShrink: 0,
                              boxShadow: '0 2px 4px rgba(229, 25, 55, 0.25)',
                            }}
                          >
                            <Add16Filled style={{ width: 12, height: 12 }} />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
                  Store catalog is empty. Click "Add New Item" from the left menu to create your products.
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
