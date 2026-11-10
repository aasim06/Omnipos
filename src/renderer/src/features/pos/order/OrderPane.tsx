import React from 'react';
import { PosCounterState } from '@/features/pos/usePosCounter';
import { OrderPaneHeader } from '@/features/pos/order/OrderPaneHeader';
import { OrderDetails } from '@/features/pos/order/OrderDetails';
import { OrderLineList } from '@/features/pos/order/OrderLineList';
import { OrderFooter } from '@/features/pos/order/OrderFooter';

/* ── Resizable order pane ─────────────────────────────────────────────
 * Default width follows the window (34%, between 420 and 560px); dragging the
 * splitter on the left edge overrides it and the choice is remembered.
 * Double-click the splitter to go back to the automatic width.
 */
const WIDTH_KEY = 'omnipos_pos_order_width';
const MIN_WIDTH = 360;

const autoWidth = () => Math.round(Math.min(560, Math.max(420, window.innerWidth * 0.34)));
const maxWidth = () => Math.max(MIN_WIDTH, Math.min(760, Math.round(window.innerWidth * 0.55)));
const clampWidth = (w: number) => Math.min(maxWidth(), Math.max(MIN_WIDTH, Math.round(w)));

function readSavedWidth(): number | null {
  try {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : null;
  } catch {
    return null;
  }
}

function saveWidth(width: number | null) {
  try {
    if (width === null) localStorage.removeItem(WIDTH_KEY);
    else localStorage.setItem(WIDTH_KEY, String(width));
  } catch {
    /* storage unavailable: width just isn't remembered */
  }
}

function useOrderPaneWidth() {
  const [savedWidth, setSavedWidth] = React.useState<number | null>(readSavedWidth);
  const [, forceRender] = React.useReducer((n: number) => n + 1, 0);

  // Re-evaluate the automatic width (and the clamp) when the window is resized.
  React.useEffect(() => {
    window.addEventListener('resize', forceRender);
    return () => window.removeEventListener('resize', forceRender);
  }, []);

  const width = clampWidth(savedWidth ?? autoWidth());
  const setWidth = (w: number | null) => {
    const next = w === null ? null : clampWidth(w);
    setSavedWidth(next);
    saveWidth(next);
  };
  return { width, setWidth };
}

export function OrderPane({ pos, sheet }: { pos: PosCounterState; sheet?: boolean }) {
  const { F, isDark } = pos;
  const { width, setWidth } = useOrderPaneWidth();
  const [dragging, setDragging] = React.useState(false);
  const [hover, setHover] = React.useState(false);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;
    setDragging(true);
    const onMove = (ev: PointerEvent) => setWidth(startWidth + (startX - ev.clientX));
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') setWidth(width + 16);
    else if (e.key === 'ArrowRight') setWidth(width - 16);
    else return;
    e.preventDefault();
  };

  const showGrip = hover || dragging;

  return (
    <div
      style={{
        position: 'relative',
        width: sheet ? '100%' : `${width}px`,
        height: '100%',
        backgroundColor: F.bgCard,
        borderLeft: sheet ? 'none' : `1px solid ${F.border}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Splitter: drag to resize, double-click to reset, arrow keys when focused (not in the bottom sheet) */}
      {!sheet && (
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize order panel"
        aria-valuenow={width}
        tabIndex={0}
        title="Drag to resize · double-click to reset"
        onPointerDown={startDrag}
        onDoubleClick={() => setWidth(null)}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '-4px',
          width: '8px',
          cursor: 'col-resize',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outlineOffset: '-2px',
        }}
      >
        <div
          style={{
            width: '3px',
            height: '32px',
            borderRadius: '2px',
            backgroundColor: dragging ? F.accentRed : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
            opacity: showGrip ? 1 : 0,
            transition: 'opacity 0.167s cubic-bezier(0, 0, 0, 1)',
          }}
        />
      </div>
      )}

      {/* Docked Panel Header */}
      <OrderPaneHeader pos={pos} />

      {/* ── Collapsible Order Header & Customer Selection ── */}
      <OrderDetails pos={pos} />

      {/* Scrollable Cart Items List */}
      <OrderLineList pos={pos} />

      {/* Docked Footer (summary, payment, confirm) */}
      <OrderFooter pos={pos} />
    </div>
  );
}
