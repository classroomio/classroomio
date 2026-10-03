import React from 'react';
import { useInteract, FONT } from './uiShared.jsx';
export function InputGroup({ start, end, placeholder, value, defaultValue, onChange, type = 'text', invalid, style, inputProps }) {
  const { focus, bind } = useInteract();
  const ring = invalid ? { borderColor: 'var(--ui-destructive)' } : focus ? { borderColor: 'var(--ui-ring)', boxShadow: 'var(--ui-focus-ring)' } : null;
  const addon = (c, side) => c && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: side === 's' ? '6px 0 6px 12px' : '6px 12px 6px 0', fontSize: 14, fontWeight: 500, color: 'var(--ui-muted-foreground)', whiteSpace: 'nowrap' }}>{c}</div>;
  return <div role="group" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', height: 36, boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', border: '1px solid var(--ui-input)', background: 'var(--ui-background)', boxShadow: 'var(--ui-shadow-xs)', transition: 'box-shadow 150ms', ...ring, ...style }}>
    {addon(start, 's')}
    <input type={type} placeholder={placeholder} value={value} defaultValue={defaultValue} onChange={onChange} {...bind} {...inputProps} style={{ flex: 1, minWidth: 0, height: '100%', border: 0, background: 'transparent', outline: 'none', padding: `0 ${end ? 8 : 12}px 0 ${start ? 8 : 12}px`, fontFamily: FONT, fontSize: 14, color: 'var(--ui-foreground)' }}/>
    {addon(end, 'e')}
  </div>;
}