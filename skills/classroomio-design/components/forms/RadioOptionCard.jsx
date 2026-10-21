import React from 'react';
import { FONT } from './uiShared.jsx';
import { optionCardStyle, OptionCardText } from './CheckboxOptionCard.jsx';
import { Input } from './Input.jsx';
const RadioCtx = React.createContext(null);
function RadioDot({ id, on, disabled, onSelect, label }) {
  const [focus, setFocus] = React.useState(false);
  return <button type="button" role="radio" id={id} aria-checked={on} aria-label={label} disabled={disabled} onClick={onSelect} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
    style={{ position: 'relative', width: 16, height: 16, padding: 0, flexShrink: 0, boxSizing: 'border-box', borderRadius: '50%', border: '1px solid var(--ui-input)', background: 'var(--ui-background)', boxShadow: focus ? 'var(--ui-focus-ring)' : 'var(--ui-shadow-xs)', cursor: 'inherit', outline: 'none', opacity: disabled ? 0.5 : 1 }}>
    {on && <span style={{ position: 'absolute', left: '50%', top: '50%', width: 8, height: 8, borderRadius: '50%', background: 'var(--ui-primary)', transform: 'translate(-50%,-50%)' }}/>}
  </button>;
}
function useRadio(value, checked, onSelect) {
  const ctx = React.useContext(RadioCtx);
  return { on: checked !== undefined ? checked : !!ctx && ctx.value === value, select: () => { if (onSelect) onSelect(value); else if (ctx) ctx.select(value); } };
}
/** Radio cards and RadioItem rows read their selection from this group. */
export function RadioOptionCardGroup({ options, value, defaultValue = '', onChange, onConfirm, columns = 2, titleSuffix, style, children }) {
  const [inner, setInner] = React.useState(defaultValue);
  const cur = value !== undefined ? value : inner;
  const select = (v) => { setInner(v); onChange && onChange(v); };
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' || e.repeat) return;
    e.preventDefault();
    if (onConfirm) onConfirm(); else { const form = e.currentTarget.closest('form'); form && form.requestSubmit(); }
  };
  return <RadioCtx.Provider value={{ value: cur, select }}>
    <div role="radiogroup" onKeyDown={onKeyDown} style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, ...style }}>
      {options ? options.map((o) => <RadioOptionCard key={o.id} id={o.id} title={o.title} description={o.description} value={o.value} disabled={o.disabled} titleSuffix={titleSuffix && titleSuffix(o)}/>) : children}
    </div>
  </RadioCtx.Provider>;
}
export function RadioOptionCard({ id, title, description, value, checked, onSelect, disabled = false, titleSuffix, style }) {
  const [hover, setHover] = React.useState(false);
  const { on, select } = useRadio(value, checked, onSelect);
  return <label htmlFor={id} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ ...optionCardStyle(on, hover), ...style }}>
    <div role="group" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16 }}>
      <OptionCardText title={title} description={description} titleSuffix={titleSuffix}/>
      <span style={{ display: 'flex', marginTop: 1 }}><RadioDot id={id} on={on} disabled={disabled} label={title} onSelect={select}/></span>
    </div>
  </label>;
}
export function RadioItem({ label = '', value, checked, onSelect, isEditable = false, onLabelChange, disabled = false, children, style }) {
  const { on, select } = useRadio(value, checked, onSelect);
  return <div style={{ display: 'inline-flex', width: '100%', alignItems: 'center', fontFamily: FONT, cursor: disabled ? 'not-allowed' : 'pointer', ...style }} onClick={() => !disabled && !isEditable && select()}>
    <RadioDot on={on} disabled={disabled || isEditable} label={label} onSelect={select}/>
    {isEditable
      ? <div style={{ width: '50%', marginLeft: 4 }}><Input defaultValue={label} placeholder="Your option" onChange={(e) => onLabelChange && onLabelChange(e.target.value)}/></div>
      : <span style={{ marginLeft: 8, fontSize: 14, color: 'var(--ui-foreground)' }}>{label}</span>}
    {children}
  </div>;
}
