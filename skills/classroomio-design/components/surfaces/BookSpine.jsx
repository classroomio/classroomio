import React from 'react';
const FILLS = { paper: ['var(--paper)', 'var(--ink-900)'], sand: ['var(--sand-300)', 'var(--ink-900)'], ink: ['var(--ink-900)', 'var(--paper)'], blue: ['var(--blue-700)', 'var(--paper)'], sky: ['var(--blue-300)', 'var(--ink-900)'] };
export function BookSpine({ label, tone = 'paper', width = 46, height = 230, tilt = 0, style }) {
  const [bg, fg] = FILLS[tone] || FILLS.paper;
  return <div style={{ position: 'relative', flexShrink: 0, width, height, background: bg, border: '1.6px solid var(--ink-900)', borderRadius: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 14, boxSizing: 'border-box', transform: tilt ? `rotate(${tilt}deg)` : undefined, transformOrigin: 'bottom right', ...style }}>
    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontFamily: 'var(--font-mono)', fontSize: 11, color: fg }}>{label}</span>
  </div>;
}
export function Shelf({ children, width = 1260 }) {
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>{children}</div>
    <div style={{ width, maxWidth: '100%', height: 16, background: 'var(--sand-300)', border: '1.6px solid var(--ink-900)', borderRadius: 3 }}/>
  </div>;
}