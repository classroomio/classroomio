import React from 'react';
import { FONT } from './uiShared.jsx';
import { Checkbox } from './Checkbox.jsx';
export function optionCardStyle(on, hover) {
  return { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', border: '1px solid ' + (on ? 'var(--ui-primary)' : 'var(--ui-border)'), background: on || hover ? 'color-mix(in oklab, var(--ui-primary) 5%, transparent)' : 'transparent', fontFamily: FONT, color: 'var(--ui-foreground)', lineHeight: 1.375, cursor: 'pointer', transition: 'background-color 200ms' };
}
export function OptionCardText({ title, description, titleSuffix }) {
  return <div style={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column', gap: 6 }}>
    <div style={{ display: 'flex', width: 'fit-content', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, lineHeight: 1.375 }}>{title}{titleSuffix}</div>
    {description && <p style={{ margin: 0, fontSize: 14, fontWeight: 400, lineHeight: 1.5, color: 'var(--ui-muted-foreground)', textWrap: 'balance' }}>{description}</p>}
  </div>;
}
export function CheckboxOptionCard({ id, title, description, checked, defaultChecked = false, disabled = false, onChange, titleSuffix, leading, footer, style }) {
  const [inner, setInner] = React.useState(defaultChecked);
  const [hover, setHover] = React.useState(false);
  const on = checked !== undefined ? checked : inner;
  return <label htmlFor={id} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ ...optionCardStyle(on, hover), ...style }}>
    <div role="group" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 16 }}>
      {leading}
      <OptionCardText title={title} description={description} titleSuffix={titleSuffix}/>
      <span style={{ display: 'flex', marginTop: 1 }}><Checkbox id={id} checked={on} disabled={disabled} onChange={(v) => { setInner(v); onChange && onChange(v); }}/></span>
    </div>
    {footer && <div style={{ marginTop: -4, minWidth: 0, padding: '0 16px 12px' }}>{footer}</div>}
  </label>;
}
export function CheckboxOptionCardGroup({ options = [], value, defaultValue = [], onChange, columns = 1, titleSuffix, leading, footer, style }) {
  const [inner, setInner] = React.useState(defaultValue);
  const cur = value !== undefined ? value : inner;
  const toggle = (v, isOn) => {
    const next = isOn ? (cur.includes(v) ? cur : [...cur, v]) : cur.filter((x) => x !== v);
    setInner(next); onChange && onChange(next);
  };
  return <div role="group" style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, ...style }}>
    {options.map((o) => <CheckboxOptionCard key={o.id} id={o.id} title={o.title} description={o.description} disabled={o.disabled}
      checked={cur.includes(o.value)} onChange={(isOn) => toggle(o.value, isOn)}
      titleSuffix={titleSuffix && titleSuffix(o)} leading={leading && leading(o)} footer={footer && footer(o)}/>)}
  </div>;
}
