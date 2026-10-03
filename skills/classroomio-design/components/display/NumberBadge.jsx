import React from 'react';
import { Ic } from '../forms/uiShared.jsx';
export function NumberBadge({ number, active = false, locked = false, style }) {
  return <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: 28, height: 28, boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.025em', transition: 'background 150ms',
    ...(active ? { background: 'var(--ui-primary)', color: 'var(--ui-primary-foreground)' } : { border: '1px solid var(--ui-border)', background: 'var(--ui-muted)', color: 'var(--ui-muted-foreground)' }), ...style }}>
    {locked ? Ic('lock', 14) : number}
  </span>;
}