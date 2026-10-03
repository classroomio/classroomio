import React from 'react';
import { useInteract } from './uiShared.jsx';
export function Switch({ checked, defaultChecked = false, onChange, disabled, id, label, style }) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const { focus, bind } = useInteract();
  const sw = <button type="button" role="switch" id={id} aria-checked={on} disabled={disabled} onClick={() => { setInner(!on); onChange && onChange(!on); }} {...bind}
    style={{ display: 'inline-flex', alignItems: 'center', width: 32, height: 18.4, padding: 0, flexShrink: 0, boxSizing: 'border-box', borderRadius: 999, border: '1px solid transparent', background: on ? 'var(--ui-primary)' : 'var(--ui-input)', boxShadow: focus ? 'var(--ui-focus-ring)' : 'var(--ui-shadow-xs)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, outline: 'none', transition: 'all 150ms' }}>
    <span style={{ display: 'block', width: 16, height: 16, borderRadius: '50%', background: 'var(--ui-background)', transform: on ? 'translateX(14px)' : 'translateX(0)', transition: 'transform 150ms' }}/>
  </button>;
  if (!label) return React.cloneElement(sw, { style: { ...sw.props.style, ...style } });
  return <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--ui-foreground)', cursor: 'pointer', ...style }}>{sw}{label}</label>;
}