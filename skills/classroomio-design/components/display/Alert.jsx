import React from 'react';
import { Ic } from '../forms/uiShared.jsx';
const V = {
  default: { background: 'var(--ui-card)', color: 'var(--ui-card-foreground)', borderColor: 'var(--ui-border)' },
  destructive: { background: 'var(--ui-card)', color: 'var(--ui-destructive)', borderColor: 'var(--ui-border)' },
  warning: { background: '#FFFBEB', color: '#78350F', borderColor: '#FDE68A' },
  information: { background: 'var(--blue-100, #EEF2FF)', color: 'var(--ui-primary)', borderColor: 'var(--ui-ring)' },
};
export function Alert({ variant = 'default', icon, title, children, style }) {
  const ic = icon === undefined ? Ic(variant === 'default' ? 'info' : variant === 'information' ? 'info' : 'alert', 16) : icon;
  const descColor = variant === 'destructive' ? 'color-mix(in oklab, var(--ui-destructive) 90%, transparent)' : variant === 'default' ? 'var(--ui-muted-foreground)' : 'inherit';
  return <div role="alert" style={{ position: 'relative', display: 'grid', gridTemplateColumns: ic ? '16px 1fr' : '0 1fr', columnGap: ic ? 12 : 0, rowGap: 2, alignItems: 'start', width: '100%', boxSizing: 'border-box', borderRadius: 'var(--ui-radius-lg)', border: '1px solid', padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 14, ...(V[variant] || V.default), ...style }}>
    {ic ? <span style={{ display: 'flex', transform: 'translateY(2px)' }}>{ic}</span> : <span/>}
    {title && <div style={{ gridColumnStart: 2, minHeight: 16, fontWeight: 500, letterSpacing: '-0.015em' }}>{title}</div>}
    {children && <div style={{ gridColumnStart: 2, display: 'grid', gap: 4, color: descColor, lineHeight: 1.625 }}>{children}</div>}
  </div>;
}