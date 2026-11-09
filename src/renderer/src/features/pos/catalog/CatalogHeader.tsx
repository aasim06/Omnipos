import { PosCounterState } from '@/features/pos/usePosCounter';
import { ChevronLeft20Regular, ChevronRight20Regular, Dismiss16Regular, Grid20Regular, Search20Regular, Table20Regular } from '@fluentui/react-icons';
import { CategoryIcon } from '@/features/pos/posIcons';
import { playErrorBeep } from '@/lib/soundFx';

export function CatalogHeader({ pos }: { pos: PosCounterState }) {
  const {
    module,
    isDark,
    F,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    setSelectedProduct,
    isSuccess,
    viewMode,
    setViewMode,
    setLastScannedFeedback,
    setVariantPickerProduct,
    products,
    allCategoryTabs,
    categoryCounts,
    tabScrollRef,
    canScrollLeft,
    canScrollRight,
    checkScrollButtons,
    handleScrollTabs,
    filteredProducts,
    addToCart,
  } = pos;

  return (
    <>
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
              placeholder="Search catalog or scan barcode (F2)..."
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
    </>
  );
}
