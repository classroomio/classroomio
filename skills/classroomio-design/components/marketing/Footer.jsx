import React from 'react';
import { Logo } from '../core/Logo.jsx';
const COLS = [
  ['Product', ['AI Assistant', 'Student management', 'Custom branding', 'Automation', 'ChatGPT & Claude']],
  ['Developers', ['API docs', 'MCP', 'Changelog', 'GitHub']],
  ['Company', ['Blog', 'Discord', 'X', 'Terms', 'Privacy']],
];
export function Footer({ columns = COLS, tagline = 'Open-source customer education. Starts free. Growth at 69/mo. No per-learner fees.', style }) {
  return <footer style={{ padding: '0 120px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, ...style }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 320 }}><Logo size="lg"/><span style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--ink-500)' }}>{tagline}</span></div>
    <div style={{ display: 'flex', gap: 80 }}>
      {columns.map(([h, ls]) => <div key={h} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16 }}><span style={{ fontWeight: 600 }}>{h}</span>{ls.map(l => <a key={l} href="#" style={{ color: 'var(--ink-500)' }}>{l}</a>)}</div>)}
    </div>
  </footer>;
}