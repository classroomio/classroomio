import React from 'react';
export function Collapsible({ trigger, children, open, defaultOpen = false, onOpenChange, disabled = false, style }) {
  const [inner, setInner] = React.useState(defaultOpen);
  const isOpen = open ?? inner;
  const toggle = () => { if (disabled) return; const next = !isOpen; setInner(next); onOpenChange && onOpenChange(next); };
  const t = React.isValidElement(trigger) ? React.cloneElement(trigger, { 'aria-expanded': isOpen }) : trigger;
  return <div data-state={isOpen ? 'open' : 'closed'} style={{ fontFamily: 'var(--font-sans)', ...style }}>
    <span onClick={toggle} style={{ display: 'inline-flex', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>{t}</span>
    {isOpen && <div>{children}</div>}
  </div>;
}
