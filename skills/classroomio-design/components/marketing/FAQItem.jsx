import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function FAQItem({ index, question, answer, open, onToggle, tab = true, z = 1, pageColor = 'var(--page)' }) {
  return <div style={{ position: 'relative', zIndex: z, background: 'var(--sand-200)', borderRadius: 10 }}>
    <button type="button" onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'transparent', border: 0, padding: '24px 24px 22px', fontFamily: 'var(--font-sans)', fontSize: 19, fontWeight: 500, color: 'var(--ink-900)', cursor: 'pointer', textAlign: 'left' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 16 }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--blue-700)' }}>{String(index).padStart(2, '0')}</span>{question}</span>
      <Icon name="plus" size={18} strokeWidth={2} color="var(--ink-500)" style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms' }}/>
    </button>
    {open && answer && <div style={{ padding: '0 24px 24px 58px', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-700)' }}>{answer}</div>}
    <span aria-hidden="true" style={{ position: 'absolute', top: -1, left: 24, width: 46, height: 10, background: pageColor, clipPath: 'polygon(0 0,100% 0,calc(100% - 8px) 100%,8px 100%)', zIndex: 4 }}/>
    {tab && <span aria-hidden="true" style={{ position: 'absolute', bottom: -16, left: 26, width: 42, height: 16, background: 'var(--sand-200)', clipPath: 'polygon(0 0,100% 0,calc(100% - 7px) 100%,7px 100%)', zIndex: 3 }}/>}
  </div>;
}