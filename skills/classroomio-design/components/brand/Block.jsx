import React from 'react';
const TONE = { sand: ['var(--sand-200)', 'var(--ink-900)'], tint: ['var(--blue-100)', 'var(--ink-900)'], blue: ['var(--blue-700)', '#FFFFFF'], ink: ['var(--ink-900)', 'var(--paper)'], paper: ['var(--paper)', 'var(--ink-900)'] };
export function Block({ kind, title, tone = 'sand', notch = true, tab = false, surface = 'var(--page)', width = 320, height = 64, style }) {
  const [bg, fg] = TONE[tone] || TONE.sand;
  return <div style={{ position: 'relative', width, height, boxSizing: 'border-box', background: bg, color: fg, padding: '14px 18px 0', display: 'flex', flexDirection: 'column', gap: 2, ...style }}>
    {notch && <span aria-hidden="true" style={{ position: 'absolute', top: -1, left: 24, width: 46, height: 10, background: surface, clipPath: 'polygon(0 0,100% 0,calc(100% - 8px) 100%,8px 100%)', zIndex: 4 }}/>}
    {tab && <span aria-hidden="true" style={{ position: 'absolute', bottom: -16, left: 26, width: 42, height: 16, background: bg, clipPath: 'polygon(0 0,100% 0,calc(100% - 7px) 100%,7px 100%)', zIndex: 3 }}/>}
    {kind && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: tone === 'blue' || tone === 'ink' ? 'var(--blue-300)' : 'var(--blue-700)' }}>{kind}</span>}
    <b style={{ fontSize: 15, fontWeight: 600 }}>{title}</b>
  </div>;
}
export function BlockStack({ blocks = [], surface = 'var(--page)', gap = 8, style }) {
  return <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap, ...style }}>
    {blocks.map((b, i) => <Block key={i} {...b} tab={i > 0} surface={surface} style={{ zIndex: i + 1 }}/>)}
  </div>;
}
export function BlockGrid({ blocks = [], columns = 4, surface = 'var(--page)', gap = 12, style }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + columns + ', minmax(0,1fr))', gap, ...style }}>
    {blocks.map((b, i) => <Block key={i} {...b} surface={surface} width="100%"/>)}
  </div>;
}