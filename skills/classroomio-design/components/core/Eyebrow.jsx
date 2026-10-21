import React from 'react';
export function Eyebrow({ children, tone = 'muted', size = 'md', style }) {
  const color = { muted: 'var(--ink-500)', accent: 'var(--blue-700)', onBlue: 'var(--blue-300)' }[tone];
  const fs = size === 'sm' ? 12 : 15; const ls = size === 'sm' ? '0.12em' : '0.14em';
  return <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: fs, letterSpacing: ls, color, textTransform: 'uppercase', ...style }}>{children}</span>;
}