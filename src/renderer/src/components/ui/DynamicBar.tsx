import React, { useRef, useLayoutEffect } from 'react';

export interface DynamicBarProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function DynamicBar({ width, height, className }: DynamicBarProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    if (width !== undefined) {
      ref.current.style.width = typeof width === 'number' ? `${width}%` : String(width);
    }
    if (height !== undefined) {
      ref.current.style.height = typeof height === 'number' ? `${height}%` : String(height);
    }
  }, [width, height]);

  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (!el) return;
        if (width !== undefined) {
          el.style.width = typeof width === 'number' ? `${width}%` : String(width);
        }
        if (height !== undefined) {
          el.style.height = typeof height === 'number' ? `${height}%` : String(height);
        }
      }}
      className={className}
    />
  );
}
