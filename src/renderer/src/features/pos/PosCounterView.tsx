import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomSelect } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Food24Regular,
  FoodChickenLeg24Regular,
  FoodPizza24Regular,
  FoodApple24Regular,
  FoodCake24Regular,
  FoodFish24Regular,
  FoodGrains24Regular,
  FoodCarrot24Regular,
  FoodEgg24Regular,
  BowlSalad24Regular,
  DrinkCoffee24Regular,
  DrinkToGo24Regular,
  DrinkBeer24Regular,
  ShoppingBag24Regular,
  Search20Regular,
  Add20Regular,
  Add16Filled,
  Subtract20Regular,
  Delete20Regular,
  Checkmark20Filled,
  Tag20Regular,
  Dismiss16Regular,
  LeafOne20Regular,
  Fire20Regular,
  Star20Regular,
  CheckmarkCircle20Filled,
  Receipt20Regular,
  Dismiss20Regular,
  Money20Regular,
  Payment20Regular,
  Notebook20Regular,
  Pause20Regular,
  Play20Regular,
  Clock20Regular,
  NoteEdit20Regular,
  VehicleTruckProfile20Regular,
  PeopleCommunity20Regular,
  Edit20Regular,
  BarcodeScanner20Regular,
  Table20Regular,
  Grid20Regular,
  Scales20Regular,
  Box20Regular,
  Phone20Regular,
  Keyboard20Regular,
  ChevronLeft20Regular,
  ChevronRight20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  Person20Regular,
  PaintBrush20Regular,
} from '@fluentui/react-icons';
import { posApi, resolveApiUrl } from '@/lib/api';
import { printKitchenKot } from '@/lib/kotPrinter';
import { Product, CartLine, Order, Category } from '@shared/types';
import { uid, nowISO } from '@/lib/utils';
import { useAppTheme } from '@/theme/AppProviders';
import { PosCounterSkeleton } from '@/components/skeletons/PageSkeletons';
import { playBeep, playSuccessChime } from '@/lib/soundFx';
import { decodeProductVariants } from '@/lib/variants';

/* ─── Fluent UI 2 Desktop Design Tokens (Dynamic Light / Dark) ───── */
function getTokens(isDark: boolean) {
  return {
    bgCanvas: isDark ? '#1A1A1A' : '#FAFAFA',      // Soft Mica / Content canvas
    bgCard: isDark ? '#242424' : '#FFFFFF',        // Pure white or elevated dark card surfaces
    bgSubtle: isDark ? '#2D2D2D' : '#F3F3F3',      // Neutral gray segment tracks and soft boxes
    bgHover: isDark ? '#383838' : '#EAEAEA',       // Hover states
    border: isDark ? '#3D3D3D' : '#E5E5E5',        // Crisp 1px desktop borders
    borderSubtle: isDark ? '#333333' : '#ECECEC',  // Interior dividers
    textPrimary: isDark ? '#FFFFFF' : '#1A1A1E',   // High-contrast Windows typography
    textSecondary: isDark ? '#ABABAB' : '#616161', // Secondary labels
    textMuted: isDark ? '#7E7E7E' : '#8C8C8C',     // Muted hints
    accentRed: '#E51937',                          // Strictly reserved red brand accent
    accentRedHover: isDark ? '#EC3953' : '#C6172E',
    accentRedSubtle: isDark ? 'rgba(229, 25, 55, 0.18)' : 'rgba(229, 25, 55, 0.08)',
    accentGreen: isDark ? '#34A853' : '#107C41',   // Fluent status green
    radiusSm: '4px',
    radiusMd: '8px',                              // 8px subtle corner radius on UI cards
    radiusLg: '12px',
    shadowCard: isDark
      ? '0 1px 3px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.6)'
      : '0 1px 3px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.08)',
    shadowElevated: isDark
      ? '0 4px 14px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.4)'
      : '0 4px 14px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
    font: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI Variable', 'Segoe UI', sans-serif",
  };
}

/* ─── Icon Resolver ────────────────────────────────────────────────── */
function ProductIcon({ name, category, size = 24, color }: { name: string; category?: string; size?: number; color?: string }) {
  const n = (name + ' ' + (category ?? '')).toLowerCase();
  const style = { width: size, height: size, color: color || 'currentColor', flexShrink: 0 };

  if (n.includes('chicken') || n.includes('wing') || n.includes('leg')) return <FoodChickenLeg24Regular style={style} />;
  if (n.includes('pizza')) return <FoodPizza24Regular style={style} />;
  if (n.includes('fish') || n.includes('tuna') || n.includes('salmon')) return <FoodFish24Regular style={style} />;
  if (n.includes('cake') || n.includes('sweet') || n.includes('dessert') || n.includes('mithai')) return <FoodCake24Regular style={style} />;
  if (n.includes('apple') || n.includes('fruit')) return <FoodApple24Regular style={style} />;
  if (n.includes('rice') || n.includes('biryani') || n.includes('grain') || n.includes('wheat')) return <FoodGrains24Regular style={style} />;
  if (n.includes('egg') || n.includes('omelette')) return <FoodEgg24Regular style={style} />;
  if (n.includes('salad') || n.includes('greens') || n.includes('vegan') || n.includes('veg')) return <BowlSalad24Regular style={style} />;
  if (n.includes('carrot') || n.includes('vegetable') || n.includes('sabzi')) return <FoodCarrot24Regular style={style} />;
  if (n.includes('coffee') || n.includes('chai') || n.includes('tea') || n.includes('espresso')) return <DrinkCoffee24Regular style={style} />;
  if (n.includes('juice') || n.includes('shake') || n.includes('smoothie') || n.includes('cola') || n.includes('pepsi') || n.includes('drink')) return <DrinkToGo24Regular style={style} />;
  if (n.includes('beer') || n.includes('fizz') || n.includes('soda')) return <DrinkBeer24Regular style={style} />;
  if (n.includes('bread') || n.includes('roti') || n.includes('naan') || n.includes('toast')) return <FoodGrains24Regular style={style} />;
  if (n.includes('soup') || n.includes('curry') || n.includes('stew') || n.includes('bowl')) return <BowlSalad24Regular style={style} />;
  return <Food24Regular style={style} />;
}

function CategoryIcon({ cat, size = 16 }: { cat: string; size?: number }) {
  const c = cat.toLowerCase();
  const s = { width: size, height: size };
  if (c.includes('paint') || c.includes('primer') || c.includes('wall') || c.includes('color')) return <PaintBrush20Regular style={s} />;
  if (c.includes('sanitary') || c.includes('tap') || c.includes('tooti') || c.includes('mixer')) return <DrinkToGo24Regular style={{ width: size, height: size }} />;
  if (c.includes('hardware') || c.includes('iron') || c.includes('kill') || c.includes('nail') || c.includes('bolt')) return <Box20Regular style={s} />;
  if (c.includes('cosmetic') || c.includes('skin') || c.includes('cream') || c.includes('beauty')) return <Star20Regular style={s} />;
  if (c.includes('garment') || c.includes('cloth') || c.includes('shirt') || c.includes('men')) return <Tag20Regular style={s} />;
  if (c.includes('shoe') || c.includes('footwear')) return <Box20Regular style={s} />;
  if (c.includes('toy') || c.includes('kid')) return <Star20Regular style={s} />;
  if (c.includes('general')) return <Box20Regular style={s} />;
  if (c.includes('vegan') || c.includes('vegetarian')) return <LeafOne20Regular style={s} />;
  if (c.includes('street') || c.includes('snack') || c.includes('fast')) return <Fire20Regular style={s} />;
  if (c.includes('dessert') || c.includes('cake') || c.includes('sweet')) return <Star20Regular style={s} />;
  if (c.includes('drink') || c.includes('beverage')) return <DrinkToGo24Regular style={{ width: size, height: size }} />;
  return <Food24Regular style={{ width: size, height: size }} />;
}

function formatSizeBadge(label: string): string {
  const l = label.trim().toLowerCase();
  if (l === 'small' || l === 's' || l === 'size s') return 'S';
  if (l === 'medium' || l === 'm' || l === 'size m') return 'M';
  if (l === 'large' || l === 'l' || l === 'size l') return 'L';
  if (l === 'extra large' || l === 'x-large' || l === 'xl' || l === 'size xl') return 'XL';
  // Shoe sizes e.g. "40", "41", "42", "43", "44", "Size 42"
  const shoeMatch = l.match(/\b(3[89]|4[0-6])\b/);
  if (shoeMatch) return shoeMatch[1];
  // Cosmetic shades e.g. "#01 Red" -> "#01", "#08 Nude" -> "#08"
  const shadeMatch = l.match(/(#\d+)/);
  if (shadeMatch) return shadeMatch[1];
  if (l.includes('can') || l.includes('tin')) return 'Can';
  if (l.includes('500') || l.includes('half')) return '500ml';
  if (l.includes('1.5') || l.includes('jumbo')) return '1.5L';
  if (l.includes('1.0') || l === '1 liter' || l === '1l' || l.includes('1 liter')) return '1.0L';
  if (l.includes('small (500ml)') || l.includes('small bottle')) return 'Small';
  if (l.includes('large (1.5l)') || l.includes('large bottle')) return 'Large';
  if (l.includes('balti') || l.includes('drum')) return 'Balti';
  if (l.includes('gallon') || l.includes('gal')) return 'Gallon';
  if (l.includes('quarter') || l.includes('qtr')) return 'Quarter';
  if (l.includes('0.5 kg') || l.includes('500g') || l.includes('aadha')) return '0.5 KG';
  if (l.includes('1.0 kg') || l.includes('1kg') || l.includes('ek kilo')) return '1 KG';
  if (l.includes('5.0 kg') || l.includes('5kg')) return '5 KG';
  if (l.includes('125ml')) return '125ml';
  if (l.includes('250ml')) return '250ml';
  if (l.includes('400ml')) return '400ml';
  if (l.includes('100g')) return '100g';
  if (l.includes('200g')) return '200g';
  return label.length > 6 ? label.slice(0, 5) : label;
}

interface FastFoodVisualCardProps {
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

const FastFoodVisualCard = React.memo(
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
  }: FastFoodVisualCardProps) {
    const product = React.useMemo(() => decodeProductVariants(rawProduct), [rawProduct]);
    const variants = React.useMemo(() => product.variants || [], [product.variants]);
    const hasVariants = variants.length > 0;
    const [selectedVariantId, setSelectedVariantId] = React.useState<string>(variants[0]?.id || '');

    React.useEffect(() => {
      if (variants.length > 0 && !variants.some((v) => v.id === selectedVariantId)) {
        setSelectedVariantId(variants[0].id);
      }
    }, [variants, selectedVariantId]);

    const activeVariant = variants.find((v) => v.id === selectedVariantId) || variants[0];
    const activePrice = activeVariant
      ? (activeVariant.price !== undefined && activeVariant.price > 0
          ? activeVariant.price
          : product.price + (activeVariant.priceDelta || 0))
      : product.price;

    const isOut = product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= 0;
    const isLowStock = !isOut && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= (product.minThreshold ?? 10);
    const inCartQty = (activeVariant ? inCartMap[`${product.id}__${activeVariant.label}`] : undefined) ?? inCartMap[product.id] ?? 0;

  const isWeighedOrAmount = isWeightItem || product.pricingType === 'perkg' || product.pricingType === 'amountse';
  const [quickAmountRs, setQuickAmountRs] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleAddByRupees = (rs: number) => {
    if (rs <= 0) return;
    const finalQty = Number((rs / (product.price || 1)).toFixed(3));
    const unitName = product.unit || 'kg';
    const weightDisplay = finalQty >= 1 ? `${finalQty} ${unitName}` : `${Math.round(finalQty * 1000)}g`;
    const variantLabel = `${weightDisplay} (${rs} PKR @ PKR ${product.price}/${unitName})`;
    const calculatedUnitPrice = Number((rs / (finalQty || 1)).toFixed(4));
    addToCart(product, finalQty, variantLabel, calculatedUnitPrice);
    setQuickAmountRs('');
    playBeep();
  };

  return (
    <div
      onClick={() => {
        if (!isOut) {
          if (isWeighedOrAmount) {
            inputRef.current?.focus();
            setSelectedProduct(product);
            return;
          }
          if (isWeightItem) {
            setWeighingProduct(product);
            setWeightAmount(1.0);
            playBeep();
            return;
          }
          setSelectedProduct(product);
          setSelectedQty(1);
        }
      }}
      style={{
        backgroundColor: F.bgCard,
        borderRadius: '12px',
        border: `1px solid ${isSelected ? F.accentRed : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '320px',
        height: 'auto',
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
      {/* ── Top Media Showcase: 160px ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '160px',
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
          <ProductIcon name={product.name} category={product.category} size={48} color={isSelected ? F.accentRed : F.textPrimary} />
        </div>

        {/* Subtle Ambient Dark Gradient on bottom edge of image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 60%)',
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
            background: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.85)',
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
          <span>{isOut ? 'OUT' : `${product.openingStock ?? '—'} left`}</span>
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

      {/* ── Card Content Body (Matching Reference Screenshot) ── */}
      <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', justifyContent: 'space-between' }}>
        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: F.textPrimary,
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={product.name}
          >
            {product.name}
          </div>
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
            title={product.description || product.category || ''}
          >
            {product.description || (product.category ? `${product.category} special` : 'Fresh menu item')}
          </div>

          {/* ── Segmented Size Strip (S / M / L / XL or Footwear 40-44) ── */}
          {hasVariants && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(variants.length, 5)}, 1fr)`,
                borderRadius: '6px',
                border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
                overflow: 'hidden',
                marginTop: '8px',
                backgroundColor: isDark ? '#1C1C1E' : '#F4F4F5',
              }}
            >
              {variants.slice(0, 5).map((v) => {
                const isVarActive = v.id === (activeVariant?.id || variants[0].id);
                const vPrice = v.price !== undefined && v.price > 0 ? v.price : product.price + (v.priceDelta || 0);
                const shortLabel = formatSizeBadge(v.label);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVariantId(v.id);
                    }}
                    style={{
                      border: 'none',
                      borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                      backgroundColor: isVarActive ? '#E51937' : 'transparent',
                      color: isVarActive ? '#FFFFFF' : isDark ? '#A1A1AA' : '#52525B',
                      padding: '4px 2px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isVarActive ? '0 0 12px rgba(229, 25, 55, 0.45)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 800, lineHeight: 1.1 }}>{shortLabel}</span>
                    <span style={{ fontSize: '9.5px', fontWeight: 600, opacity: isVarActive ? 1 : 0.75, lineHeight: 1.1 }}>
                      {vPrice.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Quick Rupees Budget Input & Presets for Per KG / Meethai Items ("50 ki ya 70 ki de do") ── */}
          {!hasVariants && isWeighedOrAmount && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                marginTop: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                padding: '5px 7px',
                borderRadius: '7px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              {/* Quick Preset Buttons (50, 100, 250) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {[50, 100, 250].map((presetRs) => {
                  const calcWeight = Number((presetRs / (product.price || 1)).toFixed(3));
                  const weightDisplay = calcWeight >= 1 ? `${calcWeight}kg` : `${Math.round(calcWeight * 1000)}g`;
                  return (
                    <button
                      key={presetRs}
                      type="button"
                      title={`Click to add Rs. ${presetRs} (${weightDisplay})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddByRupees(presetRs);
                      }}
                      style={{
                        padding: '3px 0',
                        borderRadius: '4px',
                        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                        color: F.accentRed,
                        fontWeight: 800,
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        lineHeight: 1.1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = F.accentRed;
                        e.currentTarget.style.color = '#FFFFFF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? '#27272A' : '#FFFFFF';
                        e.currentTarget.style.color = F.accentRed;
                      }}
                    >
                      <span>Rs.{presetRs}</span>
                      <span style={{ fontSize: '8.5px', fontWeight: 600, opacity: 0.75 }}>
                        {weightDisplay}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Direct Input (e.g. 70) with live calculated grams/kg */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '6px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: F.accentRed,
                      pointerEvents: 'none',
                    }}
                  >
                    Rs
                  </span>
                  <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    placeholder="e.g. 70"
                    value={quickAmountRs}
                    onChange={(e) => setQuickAmountRs(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        const val = parseFloat(quickAmountRs);
                        if (val > 0) handleAddByRupees(val);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      height: '26px',
                      paddingLeft: '24px',
                      paddingRight: '6px',
                      borderRadius: '5px',
                      border: `1.5px solid ${quickAmountRs ? F.accentRed : isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)'}`,
                      backgroundColor: isDark ? '#27272A' : '#FFFFFF',
                      color: isDark ? '#FFFFFF' : '#111827',
                      fontSize: '12px',
                      fontWeight: 800,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="button"
                  title="Add amount to cart"
                  onClick={(e) => {
                    e.stopPropagation();
                    const val = parseFloat(quickAmountRs);
                    if (val > 0) handleAddByRupees(val);
                  }}
                  style={{
                    height: '26px',
                    padding: '0 8px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: quickAmountRs ? F.accentRed : isDark ? '#3F3F46' : '#E2E8F0',
                    color: quickAmountRs ? '#FFFFFF' : isDark ? '#A1A1AA' : '#64748B',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: quickAmountRs ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.12s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {quickAmountRs && parseFloat(quickAmountRs) > 0 ? (
                    (() => {
                      const w = Number((parseFloat(quickAmountRs) / (product.price || 1)).toFixed(3));
                      const wStr = w >= 1 ? `${w}kg` : `${Math.round(w * 1000)}g`;
                      return `+ ${wStr}`;
                    })()
                  ) : (
                    '+ Add'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom Row: Dynamic Green Price & Red Add Button ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '6px' }}>
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
            <span>{activePrice.toLocaleString()} PKR</span>
            {isWeighedOrAmount && (
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: isDark ? '#9CA3AF' : '#6B7280', marginLeft: '3px' }}>
                / {product.unit || 'kg'}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isOut}
            onClick={(e) => {
              e.stopPropagation();
              if (isWeighedOrAmount) {
                const val = parseFloat(quickAmountRs);
                if (val > 0) {
                  handleAddByRupees(val);
                } else {
                  inputRef.current?.focus();
                }
                return;
              }
              if (isWeightItem) {
                setWeighingProduct(product);
                setWeightAmount(1.0);
                playBeep();
              } else if (hasVariants && activeVariant) {
                addToCart(product, 1, activeVariant.label, activePrice);
                playBeep();
              } else {
                addToCart(product, 1);
                playBeep();
              }
            }}
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
            <span>
              {isWeighedOrAmount && quickAmountRs && parseFloat(quickAmountRs) > 0
                ? `🛒 Add Rs.${quickAmountRs}`
                : isWeighedOrAmount
                ? '🛒 Enter Rs'
                : '🛒 Add'}
            </span>
          </button>
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

/* ─── Addon Ingredients (Build Your Meal) ──────────────────────────── */
const ADDONS = [
  { icon: <FoodCarrot24Regular style={{ width: 18, height: 18 }} />, label: 'Veggies' },
  { icon: <FoodApple24Regular style={{ width: 18, height: 18 }} />, label: 'Fresh' },
  { icon: <LeafOne20Regular style={{ width: 18, height: 18 }} />, label: 'Herbs' },
  { icon: <FoodEgg24Regular style={{ width: 18, height: 18 }} />, label: 'Extra' },
  { icon: <FoodGrains24Regular style={{ width: 18, height: 18 }} />, label: 'Grains' },
];

type FastFoodOrderType = 'dine-in' | 'takeaway' | 'delivery';

interface ParkedOrder {
  id: string;
  parkedAt: string;
  label: string;
  orderType: FastFoodOrderType;
  tableOrToken: string;
  lines: CartLine[];
  subtotal: number;
}

interface PosCounterProps {
  module: 'fastfood' | 'minimart';
  modeType?: 'fastfood' | 'minimart' | 'paint';
}

export function PosCounterView({ module, modeType }: PosCounterProps): React.JSX.Element {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const F = React.useMemo(() => getTokens(isDark), [isDark]);

  /* State */
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([0, 2]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'khata'>('cash');
  const [selectedKhataId, setSelectedKhataId] = useState<string>('');

  /* Fast Food Specific: Order Type & Routing */
  const [orderType, setOrderType] = useState<FastFoodOrderType>('dine-in');
  const [tableNo, setTableNo] = useState<string>('Table 1');
  const [tokenNo, setTokenNo] = useState<number>(() => {
    const saved = localStorage.getItem('pos_token_seq');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [deliveryDetails, setDeliveryDetails] = useState({
    customerName: '',
    phone: '',
    address: '',
    fee: 100,
  });

  /* Parked / Held Orders */
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>(() => {
    try {
      const saved = localStorage.getItem('pos_parked_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showParkedModal, setShowParkedModal] = useState(false);

  /* Quick Cash Tender & Change Due */
  const [tenderedAmount, setTenderedAmount] = useState<number | ''>('');

  /* Line Item Kitchen Prep Notes */
  const [editingNoteItem, setEditingNoteItem] = useState<{ productId: string; variantLabel?: string; currentNote: string } | null>(null);

  /* Mini Mart Specific: Barcode Scanner, Dual View Mode & Scale Calculator */
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScannedFeedback, setLastScannedFeedback] = useState<string | null>(null);
  const scannerInputRef = React.useRef<HTMLInputElement>(null);

  /* Loose / Weight Scale Calculator */
  const [weighingProduct, setWeighingProduct] = useState<Product | null>(null);
  const [weightAmount, setWeightAmount] = useState<number>(1.0);
  const [weightCalcMode, setWeightCalcMode] = useState<'weight' | 'rupees'>('weight');
  const [targetRupees, setTargetRupees] = useState<number>(50);

  /* Quick Quantity Numpad / Multiplier Popover */
  const [editingQtyItem, setEditingQtyItem] = useState<{
    productId: string;
    variantLabel?: string;
    currentQty: number;
    name: string;
  } | null>(null);
  const [customQtyInput, setCustomQtyInput] = useState<string>('');

  /* Minimart Customer Phone & Loyalty Lookup */
  const [customerPhone, setCustomerPhone] = useState('');

  /* Collapsible Sections (for maximizing cart item room) */
  const [isTopSectionCollapsed, setIsTopSectionCollapsed] = useState(false);
  const [isPromoCollapsed, setIsPromoCollapsed] = useState(true);

  /* Customer Autocomplete (MUI floating-label outline style matching reference screenshot) */
  interface CustomerOption {
    id?: string;
    name: string;
    phone?: string;
    currentDebt?: number;
    creditLimit?: number;
  }
  const defaultGuestCustomer: CustomerOption = {
    id: '',
    name: 'Guest',
    currentDebt: 0,
  };
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption>(defaultGuestCustomer);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = React.useRef<HTMLDivElement>(null);
  const customerInputRef = React.useRef<HTMLInputElement>(null);

  const formatCustomerBalance = (cust: CustomerOption | null | undefined) => {
    if (!cust) return '0.00';
    if (cust.currentDebt === undefined || cust.currentDebt === null) return '0.00';
    if (cust.currentDebt === 0) return '0.00';
    return cust.currentDebt > 0 ? `-${cust.currentDebt.toFixed(2)}` : `${Math.abs(cust.currentDebt).toFixed(2)}`;
  };

  /* Close customer dropdown when clicking outside */
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Quick Size / Variant Picker for Apparel, Shoes & Products with Variants */
  const [variantPickerProduct, setVariantPickerProduct] = useState<Product | null>(null);

  /* Query Khatas for Credit / Udhaar payment */
  const { data: customerKhatas = [] } = useQuery({
    queryKey: ['khatas'],
    queryFn: () => posApi.fetchKhatas(),
  });

  /* Auto-sync selected customer with Khatas when loaded */
  React.useEffect(() => {
    if (customerKhatas.length > 0) {
      if (selectedCustomer.id) {
        const found = customerKhatas.find((k: any) => k.id === selectedCustomer.id);
        if (found) setSelectedCustomer(found);
      } else if (selectedCustomer.name.toLowerCase() === 'guest') {
        const guestInDb = customerKhatas.find((k: any) => k.name.toLowerCase() === 'guest');
        if (guestInDb) setSelectedCustomer(guestInDb);
      }
    }
  }, [customerKhatas]);

  const handleSelectCustomer = (cust: CustomerOption) => {
    setSelectedCustomer(cust);
    setCustomerSearchQuery('');
    setIsCustomerDropdownOpen(false);
    if (cust.id) {
      setSelectedKhataId(cust.id);
    } else {
      setSelectedKhataId('');
    }
    if (cust.phone) {
      setCustomerPhone(cust.phone);
      if (orderType === 'delivery') {
        setDeliveryDetails((prev) => ({
          ...prev,
          customerName: cust.name,
          phone: cust.phone || prev.phone,
        }));
      }
    } else if (orderType === 'delivery' && cust.name !== 'Guest') {
      setDeliveryDetails((prev) => ({
        ...prev,
        customerName: cust.name,
      }));
    }
    playBeep();
  };

  const handleClearCustomer = () => {
    const guestInDb = customerKhatas.find((k: any) => k.name.toLowerCase() === 'guest');
    setSelectedCustomer(guestInDb || defaultGuestCustomer);
    setCustomerSearchQuery('');
    setSelectedKhataId(guestInDb?.id || '');
    setIsCustomerDropdownOpen(false);
    playBeep();
  };

  const filteredCustomerOptions = React.useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    const list: CustomerOption[] = [];
    const guestInDb = customerKhatas.find((k: any) => k.name.toLowerCase() === 'guest');
    list.push(guestInDb || defaultGuestCustomer);

    customerKhatas.forEach((k: any) => {
      if (k.name.toLowerCase() !== 'guest') {
        list.push(k);
      }
    });

    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [customerSearchQuery, customerKhatas, defaultGuestCustomer]);

  /* Query Products */
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products', module],
    queryFn: () => posApi.fetchProducts(module),
  });

  /* Query Categories from Database */
  const { data: dbCategories = [] } = useQuery<Category[]>({
    queryKey: ['categories', module],
    queryFn: () => posApi.fetchCategories(module),
  });

  // Fluent Pivot Category Tabs (Dynamic from Database & Catalog filtered by Module)
  const allCategoryTabs = React.useMemo(() => {
    const fromDb = dbCategories.filter((c) => !c.module || c.module === module).map((c) => c.name);
    const fromProducts = products.filter((p) => !p.module || p.module === module).map((p) => p.category).filter(Boolean);

    // Explicit retail category tabs for minimart counter
    const minimartDefaults = module === 'minimart' ? [
      'Cosmetics & Skincare',
      "Men's Garments",
      'Footwear & Shoes',
      'Toys & Kids',
      'Paints & Wall Primer',
      'Sanitary & Taps',
      'Hardware & Iron',
      'General Store',
    ] : [];

    return Array.from(new Set(['All', ...minimartDefaults, ...fromDb, ...fromProducts]));
  }, [dbCategories, products, module]);

  // Count items per category for visual badge in Fast Food sidebar
  const categoryCounts = React.useMemo(() => {
    const moduleProducts = products.filter((p) => !p.module || p.module === module);
    const counts: Record<string, number> = { All: moduleProducts.length };
    moduleProducts.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products, module]);

  // Scrollable Category Tabs controller (MUI / Fluent UI Pivot style with Chevrons)
  const tabScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollButtons = React.useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(checkScrollButtons, 120);
    window.addEventListener('resize', checkScrollButtons);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollButtons);
    };
  }, [allCategoryTabs, checkScrollButtons]);

  const handleScrollTabs = (direction: 'left' | 'right') => {
    if (!tabScrollRef.current) return;
    const delta = direction === 'left' ? -220 : 220;
    tabScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Auto-scroll active category into view
  React.useEffect(() => {
    if (tabScrollRef.current) {
      const activeEl = tabScrollRef.current.querySelector<HTMLButtonElement>('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    checkScrollButtons();
  }, [activeCategory, checkScrollButtons]);

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      // Role separation: Fast Food counter sells food menus, Mini Mart sells retail goods. Raw ingredients are hidden from POS selling.
      if (module === 'fastfood') {
        if (p.itemRole === 'retail_product' || p.itemRole === 'raw_ingredient') return false;
      } else if (module === 'minimart') {
        if (p.itemRole === 'food_menu' || p.itemRole === 'raw_ingredient') return false;
      }

      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.skuCode && p.skuCode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.variants &&
          p.variants.some(
            (v) =>
              (v.skuCode && v.skuCode.toLowerCase().includes(q)) ||
              (v.label && v.label.toLowerCase().includes(q))
          ));
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, module, searchTerm, activeCategory]);

  // Reset state when switching between Fast Food and Mini Mart
  React.useEffect(() => {
    setSelectedProduct(null);
    setActiveCategory('All');
    setSearchTerm('');
    if (module === 'minimart') {
      const timer = setTimeout(() => {
        scannerInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [module]);

  // Auto-select first item as hero in Fast Food mode
  React.useEffect(() => {
    if (module === 'fastfood' && filteredProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredProducts[0]);
    }
  }, [module, filteredProducts.length]);

  /* Matched Khata customer if phone matches */
  const matchedCustomer = React.useMemo(() => {
    if (!customerPhone.trim()) return null;
    const q = customerPhone.trim().toLowerCase();
    return (
      customerKhatas.find(
        (k: any) =>
          (k.phone && k.phone.toLowerCase().includes(q)) ||
          k.name.toLowerCase().includes(q)
      ) || null
    );
  }, [customerPhone, customerKhatas]);

  /* Helper: Check if product unit is sold by weight (kg/g) or volume (liter/ml) */
  const isWeightUnit = (unit?: string | null) => {
    if (!unit) return false;
    return ['kg', 'g', 'gram', 'kilogram'].includes(unit.toLowerCase().trim());
  };

  const isLiquidUnit = (unit?: string | null) => {
    if (!unit) return false;
    return ['liter', 'litre', 'l', 'ltr', 'ml'].includes(unit.toLowerCase().trim());
  };

  const isWeighableOrLiquid = (unit?: string | null) => {
    return isWeightUnit(unit) || isLiquidUnit(unit);
  };

  /* Barcode Scanner Logic (Hardware Gun & Fast Keyboard Input) */
  const handleBarcodeScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = barcodeInput.trim();
    if (!raw) return;

    let qty = 1;
    let lookupTerm = raw;
    if (raw.includes('*')) {
      const parts = raw.split('*');
      const parsedQty = parseInt(parts[0], 10);
      if (!isNaN(parsedQty) && parsedQty > 0) {
        qty = parsedQty;
        lookupTerm = parts.slice(1).join('*').trim();
      }
    }

    const termLower = lookupTerm.toLowerCase();
    let matchedVariant: any = null;
    const found = products.find((p) => {
      if (p.skuCode && p.skuCode.toLowerCase() === termLower) return true;
      if (p.id.toLowerCase() === termLower) return true;
      const vMatch = p.variants?.find((v) => v.skuCode && v.skuCode.toLowerCase() === termLower);
      if (vMatch) {
        matchedVariant = vMatch;
        return true;
      }
      return p.name.toLowerCase() === termLower || p.name.toLowerCase().includes(termLower);
    });

    if (found) {
      if (matchedVariant) {
        const vPrice =
          matchedVariant.price !== undefined && matchedVariant.price > 0
            ? matchedVariant.price
            : found.price + (matchedVariant.priceDelta || 0);
        addToCart(found, qty, matchedVariant.label, vPrice);
        setLastScannedFeedback(
          `✅ Added ${qty}x ${found.name} (${matchedVariant.label}) (PKR ${(vPrice * qty).toLocaleString()})`
        );
        setBarcodeInput('');
        setTimeout(() => setLastScannedFeedback(null), 3500);
        return;
      }

      const isWeightItem = isWeighableOrLiquid(found.unit);
      if (isWeightItem) {
        setWeighingProduct(found);
        setWeightAmount(1.0);
        setBarcodeInput('');
        playBeep();
        return;
      }

      addToCart(found, qty);
      setLastScannedFeedback(`✅ Added ${qty}x ${found.name} (PKR ${(found.price * qty).toLocaleString()})`);
      setBarcodeInput('');
      setTimeout(() => setLastScannedFeedback(null), 3500);
    } else {
      playBeep();
      setLastScannedFeedback(`❌ "${lookupTerm}" not found in catalog`);
      setTimeout(() => setLastScannedFeedback(null), 3500);
    }
  };

  /* Scale / Loose Weight & Liquid Volume Calculator Confirmation */
  const handleConfirmWeight = () => {
    if (!weighingProduct) return;
    const finalQty = Number(weightAmount.toFixed(3));
    const calcPrice = Math.round(weighingProduct.price * finalQty);
    const unitName = weighingProduct.unit || 'kg';
    const variantLabel = `${finalQty} ${unitName} @ PKR ${weighingProduct.price}/${unitName}`;
    addToCart(weighingProduct, finalQty, variantLabel, weighingProduct.price);
    setWeighingProduct(null);
    setLastScannedFeedback(`Added ${finalQty} ${unitName} of ${weighingProduct.name} (PKR ${calcPrice.toLocaleString()})`);
    setTimeout(() => setLastScannedFeedback(null), 3500);
  };

  /* Quick Quantity Numpad / Multiplier Apply */
  const handleApplyCustomQty = (newQty: number) => {
    if (!editingQtyItem || newQty <= 0) return;
    setCart((prev) =>
      prev.map((item) =>
        item.productId === editingQtyItem.productId && item.variantLabel === editingQtyItem.variantLabel
          ? { ...item, quantity: newQty }
          : item
      )
    );
    setEditingQtyItem(null);
    playBeep();
  };

  // Fast O(1) in-cart lookup map to avoid scanning cart repeatedly
  const inCartMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      const key = `${item.productId}__${item.variantLabel || ''}`;
      map[key] = (map[key] || 0) + item.quantity;
      map[item.productId] = (map[item.productId] || 0) + item.quantity;
    }
    return map;
  }, [cart]);

  /* Cart Operations */
  const addToCart = React.useCallback((
    product: Product,
    qty = 1,
    variantLabel?: string,
    customUnitPrice?: number,
    notes?: string
  ) => {
    const unitPrice = customUnitPrice !== undefined ? customUnitPrice : product.price;
    setCart((prev) => {
      const existsIndex = prev.findIndex(
        (item) => item.productId === product.id && item.variantLabel === variantLabel
      );
      if (existsIndex > -1) {
        return prev.map((item, idx) =>
          idx === existsIndex ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice,
          quantity: qty,
          variantLabel,
          notes,
          imageUrl: product.imageUrl,
        },
      ];
    });
    playBeep();
  }, []);

  const removeFromCart = React.useCallback((productId: string, variantLabel?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variantLabel === variantLabel))
    );
    playBeep();
  }, []);

  const updateCartQty = React.useCallback((productId: string, delta: number, variantLabel?: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantLabel === variantLabel
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
    playBeep();
  }, []);

  /* Hold / Park Order (Queue Management) */
  const handleParkOrder = () => {
    if (cart.length === 0) return;
    const label =
      orderType === 'dine-in'
        ? tableNo || 'Dine-In'
        : orderType === 'takeaway'
        ? `Token #${String(tokenNo).padStart(2, '0')}`
        : `Delivery (${deliveryDetails.customerName || 'Cust'})`;

    const newParked: ParkedOrder = {
      id: uid(),
      parkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      label,
      orderType,
      tableOrToken: orderType === 'dine-in' ? tableNo : String(tokenNo),
      lines: [...cart],
      subtotal: total,
    };

    const updated = [newParked, ...parkedOrders];
    setParkedOrders(updated);
    try {
      localStorage.setItem('pos_parked_orders', JSON.stringify(updated));
    } catch {}

    setCart([]);
    setTenderedAmount('');
    if (orderType === 'takeaway') {
      setTokenNo((t) => {
        const next = t + 1;
        try {
          localStorage.setItem('pos_token_seq', String(next));
        } catch {}
        return next;
      });
    }

    // In fast food mode, automatically route KOT to Kitchen display & print thermal receipt
    if (module === 'fastfood') {
      try {
        resolveApiUrl().then((base) => {
          fetch(`${base}/api/kitchen/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: label,
              orderType: orderType.toUpperCase(),
              lines: cart.map((l) => ({
                id: l.productId,
                name: l.name,
                quantity: l.quantity,
                variantLabel: l.variantLabel || '',
                notes: l.notes || '',
              })),
            }),
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
          }).catch(() => {});
        }).catch(() => {});

        void printKitchenKot(
          {
            id: newParked.id,
            module: 'fastfood',
            lines: newParked.lines,
            discountPercent: 0,
            stage: 'kot',
            createdAt: nowISO(),
            updatedAt: nowISO(),
            orderType: newParked.orderType,
          },
          {
            tableOrToken: newParked.tableOrToken,
          }
        );
      } catch {}
    }

    playBeep();
  };

  const handleResumeParkedOrder = (parked: ParkedOrder) => {
    setCart(parked.lines);
    setOrderType(parked.orderType);
    if (parked.orderType === 'dine-in') setTableNo(parked.tableOrToken);
    const remaining = parkedOrders.filter((p) => p.id !== parked.id);
    setParkedOrders(remaining);
    try {
      localStorage.setItem('pos_parked_orders', JSON.stringify(remaining));
    } catch {}
    setShowParkedModal(false);
    playBeep();
  };

  const handleDiscardParkedOrder = (id: string) => {
    const remaining = parkedOrders.filter((p) => p.id !== id);
    setParkedOrders(remaining);
    try {
      localStorage.setItem('pos_parked_orders', JSON.stringify(remaining));
    } catch {}
  };

  /* Financial Totals */
  const effectiveDeliveryFee = orderType === 'delivery' ? deliveryDetails.fee : deliveryFee;
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountVal = (subtotal * discountPct) / 100;
  const total = Math.max(0, subtotal - discountVal + effectiveDeliveryFee);

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'SAVE10') {
      setDiscountPct(10);
      setAppliedPromo(promoCode.trim());
    } else if (code === 'SAVE20') {
      setDiscountPct(20);
      setAppliedPromo(promoCode.trim());
    } else {
      setAppliedPromo('');
      setDiscountPct(0);
    }
    setPromoCode('');
  };

  /* Checkout Mutation */
  const { mutate: checkout, isPending } = useMutation({
    mutationFn: async () => {
      const hasCustomCust = selectedCustomer.name && selectedCustomer.name !== 'Guest';
      let assignedCustomerName: string | undefined;
      let assignedOrderType: 'dine-in' | 'takeaway' | 'delivery' | 'khata' = orderType;

      if (paymentMode === 'khata') {
        assignedOrderType = 'khata';
        assignedCustomerName = selectedCustomer?.name || 'Khata Customer';
      } else if (module === 'minimart') {
        if (hasCustomCust) {
          assignedCustomerName = `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}`;
        } else if (matchedCustomer) {
          assignedCustomerName = `${matchedCustomer.name} (${matchedCustomer.phone || customerPhone})`;
        } else if (customerPhone.trim()) {
          assignedCustomerName = `Customer (${customerPhone.trim()})`;
        } else {
          assignedCustomerName = 'Walk-In Customer';
        }
        assignedOrderType = 'takeaway';
      } else if (orderType === 'dine-in') {
        assignedCustomerName = hasCustomCust
          ? `${selectedCustomer.name} · Dine-In (${tableNo || 'Table 1'})`
          : `Dine-In (${tableNo || 'Table 1'})`;
      } else if (orderType === 'takeaway') {
        assignedCustomerName = hasCustomCust
          ? `${selectedCustomer.name} · Takeaway (Token #${String(tokenNo).padStart(2, '0')})`
          : `Takeaway (Token #${String(tokenNo).padStart(2, '0')})`;
      } else if (orderType === 'delivery') {
        assignedCustomerName = `Delivery (${deliveryDetails.customerName || selectedCustomer.name || 'Customer'} · ${deliveryDetails.phone || selectedCustomer.phone || 'No phone'})`;
      }

      const order: Order = {
        id: uid(),
        module,
        lines: cart,
        discountPercent: discountPct,
        totalAmount: total,
        customerName: assignedCustomerName,
        orderType: assignedOrderType,
        stage: 'paid',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      await posApi.saveOrder(order);

      // If payment is via Khata, add debit transaction to customer ledger
      if (paymentMode === 'khata' && selectedKhataId) {
        try {
          const base = await resolveApiUrl();
          await fetch(`${base}/api/khata/${selectedKhataId}/transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'DEBIT',
              amount: total,
              paymentMethod: 'credit',
              description: `POS Bill #${order.id.slice(-6)} (${cart.length} items)`,
            }),
          });
        } catch (e) {
          console.error('[Khata] Failed to record credit transaction:', e);
        }
      }

      return order;
    },
    onSuccess: (savedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', module] });
      queryClient.invalidateQueries({ queryKey: ['khatas'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-tickets'] });
      setLastOrder(savedOrder);
      setCart([]);
      setAppliedPromo('');
      setDiscountPct(0);
      setPaymentMode('cash');
      setSelectedKhataId('');
      const guestInDb = customerKhatas.find((k: any) => k.name.toLowerCase() === 'guest');
      setSelectedCustomer(guestInDb || defaultGuestCustomer);
      setCustomerSearchQuery('');
      setTenderedAmount('');
      setCustomerPhone('');
      if (orderType === 'takeaway') {
        setTokenNo((t) => {
          const next = t + 1;
          try {
            localStorage.setItem('pos_token_seq', String(next));
          } catch {}
          return next;
        });
      }
      setIsSuccess(true);
      // Automatically print Kitchen KOT to thermal printer immediately upon order placement
      if (module === 'fastfood') {
        const tableOrToken =
          orderType === 'dine-in'
            ? `TABLE: ${tableNo}`
            : orderType === 'takeaway'
            ? `TOKEN: #${tokenNo}`
            : 'DELIVERY';
        void printKitchenKot(savedOrder, {
          tableOrToken,
        });
      }
      setShowReceiptModal(true);
      playSuccessChime();
      setTimeout(() => setIsSuccess(false), 3000);
    },
  });

  /* Cashier Keyboard Shortcuts (F2: Barcode Scan, F4: Hold, F9: Checkout) */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';

      if (e.key === 'F2') {
        e.preventDefault();
        scannerInputRef.current?.focus();
        scannerInputRef.current?.select();
        return;
      }

      if (e.key === 'F4') {
        e.preventDefault();
        handleParkOrder();
        return;
      }

      if (e.key === 'F9' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        if (cart.length > 0 && !isPending && !(paymentMode === 'khata' && !selectedKhataId)) {
          checkout();
        }
        return;
      }

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        scannerInputRef.current?.focus();
        return;
      }

      // If in Mini Mart and user triggers a barcode gun anywhere on the page without focusing first
      if (module === 'minimart' && !isInput && e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        scannerInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isPending, paymentMode, selectedKhataId, orderType, tableNo, tokenNo, deliveryDetails, module, customerPhone, matchedCustomer]);

  const featured = selectedProduct ?? null;
  const sizes = ['Small', 'Regular', 'Large'];

  if (isLoadingProducts && products.length === 0) {
    return <PosCounterSkeleton module={module} />;
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: F.bgCanvas, fontFamily: F.font, overflow: 'hidden' }}>

      {/* ════════════════════════════════════════════════════════════════════
          LEFT CATALOG SECTION (Mica Surface & Fluent Pivot Tabs)
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── POS Terminal Mode Switcher Bar (Tabs) ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 24px',
            backgroundColor: isDark ? '#1C1D21' : '#F5F6F8',
            borderBottom: `1px solid ${F.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: F.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Terminal Mode:
            </span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: isDark ? '#242424' : '#FFFFFF',
                padding: '3px',
                borderRadius: '8px',
                gap: '4px',
                border: `1px solid ${F.border}`,
                boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <button
                type="button"
                onClick={() => navigate('/pos/fastfood')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: module === 'fastfood' ? F.accentRed : 'transparent',
                  color: module === 'fastfood' ? '#FFFFFF' : F.textSecondary,
                  fontWeight: module === 'fastfood' ? 700 : 500,
                  fontSize: '12.5px',
                  fontFamily: F.font,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: module === 'fastfood' ? '0 2px 8px rgba(229, 25, 55, 0.35)' : 'none',
                }}
              >
                <Food24Regular style={{ width: 16, height: 16 }} />
                <span>Fast Food Restaurant</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: module === 'fastfood' ? 'rgba(255,255,255,0.22)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    color: module === 'fastfood' ? '#FFFFFF' : F.textMuted,
                    fontWeight: 700,
                  }}
                >
                  KOT &middot; Tables
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/pos/omnimart')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: module === 'minimart' ? F.accentRed : 'transparent',
                  color: module === 'minimart' ? '#FFFFFF' : F.textSecondary,
                  fontWeight: module === 'minimart' ? 700 : 500,
                  fontSize: '12.5px',
                  fontFamily: F.font,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: module === 'minimart' ? '0 2px 8px rgba(229, 25, 55, 0.35)' : 'none',
                }}
              >
                <ShoppingBag24Regular style={{ width: 16, height: 16 }} />
                <span>Retail Mini Mart</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    backgroundColor: module === 'minimart' ? 'rgba(255,255,255,0.22)' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    color: module === 'minimart' ? '#FFFFFF' : F.textMuted,
                    fontWeight: 700,
                  }}
                >
                  Barcode Scanner
                </span>
              </button>
            </div>
          </div>

          {/* Right Status Badge & Direct KDS Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {module === 'fastfood' ? (
              <button
                type="button"
                onClick={() => navigate('/kitchen')}
                title="Click to open live Kitchen Display System (KDS) screen"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                  color: isDark ? '#34D399' : '#047857',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: F.font,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 4px rgba(16, 185, 129, 0.15)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 10px #10B981',
                  }}
                />
                <span>Open Kitchen Screen (KDS) &rarr;</span>
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11.5px',
                  color: F.textSecondary,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                  }}
                />
                <span>Barcode Scanner Ready (F2)</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Header Bar with Fluent Pivot Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 28px',
            height: '56px',
            backgroundColor: F.bgCard,
            borderBottom: `1px solid ${F.border}`,
            flexShrink: 0,
          }}
        >
          {/* Fluent UI / MUI-style Scrollable Pivot Tabs with Left/Right Chevrons & Hidden Native Scrollbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              flex: 1,
              minWidth: 0,
              position: 'relative',
              marginRight: '12px',
            }}
          >
            {/* Left Scroll Chevron Button (MUI-style) */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScrollTabs('left')}
                title="Scroll categories left"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: `1px solid ${F.border}`,
                  backgroundColor: F.bgCard,
                  color: F.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginRight: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
                  zIndex: 2,
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronLeft20Regular style={{ width: 16, height: 16 }} />
              </button>
            )}

            {/* Scrollable Tabs Track with no-scrollbar utility (Scrollbar 100% hidden) */}
            <div
              ref={tabScrollRef}
              onScroll={checkScrollButtons}
              className="no-scrollbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                gap: '2px',
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                flex: 1,
                minWidth: 0,
              }}
            >
              {allCategoryTabs.map((cat) => {
                const isActive = activeCategory === cat;
                const count = cat === 'All' ? filteredProducts.length : (categoryCounts[cat] || 0);
                return (
                  <button
                    key={cat}
                    data-active={isActive ? 'true' : 'false'}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      height: '100%',
                      padding: '0 16px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: isActive ? `3px solid ${F.accentRed}` : '3px solid transparent',
                      color: isActive ? F.accentRed : F.textSecondary,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '13.5px',
                      fontFamily: F.font,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      outline: 'none',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = F.textPrimary;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = F.textSecondary;
                    }}
                  >
                    <CategoryIcon cat={cat} size={15} />
                    <span>{cat}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isActive
                          ? (isDark ? 'rgba(229,25,55,0.2)' : '#FFEBEF')
                          : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                        color: isActive ? F.accentRed : F.textMuted,
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Chevron Button (MUI-style) */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScrollTabs('right')}
                title="Scroll categories right"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: `1px solid ${F.border}`,
                  backgroundColor: F.bgCard,
                  color: F.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginLeft: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.18)',
                  zIndex: 2,
                  transition: 'all 0.15s ease',
                }}
              >
                <ChevronRight20Regular style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>

          {/* Controls: Dual View Switcher (Minimart) & Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {module === 'minimart' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: F.bgSubtle,
                  borderRadius: F.radiusSm,
                  border: `1px solid ${F.border}`,
                  padding: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Visual Card Grid View"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: viewMode === 'grid' ? F.bgCard : 'transparent',
                    color: viewMode === 'grid' ? F.accentRed : F.textSecondary,
                    fontWeight: viewMode === 'grid' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Grid20Regular style={{ width: 14, height: 14 }} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  title="Supermarket Table / High-Density List View"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: viewMode === 'table' ? F.bgCard : 'transparent',
                    color: viewMode === 'table' ? F.accentRed : F.textSecondary,
                    fontWeight: viewMode === 'table' ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <Table20Regular style={{ width: 14, height: 14 }} />
                  <span>Table</span>
                </button>
              </div>
            )}

            {/* Subtle Rounded Desktop Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: F.bgSubtle,
                border: `1px solid ${F.border}`,
                borderRadius: F.radiusMd,
                padding: '6px 12px',
                width: '220px',
                gap: '8px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <Search20Regular style={{ color: F.textMuted, width: 16, height: 16 }} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalog by name or SKU..."
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontFamily: F.font,
                  fontSize: '13px',
                  color: F.textPrimary,
                  width: '100%',
                }}
              />
              {searchTerm && (
                <Dismiss16Regular
                  style={{ cursor: 'pointer', color: F.textMuted, width: 14, height: 14 }}
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── High-Speed Barcode / SKU Scanner Bar (Mini Mart Only) ── */}
          {module === 'minimart' && (
            <div
              style={{
                backgroundColor: F.bgCard,
                borderRadius: F.radiusMd,
                border: `1px solid ${F.border}`,
                boxShadow: F.shadowCard,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarcodeScanner20Regular style={{ color: F.accentRed, width: 22, height: 22 }} />
                  <span style={{ fontWeight: 800, fontSize: '14px', color: F.textPrimary }}>
                    RAPID BARCODE / SKU SCANNER
                  </span>
                  <span style={{ fontSize: '11px', color: F.textMuted, backgroundColor: F.bgSubtle, padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Press F2 or / to Focus
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: F.textSecondary }}>
                  Multiplier: Type <b style={{ color: F.accentRed }}>3*barcode</b> to add 3 units at once
                </div>
              </div>

              <form onSubmit={handleBarcodeScan} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: F.bgSubtle,
                    borderRadius: F.radiusSm,
                    border: `1.5px solid ${barcodeInput ? F.accentRed : F.border}`,
                    padding: '8px 14px',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <BarcodeScanner20Regular style={{ color: F.textMuted, width: 18, height: 18 }} />
                  <input
                    ref={scannerInputRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan barcode with scanner gun or type SKU and press Enter..."
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontFamily: F.font,
                      fontSize: '13.5px',
                      color: F.textPrimary,
                      fontWeight: 600,
                    }}
                  />
                  {barcodeInput && (
                    <Dismiss16Regular
                      style={{ cursor: 'pointer', color: F.textMuted }}
                      onClick={() => setBarcodeInput('')}
                    />
                  )}
                </div>

                <button
                  type="submit"
                  style={{
                    height: '42px',
                    padding: '0 20px',
                    borderRadius: F.radiusSm,
                    backgroundColor: F.accentRed,
                    color: '#FFFFFF',
                    border: 'none',
                    fontFamily: F.font,
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Add16Filled />
                  <span>Scan & Add</span>
                </button>
              </form>

              {/* Live Scanner Feedback Toast */}
              {lastScannedFeedback && (
                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    backgroundColor: lastScannedFeedback.startsWith('✅')
                      ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5')
                      : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2'),
                    color: lastScannedFeedback.startsWith('✅') ? '#10B981' : '#EF4444',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {lastScannedFeedback}
                </div>
              )}
            </div>
          )}

          {/* ── Fluent Hero Highlight Card (Meal Builder - Fast Food Only) ── */}
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: F.textPrimary, lineHeight: 1.2 }}>
                      {featured.name}
                    </div>
                    <div style={{ fontSize: '13px', color: F.textSecondary, marginTop: '3px' }}>
                      {featured.category || 'Kitchen Preparation'} • {featured.openingStock ?? 25} in stock
                    </div>
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: F.accentRed }}>
                    PKR {((Math.round((featured?.price || 0) * (selectedSize === 0 ? 1 : selectedSize === 1 ? 1.15 : 1.3)) + selectedAddons.length * 40) * selectedQty).toLocaleString()}
                  </div>
                </div>

                {/* Size Segmented Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Portion Size
                    </div>
                    <div style={{ display: 'flex', backgroundColor: F.bgSubtle, padding: '3px', borderRadius: F.radiusMd, border: `1px solid ${F.border}` }}>
                      {sizes.map((s, i) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(i)}
                          style={{
                            padding: '4px 14px',
                            borderRadius: F.radiusSm,
                            border: 'none',
                            backgroundColor: selectedSize === i ? F.bgCard : 'transparent',
                            color: selectedSize === i ? F.textPrimary : F.textSecondary,
                            fontWeight: selectedSize === i ? 700 : 500,
                            fontSize: '12.5px',
                            fontFamily: F.font,
                            cursor: 'pointer',
                            boxShadow: selectedSize === i ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                            transition: 'all 0.12s ease',
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Addons (Build Your Meal) */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: F.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                      Add-ons & Extras
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {ADDONS.map((addon, i) => {
                        const isSelected = selectedAddons.includes(i);
                        return (
                          <div
                            key={i}
                            onClick={() =>
                              setSelectedAddons((prev) =>
                                prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
                              )
                            }
                            style={{
                              padding: '5px 10px',
                              borderRadius: F.radiusMd, // 8px radius
                              backgroundColor: isSelected ? F.accentRedSubtle : F.bgSubtle,
                              border: `1px solid ${isSelected ? F.accentRed : F.border}`,
                              color: isSelected ? F.accentRed : F.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600,
                              transition: 'all 0.12s ease',
                            }}
                          >
                            {addon.icon}
                            <span>{addon.label}</span>
                            {isSelected && <Checkmark20Filled style={{ width: 12, height: 12 }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Stepper & Add to Order Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '2px' }}>
                  {/* Fluent Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', backgroundColor: F.bgSubtle, borderRadius: F.radiusMd, border: `1px solid ${F.border}` }}>
                    <button
                      onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                      style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: F.textPrimary }}
                    >
                      <Subtract20Regular style={{ width: 14, height: 14 }} />
                    </button>
                    <span style={{ minWidth: '32px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: F.textPrimary }}>
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
                  <button
                    onClick={() => {
                      if (!featured) return;
                      const sizeMultiplier = selectedSize === 0 ? 1 : selectedSize === 1 ? 1.15 : 1.3;
                      const heroPortionPrice = Math.round(featured.price * sizeMultiplier);
                      const heroAddonsPrice = selectedAddons.length * 40;
                      const unitPrice = heroPortionPrice + heroAddonsPrice;
                      const addonLabels = selectedAddons.map((i) => ADDONS[i].label);
                      const variantLabel = `${sizes[selectedSize]}${addonLabels.length > 0 ? ` • ${addonLabels.join(', ')}` : ''}`;

                      addToCart(featured, selectedQty, variantLabel, unitPrice);
                      setSelectedQty(1);
                    }}
                    style={{
                      height: '36px',
                      padding: '0 20px',
                      borderRadius: F.radiusMd, // 8px subtle corner radius
                      backgroundColor: isDark ? F.accentRed : '#1A1A1E',
                      color: '#FFFFFF',
                      border: 'none',
                      fontFamily: F.font,
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? F.accentRedHover : '#2D2D35')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isDark ? F.accentRed : '#1A1A1E')}
                  >
                    <Add16Filled />
                    <span>Add to Order</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Product Catalog Section (Grid View vs Supermarket Table View) ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: F.textPrimary }}>
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
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>SKU / Barcode</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Product Name</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Category</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Rack Location</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Stock</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Price</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700, textAlign: 'right' }}>Action</th>
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
                        const isOut = product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= 0;
                        const isLowStock = !isOut && product.openingStock !== null && product.openingStock !== undefined && product.openingStock <= (product.minThreshold ?? 10);
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
                            <td style={{ padding: '10px 16px', fontWeight: 700, color: F.textPrimary }}>
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
                                  borderRadius: '10px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: isOut ? '#FEE2E2' : isLowStock ? '#FEF3C7' : '#DCFCE7',
                                  color: isOut ? '#EF4444' : isLowStock ? '#D97706' : '#16A34A',
                                }}
                              >
                                {isOut ? 'OUT OF STOCK' : `${product.openingStock ?? '—'} left`}
                              </span>
                            </td>
                            <td style={{ padding: '10px 16px', fontWeight: 800, color: F.accentRed }}>
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
                                    fontWeight: 700,
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
                                      fontWeight: 700,
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
              /* ── Visual Grid View: Exactly 4 Cards Per Row ── */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
                {filteredProducts.map((product) => {
                  const isSelected = selectedProduct?.id === product.id;
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
                      setSelectedProduct={setSelectedProduct}
                      setSelectedQty={setSelectedQty}
                      playBeep={playBeep}
                      isWeightItem={isWeightItem}
                      setWeighingProduct={setWeighingProduct}
                      setWeightAmount={setWeightAmount}
                      setVariantPickerProduct={setVariantPickerProduct}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DOCKED RIGHT-HAND "MY ORDER" SUMMARY PANEL (Subtle Card Elevation)
      ════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '380px',
          height: '100%',
          backgroundColor: F.bgCard,
          borderLeft: `1px solid ${F.border}`,
          boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Docked Panel Header */}
        <div
          style={{
            height: '56px',
            padding: '0 18px',
            borderBottom: `1px solid ${F.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: F.textPrimary, letterSpacing: '-0.2px' }}>
              My Order
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: F.accentRed,
                backgroundColor: F.accentRedSubtle,
                padding: '2px 8px',
                borderRadius: F.radiusSm,
              }}
            >
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Recall Parked Orders Button */}
            {parkedOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setShowParkedModal(true)}
                title="View held / parked orders"
                style={{
                  padding: '4px 8px',
                  borderRadius: F.radiusSm,
                  backgroundColor: '#F59E0B',
                  color: '#000000',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
                }}
              >
                <Clock20Regular style={{ width: 13, height: 13 }} />
                <span>Recall ({parkedOrders.length})</span>
              </button>
            )}

            {/* Hold / KOT Button */}
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleParkOrder}
                title={module === 'fastfood' ? 'Hold table and send live KOT to Kitchen screen' : 'Hold order without charging to serve next customer'}
                style={{
                  padding: '4px 8px',
                  borderRadius: F.radiusSm,
                  backgroundColor: module === 'fastfood' ? F.accentRedSubtle : F.bgSubtle,
                  border: `1px solid ${module === 'fastfood' ? F.accentRed : F.border}`,
                  color: module === 'fastfood' ? F.accentRed : F.textSecondary,
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Pause20Regular style={{ width: 13, height: 13 }} />
                <span>{module === 'fastfood' ? 'Hold & Send KOT' : 'Hold'}</span>
              </button>
            )}

            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  setTenderedAmount('');
                }}
                style={{
                  fontSize: '11px',
                  color: F.textMuted,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: F.font,
                  padding: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = F.accentRed)}
                onMouseLeave={(e) => (e.currentTarget.style.color = F.textMuted)}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Collapsible Order Header & Customer Selection ── */}
        {isTopSectionCollapsed ? (
          /* Collapsed Compact 1-line Summary Bar (~32px) */
          <div
            onClick={() => setIsTopSectionCollapsed(false)}
            style={{
              padding: '6px 14px',
              borderBottom: `1px solid ${F.borderSubtle}`,
              backgroundColor: F.bgSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 0.12s ease',
            }}
            title="Click to expand order details and customer selector"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = F.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = F.bgSubtle)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
              {module === 'fastfood' && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    backgroundColor: F.accentRed,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {orderType === 'dine-in'
                    ? `Dine-In (${tableNo || 'T-1'})`
                    : orderType === 'takeaway'
                    ? `Takeaway #${String(tokenNo).padStart(2, '0')}`
                    : 'Delivery'}
                </span>
              )}
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: F.textPrimary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                👤 {selectedCustomer.name} | {formatCustomerBalance(selectedCustomer)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: F.accentRed, fontSize: '11px', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>
              <span>Expand</span>
              <ChevronDown20Regular style={{ width: 14, height: 14 }} />
            </div>
          </div>
        ) : (
          /* Expanded Order Details & Customer Section */
          <div
            style={{
              padding: '10px 14px',
              borderBottom: `1px solid ${F.borderSubtle}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: F.bgSubtle,
            }}
          >
            {/* Header: Label and Collapse Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '10.5px', fontWeight: 800, color: F.textSecondary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Order Info & Customer
              </span>
              <button
                type="button"
                onClick={() => setIsTopSectionCollapsed(true)}
                title="Collapse to make more room for order items"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: F.textMuted,
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = F.accentRed)}
                onMouseLeave={(e) => (e.currentTarget.style.color = F.textMuted)}
              >
                <span>Collapse</span>
                <ChevronUp20Regular style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Customer Autocomplete (MUI Floating Label Notch Style matching reference image) */}
            <div style={{ position: 'relative', width: '100%' }} ref={customerDropdownRef}>
              <div
                onClick={() => {
                  setIsCustomerDropdownOpen(true);
                  setTimeout(() => customerInputRef.current?.focus(), 50);
                }}
                style={{
                  position: 'relative',
                  border: `1px solid ${isCustomerDropdownOpen ? F.accentRed : isDark ? '#4A4A4A' : '#767676'}`,
                  borderRadius: '4px',
                  backgroundColor: F.bgCard,
                  minHeight: '38px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'text',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Floating notch label */}
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '10px',
                    backgroundColor: F.bgSubtle,
                    padding: '0 4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isCustomerDropdownOpen ? F.accentRed : isDark ? '#B0B0B0' : '#5F6368',
                    lineHeight: 1,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                >
                  Customer
                </span>

                {/* Text or Search Input */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                  {isCustomerDropdownOpen ? (
                    <input
                      ref={customerInputRef}
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      placeholder={`${selectedCustomer.name} | ${formatCustomerBalance(selectedCustomer)}`}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        width: '100%',
                        fontSize: '13.5px',
                        fontFamily: F.font,
                        color: F.textPrimary,
                        padding: 0,
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsCustomerDropdownOpen(false);
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (filteredCustomerOptions.length > 0) {
                            handleSelectCustomer(filteredCustomerOptions[0]);
                          } else if (customerSearchQuery.trim()) {
                            handleSelectCustomer({ name: customerSearchQuery.trim(), currentDebt: 0 });
                          }
                        }
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: '13.5px',
                        color: F.textPrimary,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {`${selectedCustomer.name} | ${formatCustomerBalance(selectedCustomer)}`}
                    </span>
                  )}
                </div>

                {/* Right Action Icons: Clear (X) and Dropdown Arrow (v) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  {(selectedCustomer.name !== 'Guest' || customerSearchQuery) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearCustomer();
                      }}
                      title="Clear customer selection"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '3px',
                        color: F.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Dismiss16Regular style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCustomerDropdownOpen((prev) => !prev);
                      if (!isCustomerDropdownOpen) {
                        setTimeout(() => customerInputRef.current?.focus(), 50);
                      }
                    }}
                    title="Toggle customer list"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '3px',
                      color: F.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isCustomerDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <ChevronDown20Regular style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>

              {/* Dropdown Options Popover */}
              {isCustomerDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: F.bgCard,
                    border: `1px solid ${F.border}`,
                    borderRadius: F.radiusSm,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 200,
                    padding: '4px',
                  }}
                >
                  {filteredCustomerOptions.map((cust, idx) => {
                    const isCur = (cust.id && cust.id === selectedCustomer.id) || (!cust.id && !selectedCustomer.id && cust.name === selectedCustomer.name);
                    return (
                      <div
                        key={cust.id || `guest-${idx}`}
                        onClick={() => handleSelectCustomer(cust)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: F.radiusSm,
                          backgroundColor: isCur ? (isDark ? 'rgba(229, 25, 55, 0.15)' : '#FEF2F2') : 'transparent',
                          cursor: 'pointer',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCur) e.currentTarget.style.backgroundColor = F.bgHover;
                        }}
                        onMouseLeave={(e) => {
                          if (!isCur) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: isCur ? 700 : 600, color: isCur ? F.accentRed : F.textPrimary }}>
                            {cust.name}
                          </div>
                          {cust.phone && (
                            <div style={{ fontSize: '11px', color: F.textMuted }}>
                              {cust.phone}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: (cust.currentDebt || 0) > 0 ? F.accentRed : '#10B981',
                            fontFamily: 'monospace',
                            flexShrink: 0,
                          }}
                        >
                          {formatCustomerBalance(cust)}
                        </div>
                      </div>
                    );
                  })}

                  {filteredCustomerOptions.length === 0 && customerSearchQuery.trim() && (
                    <div
                      onClick={() => handleSelectCustomer({ name: customerSearchQuery.trim(), currentDebt: 0 })}
                      style={{
                        padding: '8px 10px',
                        borderRadius: F.radiusSm,
                        cursor: 'pointer',
                        color: F.accentRed,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = F.bgHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      + Use "{customerSearchQuery.trim()}" as Walk-In Customer
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fast Food Mode: Order Type Tabs & Contextual Sub-bar */}
            {module === 'fastfood' && (
              <>
                {/* 3-option Segmented Pill Switcher */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '4px',
                    backgroundColor: F.bgCard,
                    padding: '3px',
                    borderRadius: F.radiusMd,
                    border: `1px solid ${F.border}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('dine-in');
                      playBeep();
                    }}
                    style={{
                      padding: '6px 0',
                      borderRadius: F.radiusSm,
                      border: 'none',
                      backgroundColor: orderType === 'dine-in' ? F.accentRed : 'transparent',
                      color: orderType === 'dine-in' ? '#FFFFFF' : F.textSecondary,
                      fontWeight: orderType === 'dine-in' ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <PeopleCommunity20Regular style={{ width: 14, height: 14 }} />
                    <span>Dine-In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('takeaway');
                      playBeep();
                    }}
                    style={{
                      padding: '6px 0',
                      borderRadius: F.radiusSm,
                      border: 'none',
                      backgroundColor: orderType === 'takeaway' ? F.accentRed : 'transparent',
                      color: orderType === 'takeaway' ? '#FFFFFF' : F.textSecondary,
                      fontWeight: orderType === 'takeaway' ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <ShoppingBag24Regular style={{ width: 14, height: 14 }} />
                    <span>Takeaway</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('delivery');
                      playBeep();
                    }}
                    style={{
                      padding: '6px 0',
                      borderRadius: F.radiusSm,
                      border: 'none',
                      backgroundColor: orderType === 'delivery' ? F.accentRed : 'transparent',
                      color: orderType === 'delivery' ? '#FFFFFF' : F.textSecondary,
                      fontWeight: orderType === 'delivery' ? 700 : 500,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <VehicleTruckProfile20Regular style={{ width: 14, height: 14 }} />
                    <span>Delivery</span>
                  </button>
                </div>

                {/* Contextual Sub-bar */}
                {orderType === 'dine-in' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: F.textMuted, whiteSpace: 'nowrap' }}>
                      TABLE:
                    </span>
                    {['T-1', 'T-2', 'T-3', 'T-4', 'T-5'].map((t) => {
                      const fullT = `Table ${t.replace('T-', '')}`;
                      const isCur = tableNo === fullT || tableNo === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTableNo(fullT);
                            playBeep();
                          }}
                          style={{
                            padding: '3px 7px',
                            borderRadius: '4px',
                            border: `1px solid ${isCur ? F.accentRed : F.border}`,
                            backgroundColor: isCur ? F.accentRedSubtle : F.bgCard,
                            color: isCur ? F.accentRed : F.textSecondary,
                            fontSize: '11px',
                            fontWeight: isCur ? 700 : 500,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {t}
                        </button>
                      );
                    })}
                    <input
                      value={tableNo}
                      onChange={(e) => setTableNo(e.target.value)}
                      placeholder="Custom..."
                      style={{
                        width: '65px',
                        padding: '3px 6px',
                        borderRadius: '4px',
                        border: `1px solid ${F.border}`,
                        backgroundColor: F.bgCard,
                        color: F.textPrimary,
                        fontSize: '11px',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {orderType === 'takeaway' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: F.bgCard,
                      padding: '5px 10px',
                      borderRadius: F.radiusSm,
                      border: `1px solid ${F.borderSubtle}`,
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary }}>
                      ASSIGNED TOKEN NUMBER
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: F.accentRed, fontFamily: 'monospace' }}>
                        #{String(tokenNo).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTokenNo((t) => Math.max(1, t - 1))}
                        style={{ padding: '1px 7px', fontSize: '11px', border: `1px solid ${F.border}`, borderRadius: '3px', background: F.bgSubtle, cursor: 'pointer', color: F.textPrimary }}
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setTokenNo((t) => t + 1)}
                        style={{ padding: '1px 7px', fontSize: '11px', border: `1px solid ${F.border}`, borderRadius: '3px', background: F.bgSubtle, cursor: 'pointer', color: F.textPrimary }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {orderType === 'delivery' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <input
                      value={deliveryDetails.customerName}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, customerName: e.target.value })}
                      placeholder="Customer Name..."
                      style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '11.5px', outline: 'none' }}
                    />
                    <input
                      value={deliveryDetails.phone}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })}
                      placeholder="Phone Number..."
                      style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '11.5px', outline: 'none' }}
                    />
                    <input
                      value={deliveryDetails.address}
                      onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                      placeholder="Delivery Address..."
                      style={{ gridColumn: 'span 2', padding: '4px 8px', borderRadius: '4px', border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '11.5px', outline: 'none' }}
                    />
                  </div>
                )}
              </>
            )}

            {/* Mini Mart Mode: Customer Khata Balance Card if customer has credit account */}
            {module === 'minimart' && selectedCustomer.id && (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: F.radiusSm,
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: F.textPrimary }}>
                    {selectedCustomer.name}
                  </div>
                  <div style={{ fontSize: '11px', color: F.textSecondary, marginTop: '2px' }}>
                    Khata Balance: <b style={{ color: (selectedCustomer.currentDebt || 0) > 0 ? F.accentRed : '#10B981' }}>PKR {(selectedCustomer.currentDebt || 0).toLocaleString()}</b>
                  </div>
                </div>
                {paymentMode !== 'khata' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('khata');
                      setSelectedKhataId(selectedCustomer.id!);
                      playBeep();
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: '#10B981',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Use Khata
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981' }}>
                    ✓ Khata Active
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scrollable Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

        {/* Docked Footer (Promocode, Summary & Quick Cash Tender) */}
        <div
          style={{
            padding: '14px 18px 18px',
            borderTop: `1px solid ${F.border}`,
            backgroundColor: F.bgCard,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          {/* Collapsible Promo Code Field */}
          {isPromoCollapsed ? (
            /* Collapsed Promo Bar */
            appliedPromo ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 10px',
                  borderRadius: F.radiusSm,
                  backgroundColor: isDark ? 'rgba(229, 25, 55, 0.15)' : '#FEF2F2',
                  border: `1px solid ${isDark ? 'rgba(229, 25, 55, 0.3)' : '#FECACA'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag20Regular style={{ width: 13, height: 13, color: F.accentRed }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: F.accentRed }}>
                    {appliedPromo.toUpperCase()} (-{discountPct}%)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Dismiss16Regular
                    style={{ width: 13, height: 13, cursor: 'pointer', color: F.accentRed }}
                    title="Remove promocode"
                    onClick={() => {
                      setAppliedPromo('');
                      setDiscountPct(0);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPromoCollapsed(false)}
                    title="Expand promocode"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: F.accentRed, padding: 0, display: 'flex' }}
                  >
                    <ChevronDown20Regular style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsPromoCollapsed(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 10px',
                  borderRadius: F.radiusSm,
                  backgroundColor: F.bgSubtle,
                  border: `1px dashed ${F.border}`,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = F.accentRed)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = F.border)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag20Regular style={{ width: 13, height: 13, color: F.textMuted }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: F.textSecondary }}>
                    PROMOCODE
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: F.textMuted, fontSize: '10.5px' }}>
                  <span>+ Add Code</span>
                  <ChevronDown20Regular style={{ width: 14, height: 14 }} />
                </div>
              </div>
            )
          ) : (
            /* Expanded Promo Field */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                borderRadius: F.radiusMd,
                backgroundColor: F.bgSubtle,
                border: `1px dashed ${F.border}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag20Regular style={{ width: 14, height: 14, color: F.textMuted }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, letterSpacing: '0.04em' }}>
                  PROMOCODE
                </span>
              </div>

              {appliedPromo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: isDark ? 'rgba(229, 25, 55, 0.2)' : '#FEF2F2',
                      color: F.accentRed,
                      padding: '2px 8px',
                      borderRadius: F.radiusSm,
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    <span>{appliedPromo.toUpperCase()}</span>
                    <Dismiss16Regular
                      style={{ width: 12, height: 12, cursor: 'pointer' }}
                      onClick={() => {
                        setAppliedPromo('');
                        setDiscountPct(0);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPromoCollapsed(true)}
                    title="Collapse promocode"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: F.textMuted, padding: '2px', display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronUp20Regular style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                    placeholder="Code..."
                    style={{
                      width: '80px',
                      padding: '3px 8px',
                      borderRadius: F.radiusSm,
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgSubtle,
                      color: F.textPrimary,
                      fontSize: '11.5px',
                      fontFamily: F.font,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={applyPromo}
                    style={{
                      padding: '3px 10px',
                      borderRadius: F.radiusSm,
                      border: 'none',
                      backgroundColor: isDark ? F.accentRed : '#1A1A1E',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: F.font,
                    }}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPromoCollapsed(true)}
                    title="Collapse promocode"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: F.textMuted, padding: '2px', display: 'flex', alignItems: 'center' }}
                  >
                    <ChevronUp20Regular style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Financial Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: F.textSecondary }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: F.textPrimary }}>PKR {subtotal.toLocaleString()}</span>
            </div>

            {discountVal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: F.accentRed }}>
                <span>Discount ({discountPct}%)</span>
                <span style={{ fontWeight: 600 }}>-PKR {discountVal.toLocaleString()}</span>
              </div>
            )}

            {orderType === 'delivery' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: F.textSecondary }}>
                <span>Delivery Charges</span>
                <span style={{ fontWeight: 600, color: effectiveDeliveryFee === 0 ? F.accentGreen : F.textPrimary }}>
                  {effectiveDeliveryFee === 0 ? 'FREE' : `PKR ${effectiveDeliveryFee}`}
                </span>
              </div>
            )}

            <div style={{ height: '1px', backgroundColor: F.borderSubtle, margin: '2px 0' }} />

            {/* Total Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: F.textPrimary }}>TOTAL</span>
              <span style={{ fontSize: '19px', fontWeight: 900, color: F.textPrimary }}>
                PKR {total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: F.textSecondary, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Payment Method
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('cash');
                  playBeep();
                }}
                style={{
                  padding: '6px 0',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${paymentMode === 'cash' ? F.accentRed : F.border}`,
                  backgroundColor: paymentMode === 'cash' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                  color: paymentMode === 'cash' ? F.accentRed : F.textPrimary,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Money20Regular style={{ width: 15, height: 15 }} />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('card');
                  playBeep();
                }}
                style={{
                  padding: '6px 0',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${paymentMode === 'card' ? F.accentRed : F.border}`,
                  backgroundColor: paymentMode === 'card' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                  color: paymentMode === 'card' ? F.accentRed : F.textPrimary,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Payment20Regular style={{ width: 15, height: 15 }} />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMode('khata');
                  playBeep();
                }}
                style={{
                  padding: '6px 0',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${paymentMode === 'khata' ? F.accentRed : F.border}`,
                  backgroundColor: paymentMode === 'khata' ? (isDark ? 'rgba(229,25,55,0.2)' : '#FEF2F2') : F.bgSubtle,
                  color: paymentMode === 'khata' ? F.accentRed : F.textPrimary,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Notebook20Regular style={{ width: 15, height: 15 }} />
                <span>Khata</span>
              </button>
            </div>

            {/* Quick Cash Tender & Change Due Calculator */}
            {paymentMode === 'cash' && cart.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase' }}>
                    Cash Tendered (Received)
                  </span>
                  {tenderedAmount !== '' && (
                    <span
                      onClick={() => setTenderedAmount('')}
                      style={{ fontSize: '10.5px', color: F.textMuted, cursor: 'pointer' }}
                    >
                      Reset
                    </span>
                  )}
                </div>

                {/* Quick Denominations */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTenderedAmount(total);
                      playBeep();
                    }}
                    style={{
                      padding: '4px 0',
                      borderRadius: '4px',
                      border: `1px solid ${tenderedAmount === total ? F.accentRed : F.border}`,
                      backgroundColor: tenderedAmount === total ? F.accentRedSubtle : F.bgSubtle,
                      color: tenderedAmount === total ? F.accentRed : F.textPrimary,
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Exact
                  </button>
                  {[500, 1000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setTenderedAmount(amt);
                        playBeep();
                      }}
                      style={{
                        padding: '4px 0',
                        borderRadius: '4px',
                        border: `1px solid ${tenderedAmount === amt ? F.accentRed : F.border}`,
                        backgroundColor: tenderedAmount === amt ? F.accentRedSubtle : F.bgSubtle,
                        color: tenderedAmount === amt ? F.accentRed : F.textPrimary,
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Or enter cash received..."
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: F.radiusSm,
                    border: `1px solid ${F.border}`,
                    backgroundColor: F.bgSubtle,
                    color: F.textPrimary,
                    fontSize: '12px',
                    fontFamily: F.font,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />

                {/* Return Change Banner */}
                {typeof tenderedAmount === 'number' && tenderedAmount >= total && (
                  <div
                    style={{
                      padding: '6px 10px',
                      borderRadius: F.radiusSm,
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase' }}>
                      Change Due (Wapsi)
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: 900, color: '#10B981', fontFamily: 'monospace' }}>
                      PKR {(tenderedAmount - total).toLocaleString()}
                    </span>
                  </div>
                )}

                {typeof tenderedAmount === 'number' && tenderedAmount > 0 && tenderedAmount < total && (
                  <div style={{ fontSize: '11px', color: F.accentRed, fontWeight: 600, textAlign: 'right' }}>
                    Short by PKR {(total - tenderedAmount).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {/* Khata Customer Selection */}
            {paymentMode === 'khata' && (
              <div style={{ marginTop: '10px' }}>
                <CustomSelect
                  label="Khata Customer"
                  required
                  value={selectedKhataId}
                  onChange={(val) => setSelectedKhataId(val)}
                  placeholder="-- Select Khata Customer --"
                  options={customerKhatas.map((k: any) => ({
                    value: k.id,
                    label: `${k.name} (Debt: PKR ${k.currentDebt?.toLocaleString()} | Limit: PKR ${k.creditLimit?.toLocaleString()})`,
                  }))}
                  error={!selectedKhataId ? '* Please select customer to debit bill' : undefined}
                />
              </div>
            )}
          </div>

          {/* Primary Interactive Button: Red Brand Accent (#E51937) */}
          <button
            disabled={cart.length === 0 || isPending || (paymentMode === 'khata' && !selectedKhataId)}
            onClick={() => checkout()}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: F.radiusMd,
              backgroundColor: cart.length === 0 || isPending ? (isDark ? '#383838' : '#CBD5E1') : F.accentRed,
              color: '#FFFFFF',
              border: 'none',
              fontFamily: F.font,
              fontWeight: 700,
              fontSize: '15px',
              cursor: cart.length === 0 || isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: cart.length === 0 || isPending ? 'none' : '0 4px 12px rgba(229, 25, 55, 0.28)',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (cart.length > 0 && !isPending) e.currentTarget.style.backgroundColor = F.accentRedHover;
            }}
            onMouseLeave={(e) => {
              if (cart.length > 0 && !isPending) e.currentTarget.style.backgroundColor = F.accentRed;
            }}
          >
            {isSuccess ? (
              <>
                <CheckmarkCircle20Filled style={{ width: 18, height: 18 }} />
                <span>Order Placed!</span>
              </>
            ) : isPending ? (
              <span>Processing...</span>
            ) : (
              <span>Confirm Order</span>
            )}
          </button>
        </div>
      </div>

      {/* ── Modal: Quick Size / Variant Selector (Clothing, Shoes, Portions) ── */}
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
                const isVarOut = v.stock !== undefined && v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={isVarOut}
                    onClick={() => {
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
                    {v.stock !== undefined && (
                      <span style={{ fontSize: '10px', color: F.textMuted, fontWeight: 600 }}>
                        {isVarOut ? 'Out of stock' : `${v.stock} left`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Line Item Kitchen Prep Notes / Modifiers (Fast Food Only) ── */}
      {module === 'fastfood' && editingNoteItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              border: `1px solid ${F.border}`,
              boxShadow: F.shadowElevated,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: F.textPrimary }}>
                Kitchen Prep Note / Modifiers
              </div>
              <button
                onClick={() => setEditingNoteItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: F.textSecondary }}>
              Quick Fast-Food Presets (Click to toggle):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['No Mayo', 'Extra Spicy', 'No Onion', 'Extra Cheese', 'Less Spicy', 'Crispy / Well Done', 'Pack Separately'].map(
                (preset) => {
                  const isPresent = editingNoteItem.currentNote.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setEditingNoteItem((prev) => {
                          if (!prev) return null;
                          const existing = prev.currentNote ? prev.currentNote.split(', ').filter(Boolean) : [];
                          const next = existing.includes(preset)
                            ? existing.filter((p) => p !== preset)
                            : [...existing, preset];
                          return { ...prev, currentNote: next.join(', ') };
                        });
                        playBeep();
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: `1px solid ${isPresent ? F.accentRed : F.border}`,
                        backgroundColor: isPresent ? F.accentRedSubtle : F.bgSubtle,
                        color: isPresent ? F.accentRed : F.textPrimary,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  );
                }
              )}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Chef Instruction / Custom Request
              </label>
              <input
                value={editingNoteItem.currentNote}
                onChange={(e) => setEditingNoteItem({ ...editingNoteItem, currentNote: e.target.value })}
                placeholder="e.g. Extra sauce on the side, cut into 4 slices..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${F.border}`,
                  backgroundColor: F.bgSubtle,
                  color: F.textPrimary,
                  fontSize: '13px',
                  fontFamily: F.font,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                style={{ padding: '6px 14px', borderRadius: F.radiusSm, border: `1px solid ${F.border}`, backgroundColor: F.bgCard, cursor: 'pointer', color: F.textPrimary, fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCart((prev) =>
                    prev.map((item) =>
                      item.productId === editingNoteItem.productId && item.variantLabel === editingNoteItem.variantLabel
                        ? { ...item, notes: editingNoteItem.currentNote.trim() }
                        : item
                    )
                  );
                  setEditingNoteItem(null);
                  playBeep();
                }}
                style={{ padding: '6px 16px', borderRadius: F.radiusSm, border: 'none', backgroundColor: F.accentRed, color: '#FFFFFF', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Held / Parked Orders Drawer ── */}
      {showParkedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '480px',
              maxHeight: '80vh',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              border: `1px solid ${F.border}`,
              boxShadow: F.shadowElevated,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock20Regular style={{ color: F.accentRed }} />
                <span style={{ fontWeight: 800, fontSize: '16px', color: F.textPrimary }}>
                  Held / Parked Orders ({parkedOrders.length})
                </span>
              </div>
              <button
                onClick={() => setShowParkedModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px' }}>
              {parkedOrders.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: F.textMuted, fontSize: '13px' }}>
                  No parked orders currently held.
                </div>
              ) : (
                parkedOrders.map((parked) => (
                  <div
                    key={parked.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: F.radiusSm,
                      backgroundColor: F.bgSubtle,
                      border: `1px solid ${F.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: F.textPrimary }}>
                          {parked.label}
                        </span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: F.accentRedSubtle, color: F.accentRed, fontWeight: 700 }}>
                          {parked.orderType}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: F.textSecondary, marginTop: '3px' }}>
                        Held at {parked.parkedAt} • {parked.lines.reduce((s, l) => s + l.quantity, 0)} items • PKR {parked.subtotal.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '11px', color: F.textMuted, marginTop: '2px' }}>
                        {parked.lines.map((l) => `${l.quantity}x ${l.name}`).join(', ')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleResumeParkedOrder(parked)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: F.radiusSm,
                          border: 'none',
                          backgroundColor: F.accentRed,
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => handleDiscardParkedOrder(parked.id)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: F.radiusSm,
                          border: `1px solid ${F.border}`,
                          backgroundColor: F.bgCard,
                          color: F.textMuted,
                          cursor: 'pointer',
                        }}
                        title="Discard"
                      >
                        <Delete20Regular style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: `1px solid ${F.border}`, paddingTop: '10px' }}>
              <button
                onClick={() => setShowParkedModal(false)}
                style={{ padding: '6px 16px', borderRadius: F.radiusSm, border: `1px solid ${F.border}`, backgroundColor: F.bgCard, color: F.textPrimary, fontSize: '12px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Thermal Receipt Preview Modal ── */}
      {showReceiptModal && lastOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '370px',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              boxShadow: F.shadowElevated,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${F.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt20Regular style={{ color: F.accentRed }} />
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Thermal Receipt Preview</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            <div style={{ padding: '16px 20px', backgroundColor: isDark ? '#1F1F1F' : '#FAFAFA', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.5, color: isDark ? '#EDEDED' : '#333' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: isDark ? '#FFFFFF' : '#111' }}>
                {module === 'fastfood' ? 'OMNIPOS COUNTER' : 'OMNIPOS SUPERMARKET'}
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: isDark ? '#999' : '#666' }}>
                {module === 'fastfood' ? 'Order Fresh • Eat Fresh' : 'Fresh Daily • Best Wholesale Prices'}
              </div>
              <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#999'}` }} />
              <div>ORDER: #{lastOrder.id.slice(-6).toUpperCase()}</div>
              <div>DATE: {new Date(lastOrder.createdAt).toLocaleTimeString()}</div>
              {lastOrder.customerName && (
                <div style={{ fontWeight: 'bold', color: isDark ? '#FFF' : '#000' }}>
                  CUSTOMER: {lastOrder.customerName}
                </div>
              )}
              <div style={{ margin: '8px 0', borderBottom: `1px dashed ${isDark ? '#444' : '#999'}` }} />
              {lastOrder.lines.map((line, idx) => (
                <div key={`${line.productId}-${idx}`} style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{line.quantity}x {line.name} {line.variantLabel ? `(${line.variantLabel})` : ''}</span>
                    <span>PKR {(line.unitPrice * line.quantity).toLocaleString()}</span>
                  </div>
                  {line.notes && (
                    <div style={{ fontSize: '10.5px', color: isDark ? '#F59E0B' : '#B45309', paddingLeft: '10px' }}>
                      * Note: {line.notes}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ margin: '8px 0', borderBottom: '1px dashed #999' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: isDark ? '#AAA' : '#666' }}>
                <span>Total Items:</span>
                <span>{lastOrder.lines.reduce((s, l) => s + l.quantity, 0)} units</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginTop: '2px' }}>
                <span>NET TOTAL:</span>
                <span>PKR {lastOrder.totalAmount?.toLocaleString()}</span>
              </div>
              {paymentMode === 'cash' && typeof tenderedAmount === 'number' && tenderedAmount >= (lastOrder.totalAmount || 0) && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                    <span>Cash Tendered:</span>
                    <span>PKR {tenderedAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: isDark ? '#10B981' : '#047857' }}>
                    <span>Change Due:</span>
                    <span>PKR {(tenderedAmount - (lastOrder.totalAmount || 0)).toLocaleString()}</span>
                  </div>
                </>
              )}
              <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: '#777' }}>
                Thank you for shopping with us!
              </div>
            </div>

            <div style={{ padding: '12px 20px', borderTop: `1px solid ${F.border}`, display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowReceiptModal(false)}
                style={{ padding: '6px 14px', borderRadius: F.radiusSm, border: `1px solid ${F.border}`, backgroundColor: F.bgCard, cursor: 'pointer', fontFamily: F.font, fontSize: '12px' }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  posApi.printReceipt();
                  setShowReceiptModal(false);
                }}
                style={{ padding: '6px 16px', borderRadius: F.radiusSm, border: 'none', backgroundColor: F.accentRed, color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: F.font, fontSize: '12px' }}
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Loose / Weight Scale Calculator ── */}
      {weighingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              boxShadow: F.shadowElevated,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isLiquidUnit(weighingProduct.unit) ? (
                  <DrinkToGo24Regular style={{ color: F.accentRed, width: 22, height: 22 }} />
                ) : isWeightUnit(weighingProduct.unit) ? (
                  <Scales20Regular style={{ color: F.accentRed, width: 22, height: 22 }} />
                ) : (
                  <Box20Regular style={{ color: F.accentRed, width: 22, height: 22 }} />
                )}
                <span style={{ fontWeight: 800, fontSize: '16px', color: F.textPrimary }}>
                  {isLiquidUnit(weighingProduct.unit)
                    ? 'Liquid Volume Dispenser'
                    : isWeightUnit(weighingProduct.unit)
                    ? 'Digital Weight Scale'
                    : 'Quantity Selector'}
                </span>
              </div>
              <button
                onClick={() => setWeighingProduct(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            {/* Product Rate Information Card */}
            <div
              style={{
                backgroundColor: F.bgSubtle,
                padding: '12px 14px',
                borderRadius: F.radiusSm,
                border: `1px solid ${F.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: F.textPrimary }}>
                  {weighingProduct.name}
                </div>
                <div style={{ fontSize: '12px', color: F.textSecondary, marginTop: '2px' }}>
                  Base Rate: <b style={{ color: F.accentRed }}>PKR {weighingProduct.price.toLocaleString()}</b> per {weighingProduct.unit || 'unit'}
                </div>
              </div>
              <Box20Regular style={{ color: F.textMuted, width: 26, height: 26 }} />
            </div>

            {/* Calculation Mode Switcher (By Weight vs By Rupees Amount) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                backgroundColor: F.bgSubtle,
                borderRadius: '8px',
                padding: '3px',
                border: `1px solid ${F.border}`,
              }}
            >
              <button
                type="button"
                onClick={() => setWeightCalcMode('weight')}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: weightCalcMode === 'weight' ? (isDark ? '#27272A' : '#FFFFFF') : 'transparent',
                  color: weightCalcMode === 'weight' ? F.accentRed : F.textSecondary,
                  fontWeight: weightCalcMode === 'weight' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: weightCalcMode === 'weight' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Scales20Regular style={{ width: 14, height: 14 }} />
                <span>By Weight ({weighingProduct.unit || 'KG'})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWeightCalcMode('rupees');
                  const currentPrice = Math.round(weighingProduct.price * weightAmount);
                  setTargetRupees(currentPrice || 50);
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: weightCalcMode === 'rupees' ? (isDark ? '#27272A' : '#FFFFFF') : 'transparent',
                  color: weightCalcMode === 'rupees' ? F.accentRed : F.textSecondary,
                  fontWeight: weightCalcMode === 'rupees' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: weightCalcMode === 'rupees' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.12s ease',
                }}
              >
                <Money20Regular style={{ width: 14, height: 14 }} />
                <span>By Rupees (PKR Amount)</span>
              </button>
            </div>

            {weightCalcMode === 'weight' ? (
              /* ── Mode 1: Traditional Weighing / Scale ── */
              (() => {
                const isLiquid = isLiquidUnit(weighingProduct.unit);
                const isWeight = isWeightUnit(weighingProduct.unit);
                const presets = isLiquid
                  ? [
                      { label: '250 ml (¼ Liter)', val: 0.25 },
                      { label: '500 ml (½ Liter)', val: 0.5 },
                      { label: '750 ml (¾ Liter)', val: 0.75 },
                      { label: '1.0 Liter', val: 1.0 },
                      { label: '1.5 Liter', val: 1.5 },
                      { label: '2.0 Liter', val: 2.0 },
                      { label: '5.0 Liter', val: 5.0 },
                    ]
                  : isWeight
                  ? [
                      { label: '250g (¼ kg)', val: 0.25 },
                      { label: '500g (½ kg)', val: 0.5 },
                      { label: '750g (¾ kg)', val: 0.75 },
                      { label: '1.0 kg', val: 1.0 },
                      { label: '2.0 kg', val: 2.0 },
                      { label: '5.0 kg', val: 5.0 },
                      { label: '10 kg (Bulk)', val: 10.0 },
                      { label: '50 kg (Bag)', val: 50.0 },
                    ]
                  : [
                      { label: `1 ${weighingProduct.unit || 'PCS'}`, val: 1 },
                      { label: `2 ${weighingProduct.unit || 'PCS'}`, val: 2 },
                      { label: `3 ${weighingProduct.unit || 'PCS'}`, val: 3 },
                      { label: `5 ${weighingProduct.unit || 'PCS'}`, val: 5 },
                      { label: `10 ${weighingProduct.unit || 'PCS'}`, val: 10 },
                      { label: `12 ${weighingProduct.unit || 'PCS'}`, val: 12 },
                    ];

                return (
                  <>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                        Quick Presets ({isLiquid ? 'Volume / Liters' : isWeight ? 'Weight / Kilograms' : 'Quantity / ' + (weighingProduct.unit || 'Units')})
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: presets.length > 6 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '6px' }}>
                        {presets.map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => {
                              setWeightAmount(preset.val);
                              playBeep();
                            }}
                            style={{
                              padding: '8px 4px',
                              borderRadius: F.radiusSm,
                              border: `1.5px solid ${weightAmount === preset.val ? F.accentRed : F.border}`,
                              backgroundColor: weightAmount === preset.val ? (isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF1F2') : F.bgCard,
                              color: weightAmount === preset.val ? (isDark ? '#FF4D64' : F.accentRed) : F.textPrimary,
                              fontWeight: weightAmount === preset.val ? 800 : 500,
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                              textAlign: 'center',
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Scale / Measure Input */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>
                        {isLiquid ? 'Measured Volume' : isWeight ? 'Weighed Quantity' : 'Selected Quantity'} ({weighingProduct.unit || 'unit'})
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step={isLiquid || isWeight ? '0.05' : '1'}
                          min={isLiquid || isWeight ? '0.01' : '1'}
                          value={weightAmount}
                          onChange={(e) => setWeightAmount(Math.max(isLiquid || isWeight ? 0.01 : 1, parseFloat(e.target.value) || 0))}
                          style={{
                            flex: 1,
                            height: '42px',
                            padding: '0 12px',
                            borderRadius: F.radiusSm,
                            border: `1.5px solid ${F.border}`,
                            backgroundColor: F.bgSubtle,
                            color: F.textPrimary,
                            fontSize: '16px',
                            fontWeight: 800,
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: F.textSecondary }}>
                          {weighingProduct.unit || (isLiquid ? 'Liter' : isWeight ? 'kg' : 'PCS')}
                        </span>
                      </div>
                    </div>

                    {/* Live Calculated Price Display */}
                    <div
                      style={{
                        backgroundColor: isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF1F2',
                        borderRadius: F.radiusSm,
                        border: '1px solid rgba(229, 25, 55, 0.3)',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 700, color: F.textPrimary }}>
                        Calculated Price:
                      </span>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: F.accentRed }}>
                        PKR {Math.round(weighingProduct.price * weightAmount).toLocaleString()}
                      </span>
                    </div>
                  </>
                );
              })()
            ) : (
              /* ── Mode 2: Reverse Price / Rupees Budget ("50 Rupay ke Chawal") ── */
              (() => {
                const rupeePresets = [50, 100, 150, 200, 300, 500, 1000];
                const unit = weighingProduct.unit || 'kg';
                const isWeight = isWeightUnit(unit);
                const isLiquid = isLiquidUnit(unit);

                const handleRupeeSelect = (rs: number) => {
                  setTargetRupees(rs);
                  const calculatedQty = Number((rs / (weighingProduct.price || 1)).toFixed(3));
                  setWeightAmount(calculatedQty);
                  playBeep();
                };

                return (
                  <>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                        Customer Budget Presets (PKR)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        {rupeePresets.map((rs) => (
                          <button
                            key={rs}
                            type="button"
                            onClick={() => handleRupeeSelect(rs)}
                            style={{
                              padding: '8px 4px',
                              borderRadius: F.radiusSm,
                              border: `1.5px solid ${targetRupees === rs ? F.accentRed : F.border}`,
                              backgroundColor: targetRupees === rs ? (isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF1F2') : F.bgCard,
                              color: targetRupees === rs ? (isDark ? '#FF4D64' : F.accentRed) : F.textPrimary,
                              fontWeight: targetRupees === rs ? 800 : 500,
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                              textAlign: 'center',
                            }}
                          >
                            Rs. {rs}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Rupee Budget Input */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Customer Target Amount (PKR)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: F.accentRed }}>
                          PKR
                        </span>
                        <input
                          type="number"
                          step="5"
                          min="1"
                          placeholder="e.g. 50"
                          value={targetRupees || ''}
                          onChange={(e) => {
                            const val = Math.max(1, parseFloat(e.target.value) || 0);
                            setTargetRupees(val);
                            const calculatedQty = Number((val / (weighingProduct.price || 1)).toFixed(3));
                            setWeightAmount(calculatedQty);
                          }}
                          style={{
                            flex: 1,
                            height: '42px',
                            padding: '0 12px',
                            borderRadius: F.radiusSm,
                            border: `1.5px solid ${F.border}`,
                            backgroundColor: F.bgSubtle,
                            color: F.textPrimary,
                            fontSize: '16px',
                            fontWeight: 800,
                            outline: 'none',
                            fontFamily: 'monospace',
                          }}
                        />
                      </div>
                    </div>

                    {/* Calculated Weight Result Card */}
                    <div
                      style={{
                        backgroundColor: isDark ? 'rgba(229, 25, 55, 0.15)' : '#FFF1F2',
                        borderRadius: F.radiusSm,
                        border: '1px solid rgba(229, 25, 55, 0.3)',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10.5px', color: F.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                          Exact {isLiquid ? 'Volume' : 'Weight'} to give:
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: F.accentRed, marginTop: '2px' }}>
                          {weightAmount} {unit}{' '}
                          <span style={{ fontSize: '13px', fontWeight: 600, color: F.textPrimary }}>
                            ({Math.round(weightAmount * 1000)} {isLiquid ? 'ml' : isWeight ? 'grams' : 'units'})
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10.5px', color: F.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>
                          Total Bill
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: F.textPrimary, marginTop: '2px' }}>
                          PKR {targetRupees.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setWeighingProduct(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${F.border}`,
                  backgroundColor: F.bgCard,
                  color: F.textPrimary,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWeight}
                style={{
                  padding: '8px 20px',
                  borderRadius: F.radiusSm,
                  border: 'none',
                  backgroundColor: F.accentRed,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(229, 25, 55, 0.3)',
                }}
              >
                <Add16Filled />
                <span>
                  {isLiquidUnit(weighingProduct.unit)
                    ? 'Add Measured Item'
                    : isWeightUnit(weighingProduct.unit)
                    ? 'Add Weighed Item'
                    : 'Add to Order'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Wholesale Quantity Numpad / Multiplier Popover ── */}
      {editingQtyItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '380px',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              boxShadow: F.shadowElevated,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '22px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: F.textPrimary }}>
                  Set Quantity
                </div>
                <div style={{ fontSize: '12px', color: F.textSecondary, marginTop: '2px' }}>
                  {editingQtyItem.name}
                </div>
              </div>
              <button
                onClick={() => setEditingQtyItem(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            {/* Quick Bulk Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '8px' }}>
                Bulk / Pack Multipliers
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {[
                  { label: '+1 Unit', qty: editingQtyItem.currentQty + 1 },
                  { label: '+5 Units', qty: editingQtyItem.currentQty + 5 },
                  { label: '+10 Units', qty: editingQtyItem.currentQty + 10 },
                  { label: 'x12 (Dozen)', qty: 12 },
                  { label: 'x24 (Carton)', qty: 24 },
                  { label: 'x48 (Box)', qty: 48 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      handleApplyCustomQty(preset.qty);
                    }}
                    style={{
                      padding: '8px 4px',
                      borderRadius: F.radiusSm,
                      border: `1px solid ${F.border}`,
                      backgroundColor: F.bgSubtle,
                      color: F.textPrimary,
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Number Input */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '6px' }}>
                Exact Item Count
              </div>
              <input
                type="number"
                min="1"
                value={customQtyInput}
                onChange={(e) => setCustomQtyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseInt(customQtyInput, 10);
                    if (!isNaN(parsed) && parsed > 0) handleApplyCustomQty(parsed);
                  }
                }}
                autoFocus
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 12px',
                  borderRadius: F.radiusSm,
                  border: `1.5px solid ${F.border}`,
                  backgroundColor: F.bgSubtle,
                  color: F.textPrimary,
                  fontSize: '18px',
                  fontWeight: 800,
                  outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setEditingQtyItem(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${F.border}`,
                  backgroundColor: F.bgCard,
                  color: F.textPrimary,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseInt(customQtyInput, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    handleApplyCustomQty(parsed);
                  }
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: F.radiusSm,
                  border: 'none',
                  backgroundColor: F.accentRed,
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Apply Quantity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
