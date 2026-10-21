import React from 'react';
export function Tabs({ tabs = [], value, defaultValue, onChange, style }) {
  const [inner, setInner] = React.useState(defaultValue ?? (tabs[0] && tabs[0].value));
  const cur = value !== undefined ? value : inner;
  const active = tabs.find(t => t.value === cur);
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'var(--font-sans)', ...style }}>
    <div role="tablist" style={{ display: 'inline-flex', width: 'fit-content', height: 36, boxSizing: 'border-box', alignItems: 'center', justifyContent: 'center', background: 'var(--ui-muted)', color: 'var(--ui-muted-foreground)', borderRadius: 'var(--ui-radius-lg)', padding: 3 }}>
      {tabs.map(t => { const on = t.value === cur;
        return <button key={t.value} role="tab" aria-selected={on} disabled={t.disabled} onClick={() => { setInner(t.value); onChange && onChange(t.value); }}
          style={{ display: 'inline-flex', height: 'calc(100% - 1px)', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap', borderRadius: 'var(--ui-radius-md)', border: '1px solid transparent', padding: '4px 8px', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: 'var(--ui-foreground)', background: on ? 'var(--ui-background)' : 'transparent', boxShadow: on ? 'var(--ui-shadow-sm)' : 'none', opacity: t.disabled ? 0.5 : 1, transition: 'color 150ms, box-shadow 150ms' }}>{t.label}</button>; })}
    </div>
    {active && active.content !== undefined && <div style={{ flex: 1, outline: 'none' }}>{active.content}</div>}
  </div>;
}