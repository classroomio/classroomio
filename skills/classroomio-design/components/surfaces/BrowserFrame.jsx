import React from 'react';
export function BrowserFrame({ url = 'app.classroomio.com', sketch = true, children, style }) {
  const b = sketch ? '1.6px solid var(--ink-900)' : '1px solid var(--sand-300)';
  return <div style={{ border: b, borderRadius: sketch ? 14 : 18, background: 'var(--paper)', overflow: 'hidden', ...style }}>
    <div style={{ height: sketch ? 38 : 50, borderBottom: b, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', background: 'var(--sand-100)' }}>
      {[0,1,2].map(i => <span key={i} style={sketch ? { width: 10, height: 10, borderRadius: '50%', border: '1.4px solid var(--ink-900)' } : { width: 11, height: 11, borderRadius: '50%', background: 'var(--sand-300)' }}/>)}
      <span style={{ marginLeft: 14, flexGrow: 1, maxWidth: 360, height: 22, borderRadius: 6, background: 'var(--paper)', border: '1px solid var(--sand-300)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)', display: 'flex', alignItems: 'center', padding: '0 10px' }}>{url}</span>
    </div>
    <div style={{ position: 'relative' }}>{children}</div>
  </div>;
}