import React from 'react';
export function Tooltip({ content, side = 'top', children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const pos = { top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 6 }, bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 }, left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 6 }, right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 6 } }[side];
  const arrow = { top: { bottom: -4, left: '50%', marginLeft: -5 }, bottom: { top: -4, left: '50%', marginLeft: -5 }, left: { right: -4, top: '50%', marginTop: -5 }, right: { left: -4, top: '50%', marginTop: -5 } }[side];
  return <span style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
    {children}
    {open && <span role="tooltip" style={{ position: 'absolute', ...pos, zIndex: 250, width: 'max-content', maxWidth: 260, textWrap: 'balance', background: 'var(--ui-primary)', color: 'var(--ui-primary-foreground)', borderRadius: 'var(--ui-radius-md)', padding: '6px 12px', fontFamily: 'var(--font-sans)', fontSize: 12, lineHeight: '16px', animation: 'ui-fade-in 120ms', pointerEvents: 'none' }}>
      {content}<span style={{ position: 'absolute', ...arrow, width: 10, height: 10, background: 'var(--ui-primary)', borderRadius: 2, transform: 'rotate(45deg)' }}/>
    </span>}
  </span>;
}