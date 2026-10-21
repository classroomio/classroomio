import React from 'react';
import { Ic } from './uiShared.jsx';
import { Button } from './Button.jsx';
function Pop({ duration, children }) {
  const ref = React.useRef(null);
  React.useEffect(() => { ref.current && ref.current.animate && ref.current.animate([{ transform: 'scale(0.85)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration, easing: 'ease-out' }); }, []);
  return <span ref={ref} style={{ display: 'inline-flex' }}>{children}</span>;
}
export function CopyButton({ text, icon, animationDuration = 500, variant = 'ghost', size = 'icon', onCopy, children, style, ...rest }) {
  const [status, setStatus] = React.useState();
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    let next = 'success';
    try { await navigator.clipboard.writeText(text); } catch (e) { next = 'failure'; }
    setStatus(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(undefined), 500);
    onCopy && onCopy(next);
  };
  const resolved = size === 'icon' && children ? 'default' : size;
  const glyph = status === 'success' ? Ic('check', 16) : status === 'failure' ? Ic('x', 16) : icon || Ic('copy', 16);
  return <Button {...rest} variant={variant} size={resolved} tabIndex={-1} name="copy" aria-label={status === 'success' ? 'Copied' : status === 'failure' ? 'Failed to copy' : 'Copy'} onClick={copy} style={style}>
    <Pop key={status || 'idle'} duration={animationDuration}>{glyph}</Pop>
    {children}
  </Button>;
}
