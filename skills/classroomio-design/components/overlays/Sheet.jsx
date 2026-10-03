import React from 'react';
import { Ic } from '../forms/uiShared.jsx';
export function Sheet({ open = false, onOpenChange, side = 'right', title, description, children, footer, inline = false, style }) {
  if (!open) return null;
  const close = () => onOpenChange && onOpenChange(false);
  const horiz = side === 'left' || side === 'right';
  const pos = inline ? { position: 'relative', height: '100%' } : { position: 'fixed', ...(side === 'right' ? { top: 0, bottom: 0, right: 0 } : side === 'left' ? { top: 0, bottom: 0, left: 0 } : side === 'top' ? { top: 0, left: 0, right: 0 } : { bottom: 0, left: 0, right: 0 }) };
  const border = { right: 'borderLeft', left: 'borderRight', top: 'borderBottom', bottom: 'borderTop' }[side];
  const panel = <div role="dialog" style={{ ...pos, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box', width: horiz ? (inline ? 320 : '75%') : undefined, maxWidth: horiz ? 384 : undefined, background: 'var(--ui-background)', color: 'var(--ui-foreground)', [border]: '1px solid var(--ui-border)', boxShadow: 'var(--ui-shadow-lg)', fontFamily: 'var(--font-sans)', ...style }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 16 }}>
      {title && <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ui-foreground)' }}>{title}</h2>}
      {description && <p style={{ margin: 0, fontSize: 14, color: 'var(--ui-muted-foreground)' }}>{description}</p>}
    </div>
    <div style={{ flex: 1, padding: '0 16px', overflowY: 'auto' }}>{children}</div>
    {footer && <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>{footer}</div>}
    <button type="button" onClick={close} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, border: 0, background: 'transparent', padding: 0, display: 'flex', cursor: 'pointer', opacity: 0.7, color: 'var(--ui-foreground)' }}>{Ic('x', 16)}</button>
  </div>;
  if (inline) return panel;
  return <><div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--ui-overlay)', animation: 'ui-fade-in 150ms' }}/>{panel}</>;
}