import React from 'react';
import { Button } from './Button.jsx';
import { Ic } from './uiShared.jsx';
export function BackButton({ href, label, style, ...rest }) {
  return <Button variant="link" href={href} style={{ height: 'fit-content', justifyContent: 'flex-start', padding: 0, ...style }} {...rest}>
    {Ic('arrowLeft', 16)}
    {label && <span style={{ fontSize: 12 }}>{label}</span>}
  </Button>;
}
