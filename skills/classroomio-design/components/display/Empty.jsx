import React from 'react';
export function Empty({ icon, title, description, children, dashed = true, style }) {
  return <div style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, textWrap: 'balance', textAlign: 'center', borderRadius: 'var(--ui-radius-lg)', border: dashed ? '1px dashed var(--ui-border)' : 0, padding: 48, fontFamily: 'var(--font-sans)', ...style }}>
    <div style={{ display: 'flex', maxWidth: 384, flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {icon && <div style={{ marginBottom: 8, display: 'flex', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--ui-radius-lg)', background: 'var(--ui-muted)', color: 'var(--ui-foreground)' }}>{icon}</div>}
      {title && <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.025em' }}>{title}</div>}
      {description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ui-muted-foreground)' }}>{description}</p>}
    </div>
    {children && <div style={{ display: 'flex', width: '100%', maxWidth: 384, minWidth: 0, flexDirection: 'column', alignItems: 'center', gap: 16, fontSize: 14 }}>{children}</div>}
  </div>;
}