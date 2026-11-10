import React from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import {
  ArrowEnter20Regular,
  BarcodeScanner20Regular,
  Dismiss16Regular,
  Food20Regular,
  Grid20Regular,
  GridKanban20Regular,
  Search20Regular,
  ShoppingBag20Regular,
  Sparkle20Regular,
  Table20Regular,
} from '@fluentui/react-icons';
import { playErrorBeep } from '@/lib/soundFx';

/**
 * Windows 11 command bar for the POS catalog (one 48px row).
 * Replaces the old "Terminal Mode" bar, the header search and the large scanner card.
 * Scanner and search keep their own inputs and their original behaviour:
 *  - scanner: Enter / scanner gun submits handleBarcodeScan (supports "3*barcode"), F2 or / focuses it
 *  - search: filters the catalog live; Enter adds the exact match
 */
export function CommandBar({
  pos,
  showFeatured,
  onToggleFeatured,
}: {
  pos: PosCounterState;
  showFeatured: boolean;
  onToggleFeatured: () => void;
}) {
  const {
    module,
    navigate,
    isDark,
    F,
    hasFastFood,
    hasOmnimart,
    searchTerm,
    setSearchTerm,
    setSelectedProduct,
    viewMode,
    setViewMode,
    setLastScannedFeedback,
    setVariantPickerProduct,
    products,
    filteredProducts,
    addToCart,
    barcodeInput,
    setBarcodeInput,
    scannerInputRef,
    handleBarcodeScan,
  } = pos;

  const subtleHover = isDark ? 'rgba(255,255,255,0.061)' : 'rgba(0,0,0,0.037)';
  const subtleSelected = isDark ? 'rgba(255,255,255,0.084)' : 'rgba(0,0,0,0.055)';

  const textBox: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '32px',
    padding: '0 10px',
    boxSizing: 'border-box',
    backgroundColor: isDark ? 'rgba(255,255,255,0.045)' : '#FFFFFF',
    border: `1px solid ${F.border}`,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.54)' : 'rgba(0,0,0,0.45)',
    borderRadius: '4px',
  };
  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontFamily: F.font,
    fontSize: '14px',
    color: F.textPrimary,
  };

  const segmentButton = ({
    active,
    onClick,
    title,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    title?: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: '28px',
        padding: '0 10px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: active ? F.bgCard : 'transparent',
        boxShadow: active ? (isDark ? '0 0 0 1px rgba(255,255,255,0.08)' : '0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.06)') : 'none',
        color: F.textPrimary,
        fontWeight: active ? 600 : 400,
        fontSize: '13px',
        fontFamily: F.font,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );

  const segmentTrack: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '2px',
    borderRadius: '6px',
    backgroundColor: F.bgSubtle,
    flexShrink: 0,
  };

  const iconButton = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '32px',
    padding: '0 10px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: active ? subtleSelected : 'transparent',
    color: F.textPrimary,
    fontSize: '13px',
    fontFamily: F.font,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '48px',
        padding: '0 16px',
        boxSizing: 'border-box',
        backgroundColor: F.bgCard,
        borderBottom: `1px solid ${F.borderSubtle}`,
        flexShrink: 0,
      }}
    >
      {/* Terminal mode (only when both POS modules are licensed) */}
      {hasFastFood && hasOmnimart && (
        <div style={segmentTrack} role="group" aria-label="Terminal mode">
          {segmentButton({ active: module === 'fastfood', onClick: () => navigate('/pos/fastfood'), title: "Fast food restaurant (KOT, tables)", children: <>
            <Food20Regular style={{ width: 16, height: 16 }} />
            <span>Fast Food</span></> })}
          {segmentButton({ active: module === 'minimart', onClick: () => navigate('/pos/omnimart'), title: "Retail mini mart (barcode scanner)", children: <>
            <ShoppingBag20Regular style={{ width: 16, height: 16 }} />
            <span>Mart</span></> })}
        </div>
      )}

      {/* Barcode / SKU scanner */}
      <form onSubmit={handleBarcodeScan} style={{ ...textBox, flex: '1 1 260px', minWidth: '200px', maxWidth: '460px', borderBottomColor: barcodeInput ? F.accentRed : textBox.borderBottomColor, borderBottomWidth: barcodeInput ? '2px' : '1px' }}>
        <BarcodeScanner20Regular style={{ color: F.textSecondary, width: 16, height: 16, flexShrink: 0 }} />
        <input
          ref={scannerInputRef}
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          placeholder="Scan barcode or SKU (F2) · 3*code adds 3"
          aria-label="Scan barcode or SKU"
          style={{ ...inputStyle, fontWeight: 600 }}
        />
        {barcodeInput && (
          <Dismiss16Regular
            style={{ cursor: 'pointer', color: F.textSecondary, width: 14, height: 14, flexShrink: 0 }}
            onClick={() => setBarcodeInput('')}
          />
        )}
        <button
          type="submit"
          title="Add scanned item (Enter)"
          aria-label="Add scanned item"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', marginRight: '-4px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', color: F.textSecondary, cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowEnter20Regular style={{ width: 16, height: 16 }} />
        </button>
      </form>

      {/* Catalog search (logic unchanged from the old header search) */}
      <div style={{ ...textBox, flex: '0 1 220px', minWidth: '150px' }}>
        <Search20Regular style={{ color: F.textSecondary, width: 16, height: 16, flexShrink: 0 }} />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const q = searchTerm.trim().toLowerCase();
              if (!q) return;
              const exact = products.find(
                (p) =>
                  (p.skuCode && p.skuCode.toLowerCase() === q) ||
                  (p.barcode && p.barcode.toLowerCase() === q) ||
                  (p.id && p.id.toLowerCase() === q) ||
                  `sku-${p.id.slice(-6)}`.toLowerCase() === q ||
                  p.name.toLowerCase() === q
              );
              const target = exact || (filteredProducts.length === 1 ? filteredProducts[0] : null);
              if (target) {
                const isTargetOut =
                  target.openingStock !== null && target.openingStock !== undefined && target.openingStock <= 0;
                if (isTargetOut && (!target.variants || target.variants.length === 0)) {
                  playErrorBeep();
                  setLastScannedFeedback({
                    isSuccess: false,
                    text: `"${target.name}" is OUT OF STOCK! (0 Available)`
                  });
                  setTimeout(() => setLastScannedFeedback(null), 3500);
                  return;
                }
                if (target.variants && target.variants.length > 0) {
                  setVariantPickerProduct(target);
                } else {
                  addToCart(target, 1);
                  setSelectedProduct(target);
                }
                setSearchTerm('');
              }
            }
          }}
          placeholder="Search items"
          aria-label="Search items"
          style={inputStyle}
        />
        {searchTerm && (
          <Dismiss16Regular
            style={{ cursor: 'pointer', color: F.textSecondary, width: 14, height: 14, flexShrink: 0 }}
            onClick={() => setSearchTerm('')}
          />
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Catalog view: touch tiles / cards / dense table (mart only) */}
      <div style={segmentTrack} role="group" aria-label="Catalog view">
        {segmentButton({ active: viewMode === 'tiles', onClick: () => setViewMode('tiles'), title: 'Touch tiles', children: <>
          <GridKanban20Regular style={{ width: 16, height: 16 }} /></> })}
        {segmentButton({ active: viewMode === 'grid', onClick: () => setViewMode('grid'), title: 'Product cards', children: <>
          <Grid20Regular style={{ width: 16, height: 16 }} /></> })}
        {module === 'minimart' &&
          segmentButton({ active: viewMode === 'table', onClick: () => setViewMode('table'), title: 'Dense table', children: <>
            <Table20Regular style={{ width: 16, height: 16 }} /></> })}
      </div>

      {/* Featured item / meal builder card (fast food), hidden by default to save space */}
      {module === 'fastfood' && (
        <button
          type="button"
          onClick={onToggleFeatured}
          aria-pressed={showFeatured}
          title={showFeatured ? 'Hide featured item card' : 'Show featured item card'}
          style={iconButton(showFeatured)}
          onMouseEnter={(e) => { if (!showFeatured) e.currentTarget.style.backgroundColor = subtleHover; }}
          onMouseLeave={(e) => { if (!showFeatured) e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <Sparkle20Regular style={{ width: 16, height: 16 }} />
          <span>Featured</span>
        </button>
      )}

      {/* Kitchen display shortcut (fast food) */}
      {module === 'fastfood' && (
        <button
          type="button"
          onClick={() => navigate('/kitchen')}
          title="Open the kitchen display (KDS)"
          style={iconButton(false)}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = subtleHover)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: F.accentGreen, flexShrink: 0 }} />
          <span>Kitchen</span>
        </button>
      )}
    </div>
  );
}
