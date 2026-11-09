import React from 'react';

/* ── Windows 11 ContentDialog conventions for the POS overlays ─────────── */

/** "Smoke" layer behind a dialog: plain dim, no blur. */
export const DIALOG_SMOKE = 'rgba(0, 0, 0, 0.4)';

/** Dialog elevation (WinUI ContentDialog shadow). */
export const DIALOG_SHADOW = '0 32px 64px rgba(0, 0, 0, 0.28), 0 2px 21px rgba(0, 0, 0, 0.22)';

/** Dialog / overlay corner radius. */
export const DIALOG_RADIUS = '8px';

// Open dialogs in the order they were opened; Escape closes only the top one.
const escapeStack: Array<{ id: number; close: () => void }> = [];
let nextId = 1;
let listening = false;

function onKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape' || escapeStack.length === 0) return;
  e.preventDefault();
  escapeStack[escapeStack.length - 1].close();
}

/**
 * Close a POS dialog with Escape, like every Windows dialog.
 * When several are open (e.g. a dialog over the expanded cart), only the top-most closes.
 */
export function useEscapeToClose(open: boolean, close: () => void) {
  const closeRef = React.useRef(close);
  closeRef.current = close;

  React.useEffect(() => {
    if (!open) return;
    const entry = { id: nextId++, close: () => closeRef.current() };
    escapeStack.push(entry);
    if (!listening) {
      window.addEventListener('keydown', onKeyDown);
      listening = true;
    }
    return () => {
      const i = escapeStack.findIndex((x) => x.id === entry.id);
      if (i >= 0) escapeStack.splice(i, 1);
      if (escapeStack.length === 0 && listening) {
        window.removeEventListener('keydown', onKeyDown);
        listening = false;
      }
    };
  }, [open]);
}
