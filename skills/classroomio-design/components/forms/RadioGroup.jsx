import React from 'react';
export function RadioGroup({ options = [], value, defaultValue, onChange, orientation = 'vertical', disabled, style }) {
  const [inner, setInner] = React.useState(defaultValue);
  const cur = value !== undefined ? value : inner;
  const [focusIdx, setFocusIdx] = React.useState(-1);
  return <div role="radiogroup" style={{ display: 'grid', gap: 12, gridAutoFlow: orientation === 'horizontal' ? 'column' : 'row', justifyContent: 'start', ...style }}>
    {options.map((o, i) => { const on = o.value === cur; const dis = disabled || o.disabled;
      return <label key={o.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--ui-foreground)', cursor: dis ? 'not-allowed' : 'pointer', opacity: dis ? 0.5 : 1 }}>
        <button type="button" role="radio" aria-checked={on} disabled={dis} onClick={() => { setInner(o.value); onChange && onChange(o.value); }} onFocus={() => setFocusIdx(i)} onBlur={() => setFocusIdx(-1)}
          style={{ position: 'relative', width: 16, height: 16, padding: 0, flexShrink: 0, boxSizing: 'border-box', borderRadius: '50%', border: '1px solid var(--ui-input)', background: 'var(--ui-background)', boxShadow: focusIdx === i ? 'var(--ui-focus-ring)' : 'var(--ui-shadow-xs)', cursor: 'inherit', outline: 'none' }}>
          {on && <span style={{ position: 'absolute', left: '50%', top: '50%', width: 8, height: 8, borderRadius: '50%', background: 'var(--ui-primary)', transform: 'translate(-50%,-50%)' }}/>}
        </button>{o.label}
      </label>; })}
  </div>;
}