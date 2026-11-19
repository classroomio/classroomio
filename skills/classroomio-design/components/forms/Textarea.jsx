import React from 'react';
import { useInteract, FONT, focusStyle } from './uiShared.jsx';
export function Textarea({ value, defaultValue, onChange, placeholder, disabled, invalid, rows = 3, style, ...rest }) {
  const { focus, bind } = useInteract();
  return <textarea value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder} disabled={disabled} rows={rows} aria-invalid={invalid || undefined} {...bind} {...rest}
    style={{ display: 'flex', minHeight: 64, width: '100%', boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', border: '1px solid var(--ui-input)', background: 'transparent', padding: '8px 12px', fontFamily: FONT, fontSize: 14, lineHeight: '20px', color: 'var(--ui-foreground)', outline: 'none', resize: 'vertical', transition: 'color 150ms, box-shadow 150ms', opacity: disabled ? 0.5 : 1, ...focusStyle(focus, invalid), ...style }}/>;
}