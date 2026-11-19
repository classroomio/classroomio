import React from 'react';
import { Ic, useOutside, FONT } from '../forms/uiShared.jsx';

const itemBase = { position: 'relative', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 'var(--ui-radius-sm)', padding: '6px 8px', fontSize: 14, cursor: 'default', userSelect: 'none', whiteSpace: 'nowrap' };
const panelBase = { position: 'absolute', zIndex: 250, boxSizing: 'border-box', background: 'var(--ui-popover)', color: 'var(--ui-popover-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', padding: 4, fontFamily: FONT, animation: 'ui-pop-in 120ms ease-out' };

function Indicator({ children }) {
  return <span style={{ pointerEvents: 'none', position: 'absolute', left: 8, display: 'flex', width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>{children}</span>;
}

function MenuItems({ items, path, state, setState, close }) {
  const [hi, setHi] = React.useState(-1);
  const [sub, setSub] = React.useState(-1);
  return <>{items.map((it, i) => {
    const key = `${path}.${i}`;
    if (it.separator) return <div key={i} role="separator" style={{ height: 1, margin: '4px -4px', background: 'var(--ui-border)' }}/>;
    if (it.heading) return <div key={i} style={{ padding: '6px 8px', paddingLeft: it.inset ? 32 : 8, fontSize: 14, fontWeight: 500 }}>{it.heading}</div>;
    const destr = it.variant === 'destructive';
    const on = hi === i || sub === i;
    const bg = on ? (destr ? 'color-mix(in oklab, var(--ui-destructive) 10%, transparent)' : 'var(--ui-accent)') : 'transparent';
    const common = { onMouseEnter: () => { setHi(i); setSub(it.items ? i : -1); }, onMouseLeave: () => setHi(-1), 'aria-disabled': it.disabled || undefined };
    const dim = it.disabled ? 0.5 : 1;
    if (it.items) return <div key={i} style={{ position: 'relative' }} {...common}>
      <div role="menuitem" aria-haspopup="menu" aria-expanded={sub === i} style={{ ...itemBase, paddingLeft: it.inset ? 32 : 8, opacity: dim, background: bg }}>
        {it.icon && <span style={{ display: 'flex', color: 'var(--ui-muted-foreground)' }}>{it.icon}</span>}
        {it.label}
        <span style={{ marginLeft: 'auto', display: 'flex' }}>{Ic('chevronRight', 16)}</span>
      </div>
      {sub === i && !it.disabled && <div role="menu" style={{ ...panelBase, top: -5, left: '100%', marginLeft: 2, minWidth: 128, boxShadow: 'var(--ui-shadow-lg)' }}>
        <MenuItems items={it.items} path={key} state={state} setState={setState} close={close}/>
      </div>}
    </div>;
    const isCheck = it.checked !== undefined || it.type === 'checkbox';
    const isRadio = it.radioGroup !== undefined;
    const checked = isCheck ? (state[key] ?? !!it.checked) : isRadio ? (state[`radio:${path}:${it.radioGroup}`] ?? it.radioSelected) === it.radioValue : false;
    const activate = () => {
      if (it.disabled) return;
      if (isCheck) { setState({ ...state, [key]: !checked }); it.onCheckedChange && it.onCheckedChange(!checked); }
      if (isRadio) { setState({ ...state, [`radio:${path}:${it.radioGroup}`]: it.radioValue }); it.onCheckedChange && it.onCheckedChange(it.radioValue); }
      it.onSelect && it.onSelect();
      close();
    };
    return <div key={i} role={isCheck ? 'menuitemcheckbox' : isRadio ? 'menuitemradio' : 'menuitem'} aria-checked={isCheck || isRadio ? !!checked : undefined} {...common} onClick={activate}
      style={{ ...itemBase, paddingLeft: it.inset || isCheck || isRadio ? 32 : 8, opacity: dim, color: destr ? 'var(--ui-destructive)' : undefined, background: bg }}>
      {isCheck && <Indicator>{checked ? Ic('check', 16) : null}</Indicator>}
      {isRadio && <Indicator>{checked ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}/> : null}</Indicator>}
      {it.icon && <span style={{ display: 'flex', color: destr ? 'var(--ui-destructive)' : 'var(--ui-muted-foreground)' }}>{it.icon}</span>}
      {it.label}
      {it.shortcut && <span style={{ marginLeft: 'auto', paddingLeft: 16, fontSize: 12, letterSpacing: '0.1em', color: 'var(--ui-muted-foreground)' }}>{it.shortcut}</span>}
    </div>;
  })}</>;
}

export function Menubar({ menus = [], defaultOpen, style }) {
  const [open, setOpen] = React.useState(defaultOpen ?? -1);
  const [state, setState] = React.useState({});
  const ref = React.useRef(null);
  useOutside(ref, open >= 0, () => setOpen(-1));
  React.useEffect(() => {
    if (open < 0) return;
    const f = (e) => {
      if (e.key === 'Escape') setOpen(-1);
      else if (e.key === 'ArrowRight') setOpen((open + 1) % menus.length);
      else if (e.key === 'ArrowLeft') setOpen((open - 1 + menus.length) % menus.length);
    };
    document.addEventListener('keydown', f);
    return () => document.removeEventListener('keydown', f);
  }, [open, menus.length]);
  return <div ref={ref} role="menubar" data-slot="menubar" style={{ display: 'inline-flex', height: 36, boxSizing: 'border-box', alignItems: 'center', gap: 4, background: 'var(--ui-background)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', padding: 4, boxShadow: 'var(--ui-shadow-xs)', fontFamily: FONT, ...style }}>
    {menus.map((m, mi) => {
      const on = open === mi;
      return <div key={mi} style={{ position: 'relative' }}>
        <button type="button" role="menuitem" aria-haspopup="menu" aria-expanded={on} onClick={() => setOpen(on ? -1 : mi)} onMouseEnter={() => { if (open >= 0) setOpen(mi); }}
          style={{ display: 'flex', userSelect: 'none', alignItems: 'center', border: 0, borderRadius: 'var(--ui-radius-sm)', padding: '4px 8px', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'default', outline: 'none', color: on ? 'var(--ui-accent-foreground)' : 'var(--ui-foreground)', background: on ? 'var(--ui-accent)' : 'transparent' }}>{m.label}</button>
        {on && <div role="menu" style={{ ...panelBase, top: '100%', marginTop: 8, left: -4, minWidth: 192, boxShadow: 'var(--ui-shadow-md)', overflow: 'visible' }}>
          <MenuItems items={m.items || []} path={String(mi)} state={state} setState={setState} close={() => setOpen(-1)}/>
        </div>}
      </div>;
    })}
  </div>;
}
