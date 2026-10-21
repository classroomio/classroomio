import React from 'react';
import { useOutside } from '../forms/uiShared.jsx';
export function DropdownMenu({ trigger, items = [], align = 'start', minWidth = 128, defaultOpen = false, onSelect }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [hi, setHi] = React.useState(-1);
  const ref = React.useRef(null);
  useOutside(ref, open, () => setOpen(false));
  return <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
    <span onClick={() => setOpen(!open)} style={{ display: 'inline-flex' }}>{trigger}</span>
    {open && <div role="menu" style={{ position: 'absolute', top: '100%', marginTop: 4, [align === 'end' ? 'right' : 'left']: 0, zIndex: 250, minWidth, boxSizing: 'border-box', background: 'var(--ui-popover)', color: 'var(--ui-popover-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', padding: 4, boxShadow: 'var(--ui-shadow-md)', fontFamily: 'var(--font-sans)', animation: 'ui-pop-in 120ms ease-out' }}>
      {items.map((it, i) => {
        if (it.separator) return <div key={i} role="separator" style={{ height: 1, margin: '4px -4px', background: 'var(--ui-border)' }}/>;
        if (it.heading) return <div key={i} style={{ padding: '6px 8px', fontSize: 14, fontWeight: 600, paddingLeft: it.inset ? 32 : 8 }}>{it.heading}</div>;
        const destr = it.variant === 'destructive';
        return <div key={i} role="menuitem" aria-disabled={it.disabled || undefined} onMouseEnter={() => setHi(i)} onMouseLeave={() => setHi(-1)} onClick={() => { if (it.disabled) return; it.onSelect && it.onSelect(); onSelect && onSelect(it); setOpen(false); }}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 'var(--ui-radius-sm)', padding: '6px 8px', paddingLeft: it.inset ? 32 : 8, fontSize: 14, cursor: 'default', userSelect: 'none', whiteSpace: 'nowrap', opacity: it.disabled ? 0.5 : 1, color: destr ? 'var(--ui-destructive)' : undefined, background: hi === i ? (destr ? 'color-mix(in oklab, var(--ui-destructive) 10%, transparent)' : 'var(--ui-accent)') : 'transparent' }}>
          {it.icon && <span style={{ display: 'flex', color: destr ? 'var(--ui-destructive)' : 'var(--ui-muted-foreground)' }}>{it.icon}</span>}
          {it.label}
          {it.shortcut && <span style={{ marginLeft: 'auto', paddingLeft: 16, fontSize: 12, letterSpacing: '0.1em', color: 'var(--ui-muted-foreground)' }}>{it.shortcut}</span>}
        </div>;
      })}
    </div>}
  </div>;
}