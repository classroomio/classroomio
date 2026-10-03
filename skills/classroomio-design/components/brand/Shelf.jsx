import React from 'react';
export function BookSpine({ label, value, caption, tone = 'paper', width = 80, height = 300, tilt = 0, fontSize = 22, style }) {
  const T = ({ paper: ['var(--paper)', 'var(--ink-900)'], sand: ['var(--sand-300)', 'var(--ink-900)'], ink: ['var(--ink-900)', 'var(--paper)'], blue: ['var(--blue-700)', '#FFFFFF'], sky: ['var(--blue-300)', 'var(--ink-900)'] })[tone] || ['var(--paper)', 'var(--ink-900)'];
  return <div style={{ position: 'relative', flexShrink: 0, width, height, boxSizing: 'border-box', background: T[0], color: T[1], border: '1.6px solid var(--ink-900)', borderRadius: 3, transform: tilt ? 'rotate(' + tilt + 'deg)' : undefined, transformOrigin: 'bottom right', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0 16px', ...style }}>
    {value !== undefined && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{value}</span>}
    <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize, fontWeight: 700, letterSpacing: '-0.02em' }}>{label}</span>
    {caption && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, writingMode: 'vertical-rl', transform: 'rotate(180deg)', opacity: 0.75 }}>{caption}</span>}
  </div>;
}
export function Shelf({ spines = [], width = 'auto', style }) {
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width, ...style }}>
    <div style={{ display: 'flex', alignItems: 'flex-end' }}>{spines.map((s, i) => <BookSpine key={i} {...s}/>)}</div>
    <div style={{ width: '100%', height: 16, background: 'var(--sand-300)', border: '1.6px solid var(--ink-900)', borderRadius: 3, marginTop: -1 }}/>
  </div>;
}