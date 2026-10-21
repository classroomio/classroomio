import React from 'react';
export function HoverCard({ trigger, children, side = 'bottom', align = 'center', width = 256, openDelay = 700, closeDelay = 300, defaultOpen = false, style }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const timer = React.useRef(null);
  const schedule = (next, delay) => { clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(next), delay); };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const x = align === 'start' ? { left: 0 } : align === 'end' ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' };
  const y = side === 'top' ? { bottom: '100%', paddingBottom: 16 } : { top: '100%', paddingTop: 16 };
  return <span style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => schedule(true, openDelay)} onMouseLeave={() => schedule(false, closeDelay)} onFocus={() => schedule(true, 0)} onBlur={() => schedule(false, closeDelay)}>
    <span style={{ display: 'inline-flex', cursor: 'pointer' }}>{trigger}</span>
    {open && <div style={{ position: 'absolute', ...y, ...x, zIndex: 250 }}>
      <div style={{ width, boxSizing: 'border-box', background: 'var(--ui-popover)', color: 'var(--ui-popover-foreground)', border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius-md)', padding: 16, boxShadow: 'var(--ui-shadow-md)', fontFamily: 'var(--font-sans)', fontSize: 14, animation: 'ui-pop-in 120ms ease-out', ...style }}>{children}</div>
    </div>}
  </span>;
}
