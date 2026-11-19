import React from 'react';
import { Ic, useInteract } from './uiShared.jsx';
export function Checkbox({ checked, defaultChecked = false, indeterminate = false, onChange, disabled, invalid, id, label, style }) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const { focus, bind } = useInteract();
  const filled = on || indeterminate;
  const box = <button type="button" role="checkbox" id={id} aria-checked={indeterminate ? 'mixed' : on} disabled={disabled} onClick={() => { setInner(!on); onChange && onChange(!on); }} {...bind}
    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, padding: 0, flexShrink: 0, boxSizing: 'border-box', borderRadius: 4, border: '1px solid ' + (invalid ? 'var(--ui-destructive)' : filled ? 'var(--ui-primary)' : 'var(--ui-input)'), background: filled ? 'var(--ui-primary)' : 'var(--ui-background)', color: 'var(--ui-primary-foreground)', boxShadow: focus ? 'var(--ui-focus-ring)' : 'var(--ui-shadow-xs)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, outline: 'none', transition: 'box-shadow 150ms' }}>
    {on ? Ic('check', 14) : indeterminate ? Ic('minus', 14) : null}
  </button>;
  if (!label) return React.cloneElement(box, { style: { ...box.props.style, ...style } });
  return <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--ui-foreground)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, ...style }}>{box}{label}</label>;
}