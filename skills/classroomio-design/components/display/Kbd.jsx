import React from 'react';
export function Kbd({ children, style }) {
  return <kbd style={{ display: 'inline-flex', height: 20, minWidth: 20, width: 'fit-content', boxSizing: 'border-box', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 'var(--ui-radius-sm)', padding: '0 4px', background: 'var(--ui-muted)', color: 'var(--ui-muted-foreground)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, pointerEvents: 'none', userSelect: 'none', ...style }}>{children}</kbd>;
}