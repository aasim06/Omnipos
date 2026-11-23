import React from 'react';
import type { Category } from '@shared/types';
import { CategoryGlyph, resolveCategoryIconKey } from '@/features/pos/categoryIcons';

/* ─── Category tile colours ─────────────────────────────────────────
 * Shared by the POS tile board and the admin colour picker.
 * bg/ink: soft fill + text (item photo boxes); shine: the solid glossy fill of the category tile.
 */
export type TileTint = { bg: string; ink: string; shine: string; border?: string };

export const CATEGORY_COLORS: { key: string; label: string; light: TileTint; dark: TileTint }[] = [
  { key: 'blue', label: 'Blue', light: { bg: '#DBEAFE', ink: '#1E3A8A', shine: '#3B82F6', border: '#93C5FD' }, dark: { bg: '#1E3A8A', ink: '#FFFFFF', shine: '#2563EB', border: '#3B82F6' } },
  { key: 'green', label: 'Green', light: { bg: '#D1FAE5', ink: '#064E3B', shine: '#10B981', border: '#6EE7B7' }, dark: { bg: '#064E3B', ink: '#FFFFFF', shine: '#059669', border: '#10B981' } },
  { key: 'amber', label: 'Amber', light: { bg: '#FEF3C7', ink: '#78350F', shine: '#F59E0B', border: '#FCD34D' }, dark: { bg: '#78350F', ink: '#FFFFFF', shine: '#D97706', border: '#F59E0B' } },
  { key: 'purple', label: 'Purple', light: { bg: '#EDE9FE', ink: '#4C1D95', shine: '#8B5CF6', border: '#C4B5FD' }, dark: { bg: '#4C1D95', ink: '#FFFFFF', shine: '#7C3AED', border: '#8B5CF6' } },
  { key: 'rose', label: 'Rose', light: { bg: '#FFE4E6', ink: '#881337', shine: '#F43F5E', border: '#FDA4AF' }, dark: { bg: '#881337', ink: '#FFFFFF', shine: '#E11D48', border: '#F43F5E' } },
  { key: 'teal', label: 'Teal', light: { bg: '#CCFBF1', ink: '#134E4A', shine: '#14B8A6', border: '#5EEAD4' }, dark: { bg: '#134E4A', ink: '#FFFFFF', shine: '#0D9488', border: '#14B8A6' } },
  { key: 'orange', label: 'Orange', light: { bg: '#FFEDD5', ink: '#7C2D12', shine: '#F97316', border: '#FDBA74' }, dark: { bg: '#7C2D12', ink: '#FFFFFF', shine: '#EA580C', border: '#F97316' } },
  { key: 'cyan', label: 'Cyan', light: { bg: '#CFFAFE', ink: '#164E63', shine: '#06B6D4', border: '#67E8F9' }, dark: { bg: '#164E63', ink: '#FFFFFF', shine: '#0891B2', border: '#06B6D4' } },
  { key: 'pink', label: 'Pink', light: { bg: '#FCE7F3', ink: '#701A75', shine: '#EC4899', border: '#F472B6' }, dark: { bg: '#701A75', ink: '#FFFFFF', shine: '#C026D3', border: '#EC4899' } },
  { key: 'indigo', label: 'Indigo', light: { bg: '#E0E7FF', ink: '#312E81', shine: '#6366F1', border: '#A5B4FC' }, dark: { bg: '#312E81', ink: '#FFFFFF', shine: '#4F46E5', border: '#6366F1' } },
  { key: 'lime', label: 'Lime', light: { bg: '#ECFCCB', ink: '#365314', shine: '#84CC16', border: '#BEF264' }, dark: { bg: '#365314', ink: '#FFFFFF', shine: '#65A30D', border: '#84CC16' } },
  { key: 'red', label: 'Red', light: { bg: '#FEE2E2', ink: '#7F1D1D', shine: '#EF4444', border: '#FCA5A5' }, dark: { bg: '#7F1D1D', ink: '#FFFFFF', shine: '#DC2626', border: '#EF4444' } },
  { key: 'yellow', label: 'Yellow', light: { bg: '#FEF9C3', ink: '#713F12', shine: '#EAB308', border: '#FDE047' }, dark: { bg: '#713F12', ink: '#FFFFFF', shine: '#CA8A04', border: '#EAB308' } },
  { key: 'mint', label: 'Mint', light: { bg: '#D1FAE5', ink: '#064E3B', shine: '#10B981', border: '#6EE7B7' }, dark: { bg: '#044E3B', ink: '#FFFFFF', shine: '#059669', border: '#10B981' } },
  { key: 'slate', label: 'Slate', light: { bg: '#F1F5F9', ink: '#1E293B', shine: '#64748B', border: '#CBD5E1' }, dark: { bg: '#1E293B', ink: '#FFFFFF', shine: '#475569', border: '#64748B' } },
  { key: 'peach', label: 'Peach', light: { bg: '#FFEDD5', ink: '#7C2D12', shine: '#FB923C', border: '#FDBA74' }, dark: { bg: '#6B2D1B', ink: '#FFFFFF', shine: '#C2410C', border: '#FB923C' } },
  { key: 'lavender', label: 'Lavender', light: { bg: '#EDE9FE', ink: '#4C1D95', shine: '#8B5CF6', border: '#C4B5FD' }, dark: { bg: '#4C1D95', ink: '#FFFFFF', shine: '#7C3AED', border: '#8B5CF6' } },
  { key: 'coral', label: 'Coral', light: { bg: '#FFE4E6', ink: '#881337', shine: '#F43F5E', border: '#FDA4AF' }, dark: { bg: '#881337', ink: '#FFFFFF', shine: '#E11D48', border: '#F43F5E' } },
];

/** Colours used automatically (by board position) when a category has none set. */
const AUTO_ORDER = [
  'blue',
  'green',
  'amber',
  'purple',
  'rose',
  'teal',
  'orange',
  'cyan',
  'pink',
  'indigo',
  'lime',
  'red',
  'yellow',
  'mint',
  'slate',
  'peach',
];

function hashIndex(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function tintByKey(key: string, isDark: boolean): TileTint | null {
  const c = CATEGORY_COLORS.find((x) => x.key === key);
  return c ? (isDark ? c.dark : c.light) : null;
}

/** Colour for a category: its saved colour, otherwise automatic from its position (or name). */
export function categoryTint(colorKey: string | null | undefined, fallbackIndex: number, isDark: boolean): TileTint {
  const saved = colorKey ? tintByKey(colorKey, isDark) : null;
  if (saved) return saved;
  const auto = AUTO_ORDER[((fallbackIndex % AUTO_ORDER.length) + AUTO_ORDER.length) % AUTO_ORDER.length];
  return tintByKey(auto, isDark)!;
}

export function autoTintIndex(name: string): number {
  return hashIndex(name);
}

/* ─── Category icons ──────────────────────────────────────────────── */
export { CATEGORY_ICONS } from '@/features/pos/categoryIcons';

/**
 * Icon for a category: its saved icon, otherwise one picked from the name for any business type
 * (pharmacy, electronics, hardware, apparel, food…). `module` sets the fallback when the name
 * gives no hint: food icon for fast food, shopping bag for everything else.
 */
export function CategoryTileIcon({ name, iconKey, size, module }: { name: string; iconKey?: string | null; size: number; module?: string | null }) {
  return <CategoryGlyph iconKey={resolveCategoryIconKey(name, iconKey, module)} size={size} />;
}

/** Board order: saved displayOrder first (lower first), then the incoming order. */
export function sortCategoryNames(names: string[], meta: Map<string, Category>): string[] {
  return names
    .map((n, i) => ({ n, i, o: meta.get(n)?.displayOrder }))
    .sort((a, b) => {
      const ao = a.o ?? Number.MAX_SAFE_INTEGER;
      const bo = b.o ?? Number.MAX_SAFE_INTEGER;
      // displayOrder 0 is the database default, so treat it as "not set".
      const aa = ao === 0 ? Number.MAX_SAFE_INTEGER : ao;
      const bb = bo === 0 ? Number.MAX_SAFE_INTEGER : bo;
      return aa - bb || a.i - b.i;
    })
    .map((x) => x.n);
}
