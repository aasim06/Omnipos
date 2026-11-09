import { Product } from '@shared/types';
import { getTokens } from '@/features/pos/posTokens';
import { playBeep } from '@/lib/soundFx';
import React from 'react';
import { decodeProductVariants } from '@/lib/variants';
import { ProductIcon } from '@/features/pos/posIcons';
import { Add20Regular, BarcodeScanner20Regular, Checkmark20Filled, Scales20Regular } from '@fluentui/react-icons';

export interface FastFoodVisualCardProps {
  product: Product;
  isSelected: boolean;
  isDark: boolean;
  F: ReturnType<typeof getTokens>;
  inCartMap: Record<string, number>;
  addToCart: (product: Product, qty?: number, variantLabel?: string, customUnitPrice?: number) => void;
  setSelectedProduct: (p: Product) => void;
  setSelectedQty: (qty: number) => void;
  playBeep: () => void;
  isWeightItem: boolean;
  setWeighingProduct: (p: Product) => void;
  setWeightAmount: (n: number) => void;
  setVariantPickerProduct: (p: Product) => void;
}

export const FastFoodVisualCard = React.memo(
  function FastFoodVisualCard({
    product: rawProduct,
    isSelected,
    isDark,
    F,
    inCartMap,
    addToCart,
    setSelectedProduct,
    setSelectedQty,
    playBeep,
    isWeightItem,
    setWeighingProduct,
    setWeightAmount,
    setVariantPickerProduct,
  }: FastFoodVisualCardProps) {
    const product = React.useMemo(() => decodeProductVariants(rawProduct), [rawProduct]);
    const variants = React.useMemo(() => product.variants || [], [product.variants]);
    const hasVariants = variants.length > 0;

    const isFood = product.module === 'fastfood';
    const isOut = !isFood && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= 0;
    const isLowStock = !isFood && !isOut && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= (product.minThreshold ?? 10);
    const inCartQty = inCartMap[product.id] ?? 0;

    const isWeighedOrAmount = isWeightItem || product.pricingType === 'perkg' || product.pricingType === 'amountse';

    const handleAction = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (isOut) return;

      if (isWeighedOrAmount || isWeightItem) {
        setWeighingProduct(product);
        setWeightAmount(1.0);
        playBeep();
      } else if (hasVariants) {
        setVariantPickerProduct(product);
        playBeep();
      } else {
        addToCart(product, 1);
        playBeep();
      }
    };

    return (
      <div
        onClick={() => handleAction()}
        style={{
          backgroundColor: F.bgCard,
          borderRadius: '8px',
          border: `1px solid ${isSelected ? F.accentRed : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          minHeight: '275px',
          cursor: isOut ? 'default' : 'pointer',
          opacity: isOut ? 0.6 : 1,
          boxShadow: isSelected
            ? '0 0 0 2px #E51937, 0 8px 24px rgba(229, 25, 55, 0.25)'
            : isDark
            ? '0 4px 16px rgba(0, 0, 0, 0.3)'
            : '0 2px 10px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isOut) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            if (!isSelected) {
              e.currentTarget.style.boxShadow = isDark
                ? '0 12px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.15)'
                : '0 12px 28px rgba(0,0,0,0.09), 0 0 0 1px rgba(229,25,55,0.2)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(229,25,55,0.3)';
            }
            const img = e.currentTarget.querySelector('img');
            if (img) img.style.transform = 'scale(1.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOut) {
            e.currentTarget.style.transform = 'translateY(0)';
            if (!isSelected) {
              e.currentTarget.style.boxShadow = isDark
                ? '0 4px 16px rgba(0, 0, 0, 0.3)'
                : '0 2px 10px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
            }
            const img = e.currentTarget.querySelector('img');
            if (img) img.style.transform = 'scale(1)';
          }
        }}
      >
        {/* ── Top Media Showcase: 145px ── */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '145px',
            overflow: 'hidden',
            backgroundColor: isDark ? '#18181B' : '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {product.imageBase64 || product.imageUrl ? (
            <img
              src={product.imageBase64 || product.imageUrl}
              alt={product.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.35s ease',
              }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
                const fallback = (e.currentTarget as HTMLElement).nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}

          {/* Fallback Graphic Pattern */}
          <div
            style={{
              display: product.imageBase64 || product.imageUrl ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              background: isDark
                ? 'linear-gradient(135deg, #1f1f24 0%, #161619 100%)'
                : 'linear-gradient(135deg, #F8FAFC 0%, #EDF2F7 100%)',
            }}
          >
            <ProductIcon name={product.name} category={product.category} size={46} color={isSelected ? F.accentRed : F.textPrimary} />
          </div>

          {/* Subtle Ambient Dark Gradient on bottom edge of image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 65%)',
              pointerEvents: 'none',
            }}
          />

          {/* Floating Stock Badge (Glassmorphic Top-Right) */}
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '20px',
              background: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
              fontSize: '11px',
              fontWeight: 600,
              color: isOut ? '#EF4444' : isLowStock ? '#F59E0B' : isDark ? '#FFFFFF' : '#111827',
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isOut ? '#EF4444' : isLowStock ? '#F59E0B' : '#10B981',
                boxShadow: `0 0 6px ${isOut ? '#EF4444' : isLowStock ? '#F59E0B' : '#10B981'}`,
              }}
            />
            <span>{isOut ? 'OUT' : isFood && (product.openingStock === null || product.openingStock === undefined) ? 'Fresh' : `${product.openingStock ?? '—'} left`}</span>
          </div>

          {/* In-Cart Glowing Indicator Pill */}
          {inCartQty > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor: '#107C41',
                color: '#FFFFFF',
                fontSize: '10.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 8px rgba(16, 124, 65, 0.45)',
              }}
            >
              <Checkmark20Filled style={{ width: 12, height: 12 }} />
              <span>{inCartQty} in cart</span>
            </div>
          )}
        </div>

        {/* ── Card Content Body ── */}
        <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', justifyContent: 'space-between' }}>
          <div>
            {/* SKU / Code & Category Pill */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10.5px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: isDark ? '#94A3B8' : '#475569',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'}`,
                  letterSpacing: '0.02em',
                }}
                title={`SKU / Code: ${product.skuCode || product.barcode || 'N/A'}`}
              >
                <BarcodeScanner20Regular style={{ width: 12, height: 12, opacity: 0.8 }} />
                <span>{product.skuCode || product.barcode || 'NO-SKU'}</span>
              </span>

              {product.category && (
                <span
                  style={{
                    fontSize: '10.5px',
                    color: F.textMuted,
                    fontWeight: 500,
                    maxWidth: '110px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={product.category}
                >
                  {product.category}
                </span>
              )}
            </div>

            {/* Product Name */}
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: F.textPrimary,
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={product.name}
            >
              {product.name}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: '11.5px',
                color: isDark ? '#A1A1AA' : '#6B7280',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                marginTop: '2px',
              }}
              title={product.description || (product.category ? `${product.category} special` : '')}
            >
              {product.description || (product.category ? `${product.category} special` : 'Fresh store item')}
            </div>
          </div>

          {/* ── Bottom Row: Price & Clean Action Button ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '12px',
              paddingTop: '8px',
              borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)'}`,
            }}
          >
            <div
              style={{
                fontSize: '14.5px',
                fontWeight: 800,
                color: '#10B981',
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'baseline',
              }}
            >
              <span>{product.price.toLocaleString()} PKR</span>
              {isWeighedOrAmount && (
                <span style={{ fontSize: '10.5px', fontWeight: 600, color: isDark ? '#9CA3AF' : '#6B7280', marginLeft: '3px' }}>
                  / {product.unit || 'kg'}
                </span>
              )}
            </div>

            {isWeighedOrAmount || isWeightItem ? (
              <button
                type="button"
                disabled={isOut}
                onClick={handleAction}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: isOut ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isOut) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOut) {
                    e.currentTarget.style.backgroundColor = '#10B981';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <Scales20Regular style={{ width: 14, height: 14 }} />
                <span>Weigh</span>
              </button>
            ) : hasVariants ? (
              <button
                type="button"
                disabled={isOut}
                onClick={handleAction}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: `1px solid ${inCartQty > 0 ? '#E51937' : isDark ? 'rgba(255,255,255,0.15)' : '#E2E8F0'}`,
                  backgroundColor: inCartQty > 0 ? '#E51937' : isDark ? '#27272A' : '#F8FAFC',
                  color: inCartQty > 0 ? '#FFFFFF' : isDark ? '#F4F4F5' : '#1E293B',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: isOut ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  boxShadow: inCartQty > 0 ? '0 2px 8px rgba(229, 25, 55, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isOut) {
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOut) {
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <Add20Regular style={{ width: 14, height: 14 }} />
                <span>Options ({variants.length})</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isOut}
                onClick={handleAction}
                style={{
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#E51937',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  cursor: isOut ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  fontFamily: 'inherit',
                  boxShadow: '0 2px 8px rgba(229, 25, 55, 0.35)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isOut) {
                    e.currentTarget.style.backgroundColor = '#be123c';
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOut) {
                    e.currentTarget.style.backgroundColor = '#E51937';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <Add20Regular style={{ width: 14, height: 14 }} />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  },
(prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isDark !== next.isDark) return false;
  if (prev.isWeightItem !== next.isWeightItem) return false;
  if (prev.product !== next.product) return false;

  // Compare inCart counts specifically for this product
  const prevCount = prev.inCartMap[prev.product.id] || 0;
  const nextCount = next.inCartMap[next.product.id] || 0;
  if (prevCount !== nextCount) return false;

  if (prev.product.variants && prev.product.variants.length > 0) {
    for (const v of prev.product.variants) {
      const key = `${prev.product.id}__${v.label}`;
      if ((prev.inCartMap[key] || 0) !== (next.inCartMap[key] || 0)) {
        return false;
      }
    }
  }

  return true;
});
