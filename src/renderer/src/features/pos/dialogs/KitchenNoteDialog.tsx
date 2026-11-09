import { PosCounterState } from '@/features/pos/usePosCounter';
import { Dismiss20Regular } from '@fluentui/react-icons';
import { playBeep } from '@/lib/soundFx';
import { DIALOG_RADIUS, DIALOG_SHADOW, DIALOG_SMOKE, useEscapeToClose } from '@/features/pos/posDialog';

export function KitchenNoteDialog({ pos }: { pos: PosCounterState }) {
  const {
    module,
    F,
    setCart,
    editingNoteItem,
    setEditingNoteItem,
  } = pos;

  useEscapeToClose(module === 'fastfood' && !!editingNoteItem, () => setEditingNoteItem(null));

  return (
    <>
      {module === 'fastfood' && editingNoteItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: DIALOG_SMOKE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: F.bgCard,
              borderRadius: F.radiusMd,
              border: `1px solid ${F.border}`,
              boxShadow: DIALOG_SHADOW,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '15px', color: F.textPrimary }}>
                Kitchen Prep Note / Modifiers
              </div>
              <button
                onClick={() => setEditingNoteItem(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: F.textMuted }}
              >
                <Dismiss20Regular />
              </button>
            </div>

            <div style={{ fontSize: '12px', color: F.textSecondary }}>
              Quick Fast-Food Presets (Click to toggle):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['No Mayo', 'Extra Spicy', 'No Onion', 'Extra Cheese', 'Less Spicy', 'Crispy / Well Done', 'Pack Separately'].map(
                (preset) => {
                  const isPresent = editingNoteItem.currentNote.includes(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setEditingNoteItem((prev) => {
                          if (!prev) return null;
                          const existing = prev.currentNote ? prev.currentNote.split(', ').filter(Boolean) : [];
                          const next = existing.includes(preset)
                            ? existing.filter((p) => p !== preset)
                            : [...existing, preset];
                          return { ...prev, currentNote: next.join(', ') };
                        });
                        playBeep();
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        border: `1px solid ${isPresent ? F.accentRed : F.border}`,
                        backgroundColor: isPresent ? F.accentRedSubtle : F.bgSubtle,
                        color: isPresent ? F.accentRed : F.textPrimary,
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  );
                }
              )}
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: F.textSecondary, textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                Chef Instruction / Custom Request
              </label>
              <input
                value={editingNoteItem.currentNote}
                onChange={(e) => setEditingNoteItem({ ...editingNoteItem, currentNote: e.target.value })}
                placeholder="e.g. Extra sauce on the side, cut into 4 slices..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: F.radiusSm,
                  border: `1px solid ${F.border}`,
                  backgroundColor: F.bgSubtle,
                  color: F.textPrimary,
                  fontSize: '13px',
                  fontFamily: F.font,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setEditingNoteItem(null)}
                style={{ padding: '6px 14px', borderRadius: F.radiusSm, border: `1px solid ${F.border}`, backgroundColor: F.bgCard, cursor: 'pointer', color: F.textPrimary, fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCart((prev) =>
                    prev.map((item) =>
                      item.productId === editingNoteItem.productId && item.variantLabel === editingNoteItem.variantLabel
                        ? { ...item, notes: editingNoteItem.currentNote.trim() }
                        : item
                    )
                  );
                  setEditingNoteItem(null);
                  playBeep();
                }}
                style={{ padding: '6px 16px', borderRadius: F.radiusSm, border: 'none', backgroundColor: F.accentRed, color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
