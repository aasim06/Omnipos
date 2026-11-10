import React from 'react';
import { Category, Product } from '@shared/types';
import { useQueryClient } from '@tanstack/react-query';
import { posApi } from '@/lib/api';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { decodeProductVariants } from '@/lib/variants';
import { playBeep } from '@/lib/soundFx';
import { hasOpenPosDialog } from '@/features/pos/posDialog';
import { Add16Filled, Apps24Regular, ArrowLeft20Regular, ChevronRight16Regular, MoreVertical16Regular, Options16Regular, Scales16Regular, Star16Filled, Star16Regular } from '@fluentui/react-icons';
import { CategoryTileIcon, TileTint, autoTintIndex, categoryTint, sortCategoryNames } from '@/features/pos/categoryStyle';

type Tint = TileTint;

/** Product tags arrive as an array or as a JSON string from the database. */
export function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const FAVOURITE_TAG = 'pos:favourite';
export const WIDE_TAG = 'pos:wide';

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** "Fresh Milk (1 Liter)" -> "FM", "lava burger" -> "LB", "suger" -> "SU". */
function initials(name: string): string {
  // Words that start with a letter only, so "Pepsi 1.5L" gives "PE", not "P1".
  const words = name
    .replace(/\(.*?\)/g, ' ')
    .split(/[^A-Za-z0-9؀-ۿ]+/)
    .filter((w) => /^[A-Za-z؀-ۿ]/.test(w));
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Touch tile board (restaurant-terminal style).
 * "All" with no search shows a board of category tiles; tapping one shows that category's items.
 * Back (header button or Escape) returns to the category board.
 */
export function TileBoard({ pos }: { pos: PosCounterState }) {
  const { isDark, F, module, activeCategory, setActiveCategory, allCategoryTabs, categoryCounts, filteredProducts, products, dbCategories, searchTerm, setSearchTerm } = pos;

  // "All items" opened from the category board.
  const [showAllItems, setShowAllItems] = React.useState(false);
  React.useEffect(() => setShowAllItems(false), [activeCategory]);

  // Saved colour / icon / order per category (Admin > Categories).
  const categoryMeta = React.useMemo(() => {
    const m = new Map<string, Category>();
    dbCategories.filter((c) => !c.module || c.module === module).forEach((c) => m.set(c.name, c));
    return m;
  }, [dbCategories, module]);

  const categories = React.useMemo(
    () => sortCategoryNames(allCategoryTabs.filter((c) => c !== 'All'), categoryMeta),
    [allCategoryTabs, categoryMeta],
  );
  const tintFor = React.useCallback(
    (category?: string) => {
      const i = category ? categories.indexOf(category) : -1;
      return categoryTint(category ? categoryMeta.get(category)?.color : null, i >= 0 ? i : autoTintIndex(category || ''), isDark);
    },
    [categories, categoryMeta, isDark],
  );

  // Favourites (quick keys): products pinned with the favourite tag, in their display order.
  const favourites = React.useMemo(
    () =>
      products
        .filter((p) => (!p.module || p.module === module) && parseTags(p.tags).includes(FAVOURITE_TAG))
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0) || a.name.localeCompare(b.name)),
    [products, module],
  );

  // Tile size (Admin > Settings > Touch layout) and a column count that fits the width.
  const tileSize = useTileSize();
  const [boardRef, boardWidth] = useWidth<HTMLDivElement>();
  const spec = TILE_SPECS[tileSize];
  const fit = (min: number, max: number, gap: number) =>
    boardWidth > 0 ? Math.max(2, Math.min(max, Math.floor((boardWidth + gap) / (min + gap)))) : max;
  const categoryCols = fit(spec.categoryMin, spec.categoryMax, 12);
  const itemCols = Math.max(1, fit(spec.itemMin, 8, 10));
  const narrow = boardWidth > 0 && boardWidth < 520;

  const toggleTag = useToggleProductTag(module);

  const searching = searchTerm.trim().length > 0;
  const showCategoryBoard = activeCategory === 'All' && !searching && !showAllItems;

  const goBack = React.useCallback(() => {
    if (searching) setSearchTerm('');
    else if (showAllItems) setShowAllItems(false);
    else setActiveCategory('All');
  }, [searching, showAllItems, setSearchTerm, setActiveCategory]);

  // Escape goes back one level, unless a dialog is open (it takes Escape first).
  React.useEffect(() => {
    if (showCategoryBoard) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || hasOpenPosDialog()) return;
      e.preventDefault();
      goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showCategoryBoard, goBack]);

  const current = searching ? `Results for "${searchTerm.trim()}"` : activeCategory === 'All' ? 'All items' : activeCategory;
  const count = showCategoryBoard ? categories.length : filteredProducts.length;
  const countLabel = showCategoryBoard ? (count === 1 ? 'category' : 'categories') : count === 1 ? 'item' : 'items';

  return (
    <div ref={boardRef} style={{ fontFamily: F.font }}>
      <style>{`.pos-board-tile:hover:not([aria-disabled="true"]){filter:brightness(${isDark ? 1.12 : 0.97})}.pos-board-tile:active:not([aria-disabled="true"]){transform:scale(0.97)}.pos-board-tile:focus-visible{outline:2px solid ${F.textPrimary};outline-offset:2px}`}</style>

      {/* Header: back + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '36px', marginBottom: '12px' }}>
        {!showCategoryBoard && (
          <button
            type="button"
            onClick={goBack}
            title="Back (Esc)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '36px',
              padding: '0 8px 0 10px',
              borderRadius: '6px',
              border: `1px solid ${F.border}`,
              backgroundColor: F.bgCard,
              color: F.textPrimary,
              fontFamily: F.font,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = F.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = F.bgCard)}
          >
            <ArrowLeft20Regular style={{ width: 18, height: 18 }} />
            Back
            <kbd
              style={{
                marginLeft: '2px',
                padding: '1px 5px',
                borderRadius: '4px',
                border: `1px solid ${F.border}`,
                backgroundColor: F.bgSubtle,
                color: F.textSecondary,
                fontFamily: F.font,
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              Esc
            </kbd>
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, fontSize: '16px', fontWeight: 600 }}>
          {showCategoryBoard ? (
            <span style={{ color: F.textPrimary }}>Categories</span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setShowAllItems(false);
                  setActiveCategory('All');
                }}
                style={{ padding: 0, border: 'none', background: 'none', color: F.textSecondary, font: 'inherit', cursor: 'pointer' }}
              >
                Categories
              </button>
              <ChevronRight16Regular style={{ color: F.textMuted, flexShrink: 0 }} />
              <span style={{ color: F.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current}</span>
            </>
          )}
          <span style={{ marginLeft: '4px', fontSize: '13px', fontWeight: 400, color: F.textMuted, whiteSpace: 'nowrap' }}>
            {count} {countLabel}
          </span>
        </div>
      </div>

      {showCategoryBoard ? (
        <>
          {favourites.length > 0 && (
            <section style={{ marginBottom: '20px' }}>
              <SectionTitle F={F} icon={<Star16Filled style={{ color: '#E8A317' }} />} text="Favourites" note={`${favourites.length} quick keys`} />
              <ItemGrid cols={itemCols} rowHeight={spec.itemRow}>
                {favourites.map((p) => (
                  <ItemTile key={p.id} pos={pos} product={p} tint={tintFor(p.category)} compact={narrow} onToggleTag={toggleTag} />
                ))}
              </ItemGrid>
            </section>
          )}
          {favourites.length > 0 && <SectionTitle F={F} text="Categories" />}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${categoryCols}, minmax(0, 1fr))`,
              gridAutoRows: `${spec.categoryRow}px`,
              gap: '12px',
            }}
          >
            <CategoryTile
              F={F}
              isDark={isDark}
              tint={{ bg: F.bgCard, ink: F.textPrimary, shine: F.bgCard }}
              outlined
              iconSize={spec.categoryIcon}
              onClick={() => setShowAllItems(true)}
              icon={<Apps24Regular style={{ width: spec.categoryIcon, height: spec.categoryIcon }} />}
              name="All items"
              count={categoryCounts.All ?? 0}
            />
            {categories.map((cat) => (
              <CategoryTile
                key={cat}
                F={F}
                isDark={isDark}
                tint={tintFor(cat)}
                iconSize={spec.categoryIcon}
                onClick={() => setActiveCategory(cat)}
                icon={<CategoryTileIcon name={cat} iconKey={categoryMeta.get(cat)?.icon} size={spec.categoryIcon} />}
                name={cat}
                count={categoryCounts[cat] ?? 0}
              />
            ))}
          </div>
        </>
      ) : filteredProducts.length === 0 ? (
        <div
          style={{
            padding: '40px 16px',
            textAlign: 'center',
            fontSize: '14px',
            color: F.textMuted,
            border: `1px dashed ${F.border}`,
            borderRadius: '10px',
          }}
        >
          {searching ? 'No items match this search.' : 'No items in this category yet.'}
        </div>
      ) : (
        <ItemGrid cols={itemCols} rowHeight={spec.itemRow}>
          {filteredProducts.map((p) => (
            <ItemTile key={p.id} pos={pos} product={p} tint={tintFor(p.category)} compact={narrow} onToggleTag={toggleTag} />
          ))}
        </ItemGrid>
      )}
    </div>
  );
}

/* ─── Tile size (Phase 5 setting) ─────────────────────────────────── */
export type TileSize = 'S' | 'M' | 'L';
export const TILE_SIZE_KEY = 'omnipos_pos_tile_size';
const TILE_SIZE_EVENT = 'omnipos:tile-size';

const TILE_SPECS: Record<TileSize, { categoryMin: number; categoryMax: number; categoryRow: number; categoryIcon: number; itemMin: number; itemRow: number }> = {
  S: { categoryMin: 130, categoryMax: 6, categoryRow: 140, categoryIcon: 36, itemMin: 230, itemRow: 104 },
  M: { categoryMin: 160, categoryMax: 5, categoryRow: 172, categoryIcon: 46, itemMin: 270, itemRow: 116 },
  L: { categoryMin: 200, categoryMax: 4, categoryRow: 204, categoryIcon: 56, itemMin: 330, itemRow: 132 },
};

export function readTileSize(): TileSize {
  try {
    const v = localStorage.getItem(TILE_SIZE_KEY);
    return v === 'S' || v === 'L' ? v : 'M';
  } catch {
    return 'M';
  }
}

export function writeTileSize(size: TileSize) {
  try {
    localStorage.setItem(TILE_SIZE_KEY, size);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(TILE_SIZE_EVENT));
}

function useTileSize(): TileSize {
  const [size, setSize] = React.useState<TileSize>(readTileSize);
  React.useEffect(() => {
    const update = () => setSize(readTileSize());
    window.addEventListener(TILE_SIZE_EVENT, update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener(TILE_SIZE_EVENT, update);
      window.removeEventListener('storage', update);
    };
  }, []);
  return size;
}

function useWidth<T extends HTMLElement>(): [React.RefCallback<T>, number] {
  const [width, setWidth] = React.useState(0);
  const observer = React.useRef<ResizeObserver | null>(null);
  const ref = React.useCallback((el: T | null) => {
    observer.current?.disconnect();
    if (!el) return;
    setWidth(el.clientWidth);
    observer.current = new ResizeObserver((entries) => setWidth(Math.round(entries[0].contentRect.width)));
    observer.current.observe(el);
  }, []);
  React.useEffect(() => () => observer.current?.disconnect(), []);
  return [ref, width];
}

/** Toggle a POS tag (favourite / wide tile) on a product and refresh the catalog. */
function useToggleProductTag(module: string) {
  const queryClient = useQueryClient();
  return React.useCallback(
    async (product: Product, tag: string) => {
      const tags = parseTags(product.tags);
      const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
      // Optimistic update so the tile moves at once.
      queryClient.setQueryData<Product[]>(['products', module], (old) =>
        old ? old.map((p) => (p.id === product.id ? { ...p, tags: next } : p)) : old,
      );
      try {
        await posApi.saveProduct({ ...product, tags: next });
      } finally {
        queryClient.invalidateQueries({ queryKey: ['products', module] });
      }
    },
    [queryClient, module],
  );
}

function ItemGrid({ cols, rowHeight, children }: { cols: number; rowHeight: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: `${rowHeight}px`, gridAutoFlow: 'dense', gap: '10px' }}>
      {children}
    </div>
  );
}

function SectionTitle({ F, icon, text, note }: { F: PosCounterState['F']; icon?: React.ReactNode; text: string; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 10px', fontSize: '14px', fontWeight: 600, color: F.textPrimary }}>
      {icon}
      {text}
      {note && <span style={{ marginLeft: '4px', fontSize: '12px', fontWeight: 400, color: F.textMuted }}>{note}</span>}
    </div>
  );
}

/* ─── Category tile ──────────────────────────────────────────────── */
function CategoryTile({
  F,
  isDark,
  tint,
  outlined,
  onClick,
  iconSize = 46,
  icon,
  name,
  count,
}: {
  F: PosCounterState['F'];
  isDark: boolean;
  tint: Tint;
  outlined?: boolean;
  onClick: () => void;
  iconSize?: number;
  icon: React.ReactNode;
  name: string;
  count: number;
}) {
  const empty = count === 0;
  // Flat, like the app's cards: solid colour, hairline border, the same light card shadow (no glow or bevel).
  const color = outlined ? tint.bg : tint.shine ?? tint.bg;
  const shadow = F.shadowCard;
  return (
    <button
      type="button"
      className="pos-board-tile"
      aria-label={`${name}, ${count} items`}
      aria-disabled={empty}
      onClick={() => !empty && onClick()}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        padding: '16px',
        border: outlined ? `1px solid ${F.border}` : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        borderRadius: '16px',
        backgroundColor: color,
        boxShadow: empty ? 'none' : shadow,
        color: tint.ink,
        fontFamily: F.font,
        cursor: empty ? 'not-allowed' : 'pointer',
        opacity: empty ? 0.45 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        textAlign: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'manipulation',
        transition: 'transform 0.08s ease, filter 0.12s ease',
      }}
    >
      <span
        style={{
          width: `${Math.round(iconSize * 1.7)}px`,
          height: `${Math.round(iconSize * 1.7)}px`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: outlined ? F.bgSubtle : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.5)',
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: iconSize >= 46 ? '17px' : '15px',
          fontWeight: 700,
          lineHeight: '21px',
          maxHeight: '42px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
        }}
      >
        {name}
      </span>
      <span
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          minWidth: '24px',
          height: '22px',
          padding: '0 7px',
          borderRadius: '11px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: outlined ? F.bgSubtle : isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.65)',
          fontSize: '12px',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </span>
    </button>
  );
}

/* ─── Item tile ──────────────────────────────────────────────────────
 * Wide retail tile on the app's card surface (white in light, dark in dark).
 * Left: rounded photo box on the category colour. Right: category + stock,
 * name, size / SKU, then the price with an add button (or the quantity in the order).
 */

/** "Fresh Milk (1 Liter)" -> ["Fresh Milk", "1 Liter"]. */
function splitName(name: string): [string, string] {
  const m = name.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? [m[1], m[2]] : [name, ''];
}

function ItemTile({
  pos,
  product: rawProduct,
  tint,
  compact,
  onToggleTag,
}: {
  pos: PosCounterState;
  product: Product;
  tint: Tint;
  compact?: boolean;
  onToggleTag: (product: Product, tag: string) => void;
}) {
  const { F, isDark, inCartMap, addToCart, isWeighableOrLiquid, setWeighingProduct, setWeightAmount, setVariantPickerProduct } = pos;
  const product = React.useMemo(() => decodeProductVariants(rawProduct), [rawProduct]);
  const variantCount = product.variants?.length ?? 0;
  const hasVariants = variantCount > 0;
  const isWeighed = isWeighableOrLiquid(product.unit) || product.pricingType === 'perkg' || product.pricingType === 'amountse';

  const isFood = product.module === 'fastfood';
  const stock = product.openingStock;
  const hasStock = stock !== null && stock !== undefined;
  const isOut = !isFood && hasStock && (stock as number) <= 0;
  const isLow = !isFood && !isOut && hasStock && (stock as number) <= (product.minThreshold ?? 10);
  const inCart = inCartMap[product.id] ?? 0;
  const unit = (product.unit || 'kg').toLowerCase();
  const photo = product.imageBase64 || product.imageUrl;
  const [photoFailed, setPhotoFailed] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const accent = F.accentRed;
  const active = inCart > 0;

  const [title, sizeFromName] = splitName(product.name);
  const detail = isWeighed
    ? `Sold per ${unit}`
    : hasVariants
    ? `${variantCount} options`
    : sizeFromName || (product.unit ? product.unit.toUpperCase() : '');
  const code = product.skuCode || product.barcode;
  const stockQty = hasStock ? `${formatQty(stock as number)}${isWeighed ? ` ${unit}` : ''}` : '';

  // Stock chip: green normal, amber low, red sold out, neutral for made-to-order food.
  const stockChip = isOut
    ? { text: 'Sold out', fg: '#C42B1C', bg: isDark ? 'rgba(232,72,72,0.16)' : '#FDECEA' }
    : isLow
    ? { text: `Low · ${stockQty}`, fg: isDark ? '#F2C661' : '#8A5300', bg: isDark ? 'rgba(242,198,97,0.14)' : '#FEF3DC' }
    : hasStock && !(isFood && (stock as number) <= 0) // food is made to order; 0 stock means "not tracked"
    ? { text: stockQty, fg: isDark ? '#7FD69A' : '#107C41', bg: isDark ? 'rgba(127,214,154,0.12)' : '#E8F5EC' }
    : isFood
    ? { text: 'Made fresh', fg: F.textSecondary, bg: F.bgSubtle }
    : null;

  const tap = () => {
    if (isOut) return;
    if (isWeighed) {
      setWeighingProduct(product);
      setWeightAmount(1.0);
      playBeep();
    } else if (hasVariants) {
      setVariantPickerProduct(product);
      playBeep();
    } else {
      addToCart(product, 1); // plays its own beep
    }
  };

  const lift = hover && !isOut;
  let borderColor = F.border;
  if (active) borderColor = accent;
  else if (lift) borderColor = isDark ? '#4A4A4A' : '#D0D0D0';
  let shadow = F.shadowCard;
  if (active) shadow = `inset 0 0 0 1px ${accent}`;
  else if (lift) shadow = isDark ? '0 6px 16px rgba(0,0,0,0.4)' : '0 6px 16px rgba(15,23,42,0.08)';

  // Quick-key options: right-click (or long-press on touch) or the ⋮ button.
  const tags = parseTags(rawProduct.tags);
  const isFavourite = tags.includes(FAVOURITE_TAG);
  const isWide = tags.includes(WIDE_TAG);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const photoW = compact ? 72 : 94;

  return (
    <div
      style={{ position: 'relative', minWidth: 0, gridColumn: isWide ? 'span 2' : undefined }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
    <button
      type="button"
      className="pos-board-tile"
      aria-label={`${product.name}, Rs ${product.price}${isWeighed ? ` per ${unit}` : ''}${inCart ? `, ${formatQty(inCart)} in order` : ''}${isOut ? ', sold out' : ''}`}
      aria-disabled={isOut}
      onClick={tap}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        padding: '10px 12px 10px 10px',
        border: `1px solid ${borderColor}`,
        borderRadius: '12px',
        background: isOut ? F.bgSubtle : F.bgCard,
        boxShadow: shadow,
        color: F.textPrimary,
        fontFamily: F.font,
        textAlign: 'left',
        cursor: isOut ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'stretch',
        gap: '12px',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'manipulation',
        transition: 'transform 0.08s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Rounded photo box: the photo fills it; without one, initials on the category colour */}
      <span
        style={{
          position: 'relative',
          width: `${photoW}px`,
          flexShrink: 0,
          borderRadius: '10px',
          backgroundColor: photo && !photoFailed ? F.bgSubtle : isOut ? F.bgCard : tint.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {photo && !photoFailed ? (
          <img
            src={photo}
            alt=""
            draggable={false}
            onError={() => setPhotoFailed(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isOut ? 'grayscale(1)' : 'none',
              opacity: isOut ? 0.5 : 1,
              transform: lift ? 'scale(1.06)' : 'none',
              transition: 'transform 0.25s ease',
            }}
          />
        ) : (
          <span style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '0.03em', color: isOut ? F.textMuted : tint.ink }}>
            {initials(product.name)}
          </span>
        )}

        {(isWeighed || hasVariants) && !isOut && (
          <span
            title={detail}
            style={{
              position: 'absolute',
              left: '5px',
              bottom: '5px',
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.9)',
              color: F.textPrimary,
            }}
          >
            {isWeighed ? <Scales16Regular style={{ width: 14, height: 14 }} /> : <Options16Regular style={{ width: 14, height: 14 }} />}
          </span>
        )}
      </span>

      {/* Details */}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Category + stock */}
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
          <span
            style={{
              minWidth: 0,
              fontSize: '10.5px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: F.textMuted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {product.category || 'General'}
          </span>
          {stockChip && (
            <span
              title={isOut ? 'Sold out' : hasStock ? `${stockQty} in stock` : undefined}
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                height: '18px',
                padding: '0 7px',
                borderRadius: '9px',
                backgroundColor: stockChip.bg,
                color: stockChip.fg,
                fontSize: '10.5px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '3px', backgroundColor: stockChip.fg }} />
              {stockChip.text}
            </span>
          )}
        </span>

        {/* Name */}
        <span
          title={product.name}
          style={{
            marginTop: '3px',
            fontSize: '15px',
            fontWeight: 700,
            lineHeight: '19px',
            color: isOut ? F.textMuted : F.textPrimary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </span>

        {/* Size / unit and SKU */}
        <span
          style={{
            marginTop: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: F.textSecondary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {detail && <span style={{ flexShrink: 0 }}>{detail}</span>}
          {detail && code && (
            <span aria-hidden style={{ color: F.textMuted }}>
              ·
            </span>
          )}
          {code && (
            <span style={{ fontFamily: 'Consolas, "Cascadia Mono", monospace', fontSize: '11px', color: F.textMuted, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {code}
            </span>
          )}
        </span>

        {/* Price + add button / quantity in the order */}
        <span style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', color: isOut ? F.textMuted : F.textPrimary }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: F.textSecondary, marginRight: '3px' }}>Rs</span>
            <span style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {isWeighed && <span style={{ fontSize: '12px', color: F.textMuted }}> /{unit}</span>}
          </span>

          {!isOut && active && (
            <span
              style={{
                flexShrink: 0,
                height: '28px',
                padding: '0 10px',
                borderRadius: '14px',
                backgroundColor: accent,
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              × {formatQty(inCart)}
              {isWeighed ? ` ${unit}` : ''}
            </span>
          )}
          {!isOut && !active && (
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: '28px',
                height: '28px',
                borderRadius: '14px',
                backgroundColor: hover ? accent : F.accentRedSubtle,
                color: hover ? '#FFFFFF' : accent,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
            >
              {isWeighed ? <Scales16Regular /> : hasVariants ? <ChevronRight16Regular /> : <Add16Filled />}
            </span>
          )}
        </span>
      </span>
    </button>

      {/* Favourite marker (top-left of the photo) */}
      {isFavourite && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            width: '20px',
            height: '20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.92)',
            color: '#E8A317',
            pointerEvents: 'none',
          }}
        >
          <Star16Filled style={{ width: 13, height: 13 }} />
        </span>
      )}

      {/* ⋮ options (shown on hover; long-press / right-click also opens it) */}
      {(hover || menuOpen) && (
        <button
          type="button"
          title="Tile options"
          aria-label="Tile options"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          style={{
            position: 'absolute',
            top: '14px',
            left: `${10 + photoW - 26}px`,
            width: '22px',
            height: '22px',
            padding: 0,
            borderRadius: '6px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.92)',
            color: F.textPrimary,
            cursor: 'pointer',
          }}
        >
          <MoreVertical16Regular style={{ width: 14, height: 14 }} />
        </button>
      )}

      {menuOpen && (
        <TileMenu
          F={F}
          onClose={() => setMenuOpen(false)}
          items={[
            {
              icon: isFavourite ? <Star16Regular /> : <Star16Filled style={{ color: '#E8A317' }} />,
              label: isFavourite ? 'Remove from favourites' : 'Add to favourites',
              onClick: () => onToggleTag(rawProduct, FAVOURITE_TAG),
            },
            {
              icon: <Apps24Regular style={{ width: 16, height: 16 }} />,
              label: isWide ? 'Normal tile' : 'Wide tile (2 columns)',
              onClick: () => onToggleTag(rawProduct, WIDE_TAG),
            },
          ]}
        />
      )}
    </div>
  );
}

/** Small popup menu anchored to the top-left of a tile; closes on outside click or Escape. */
function TileMenu({
  F,
  items,
  onClose,
}: {
  F: PosCounterState['F'];
  items: { icon: React.ReactNode; label: string; onClick: () => void }[];
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault(); // so the board does not also go back
        e.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: 'absolute',
        top: '40px',
        left: '10px',
        zIndex: 20,
        minWidth: '210px',
        padding: '4px',
        borderRadius: '8px',
        border: `1px solid ${F.border}`,
        backgroundColor: F.bgCard,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        fontFamily: F.font,
      }}
    >
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          role="menuitem"
          onClick={() => {
            it.onClick();
            onClose();
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = F.bgHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            height: '36px',
            padding: '0 10px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: 'transparent',
            color: F.textPrimary,
            fontFamily: F.font,
            fontSize: '13px',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', width: 16, justifyContent: 'center' }}>{it.icon}</span>
          {it.label}
        </button>
      ))}
    </div>
  );
}
