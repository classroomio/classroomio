import React from 'react';
import { Ic } from '../forms/uiShared.jsx';
export function Dialog({ open = false, onOpenChange, title, description, children, footer, showCloseButton = true, inline = false, width, style }) {
  if (!open) return null;
  const close = () => onOpenChange && onOpenChange(false);
  const panel = <div role="dialog" aria-modal={!inline} onClick={e => e.stopPropagation()}
    style={{ position: inline ? 'relative' : 'fixed', left: inline ? undefined : '50%', top: inline ? undefined : '50%', transform: inline ? undefined : 'translate(-50%,-50%)', zIndex: 200, display: 'grid', gap: 16, width: width ?? (inline ? '100%' : 'min(80%, 576px)'), minWidth: inline ? undefined : 500, boxSizing: 'border-box', background: 'var(--ui-background)', color: 'var(--ui-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-lg)', padding: 24, boxShadow: 'var(--ui-shadow-lg)', fontFamily: 'var(--font-sans)', animation: inline ? undefined : 'ui-zoom-in 200ms ease-out', ...style }}>
    {(title || description) && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
      {title && <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1 }}>{title}</h2>}
      {description && <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--ui-muted-foreground)' }}>{description}</p>}
    </div>}
    {children}
    {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
    {showCloseButton && <button type="button" onClick={close} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, border: 0, background: 'transparent', padding: 0, display: 'flex', cursor: 'pointer', color: 'var(--ui-foreground)', opacity: 0.7, borderRadius: 2 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.7}>{Ic('x', 16)}</button>}
  </div>;
  if (inline) return panel;
  return <>
    <div onClick={close} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--ui-overlay)', animation: 'ui-fade-in 150ms' }}/>
    {panel}
  </>;
}