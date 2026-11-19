import React from 'react';
export function DetailRows({ rows = [], tone = 'light', style }) {
  const dark = tone === 'dark';
  const line = dark ? 'rgba(255,255,255,0.25)' : 'var(--sand-300)';
  const labelColor = dark ? 'rgba(255,255,255,0.7)' : 'var(--ink-500)';
  return <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid ' + line, ...style }}>
    {rows.map((r, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: '1px solid ' + line, fontSize: 17 }}>
      <span style={{ color: labelColor }}>{r.label}</span>
      <b style={{ fontWeight: 600, fontFamily: r.mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: r.mono ? 15 : 17 }}>{r.value}</b>
    </div>)}
  </div>;
}