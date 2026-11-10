import React from 'react';
import { Button, Dialog, DialogSurface } from '@fluentui/react-components';
import { ArrowDown16Regular, ArrowUp16Regular, Dismiss20Regular } from '@fluentui/react-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Category, ModuleKey } from '@shared/types';
import { posApi } from '@/lib/api';
import { useAppTheme } from '@/theme/AppProviders';
import { getTokens } from '@/features/pos/posTokens';
import { CATEGORY_COLORS, CATEGORY_ICONS, CategoryTileIcon, categoryTint, sortCategoryNames } from '@/features/pos/categoryStyle';

type Row = { cat: Category; color: string; icon: string };

/**
 * POS board settings for one module: tile colour, icon and order of every category.
 * Empty colour / icon means "automatic" (colour by position, icon from the name).
 */
export function PosBoardDialog({
  open,
  module,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  module: ModuleKey;
  categories: Category[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { mode } = useAppTheme();
  const isDark = mode === 'dark';
  const F = React.useMemo(() => getTokens(isDark), [isDark]);
  const queryClient = useQueryClient();

  const [rows, setRows] = React.useState<Row[]>([]);
  const [selected, setSelected] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  // Fresh copy each time the dialog opens, in the current board order.
  React.useEffect(() => {
    if (!open) return;
    const mine = categories.filter((c) => c.module === module);
    const byName = new Map(mine.map((c) => [c.name, c]));
    const ordered = sortCategoryNames(
      mine.map((c) => c.name),
      byName,
    ).map((n) => byName.get(n)!);
    setRows(ordered.map((cat) => ({ cat, color: cat.color || '', icon: cat.icon || '' })));
    setSelected(0);
  }, [open, categories, module]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    setRows((r) => {
      const next = [...r];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSelected(j);
  };

  const patch = (i: number, p: Partial<Row>) => setRows((r) => r.map((row, k) => (k === i ? { ...row, ...p } : row)));

  const save = async () => {
    setSaving(true);
    try {
      for (let i = 0; i < rows.length; i++) {
        const { cat, color, icon } = rows[i];
        const order = i + 1;
        if ((cat.color || '') === color && (cat.icon || '') === icon && cat.displayOrder === order) continue;
        await posApi.saveCategory({ ...cat, color, icon, displayOrder: order });
      }
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const current = rows[selected];

  const swatch = (key: string, label: string, bg: string, active: boolean, onClick: () => void) => (
    <button
      key={key || 'auto'}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        border: active ? `2px solid ${F.textPrimary}` : `1px solid ${F.border}`,
        background: bg,
        cursor: 'pointer',
        padding: 0,
        fontSize: '10px',
        fontWeight: 700,
        color: F.textSecondary,
      }}
    >
      {key ? '' : 'Auto'}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface style={{ maxWidth: '860px', width: '92vw', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${F.border}` }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: F.textPrimary }}>POS board</div>
            <div style={{ fontSize: '12px', color: F.textMuted }}>
              Colour, icon and order of the {module === 'fastfood' ? 'Fast Food' : 'Mart'} category tiles on the POS screen.
            </div>
          </div>
          <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={onClose} aria-label="Close" />
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: F.textMuted }}>No categories yet.</div>
        ) : (
          <div style={{ display: 'flex', minHeight: '420px', maxHeight: '64vh' }}>
            {/* Order list */}
            <div style={{ width: '300px', flexShrink: 0, overflowY: 'auto', borderRight: `1px solid ${F.border}`, padding: '8px' }}>
              {rows.map((row, i) => {
                const tint = categoryTint(row.color || null, i, isDark);
                const active = i === selected;
                return (
                  <div
                    key={row.cat.id}
                    onClick={() => setSelected(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 8px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: active ? F.bgHover : 'transparent',
                    }}
                  >
                    <span style={{ width: '20px', fontSize: '12px', color: F.textMuted, textAlign: 'right' }}>{i + 1}</span>
                    <span
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        backgroundColor: tint.shine,
                        color: tint.ink,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CategoryTileIcon name={row.cat.name} iconKey={row.icon || null} size={20} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: '13px', fontWeight: 600, color: F.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.cat.name}
                    </span>
                    <Button size="small" appearance="subtle" icon={<ArrowUp16Regular />} disabled={i === 0} aria-label="Move up" onClick={(e) => { e.stopPropagation(); move(i, -1); }} />
                    <Button size="small" appearance="subtle" icon={<ArrowDown16Regular />} disabled={i === rows.length - 1} aria-label="Move down" onClick={(e) => { e.stopPropagation(); move(i, 1); }} />
                  </div>
                );
              })}
            </div>

            {/* Editor for the selected category */}
            {current && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {(() => {
                  const tint = categoryTint(current.color || null, selected, isDark);
                  return (
                    <div
                      style={{
                        width: '170px',
                        height: '150px',
                        borderRadius: '16px',
                        backgroundColor: tint.shine,
                        color: tint.ink,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        boxShadow: F.shadowCard,
                        marginBottom: '18px',
                      }}
                    >
                      <span style={{ width: 66, height: 66, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' }}>
                        <CategoryTileIcon name={current.cat.name} iconKey={current.icon || null} size={38} />
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '15px', textAlign: 'center', padding: '0 8px' }}>{current.cat.name}</span>
                    </div>
                  );
                })()}

                <div style={{ fontSize: '13px', fontWeight: 600, color: F.textPrimary, marginBottom: '8px' }}>Colour</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                  {swatch('', 'Automatic', F.bgSubtle, current.color === '', () => patch(selected, { color: '' }))}
                  {CATEGORY_COLORS.map((c) =>
                    swatch(c.key, c.label, (isDark ? c.dark : c.light).shine, current.color === c.key, () => patch(selected, { color: c.key })),
                  )}
                </div>

                <div style={{ fontSize: '13px', fontWeight: 600, color: F.textPrimary, marginBottom: '8px' }}>Icon</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: '6px' }}>
                  {[{ key: '', label: 'Automatic (from the name)' }, ...CATEGORY_ICONS].map((ic) => {
                    const active = current.icon === ic.key;
                    return (
                      <button
                        key={ic.key || 'auto'}
                        type="button"
                        title={ic.label}
                        aria-label={ic.label}
                        aria-pressed={active}
                        onClick={() => patch(selected, { icon: ic.key })}
                        style={{
                          height: '44px',
                          borderRadius: '8px',
                          border: active ? `2px solid ${F.textPrimary}` : `1px solid ${F.border}`,
                          backgroundColor: active ? F.bgHover : F.bgCard,
                          color: F.textPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {ic.key ? <CategoryTileIcon name="" iconKey={ic.key} size={22} /> : 'Auto'}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 20px', borderTop: `1px solid ${F.border}` }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button appearance="primary" onClick={save} disabled={saving || rows.length === 0}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </DialogSurface>
    </Dialog>
  );
}
