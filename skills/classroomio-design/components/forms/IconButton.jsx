import React from 'react';
import { Button } from './Button.jsx';
import { Tooltip } from '../overlays/Tooltip.jsx';
import { Kbd } from '../display/Kbd.jsx';
export function IconButton({ tooltip, tooltipSide = 'top', shortcut, variant = 'secondary', size = 'icon', children, ...rest }) {
  const button = <Button variant={variant} size={size} {...rest}>{children}</Button>;
  if (!tooltip) return button;
  const content = shortcut && shortcut.length
    ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>{tooltip}</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{shortcut.map((key) => <Kbd key={key}>{key}</Kbd>)}</span></span>
    : tooltip;
  return <Tooltip content={content} side={tooltipSide}>{button}</Tooltip>;
}
