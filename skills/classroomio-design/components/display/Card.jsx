import React from 'react';
export function Card({ title, description, action, footer, children, bordered, style }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 24, background: 'var(--ui-card)', color: 'var(--ui-card-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-lg)', padding: '24px 0', fontFamily: 'var(--font-sans)', ...style }}>
    {(title || description || action) && <div style={{ display: 'grid', gridTemplateColumns: action ? '1fr auto' : '1fr', gridTemplateRows: 'auto auto', alignItems: 'start', gap: 6, padding: '0 24px', paddingBottom: bordered ? 24 : 0, borderBottom: bordered ? '1px solid var(--ui-border)' : 0 }}>
      {title && <div style={{ fontWeight: 600, lineHeight: 1 }}>{title}</div>}
      {action && <div style={{ gridColumnStart: 2, gridRow: '1 / span 2', alignSelf: 'start', justifySelf: 'end' }}>{action}</div>}
      {description && <p style={{ margin: 0, fontSize: 14, color: 'var(--ui-muted-foreground)' }}>{description}</p>}
    </div>}
    {children && <div style={{ padding: '0 24px' }}>{children}</div>}
    {footer && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 24px' }}>{footer}</div>}
  </div>;
}