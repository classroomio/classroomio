import React from 'react';
export function Progress({ value = 0, max = 100, variant = 'default', style }) {
  const pct = Math.max(0, Math.min(100, (100 * value) / (max || 1)));
  const m = variant === 'muted';
  return <div role="progressbar" aria-valuenow={value} aria-valuemax={max} style={{ position: 'relative', height: 8, width: '100%', overflow: 'hidden', borderRadius: 'var(--ui-radius-md)', background: m ? 'var(--ui-muted)' : 'var(--ui-primary-soft)', ...style }}>
    <div style={{ height: '100%', width: '100%', background: m ? 'color-mix(in oklab, var(--ui-muted-foreground) 40%, transparent)' : 'var(--ui-primary)', transform: `translateX(-${100 - pct}%)`, transition: 'transform 300ms' }}/>
  </div>;
}