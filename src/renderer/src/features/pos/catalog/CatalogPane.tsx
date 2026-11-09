import { PosCounterState } from '@/features/pos/usePosCounter';
import { TerminalModeBar } from '@/features/pos/catalog/TerminalModeBar';
import { CatalogHeader } from '@/features/pos/catalog/CatalogHeader';
import { ScannerBar } from '@/features/pos/catalog/ScannerBar';
import { MealBuilderCard } from '@/features/pos/catalog/MealBuilderCard';
import { ProductCatalog } from '@/features/pos/catalog/ProductCatalog';

export function CatalogPane({ pos }: { pos: PosCounterState }) {
  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── POS Terminal Mode Switcher Bar (Tabs) ── */}
        <TerminalModeBar pos={pos} />

        {/* Desktop Header Bar with Fluent Pivot Tabs */}
        <CatalogHeader pos={pos} />

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── High-Speed Barcode / SKU Scanner Bar ── */}
          <ScannerBar pos={pos} />

          {/* ── Fluent Hero Highlight Card (Meal Builder - Fast Food Only) ── */}
          <MealBuilderCard pos={pos} />

          {/* ── Product Catalog Section (Grid View vs Supermarket Table View) ── */}
          <ProductCatalog pos={pos} />
        </div>
      </div>
    </>
  );
}
