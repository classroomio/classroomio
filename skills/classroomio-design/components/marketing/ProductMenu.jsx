import React from 'react';
import { Icon } from '../core/Icon.jsx';
export const DEFAULT_MENU = [
  { icon: 'sparkle', title: 'AI Assistant', body: 'Draft courses from your files; answer learners from the lesson.' },
  { icon: 'users', title: 'Student management', body: 'Bulk import, deactivate and track every learner.' },
  { icon: 'palette', title: 'Custom branding', body: 'Your domain, theme and favicon — switch features on or off.' },
  { icon: 'bolt', title: 'Automation', body: 'Zapier, a full API, and a CLI on the way.' },
  { icon: 'chat', title: 'ChatGPT & Claude', body: 'Run your academy from your favourite assistant via MCP.' },
];
export function ProductMenu({ items = DEFAULT_MENU, feature = { label: 'NEW', title: 'Zapier integration', body: 'Connect your academy to 1000s of tools.' }, onSelect, style }) {
  const [hover, setHover] = React.useState(-1);
  return <div style={{ width: 720, background: 'var(--paper)', border: '1px solid var(--sand-300)', borderRadius: 18, padding: 12, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', ...style }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 2 }}>
      {items.map((it, i) => <a key={it.title} href="#" onClick={e => { e.preventDefault(); onSelect && onSelect(it); }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)} style={{ display: 'flex', gap: 14, padding: 14, borderRadius: 12, background: hover === i ? 'var(--sand-100)' : 'transparent', color: 'var(--ink-900)' }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, background: hover === i ? 'var(--paper)' : 'var(--sand-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={it.icon} color="var(--blue-700)"/></span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><b style={{ fontSize: 16 }}>{it.title}</b><span style={{ fontSize: 14, lineHeight: 1.4, color: 'var(--ink-700)' }}>{it.body}</span></span>
      </a>)}
      {feature && <a href="#" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, padding: '14px 16px', borderRadius: 12, background: 'var(--sand-100)', color: 'var(--ink-900)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--blue-700)' }}>{feature.label}</span>
        <b style={{ fontSize: 16 }}>{feature.title}</b><span style={{ fontSize: 14, color: 'var(--ink-700)' }}>{feature.body}</span></a>}
    </div>
    <div style={{ marginTop: 8, borderTop: '1px solid var(--sand-300)', padding: '14px 14px 6px', display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--ink-700)' }}>
      <span>Open source · self-host or cloud</span>
      <a href="#" style={{ color: 'var(--blue-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>API docs <Icon name="arrowRight" size={18} strokeWidth={2}/></a>
    </div>
  </div>;
}