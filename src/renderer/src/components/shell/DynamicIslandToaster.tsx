import React, { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, forwardRef } from 'react';
import { Checkmark20Filled, Dismiss20Filled, ErrorCircle20Filled, Info20Filled, Warning20Filled, Dismiss16Regular } from '@fluentui/react-icons';

/**
 * "Dynamic Island" notifications.
 *
 * A black capsule sits at the top centre. A message starts as a small pill and springs open into
 * a card with the icon, title and text — like the iPhone's Dynamic Island — then fades away as a
 * whole (it does not shrink back into a pill, which looked like a second, smaller toast). One message shows at a time; others wait their turn (a "+N" chip shows
 * how many). Hover pauses the timer, click / Esc dismisses, and a ring around the icon shows the
 * time left. Honours "reduce motion". The capsule stays black in light and dark themes.
 */

export type IslandIntent = 'success' | 'error' | 'warning' | 'info';

export interface IslandMessage {
  id: number;
  title: string;
  body?: string;
  intent: IslandIntent;
  timeout: number;
}

export interface DynamicIslandHandle {
  show: (msg: Omit<IslandMessage, 'id'>) => void;
}

const ACCENT: Record<IslandIntent, string> = {
  success: '#30D158',
  error: '#FF453A',
  warning: '#FFD60A',
  info: '#0A84FF',
};

const ICON: Record<IslandIntent, React.ComponentType<{ style?: React.CSSProperties }>> = {
  success: Checkmark20Filled,
  error: ErrorCircle20Filled,
  warning: Warning20Filled,
  info: Info20Filled,
};

// pill → open → gone (fades out at full size)
type Phase = 'pill' | 'open' | 'gone';

const PILL_W = 128;
const PILL_H = 36;
const OPEN_W = 440;
const SPRING = 'cubic-bezier(0.32, 1.32, 0.45, 1)'; // springy overshoot
const SETTLE = 'cubic-bezier(0.4, 0, 0.2, 1)';

const CSS = `
@keyframes omni-island-drop { from { transform: translate(-50%, -14px) scale(0.6); opacity: 0; } to { transform: translate(-50%, 0) scale(1); opacity: 1; } }
@keyframes omni-island-lift { from { transform: translate(-50%, 0) scale(1); opacity: 1; filter: blur(0); } to { transform: translate(-50%, -10px) scale(0.94); opacity: 0; filter: blur(4px); } }
@keyframes omni-island-glow { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes omni-island-pop { 0% { transform: scale(.4); opacity: 0; } 70% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
.omni-island { position: fixed; left: 50%; z-index: 2147483000; -webkit-app-region: no-drag; app-region: no-drag;
  background: #050506; color: #fff; overflow: hidden; cursor: default; box-sizing: border-box;
  font-family: 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif;
  box-shadow: 0 18px 40px -12px rgba(0,0,0,.55), 0 4px 14px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.07);
  transform: translate(-50%, 0);
  transition: width .62s ${SPRING}, height .62s ${SPRING}, border-radius .62s ${SPRING}; }
.omni-island.enter { animation: omni-island-drop .38s ${SPRING} both; }
.omni-island.leave { animation: omni-island-lift .3s ${SETTLE} both; }
.omni-island-content { display: flex; align-items: center; gap: 12px; padding: 10px 12px 10px 10px; transition: opacity .28s ease, filter .28s ease, transform .4s ${SPRING}; }
.omni-island-content.hidden { opacity: 0; filter: blur(6px); transform: scale(.94); }
.omni-island-dot { position: absolute; top: 50%; right: 16px; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; transition: opacity .2s ease; animation: omni-island-glow 1.4s ease-in-out infinite; }
.omni-island-icon { position: relative; flex: 0 0 auto; width: 38px; height: 38px; display: grid; place-items: center; animation: omni-island-pop .5s ${SPRING} .12s both; }
.omni-island-title { font-size: 14px; font-weight: 600; line-height: 18px; letter-spacing: -.01em; }
.omni-island-body { font-size: 12.5px; line-height: 17px; color: rgba(255,255,255,.66); margin-top: 1px; overflow-wrap: anywhere; }
.omni-island-close { flex: 0 0 auto; align-self: flex-start; width: 24px; height: 24px; border-radius: 12px; border: 0; background: rgba(255,255,255,.08);
  color: rgba(255,255,255,.7); display: grid; place-items: center; cursor: pointer; transition: background .15s ease, color .15s ease; }
.omni-island-close:hover { background: rgba(255,255,255,.18); color: #fff; }
.omni-island-close:focus-visible { outline: 2px solid rgba(255,255,255,.6); outline-offset: 1px; }
.omni-island-more { flex: 0 0 auto; align-self: flex-start; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 10px; background: rgba(255,255,255,.12); color: rgba(255,255,255,.8); }
@media (prefers-reduced-motion: reduce) {
  .omni-island, .omni-island-content, .omni-island-icon { transition: opacity .2s ease !important; animation: none !important; }
  .omni-island.leave { opacity: 0; }
}
`;

/** Remaining-time ring around the icon. */
function Ring({ color, duration, paused, runKey }: { color: string; duration: number; paused: boolean; runKey: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden>
      <circle cx="19" cy="19" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="2" />
      <circle
        key={runKey}
        cx="19"
        cy="19"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={c}
        style={{
          strokeDashoffset: 0,
          animation: `omni-island-ring ${duration}ms linear forwards`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      />
      <style>{`@keyframes omni-island-ring { to { stroke-dashoffset: ${c}; } }`}</style>
    </svg>
  );
}

export const DynamicIslandToaster = forwardRef<DynamicIslandHandle, { top?: number }>(function DynamicIslandToaster({ top = 8 }, ref) {
  const [queue, setQueue] = useState<IslandMessage[]>([]);
  const [current, setCurrent] = useState<IslandMessage | null>(null);
  const [phase, setPhase] = useState<Phase>('gone');
  const [paused, setPaused] = useState(false);
  const [contentH, setContentH] = useState(PILL_H);
  const [runKey, setRunKey] = useState(0);
  const nextId = useRef(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const remaining = useRef(0);
  const startedAt = useRef(0);
  const hideTimer = useRef<number | null>(null);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  useImperativeHandle(ref, () => ({
    show: (msg) => setQueue((q) => [...q, { ...msg, id: nextId.current++ }]),
  }));

  // Pick the next message when idle
  useEffect(() => {
    if (current || queue.length === 0) return;
    const [next, ...rest] = queue;
    setQueue(rest);
    setCurrent(next);
    setPaused(false);
    setPhase('pill');
    setRunKey((k) => k + 1);
    later(() => setPhase('open'), 260); // the pill drops in, then springs open
  }, [queue, current]);

  // Measure the open height so the capsule can animate to it
  useLayoutEffect(() => {
    if (phase === 'open' && contentRef.current) setContentH(Math.max(PILL_H, contentRef.current.scrollHeight));
  }, [phase, current]);

  const fold = useCallback(() => {
    clearTimers();
    setPhase('gone'); // fade up and away at full size
    later(() => setCurrent(null), 320);
  }, []);

  // Auto-dismiss timer (pausable); shorter when others are waiting
  useEffect(() => {
    if (phase !== 'open' || !current) return;
    const duration = queue.length > 0 ? Math.min(current.timeout, 2600) : current.timeout;
    remaining.current = duration;
    startedAt.current = Date.now();
    hideTimer.current = window.setTimeout(fold, duration);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current?.id]);

  const pause = () => {
    if (phase !== 'open' || paused) return;
    setPaused(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    remaining.current = Math.max(600, remaining.current - (Date.now() - startedAt.current));
  };
  const resume = () => {
    if (phase !== 'open' || !paused) return;
    setPaused(false);
    startedAt.current = Date.now();
    hideTimer.current = window.setTimeout(fold, remaining.current);
  };

  // Esc dismisses
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && phase === 'open' && fold();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, phase, fold]);

  useEffect(() => () => clearTimers(), []);

  if (!current) return <style>{CSS}</style>;

  const accent = ACCENT[current.intent];
  const Icon = ICON[current.intent];
  const isOpen = phase === 'open';
  // Keep the open size while leaving, so it never shrinks back into a small pill
  const expanded = phase === 'open' || phase === 'gone';
  const width = expanded ? `min(${OPEN_W}px, calc(100vw - 32px))` : `${PILL_W}px`;
  const height = expanded ? contentH : PILL_H;
  const duration = queue.length > 0 ? Math.min(current.timeout, 2600) : current.timeout;
  const urgent = current.intent === 'error' || current.intent === 'warning';

  return (
    <>
      <style>{CSS}</style>
      <div
        className={`omni-island ${phase === 'pill' ? 'enter' : ''} ${phase === 'gone' ? 'leave' : ''}`}
        style={{ top, width, height, borderRadius: expanded ? 26 : PILL_H / 2 }}
        role={urgent ? 'alert' : 'status'}
        aria-live={urgent ? 'assertive' : 'polite'}
        aria-atomic="true"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('.omni-island-close')) return;
          if (isOpen) fold();
        }}
      >
        {/* Collapsed pill: a glowing accent dot, like the island's activity light */}
        <span className="omni-island-dot" style={{ background: accent, boxShadow: `0 0 10px ${accent}`, ...(expanded ? { opacity: 0, animation: 'none' } : {}) }} />

        {/* Content is laid out at the open width so its height can be measured before the capsule reaches it */}
        <div ref={contentRef} className={`omni-island-content ${expanded ? '' : 'hidden'}`} style={{ width: `min(${OPEN_W}px, calc(100vw - 32px))`, boxSizing: 'border-box' }}>
          <div className="omni-island-icon" key={current.id}>
            <Ring color={accent} duration={duration} paused={paused} runKey={runKey} />
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: `${accent}26`,
                color: accent,
                boxShadow: `0 0 16px ${accent}40`,
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="omni-island-title">{current.title}</div>
            {current.body && <div className="omni-island-body">{current.body}</div>}
          </div>
          {queue.length > 0 && <span className="omni-island-more" title={`${queue.length} more`}>+{queue.length}</span>}
          <button type="button" className="omni-island-close" aria-label="Dismiss notification" onClick={fold}>
            {current.intent === 'error' ? <Dismiss20Filled style={{ width: 14, height: 14 }} /> : <Dismiss16Regular style={{ width: 14, height: 14 }} />}
          </button>
        </div>
      </div>
    </>
  );
});
