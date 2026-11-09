/* ─── Fluent UI 2 Desktop Design Tokens (Dynamic Light / Dark) ───── */
export function getTokens(isDark: boolean) {
  return {
    // Windows 11 (WinUI 3) values — kept in step with theme/AppProviders.tsx.
    // TODO(P3): replace with Fluent `tokens.*` when the POS view is split up.
    bgCanvas: isDark ? '#202020' : '#F3F3F3',      // SolidBackgroundFillColorBase
    bgCard: isDark ? '#2B2B2B' : '#FFFFFF',        // Card / layer surface
    bgSubtle: isDark ? '#323232' : '#EEEEEE',      // Segment tracks and soft boxes
    bgHover: isDark ? '#3A3A3A' : '#E9E9E9',       // Subtle hover fill
    border: isDark ? '#3A3A3A' : '#E0E0E0',        // ControlStroke
    borderSubtle: isDark ? '#333333' : '#EBEBEB',  // CardStroke / dividers
    textPrimary: isDark ? '#FFFFFF' : '#1A1A1A',   // TextFillColorPrimary
    textSecondary: isDark ? '#CFCFCF' : '#5D5D5D', // TextFillColorSecondary
    textMuted: isDark ? '#9A9A9A' : '#8A8A8A',     // TextFillColorTertiary
    accentRed: '#E51937',                          // Accent (primary actions only)
    accentRedHover: isDark ? '#EC3953' : '#C6172E',
    accentRedSubtle: isDark ? 'rgba(229, 25, 55, 0.18)' : 'rgba(229, 25, 55, 0.08)',
    accentGreen: isDark ? '#6CCB5F' : '#0F7B0F',   // SystemFillColorSuccess
    radiusSm: '4px',                               // ControlCornerRadius
    radiusMd: '8px',                               // OverlayCornerRadius (cards)
    radiusLg: '8px',
    shadowCard: isDark ? '0 1px 2px rgba(0, 0, 0, 0.26)' : '0 1px 2px rgba(0, 0, 0, 0.04)',
    shadowElevated: isDark ? '0 8px 16px rgba(0, 0, 0, 0.26)' : '0 8px 16px rgba(0, 0, 0, 0.14)',
    font: "'Segoe UI Variable Text', 'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif",
  };
}

export type PosTokens = ReturnType<typeof getTokens>;
