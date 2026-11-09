import { PosCounterState } from '@/features/pos/usePosCounter';
import { OrderPaneHeader } from '@/features/pos/order/OrderPaneHeader';
import { OrderDetails } from '@/features/pos/order/OrderDetails';
import { OrderLineList } from '@/features/pos/order/OrderLineList';
import { OrderFooter } from '@/features/pos/order/OrderFooter';

export function OrderPane({ pos }: { pos: PosCounterState }) {
  const {
    F,
  } = pos;

  return (
    <>
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
        <OrderPaneHeader pos={pos} />

        {/* ── Collapsible Order Header & Customer Selection ── */}
        <OrderDetails pos={pos} />

        {/* Scrollable Cart Items List */}
        <OrderLineList pos={pos} />

        {/* Docked Footer (Bill Discount, Summary & Quick Cash Tender) */}
        <OrderFooter pos={pos} />
      </div>
    </>
  );
}
