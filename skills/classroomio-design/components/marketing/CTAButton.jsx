import React from 'react';
// Geometry = app Button (packages/ui/src/base/button): sm 32 · md 36 · lg 40, 8px radius, 14px/500.
const SIZES = { sm: { height: 32, padding: '0 12px', fontSize: 14, borderRadius: 8 }, md: { height: 36, padding: '0 16px', fontSize: 14, borderRadius: 8 }, lg: { height: 40, padding: '0 24px', fontSize: 14, borderRadius: 8 } };
const VARIANTS = {
  primary: { background: 'var(--blue-700)', color: '#FFFFFF', border: '1px solid transparent' },
  secondary: { background: 'var(--paper)', color: 'var(--ink-900)', border: '1px solid var(--sand-300)' },
  inverse: { background: '#FFFFFF', color: 'var(--blue-700)', border: '1px solid transparent' },
  outlineOnBlue: { background: 'transparent', color: '#FFFFFF', border: '1px solid rgba(255,255,255,0.4)' },
  link: { background: 'transparent', color: 'var(--blue-700)', border: 0, padding: 0 },
};
export function CTAButton({ variant = 'primary', size = 'md', href, onClick, icon, disabled, children, style }) {
  const [hover, setHover] = React.useState(false);
  const Tag = href ? 'a' : 'button';
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = variant === 'link' ? { fontSize: SIZES[size].fontSize } : SIZES[size];
  return <Tag href={href} onClick={onClick} disabled={disabled} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-sans)', fontWeight: 500, boxSizing: 'border-box', justifyContent: 'center', cursor: disabled ? 'not-allowed' : 'pointer', textDecoration: 'none', lineHeight: 1.2, transition: 'filter 160ms, background 160ms', opacity: disabled ? 0.45 : 1, filter: hover && !disabled && variant !== 'link' ? 'brightness(0.94)' : 'none', ...s, ...v, ...style }}>
    {children}{icon && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ transform: hover ? 'translateX(2px)' : 'none', transition: 'transform 160ms' }}><path d="M5 12h14M13 6l6 6-6 6"/></svg>}
  </Tag>;
}