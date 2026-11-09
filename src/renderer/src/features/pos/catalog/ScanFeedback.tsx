import { PosCounterState } from '@/features/pos/usePosCounter';
import { CheckmarkCircle20Filled, DismissCircle20Filled } from '@fluentui/react-icons';

/**
 * Scanner / search result as a floating Windows 11 InfoBar (success or error).
 * It overlays the catalog instead of taking layout space; the hook clears it after a few seconds.
 */
export function ScanFeedback({ pos }: { pos: PosCounterState }) {
  const { isDark, F, lastScannedFeedback } = pos;
  if (!lastScannedFeedback) return null;

  const ok = lastScannedFeedback.isSuccess;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '96px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        maxWidth: 'min(560px, calc(100% - 32px))',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        fontFamily: F.font,
        color: F.textPrimary,
        backgroundColor: ok ? (isDark ? '#393D1B' : '#DFF6DD') : (isDark ? '#442726' : '#FDE7E9'),
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isDark ? '0 8px 16px rgba(0,0,0,0.26)' : '0 8px 16px rgba(0,0,0,0.14)',
        pointerEvents: 'none',
      }}
    >
      {ok ? (
        <CheckmarkCircle20Filled style={{ width: 16, height: 16, flexShrink: 0, color: isDark ? '#6CCB5F' : '#0F7B0F' }} />
      ) : (
        <DismissCircle20Filled style={{ width: 16, height: 16, flexShrink: 0, color: isDark ? '#FF99A4' : '#C42B1C' }} />
      )}
      <span>{lastScannedFeedback.text}</span>
    </div>
  );
}
