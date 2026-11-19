import React from 'react';
export function Pill({ children, icon, href = '#', mono, trailing, style }) {
  return <a href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, border: '1px solid var(--sand-300)', borderRadius: 999, padding: trailing ? '10px 10px 10px 18px' : '8px 16px', fontSize: 15, background: 'var(--paper)', color: 'var(--ink-700)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', ...style }}>
    {icon}{children}{trailing}
  </a>;
}