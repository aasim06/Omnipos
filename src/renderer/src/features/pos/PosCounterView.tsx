import { PosCounterProps } from '@/features/pos/posTypes';
import React from 'react';
import { usePosCounter } from '@/features/pos/usePosCounter';
import { PosCounterSkeleton } from '@/components/skeletons/PageSkeletons';
import { CatalogPane } from '@/features/pos/catalog/CatalogPane';
import { OrderPane } from '@/features/pos/order/OrderPane';
import { VariantPickerDialog } from '@/features/pos/dialogs/VariantPickerDialog';
import { KitchenNoteDialog } from '@/features/pos/dialogs/KitchenNoteDialog';
import { ParkedOrdersDialog } from '@/features/pos/dialogs/ParkedOrdersDialog';
import { ReceiptPreviewDialog } from '@/features/pos/dialogs/ReceiptPreviewDialog';
import { ExpandedCartDrawer } from '@/features/pos/dialogs/ExpandedCartDrawer';
import { A4InvoiceDialog } from '@/features/pos/dialogs/A4InvoiceDialog';
import { WeightScaleDialog } from '@/features/pos/dialogs/WeightScaleDialog';
import { BulkQtyDialog } from '@/features/pos/dialogs/BulkQtyDialog';

/**
 * POS counter screen (Fast Food / Mart).
 * State and logic live in usePosCounter; each area of the screen is its own component.
 */
export function PosCounterView(props: PosCounterProps): React.JSX.Element {
  const pos = usePosCounter(props);
  const {
    module,
    F,
    products,
    isLoadingProducts,
  } = pos;

  if (isLoadingProducts && products.length === 0) {
    return <PosCounterSkeleton module={module} />;
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: F.bgCanvas, fontFamily: F.font, overflow: 'hidden' }}>

      {/* ════════════════════════════════════════════════════════════════════
          LEFT CATALOG SECTION (Mica Surface & Fluent Pivot Tabs)
      ════════════════════════════════════════════════════════════════════ */}
      <CatalogPane pos={pos} />

      {/* ════════════════════════════════════════════════════════════════════
          DOCKED RIGHT-HAND "MY ORDER" SUMMARY PANEL (Subtle Card Elevation)
      ════════════════════════════════════════════════════════════════════ */}
      <OrderPane pos={pos} />

      {/* ── Modal: Quick Size / Variant Selector (Clothing, Shoes, Portions) ── */}
      <VariantPickerDialog pos={pos} />

      {/* ── Modal: Line Item Kitchen Prep Notes / Modifiers (Fast Food Only) ── */}
      <KitchenNoteDialog pos={pos} />

      {/* ── Modal: Held / Parked Orders Drawer ── */}
      <ParkedOrdersDialog pos={pos} />

      {/* ── Modal: Thermal Receipt Preview Modal ── */}
      <ReceiptPreviewDialog pos={pos} />

      {/* ── Drawer: Expanded Cart List with Blurry Backdrop ── */}
      <ExpandedCartDrawer pos={pos} />

      {/* ── Modal: Commercial A4 Invoice Template ── */}
      <A4InvoiceDialog pos={pos} />

      {/* ── Modal: Loose / Weight Scale Calculator ── */}
      <WeightScaleDialog pos={pos} />

      {/* ── Modal: Wholesale Quantity Numpad / Multiplier Popover ── */}
      <BulkQtyDialog pos={pos} />
    </div>
  );
}
