import React from 'react';
import { Ic, useInteract, FONT, useOutside } from './uiShared.jsx';
export function Select({ options = [], value, defaultValue, onChange, placeholder = 'Select…', size = 'default', disabled, invalid, width, style }) {
  const [open, setOpen] = React.useState(false);
  const [inner, setInner] = React.useState(defaultValue);
  const [hi, setHi] = React.useState(-1);
  const ref = React.useRef(null);
  const { focus, bind } = useInteract();
  useOutside(ref, open, () => setOpen(false));
  const cur = value !== undefined ? value : inner;
  const sel = options.find(o => o.value === cur);
  const pick = (o) => { if (o.disabled) return; setInner(o.value); onChange && onChange(o.value); setOpen(false); };
  const ring = invalid ? { borderColor: 'var(--ui-destructive)' } : (focus || open) ? { borderColor: 'var(--ui-ring)', boxShadow: 'var(--ui-focus-ring)' } : null;
  return <div ref={ref} style={{ position: 'relative', display: 'inline-block', width, ...style }}>
    <button type="button" disabled={disabled} onClick={() => setOpen(!open)} aria-expanded={open} {...bind}
      style={{ display: 'flex', width: width ? '100%' : 'fit-content', minWidth: 0, maxWidth: width ? undefined : 320, alignItems: 'center', justifyContent: 'space-between', gap: 8, whiteSpace: 'nowrap', height: size === 'sm' ? 32 : 36, boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', border: '1px solid var(--ui-input)', background: 'transparent', padding: '8px 12px', fontFamily: FONT, fontSize: 14, color: sel ? 'var(--ui-foreground)' : 'var(--ui-muted-foreground)', boxShadow: 'var(--ui-shadow-xs)', outline: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'box-shadow 150ms', ...ring }}>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{sel ? sel.label : placeholder}</span>
      <span style={{ opacity: 0.5, display: 'flex' }}>{Ic('chevronDown', 16)}</span>
    </button>
    {open && <div role="listbox" style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: '100%', boxSizing: 'border-box', zIndex: 250, background: 'var(--ui-popover)', color: 'var(--ui-popover-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', boxShadow: 'var(--ui-shadow-md)', padding: 4, maxHeight: 280, overflowY: 'auto', animation: 'ui-pop-in 120ms ease-out' }}>
      {options.map((o, i) => o.heading ? <div key={i} style={{ padding: '6px 8px', fontSize: 12, color: 'var(--ui-muted-foreground)' }}>{o.heading}</div>
        : <div key={o.value} role="option" aria-selected={o.value === cur} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(-1)} onClick={() => pick(o)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 'var(--ui-radius-sm)', padding: '6px 32px 6px 8px', fontSize: 14, cursor: 'default', userSelect: 'none', whiteSpace: 'nowrap', background: hi === i ? 'var(--ui-accent)' : 'transparent', opacity: o.disabled ? 0.5 : 1 }}>
          {o.label}
          <span style={{ position: 'absolute', right: 8, display: 'flex' }}>{o.value === cur && Ic('check', 16)}</span>
        </div>)}
    </div>}
  </div>;
}