import React from 'react';
import { Ic, FONT } from '../forms/uiShared.jsx';
const ICONS = { success: 'circleCheck', error: 'octagonX', warning: 'triangleAlert', info: 'info', loading: 'loader' };
let items = [];
let seq = 0;
const listeners = new Set();
const emit = () => listeners.forEach(l => l());
const timers = {};
function dismiss(id) {
  if (id === undefined) { items = []; } else { items = items.filter(t => t.id !== id); }
  emit();
}
function push(type, title, opts = {}) {
  const id = opts.id ?? ++seq;
  items = [...items.filter(t => t.id !== id), { id, type, title, ...opts }];
  clearTimeout(timers[id]);
  const duration = opts.duration ?? 4000;
  if (type !== 'loading' && duration !== Infinity) timers[id] = setTimeout(() => dismiss(id), duration);
  emit();
  return id;
}
/** Imperative toast helper; requires a mounted Toaster. */
export const toast = Object.assign((title, opts) => push('default', title, opts), {
  success: (title, opts) => push('success', title, opts),
  error: (title, opts) => push('error', title, opts),
  warning: (title, opts) => push('warning', title, opts),
  info: (title, opts) => push('info', title, opts),
  loading: (title, opts) => push('loading', title, opts),
  dismiss,
});
export function Toast({ type = 'default', title, description, action, cancel, closeButton = false, onClose, style }) {
  const [hov, setHov] = React.useState(false);
  const icon = ICONS[type];
  const btn = { height: 24, padding: '0 8px', border: 0, borderRadius: 4, fontFamily: FONT, fontSize: 12, fontWeight: 500, cursor: 'pointer', flexShrink: 0 };
  return <div role="status" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, boxSizing: 'border-box', width: 356, padding: 16, background: 'var(--ui-background)', color: 'var(--ui-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', boxShadow: 'var(--ui-shadow-lg)', fontFamily: FONT, fontSize: 13, ...style }}>
    {icon && <span style={{ display: 'flex', width: 16, marginRight: 4, animation: type === 'loading' ? 'ui-spin 1s linear infinite' : undefined }}>{Ic(icon, 16)}</span>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{title}</div>
      {description && <div style={{ fontWeight: 400, lineHeight: 1.4, color: 'var(--ui-muted-foreground)' }}>{description}</div>}
    </div>
    {cancel && <button type="button" onClick={cancel.onClick} style={{ ...btn, background: 'var(--ui-muted)', color: 'var(--ui-muted-foreground)' }}>{cancel.label}</button>}
    {action && <button type="button" onClick={action.onClick} style={{ ...btn, background: 'var(--ui-primary)', color: 'var(--ui-primary-foreground)' }}>{action.label}</button>}
    {closeButton && <button type="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 0, left: 0, transform: 'translate(-35%, -35%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, padding: 0, background: 'var(--ui-background)', color: 'var(--ui-foreground)', border: '1px solid var(--ui-border)', borderRadius: '50%', cursor: 'pointer', opacity: hov ? 1 : 0, transition: 'opacity 150ms' }}>{Ic('x', 12)}</button>}
  </div>;
}
export function Toaster({ position = 'bottom-right', closeButton = true, inline = false, style }) {
  const list = React.useSyncExternalStore(l => { listeners.add(l); return () => listeners.delete(l); }, () => items, () => items);
  const [v, hz] = position.split('-');
  const edge = { position: inline ? 'absolute' : 'fixed', zIndex: 999, display: 'flex', flexDirection: v === 'top' ? 'column' : 'column-reverse', gap: 14, [v === 'top' ? 'top' : 'bottom']: 24, ...(hz === 'left' ? { left: 24 } : hz === 'right' ? { right: 24 } : { left: '50%', transform: 'translateX(-50%)' }) };
  return <div style={{ ...edge, ...style }}>
    {list.map(t => <Toast key={t.id} {...t} closeButton={closeButton} onClose={() => dismiss(t.id)} />)}
  </div>;
}
