import React from 'react';
import { Label } from './Label.jsx';
export function Field({ label, htmlFor, required, description, error, orientation = 'vertical', children, style }) {
  const h = orientation === 'horizontal';
  return <div role="group" data-invalid={!!error || undefined} style={{ display: 'flex', flexDirection: h ? 'row' : 'column', alignItems: h ? 'center' : 'stretch', gap: 12, width: '100%', ...style }}>
    {h && children}
    {(label || description) && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: h ? '1 1 auto' : undefined }}>
      {label && <Label htmlFor={htmlFor} required={required} style={error ? { color: 'var(--ui-destructive)' } : null}>{label}</Label>}
      {h && description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ui-muted-foreground)' }}>{description}</p>}
    </div>}
    {!h && children}
    {!h && description && <p style={{ margin: '-4px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--ui-muted-foreground)' }}>{description}</p>}
    {error && <div role="alert" style={{ fontSize: 14, color: 'var(--ui-destructive)' }}>{error}</div>}
  </div>;
}