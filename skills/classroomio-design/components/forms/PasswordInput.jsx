import React from 'react';
import { InputGroup } from './InputGroup.jsx';
import { Ic } from './uiShared.jsx';
function strength(v) { let s = 0; if (v.length >= 8) s++; if (/[A-Z]/.test(v)) s++; if (/[0-9]/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v)) s++; return s; }
export function PasswordInput({ value, defaultValue = '', onChange, placeholder = 'Password', showStrength = false, style }) {
  const [show, setShow] = React.useState(false);
  const [v, setV] = React.useState(value ?? defaultValue);
  const val = value ?? v;
  const s = strength(val);
  const toggle = <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} style={{ border: 0, background: 'transparent', padding: 4, margin: '0 -4px', display: 'flex', cursor: 'pointer', color: 'var(--ui-muted-foreground)' }}>{Ic(show ? 'eyeOff' : 'eye', 16)}</button>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
    <InputGroup type={show ? 'text' : 'password'} placeholder={placeholder} value={val} onChange={e => { setV(e.target.value); onChange && onChange(e); }} end={toggle}/>
    {showStrength && <div style={{ display: 'flex', gap: 4 }}>{[0,1,2,3].map(i => <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < s ? (s < 2 ? 'var(--ui-destructive)' : s < 4 ? 'var(--ui-warning)' : 'var(--ui-success)') : 'var(--ui-muted)' }}/>)}</div>}
  </div>;
}