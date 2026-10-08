import React from 'react';
import { notchStyle, tabStyle } from '../forms/uiShared.jsx';
const TONE = { sand: ['var(--sand-200)', 'var(--ink-900)'], tint: ['var(--blue-100)', 'var(--ink-900)'], blue: ['var(--blue-700)', '#FFFFFF'], ink: ['var(--ink-900)', 'var(--paper)'], paper: ['var(--paper)', 'var(--ink-900)'] };
export function Block({ kind, title, tone = 'sand', notch = true, tab = false, surface = 'var(--page)', width = 320, height = 64, style }) {
  const [bg, fg] = TONE[tone] || TONE.sand;
  return <div style={{ position: 'relative', width, height, boxSizing: 'border-box', background: bg, color: fg, padding: '14px 18px 0', display: 'flex', flexDirection: 'column', gap: 2, ...style }}>
    {notch && <span aria-hidden="true" style={notchStyle(surface)}/>}
    {tab && <span aria-hidden="true" style={tabStyle(bg)}/>}
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