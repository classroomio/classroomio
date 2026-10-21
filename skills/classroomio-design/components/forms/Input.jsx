import React from 'react';
import { useInteract, FONT, focusStyle } from './uiShared.jsx';
export function Input({ type = 'text', value, defaultValue, onChange, placeholder, disabled, invalid, style, ...rest }) {
  const { focus, bind } = useInteract();
  return <input type={type} value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder} disabled={disabled} aria-invalid={invalid || undefined} {...bind} {...rest}
    style={{ display: 'flex', height: 36, width: '100%', minWidth: 0, boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', border: '1px solid var(--ui-input)', background: 'var(--ui-background)', padding: '4px 12px', fontFamily: FONT, fontSize: 14, color: 'var(--ui-foreground)', boxShadow: 'var(--ui-shadow-xs)', outline: 'none', transition: 'color 150ms, box-shadow 150ms', cursor: disabled ? 'not-allowed' : undefined, opacity: disabled ? 0.5 : 1, ...focusStyle(focus, invalid), ...style }}/>;
}