import React from 'react';
import { FONT } from '../forms/uiShared.jsx';
export function UnderlineTabs({ tabs = [], value, defaultValue, onChange, style }) {
  const [inner, setInner] = React.useState(defaultValue ?? (tabs[0] && tabs[0].value));
  const [hovered, setHovered] = React.useState(null);
  const [focused, setFocused] = React.useState(null);
  const cur = value !== undefined ? value : inner;
  const active = tabs.find(t => t.value === cur);
  const select = (t) => { if (t.disabled) return; setInner(t.value); onChange && onChange(t.value); };
  const onKeyDown = (e) => {
    const enabled = tabs.filter(t => !t.disabled);
    const i = enabled.findIndex(t => t.value === cur);
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step || i < 0) return;
    e.preventDefault();
    select(enabled[(i + step + enabled.length) % enabled.length]);
  };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: FONT, ...style }}>
    <div role="tablist" onKeyDown={onKeyDown} style={{ position: 'relative', display: 'inline-flex', boxSizing: 'border-box', height: 36, width: '100%', maxWidth: '100%', alignItems: 'center', justifyContent: 'flex-start', overflowX: 'auto', borderBottom: '1px solid var(--ui-border)', color: 'var(--ui-muted-foreground)', scrollbarWidth: 'none' }}>
      {tabs.map(t => {
        const on = t.value === cur;
        const lit = (hovered === t.value || focused === t.value) && !t.disabled;
        return <div key={t.value} style={{ position: 'relative', height: '100%' }}>
          <button role="tab" aria-selected={on} tabIndex={on ? 0 : -1} disabled={t.disabled} onClick={() => select(t)}
            onMouseEnter={() => setHovered(t.value)} onMouseLeave={() => setHovered(null)} onFocus={() => setFocused(t.value)} onBlur={() => setFocused(null)}
            style={{ position: 'relative', zIndex: 10, display: 'inline-flex', boxSizing: 'border-box', height: 'calc(100% - 3px)', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap', padding: '4px 12px', border: 0, background: 'transparent', outline: 'none', fontFamily: 'inherit', fontSize: 14, color: lit ? 'var(--ui-primary)' : 'var(--ui-foreground)', cursor: t.disabled ? 'default' : 'pointer', pointerEvents: t.disabled ? 'none' : undefined, opacity: t.disabled ? 0.5 : 1, transition: 'color 150ms' }}>{t.label}</button>
          <div style={{ position: 'absolute', top: 0, zIndex: 1, width: '100%', height: 'calc(100% - 3px)', borderRadius: 'var(--ui-radius-md)', background: 'color-mix(in oklab, var(--ui-primary) 10%, transparent)', opacity: lit ? 1 : 0, transition: 'opacity 300ms', pointerEvents: 'none' }} />
          {on && <div style={{ position: 'absolute', zIndex: 1, bottom: -1, width: '100%', height: 2, background: 'var(--ui-primary)', pointerEvents: 'none' }} />}
        </div>;
      })}
    </div>
    {active && active.content !== undefined && <div role="tabpanel" style={{ flex: 1, outline: 'none' }}>{active.content}</div>}
  </div>;
}
