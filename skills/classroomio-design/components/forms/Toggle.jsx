import React from 'react';
import { useInteract, FONT } from './uiShared.jsx';
const SZ = { default: [36, 8], sm: [32, 6], lg: [40, 10] };
export function Toggle({ pressed, defaultPressed = false, onChange, variant = 'default', size = 'default', disabled, children, style, ...rest }) {
  const [inner, setInner] = React.useState(defaultPressed);
  const on = pressed !== undefined ? pressed : inner;
  const { hover, focus, bind } = useInteract();
  const [h, px] = SZ[size] || SZ.default;
  return <button type="button" aria-pressed={on} disabled={disabled} onClick={() => { setInner(!on); onChange && onChange(!on); }} {...bind} {...rest}
    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: h, minWidth: h, padding: `0 ${px}px`, boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', fontFamily: FONT, fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', cursor: 'pointer', outline: 'none', transition: 'color 150ms, box-shadow 150ms', opacity: disabled ? 0.5 : 1,
      border: variant === 'outline' ? '1px solid var(--ui-input)' : '1px solid transparent', boxShadow: focus ? 'var(--ui-focus-ring)' : variant === 'outline' ? 'var(--ui-shadow-xs)' : 'none',
      background: on ? 'var(--ui-accent)' : hover ? (variant === 'outline' ? 'var(--ui-accent)' : 'var(--ui-muted)') : 'transparent',
      color: on ? 'var(--ui-accent-foreground)' : hover && variant !== 'outline' ? 'var(--ui-muted-foreground)' : 'var(--ui-foreground)', ...style }}>{children}</button>;
}
export function ToggleGroup({ items = [], value, defaultValue, onChange, type = 'single', variant = 'default', size = 'default', style }) {
  const [inner, setInner] = React.useState(defaultValue ?? (type === 'multiple' ? [] : undefined));
  const cur = value !== undefined ? value : inner;
  const isOn = (v) => type === 'multiple' ? (cur || []).includes(v) : cur === v;
  const set = (v) => { const n = type === 'multiple' ? (isOn(v) ? cur.filter(x => x !== v) : [...(cur || []), v]) : (cur === v ? undefined : v); setInner(n); onChange && onChange(n); };
  return <div role="group" style={{ display: 'flex', width: 'fit-content', alignItems: 'center', borderRadius: 'var(--ui-radius-md)', boxShadow: variant === 'outline' ? 'var(--ui-shadow-xs)' : 'none', ...style }}>
    {items.map((it, i) => <Toggle key={it.value} variant={variant} size={size} pressed={isOn(it.value)} onChange={() => set(it.value)} aria-label={it.ariaLabel}
      style={{ flex: 1, minWidth: 0, boxShadow: 'none', borderRadius: i === 0 ? 'var(--ui-radius-md) 0 0 var(--ui-radius-md)' : i === items.length - 1 ? '0 var(--ui-radius-md) var(--ui-radius-md) 0' : 0, borderLeftWidth: variant === 'outline' && i > 0 ? 0 : undefined }}>{it.label}</Toggle>)}
  </div>;
}