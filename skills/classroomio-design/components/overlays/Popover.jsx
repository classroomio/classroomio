import React from 'react';
import { useOutside } from '../forms/uiShared.jsx';
export function Popover({ trigger, children, align = 'center', width = 288, defaultOpen = false, style }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const ref = React.useRef(null);
  useOutside(ref, open, () => setOpen(false));
  const x = align === 'start' ? { left: 0 } : align === 'end' ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' };
  return <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
    <span onClick={() => setOpen(!open)} style={{ display: 'inline-flex' }}>{trigger}</span>
    {open && <div style={{ position: 'absolute', top: '100%', marginTop: 4, ...x, zIndex: 250 }}>
      <div style={{ width, boxSizing: 'border-box', background: 'var(--ui-popover)', color: 'var(--ui-popover-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', padding: 16, boxShadow: 'var(--ui-shadow-md)', fontFamily: 'var(--font-sans)', fontSize: 14, animation: 'ui-pop-in 120ms ease-out', ...style }}>{children}</div>
    </div>}
  </div>;
}