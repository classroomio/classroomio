import React from 'react';
import { Ic, FONT } from '../forms/uiShared.jsx';
import { Dialog } from './Dialog.jsx';

const CmdCtx = React.createContext({ search: '', setSearch() {}, filter: null, selected: '', setSelected() {}, large: false });

const textOf = (node) => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(' ');
  return node.props ? textOf(node.props.children) : '';
};

/** Subsequence match score: 1 for substring, fraction for scattered, 0 for none. */
const defaultFilter = (value, search, keywords = []) => {
  const q = search.trim().toLowerCase();
  if (!q) return 1;
  const hay = `${value} ${keywords.join(' ')}`.toLowerCase();
  if (hay.includes(q)) return 1;
  let i = 0;
  for (const ch of hay) if (ch === q[i]) i++;
  return i === q.length ? 0.5 : 0;
};

export function Command({ value, defaultValue = '', onValueChange, filter = defaultFilter, shouldFilter = true, large = false, style, children }) {
  const [inner, setInner] = React.useState(defaultValue);
  const search = value !== undefined ? value : inner;
  const setSearch = (v) => { setInner(v); onValueChange && onValueChange(v); };
  const [selected, setSelected] = React.useState('');
  const ref = React.useRef(null);
  const items = () => Array.from(ref.current ? ref.current.querySelectorAll('[data-command-item]:not([aria-disabled="true"])') : []);
  React.useEffect(() => { const first = items()[0]; setSelected(first ? first.getAttribute('data-value') : ''); }, [search]);
  const onKeyDown = (e) => {
    const list = items(); if (!list.length) return;
    const idx = list.findIndex(el => el.getAttribute('data-value') === selected);
    const pick = (n) => { const el = list[(n + list.length) % list.length]; setSelected(el.getAttribute('data-value')); el.scrollIntoView && el.scrollIntoView({ block: 'nearest' }); };
    if (e.key === 'ArrowDown') { e.preventDefault(); pick(idx + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); pick(idx - 1); }
    else if (e.key === 'Home') { e.preventDefault(); pick(0); }
    else if (e.key === 'End') { e.preventDefault(); pick(list.length - 1); }
    else if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); list[idx].click(); }
  };
  return <CmdCtx.Provider value={{ search, setSearch, filter: shouldFilter ? filter : null, selected, setSelected, large }}>
    <div ref={ref} data-command="" data-slot="command" onKeyDown={onKeyDown} style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box', background: 'var(--ui-popover)', color: 'var(--ui-popover-foreground)', borderRadius: 'var(--ui-radius-md)', fontFamily: FONT, ...style }}>{children}</div>
  </CmdCtx.Provider>;
}

export function CommandInput({ placeholder, style }) {
  const { search, setSearch, large } = React.useContext(CmdCtx);
  return <div data-command-input-wrapper="" style={{ display: 'flex', height: large ? 48 : 36, alignItems: 'center', gap: 8, borderBottom: '1px solid var(--ui-border)', padding: '0 32px 0 12px', boxSizing: 'border-box' }}>
    <span style={{ display: 'flex', opacity: 0.5 }}>{Ic('search', large ? 20 : 16)}</span>
    <input data-command-input="" value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder} role="combobox" aria-expanded="true" autoComplete="off"
      style={{ display: 'flex', height: large ? 48 : 40, width: '100%', boxSizing: 'border-box', border: 0, outline: 'none', background: 'transparent', padding: '12px 0', fontFamily: 'inherit', fontSize: 14, color: 'inherit', ...style }}/>
  </div>;
}

export const CommandList = ({ style, children }) => <div role="listbox" data-slot="command-list" style={{ maxHeight: 300, overflowY: 'auto', overflowX: 'hidden', ...style }}>{children}</div>;

export function CommandEmpty({ style, children }) {
  const { search } = React.useContext(CmdCtx);
  const ref = React.useRef(null);
  const [none, setNone] = React.useState(false);
  React.useLayoutEffect(() => {
    const root = ref.current && ref.current.closest('[data-command]');
    const empty = !!root && !root.querySelector('[data-command-item]');
    if (empty !== none) setNone(empty);
  });
  return <div ref={ref} data-slot="command-empty" style={{ display: none ? 'block' : 'none', padding: '24px 0', textAlign: 'center', fontSize: 14, ...style }}>{children}</div>;
}

export function CommandGroup({ heading, style, children }) {
  const { large } = React.useContext(CmdCtx);
  const ref = React.useRef(null);
  const [hidden, setHidden] = React.useState(false);
  React.useLayoutEffect(() => {
    const empty = !!ref.current && !ref.current.querySelector('[data-command-item]');
    if (empty !== hidden) setHidden(empty);
  });
  return <div ref={ref} role="group" data-command-group="" style={{ display: hidden ? 'none' : undefined, overflow: 'hidden', padding: large ? '4px 8px' : 4, color: 'var(--ui-foreground)', ...style }}>
    {heading && <div style={{ padding: '6px 8px', fontSize: 12, fontWeight: 500, color: 'var(--ui-muted-foreground)' }}>{heading}</div>}
    {children}
  </div>;
}

export function CommandItem({ value, keywords, disabled = false, onSelect, icon, style, children }) {
  const { search, filter, selected, setSelected, large } = React.useContext(CmdCtx);
  const val = value ?? (textOf(children).trim() || textOf(icon));
  if (filter && !(filter(val, search, keywords) > 0)) return null;
  const on = selected === val;
  return <div role="option" data-command-item="" data-value={val} aria-selected={on} aria-disabled={disabled || undefined}
    onPointerMove={() => { if (!disabled && !on) setSelected(val); }}
    onClick={() => { if (!disabled && onSelect) onSelect(val); }}
    style={{ position: 'relative', display: 'flex', cursor: 'default', userSelect: 'none', alignItems: 'center', gap: 8, borderRadius: 'var(--ui-radius-sm)', padding: large ? '12px 8px' : '6px 8px', fontSize: 14, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : undefined, background: on ? 'var(--ui-accent)' : 'transparent', color: on ? 'var(--ui-accent-foreground)' : undefined, ...style }}>
    {icon && <span style={{ display: 'flex', color: 'var(--ui-muted-foreground)' }}>{icon}</span>}
    {children}
  </div>;
}

export const CommandSeparator = ({ style }) => <div role="separator" data-slot="command-separator" style={{ height: 1, margin: '0 -4px', background: 'var(--ui-border)', ...style }}/>;
export const CommandShortcut = ({ style, children }) => <span data-slot="command-shortcut" style={{ marginLeft: 'auto', fontSize: 12, letterSpacing: '0.1em', color: 'var(--ui-muted-foreground)', ...style }}>{children}</span>;

export function CommandDialog({ open = false, onOpenChange, title = 'Command Palette', description = 'Search for a command to run', value, onValueChange, children }) {
  const hide = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' };
  return <Dialog open={open} onOpenChange={onOpenChange} showCloseButton style={{ padding: 0, gap: 0, overflow: 'hidden', minWidth: 0, width: 'min(80%, 576px)' }}>
    <h2 style={hide}>{title}</h2><p style={hide}>{description}</p>
    <Command large value={value} onValueChange={onValueChange}>{children}</Command>
  </Dialog>;
}
