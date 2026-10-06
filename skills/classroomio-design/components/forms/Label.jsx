import React from 'react';
export function Label({ htmlFor, required, disabled, children, style }) {
  return <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, lineHeight: 1, color: 'var(--ui-foreground)', opacity: disabled ? 0.5 : 1, ...style }}>
    {children}{required && <span aria-hidden="true" style={{ color: '#B91C1C' }}>*</span>}
  </label>;
}