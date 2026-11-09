import React from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { CommandBar } from '@/features/pos/catalog/CommandBar';
import { CategoryPivot } from '@/features/pos/catalog/CategoryPivot';
import { ScanFeedback } from '@/features/pos/catalog/ScanFeedback';
import { MealBuilderCard } from '@/features/pos/catalog/MealBuilderCard';
import { ProductCatalog } from '@/features/pos/catalog/ProductCatalog';

const FEATURED_KEY = 'omnipos_pos_show_featured';

function readShowFeatured(): boolean {
  try {
    return localStorage.getItem(FEATURED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function CatalogPane({ pos }: { pos: PosCounterState }) {
  // The fast-food "featured item" card is optional now (hidden by default) so products get the height.
  const [showFeatured, setShowFeatured] = React.useState<boolean>(readShowFeatured);
  const toggleFeatured = () =>
    setShowFeatured((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(FEATURED_KEY, String(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Scanner, search, mode and view switches in one row */}
      <CommandBar pos={pos} showFeatured={showFeatured} onToggleFeatured={toggleFeatured} />

      {/* Category pivot */}
      <CategoryPivot pos={pos} />

      {/* Scanner result (floating, takes no space) */}
      <ScanFeedback pos={pos} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* ── Featured item / meal builder (fast food, optional) ── */}
        {showFeatured && <MealBuilderCard pos={pos} />}

        {/* ── Product Catalog Section (Grid View vs Supermarket Table View) ── */}
        <ProductCatalog pos={pos} highlightSelected={showFeatured} />
      </div>
    </div>
  );
}
