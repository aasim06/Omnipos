import { PosCounterState } from '@/features/pos/usePosCounter';
import { ChevronLeft20Regular, ChevronRight20Regular } from '@fluentui/react-icons';
import { CategoryIcon } from '@/features/pos/posIcons';

/**
 * Windows 11 pivot / SelectorBar for product categories (40px).
 * Selected tab: primary text, semibold, short accent pill underneath.
 * Scrolling logic (chevrons, hidden scrollbar) is unchanged from the old header.
 */
export function CategoryPivot({ pos }: { pos: PosCounterState }) {
  const {
    isDark,
    F,
    activeCategory,
    setActiveCategory,
    allCategoryTabs,
    categoryCounts,
    tabScrollRef,
    canScrollLeft,
    canScrollRight,
    checkScrollButtons,
    handleScrollTabs,
    filteredProducts,
  } = pos;

  const chevron = (side: 'left' | 'right') => (
    <button
      type="button"
      onClick={() => handleScrollTabs(side)}
      title={side === 'left' ? 'Scroll categories left' : 'Scroll categories right'}
      style={{
        width: '24px',
        height: '28px',
        borderRadius: '4px',
        border: 'none',
        backgroundColor: 'transparent',
        color: F.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {side === 'left' ? (
        <ChevronLeft20Regular style={{ width: 14, height: 14 }} />
      ) : (
        <ChevronRight20Regular style={{ width: 14, height: 14 }} />
      )}
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        padding: '0 12px',
        boxSizing: 'border-box',
        backgroundColor: F.bgCard,
        borderBottom: `1px solid ${F.border}`,
        flexShrink: 0,
      }}
    >
      {canScrollLeft && chevron('left')}

      <div
        ref={tabScrollRef}
        onScroll={checkScrollButtons}
        className="no-scrollbar"
        role="tablist"
        aria-label="Product categories"
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
              role="tab"
              aria-selected={isActive}
              data-active={isActive ? 'true' : 'false'}
              onClick={() => setActiveCategory(cat)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 12px',
                borderRadius: '4px',
                background: 'transparent',
                border: 'none',
                color: isActive ? F.textPrimary : F.textSecondary,
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                fontFamily: F.font,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.061)' : 'rgba(0,0,0,0.037)';
                if (!isActive) e.currentTarget.style.color = F.textPrimary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                if (!isActive) e.currentTarget.style.color = F.textSecondary;
              }}
            >
              <CategoryIcon cat={cat} size={16} />
              <span>{cat}</span>
              <span
                style={{
                  fontSize: '11px',
                  lineHeight: '16px',
                  padding: '0 6px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: F.textSecondary,
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: '-4px',
                    width: '16px',
                    height: '3px',
                    marginLeft: '-8px',
                    borderRadius: '2px',
                    backgroundColor: F.accentRed,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {canScrollRight && chevron('right')}
    </div>
  );
}
