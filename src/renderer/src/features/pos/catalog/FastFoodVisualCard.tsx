import { Product } from '@shared/types';
import { getTokens } from '@/features/pos/posTokens';
import React from 'react';
import { decodeProductVariants } from '@/lib/variants';
import { Add16Filled, Delete16Regular, Options16Regular, Scales16Regular, Subtract16Filled } from '@fluentui/react-icons';

export interface FastFoodVisualCardProps {
  product: Product;
  isSelected: boolean;
  isDark: boolean;
  F: ReturnType<typeof getTokens>;
  inCartMap: Record<string, number>;
  addToCart: (product: Product, qty?: number, variantLabel?: string, customUnitPrice?: number) => void;
  removeFromCart: (productId: string, variantLabel?: string) => void;
  updateCartQty: (productId: string, delta: number, variantLabel?: string) => void;
  setSelectedProduct: (p: Product) => void;
  setSelectedQty: (qty: number) => void;
  playBeep: () => void;
  isWeightItem: boolean;
  setWeighingProduct: (p: Product) => void;
  setWeightAmount: (n: number) => void;
  setVariantPickerProduct: (p: Product) => void;
}

/* Muted per-category swatches: [light bg, light ink, dark bg, dark ink]. */
const SWATCHES = [
  ['#F3E8E6', '#9A3B2E', '#3A2724', '#E8A598'],
  ['#F4ECDF', '#8A5A12', '#3A3022', '#E2BC7E'],
  ['#E6F0E4', '#2F6B2A', '#24332A', '#9DD196'],
  ['#E2EFEE', '#1E6660', '#20332F', '#8ED0C8'],
  ['#E4ECF5', '#2A5A8C', '#222D3A', '#9CC0E8'],
  ['#ECE8F5', '#57439A', '#2C2838', '#BCADEB'],
  ['#F4E6EE', '#8E3466', '#38242F', '#E6A3C8'],
  ['#ECEBE4', '#5A5A3C', '#2F2F28', '#C9C9A3'],
] as const;

function swatchFor(key: string, isDark: boolean) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const s = SWATCHES[Math.abs(h) % SWATCHES.length];
  return isDark ? { bg: s[2], ink: s[3] } : { bg: s[0], ink: s[1] };
}

/** "Fresh Milk (1 Liter)" -> "FM", "suger" -> "SU". */
function initials(name: string): string {
  const words = name.replace(/\(.*?\)/g, ' ').split(/[^A-Za-z0-9؀-ۿ]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Trim long fractional quantities (119.706 -> 119.71) and drop trailing zeros. */
function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/**
 * Retail POS product tile.
 * Tap anywhere to add (weighed items open the scale, items with sizes open the picker).
 * A plain item already in the order shows a - qty + stepper in place of the add button.
 */
export const FastFoodVisualCard = React.memo(
  function FastFoodVisualCard({
    product: rawProduct,
    isSelected,
    isDark,
    F,
    inCartMap,
    addToCart,
    removeFromCart,
    updateCartQty,
    playBeep,
    isWeightItem,
    setWeighingProduct,
    setWeightAmount,
    setVariantPickerProduct,
  }: FastFoodVisualCardProps) {
    const product = React.useMemo(() => decodeProductVariants(rawProduct), [rawProduct]);
    const variants = product.variants || [];
    const hasVariants = variants.length > 0;

    const isFood = product.module === 'fastfood';
    const stock = product.openingStock;
    const hasStock = stock !== null && stock !== undefined;
    const isOut = !isFood && hasStock && (stock as number) <= 0;
    const isLowStock = !isFood && !isOut && hasStock && (stock as number) <= (product.minThreshold ?? 10);

    // inCartMap[id] already totals every variant line of this product.
    const inCartQty = inCartMap[product.id] ?? 0;
    const isWeighed = isWeightItem || product.pricingType === 'perkg' || product.pricingType === 'amountse';
    const usesStepper = !isWeighed && !hasVariants && inCartQty > 0;
    const isActive = isSelected || inCartQty > 0;

    const unitLabel = (product.unit || 'kg').toLowerCase();
    const hasImage = Boolean(product.imageBase64 || product.imageUrl);
    const [imgFailed, setImgFailed] = React.useState(false);
    const [hover, setHover] = React.useState(false);
    const [pressed, setPressed] = React.useState(false);
    const showPhoto = hasImage && !imgFailed;

    const sw = React.useMemo(() => swatchFor(product.category || product.name, isDark), [product.category, product.name, isDark]);
    const accent = F.accentRed;
    const code = product.skuCode || product.barcode;

    const handleAction = () => {
      if (isOut) return;
      if (isWeighed) {
        setWeighingProduct(product);
        setWeightAmount(1.0);
        playBeep();
      } else if (hasVariants) {
        setVariantPickerProduct(product);
        playBeep();
      } else {
        addToCart(product, 1); // addToCart plays its own beep
      }
    };

    const decrement = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (inCartQty <= 1) removeFromCart(product.id);
      else updateCartQty(product.id, -1);
    };
    const increment = (e: React.MouseEvent) => {
      e.stopPropagation();
      addToCart(product, 1);
    };

    let stockText = '';
    if (hasStock && !isOut) stockText = `${formatQty(stock as number)}${isWeighed ? ` ${unitLabel}` : ''} left`;
    else if (isFood && !hasStock) stockText = 'Made to order';
    const stockColor = isLowStock ? (isDark ? '#F2C661' : '#A15C00') : F.textMuted;

    const lift = hover && !isOut;
    const ring = isActive ? accent : lift ? (isDark ? '#5A5A5A' : '#C4C4C4') : F.border;

    const iconBtn: React.CSSProperties = {
      width: '32px',
      height: '32px',
      padding: 0,
      border: 'none',
      borderRadius: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'background-color 0.12s ease, color 0.12s ease',
    };

    return (
      <div
        role="button"
        tabIndex={isOut ? -1 : 0}
        aria-disabled={isOut}
        aria-label={`${product.name}, Rs ${product.price}${isWeighed ? ` per ${unitLabel}` : ''}${inCartQty ? `, ${formatQty(inCartQty)} in order` : ''}`}
        className="pos-tile"
        onClick={handleAction}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAction();
          }
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: '232px',
          backgroundColor: F.bgCard,
          border: `1px solid ${ring}`,
          boxShadow: isActive
            ? `inset 0 0 0 1px ${accent}`
            : lift
            ? isDark
              ? '0 8px 20px rgba(0,0,0,0.45)'
              : '0 8px 20px rgba(15,23,42,0.08)'
            : 'none',
          borderRadius: '10px',
          overflow: 'hidden',
          cursor: isOut ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          outline: 'none',
          fontFamily: F.font,
          transform: pressed && !isOut ? 'scale(0.98)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease',
        }}
      >
        {/* Media */}
        <div
          style={{
            position: 'relative',
            height: '116px',
            flexShrink: 0,
            backgroundColor: showPhoto || isOut ? F.bgSubtle : sw.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {isOut && !showPhoto ? null : showPhoto ? (
            <img
              src={product.imageBase64 || product.imageUrl}
              alt=""
              draggable={false}
              onError={() => setImgFailed(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: isOut ? 'grayscale(1)' : 'none',
                opacity: isOut ? 0.45 : 1,
                transform: lift ? 'scale(1.04)' : 'none',
                transition: 'transform 0.3s ease',
              }}
            />
          ) : (
            <span
              aria-hidden
              style={{
                fontSize: '34px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: sw.ink,
                lineHeight: 1,
              }}
            >
              {initials(product.name)}
            </span>
          )}

          {(isWeighed || hasVariants) && (
            <span
              style={{
                position: 'absolute',
                left: '8px',
                bottom: '8px',
                height: '22px',
                padding: '0 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: isDark ? '#F5F5F5' : '#1A1A1A',
                backgroundColor: isDark ? 'rgba(20,20,20,0.75)' : 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(6px)',
              }}
            >
              {isWeighed ? <Scales16Regular style={{ width: 13, height: 13 }} /> : <Options16Regular style={{ width: 13, height: 13 }} />}
              {isWeighed ? `Sold by ${unitLabel}` : `${variants.length} options`}
            </span>
          )}

          {inCartQty > 0 && !usesStepper && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                minWidth: '24px',
                height: '24px',
                padding: '0 7px',
                boxSizing: 'border-box',
                borderRadius: '12px',
                backgroundColor: accent,
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontVariantNumeric: 'tabular-nums',
                boxShadow: '0 2px 6px rgba(229,25,55,0.35)',
              }}
            >
              {formatQty(inCartQty)}
              {isWeighed ? ` ${unitLabel}` : ''}
            </span>
          )}

          {isOut && (
            <span
              style={{
                position: 'absolute',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.92)',
                color: '#C42B1C',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}
            >
              SOLD OUT
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, minHeight: 0, padding: '10px 12px 10px', display: 'flex', flexDirection: 'column' }}>
          <div
            title={product.name}
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              lineHeight: '18px',
              maxHeight: '36px',
              color: isOut ? F.textMuted : F.textPrimary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {product.name}
          </div>

          <div
            style={{
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: F.textMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {code && (
              <span style={{ fontFamily: 'Consolas, "Cascadia Mono", monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{code}</span>
            )}
            {code && stockText && <span aria-hidden>·</span>}
            {stockText && (
              <span style={{ color: stockColor, fontWeight: isLowStock ? 600 : 400, flexShrink: 0 }}>
                {isLowStock ? `Only ${stockText}` : stockText}
              </span>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ minWidth: 0, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: F.textSecondary, marginRight: '3px' }}>Rs</span>
              <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', color: isOut ? F.textMuted : F.textPrimary }}>
                {product.price.toLocaleString()}
              </span>
              {isWeighed && <span style={{ fontSize: '12px', color: F.textMuted }}> /{unitLabel}</span>}
            </div>

            {isOut ? null : usesStepper ? (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  border: `1px solid ${accent}`,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  aria-label={inCartQty <= 1 ? `Remove ${product.name}` : `One less ${product.name}`}
                  onClick={decrement}
                  style={{ ...iconBtn, width: '28px', height: '30px', borderRadius: 0, backgroundColor: 'transparent', color: accent }}
                >
                  {inCartQty <= 1 ? <Delete16Regular /> : <Subtract16Filled />}
                </button>
                <span
                  style={{
                    minWidth: '22px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: F.textPrimary,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatQty(inCartQty)}
                </span>
                <button
                  type="button"
                  aria-label={`One more ${product.name}`}
                  onClick={increment}
                  style={{ ...iconBtn, width: '28px', height: '30px', borderRadius: 0, backgroundColor: accent, color: '#FFFFFF' }}
                >
                  <Add16Filled />
                </button>
              </div>
            ) : (
              <span
                aria-hidden
                style={{
                  ...iconBtn,
                  backgroundColor: lift ? accent : F.bgSubtle,
                  color: lift ? '#FFFFFF' : F.textPrimary,
                }}
              >
                {isWeighed ? <Scales16Regular /> : hasVariants ? <Options16Regular /> : <Add16Filled />}
              </span>
            )}
          </div>
        </div>

        <style>{`.pos-tile:focus-visible{outline:2px solid ${F.textPrimary};outline-offset:2px}`}</style>
      </div>
    );
  },
  (prev, next) =>
    prev.product === next.product &&
    prev.isSelected === next.isSelected &&
    prev.isDark === next.isDark &&
    prev.isWeightItem === next.isWeightItem &&
    prev.F === next.F &&
    prev.addToCart === next.addToCart &&
    prev.removeFromCart === next.removeFromCart &&
    prev.updateCartQty === next.updateCartQty &&
    (prev.inCartMap[prev.product.id] || 0) === (next.inCartMap[next.product.id] || 0),
);
