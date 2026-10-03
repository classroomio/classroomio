import React from 'react';
import { Ic } from '../forms/uiShared.jsx';
export function Accordion({ items = [], type = 'single', defaultOpen = [], style }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [hov, setHov] = React.useState(-1);
  const toggle = (i) => setOpen(o => o.includes(i) ? o.filter(x => x !== i) : type === 'single' ? [i] : [...o, i]);
  return <div style={{ fontFamily: 'var(--font-sans)', ...style }}>
    {items.map((it, i) => { const on = open.includes(i);
      return <div key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--ui-border)' : 0 }}>
        <button type="button" aria-expanded={on} onClick={() => toggle(i)} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)}
          style={{ display: 'flex', width: '100%', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, border: 0, background: 'transparent', borderRadius: 'var(--ui-radius-md)', padding: '16px 0', textAlign: 'left', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, color: 'var(--ui-foreground)', cursor: 'pointer', textDecoration: hov === i ? 'underline' : 'none' }}>
          {it.title}<span style={{ display: 'flex', color: 'var(--ui-muted-foreground)', transform: `translateY(2px) rotate(${on ? 180 : 0}deg)`, transition: 'transform 200ms' }}>{Ic('chevronDown', 16)}</span>
        </button>
        {on && <div style={{ paddingBottom: 16, fontSize: 14, color: 'var(--ui-foreground)', lineHeight: 1.5 }}>{it.content}</div>}
      </div>; })}
  </div>;
}