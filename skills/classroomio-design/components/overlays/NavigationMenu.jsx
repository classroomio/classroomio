import React from 'react';
import { Ic, useInteract, FONT } from '../forms/uiShared.jsx';

const OPEN_DELAY = 200;
const CLOSE_DELAY = 300;

/** Link row for use inside NavigationMenu content. */
export function NavigationMenuLink({ href, active = false, onClick, style, children }) {
  const { hover, focus, bind } = useInteract();
  return <a data-slot="navigation-menu-link" data-active={active} href={href} onClick={onClick} {...bind}
    style={{ display: 'flex', flexDirection: 'column', gap: 4, borderRadius: 'var(--ui-radius-sm)', padding: 8, fontSize: 14, textDecoration: 'none', cursor: 'pointer', outline: 'none', transition: 'all 150ms', color: hover || focus || active ? 'var(--ui-accent-foreground)' : 'var(--ui-foreground)', background: hover || focus ? 'var(--ui-accent)' : active ? 'color-mix(in oklab, var(--ui-accent) 50%, transparent)' : 'transparent', boxShadow: focus ? 'var(--ui-focus-ring)' : 'none', ...style }}>{children}</a>;
}

function Trigger({ item, open, onEnter, onLeave, onToggle }) {
  const { hover, focus, bind } = useInteract();
  const bg = hover || focus || open ? 'var(--ui-accent)' : 'var(--ui-background)';
  const base = { display: 'inline-flex', height: 36, width: 'max-content', boxSizing: 'border-box', alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: 'var(--ui-radius-md)', padding: '8px 16px', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, textDecoration: 'none', cursor: 'pointer', outline: 'none', color: hover || focus || open ? 'var(--ui-accent-foreground)' : 'var(--ui-foreground)', background: open && !hover && !focus ? 'color-mix(in oklab, var(--ui-accent) 50%, transparent)' : bg, boxShadow: focus ? 'var(--ui-focus-ring)' : 'none', opacity: item.disabled ? 0.5 : 1, pointerEvents: item.disabled ? 'none' : undefined, transition: 'color 150ms, box-shadow 150ms' };
  if (item.content === undefined) return <a data-slot="navigation-menu-link" href={item.href} onClick={item.onClick} {...bind} style={{ ...base, background: item.active ? 'color-mix(in oklab, var(--ui-accent) 50%, transparent)' : base.background }}>{item.label}</a>;
  return <button type="button" data-slot="navigation-menu-trigger" data-state={open ? 'open' : 'closed'} aria-expanded={open} {...bind} onClick={onToggle} onMouseEnter={(e) => { bind.onMouseEnter(e); onEnter(); }} onMouseLeave={(e) => { bind.onMouseLeave(e); onLeave(); }} style={base}>
    {item.label}
    <span style={{ position: 'relative', top: 1, marginLeft: 4, display: 'flex', transition: 'transform 300ms', transform: open ? 'rotate(180deg)' : 'none' }}>{Ic('chevronDown', 12)}</span>
  </button>;
}

export function NavigationMenu({ items = [], viewport = true, indicator = false, defaultValue, style }) {
  const [value, setValue] = React.useState(defaultValue ?? null);
  const timer = React.useRef(null);
  const clear = () => { clearTimeout(timer.current); };
  const schedule = (v, delay) => { clear(); timer.current = setTimeout(() => setValue(v), value ? 0 : delay); };
  React.useEffect(() => clear, []);
  React.useEffect(() => {
    if (value == null) return;
    const f = (e) => { if (e.key === 'Escape') setValue(null); };
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  }, [value]);
  const rootRef = React.useRef(null);
  React.useEffect(() => {
    if (value == null) return;
    const f = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setValue(null); };
    document.addEventListener('mousedown', f);
    return () => document.removeEventListener('mousedown', f);
  }, [value]);
  const active = items.find(it => it.value === value && it.content !== undefined);
  const panel = { background: 'var(--ui-popover)', color: 'var(--ui-popover-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', boxShadow: 'var(--ui-shadow-sm)', overflow: 'hidden', boxSizing: 'border-box', animation: 'ui-pop-in 200ms ease-out' };
  return <nav ref={rootRef} data-slot="navigation-menu" data-viewport={viewport} aria-label="Main" onMouseEnter={clear} onMouseLeave={() => schedule(null, CLOSE_DELAY)} style={{ position: 'relative', display: 'flex', maxWidth: 'max-content', flex: 1, alignItems: 'center', justifyContent: 'center', fontFamily: FONT, ...style }}>
    <ul data-slot="navigation-menu-list" style={{ display: 'flex', flex: 1, listStyle: 'none', alignItems: 'center', justifyContent: 'center', gap: 4, margin: 0, padding: 0 }}>
      {items.map((it, i) => {
        const open = value === it.value && it.content !== undefined;
        return <li key={it.value ?? i} data-slot="navigation-menu-item" style={{ position: 'relative' }}>
          <Trigger item={it} open={open} onEnter={() => schedule(it.value, OPEN_DELAY)} onLeave={clear} onToggle={() => { clear(); setValue(open ? null : it.value); }}/>
          {open && indicator && <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1, display: 'flex', height: 6, alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'relative', top: '60%', width: 8, height: 8, transform: 'rotate(45deg)', background: 'var(--ui-border)', borderTopLeftRadius: 2, boxShadow: 'var(--ui-shadow-md)' }}/>
          </div>}
          {open && !viewport && <div data-slot="navigation-menu-content" style={{ ...panel, position: 'absolute', left: 0, top: '100%', marginTop: 6, zIndex: 50 }}>{it.content}</div>}
        </li>;
      })}
    </ul>
    {viewport && active && <div style={{ position: 'absolute', left: 0, top: '100%', isolation: 'isolate', zIndex: 50, display: 'flex', justifyContent: 'center' }}>
      <div data-slot="navigation-menu-viewport" data-state="open" style={{ ...panel, position: 'relative', marginTop: 6, width: 'max-content', transformOrigin: 'top center' }}>
        <div data-slot="navigation-menu-content">{active.content}</div>
      </div>
    </div>}
  </nav>;
}
