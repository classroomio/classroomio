import React from 'react';
export function Tag({ children, variant = 'outline', style }) {
  const v = { outline: { border: '1px solid var(--sand-300)', color: 'var(--ink-900)', background: 'transparent', borderRadius: 6, padding: '3px 8px' },
    new: { border: 0, color: 'var(--blue-700)', background: 'transparent', padding: 0, fontSize: 12, letterSpacing: '0.1em' },
    onPhoto: { border: 0, color: '#FFFFFF', background: 'rgba(23,20,15,0.7)', borderRadius: 999, padding: '5px 10px', fontSize: 12, letterSpacing: 0 },
    onPhotoLight: { border: 0, color: 'var(--blue-700)', background: 'var(--paper)', borderRadius: 999, padding: '5px 10px', fontSize: 12, letterSpacing: 0 },
    agent: { border: 0, color: 'var(--paper)', background: 'var(--blue-700)', borderRadius: 999, padding: '4px 10px', letterSpacing: 0 } }[variant];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', whiteSpace: 'nowrap', ...v, ...style }}>{children}</span>;
}