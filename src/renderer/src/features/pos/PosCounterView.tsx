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
import { DIALOG_SMOKE, useEscapeToClose } from '@/features/pos/posDialog';

/** Below this window width the order pane turns into a bottom sheet. */
const COMPACT_WIDTH = 768;

function useIsCompact(): boolean {
  const [compact, setCompact] = React.useState(() => window.innerWidth < COMPACT_WIDTH);
  React.useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < COMPACT_WIDTH);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return compact;
}

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

  // Handheld / small window: the order pane becomes a bottom sheet.
  const compact = useIsCompact();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  React.useEffect(() => {
    if (!compact) setSheetOpen(false);
  }, [compact]);
  useEscapeToClose(compact && sheetOpen, () => setSheetOpen(false));

  if (isLoadingProducts && products.length === 0) {
    return <PosCounterSkeleton module={module} />;
  }

  const itemCount = pos.cart.reduce((n, i) => n + i.quantity, 0);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: compact ? 'column' : 'row',
        width: '100%',
        height: '100%',
        backgroundColor: F.bgCanvas,
        fontFamily: F.font,
        overflow: 'hidden',
      }}
    >

      {/* ════════════════════════════════════════════════════════════════════
          LEFT CATALOG SECTION (Mica Surface & Fluent Pivot Tabs)
      ════════════════════════════════════════════════════════════════════ */}
      <CatalogPane pos={pos} />

      {/* ════════════════════════════════════════════════════════════════════
          DOCKED RIGHT-HAND "MY ORDER" SUMMARY PANEL (Subtle Card Elevation)
          On a small screen: an order bar at the bottom that opens a sheet.
      ════════════════════════════════════════════════════════════════════ */}
      {!compact ? (
        <OrderPane pos={pos} />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              height: '64px',
              padding: '0 16px',
              border: 'none',
              borderTop: `1px solid ${F.border}`,
              backgroundColor: F.bgCard,
              color: F.textPrimary,
              fontFamily: F.font,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '15px', fontWeight: 600 }}>Order</span>
            <span style={{ fontSize: '13px', color: F.textSecondary }}>
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </span>
            <span style={{ flex: 1 }} />
            <span
              style={{
                height: '44px',
                padding: '0 18px',
                borderRadius: '10px',
                backgroundColor: pos.cart.length ? F.accentRed : F.bgSubtle,
                color: pos.cart.length ? '#FFFFFF' : F.textMuted,
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '16px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Rs {pos.total.toLocaleString()} ›
            </span>
          </button>

          {sheetOpen && (
            <div
              onClick={() => setSheetOpen(false)}
              style={{ position: 'absolute', inset: 0, zIndex: 40, backgroundColor: DIALOG_SMOKE }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '88%',
                  borderRadius: '16px 16px 0 0',
                  overflow: 'hidden',
                  backgroundColor: F.bgCard,
                  boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <button
                  type="button"
                  aria-label="Close order"
                  onClick={() => setSheetOpen(false)}
                  style={{ height: '22px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <span style={{ width: '40px', height: '5px', borderRadius: '3px', backgroundColor: F.border }} />
                </button>
                <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                  <OrderPane pos={pos} sheet />
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
