import React from 'react';
export function CourseCard({ media, tag, title, meta, children, style }) {
  return <div style={{ background: 'var(--paper)', border: '1px solid var(--sand-300)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
    {media && <div style={{ height: 140, overflow: 'hidden', background: 'var(--sand-100)' }}>{media}</div>}
    <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tag && <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', border: '1px solid var(--sand-300)', borderRadius: 6, padding: '3px 8px', color: 'var(--ink-900)' }}>{tag}</span>}
      {title && <b style={{ fontSize: 17, letterSpacing: '-0.01em' }}>{title}</b>}
      {meta && <span style={{ fontSize: 13, color: 'var(--ink-500)' }}>{meta}</span>}
      {children}
    </div>
  </div>;
}