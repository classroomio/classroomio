import React from 'react';
import { Ic, useInteract, FONT } from './uiShared.jsx';
import { BlockGlyph } from '../loading/BlockLoader.jsx';
const SIZES = {
  default: { height: 36, padding: '8px 16px', iconPad: '8px 12px' },
  sm: { height: 32, padding: '0 12px', iconPad: '0 10px', gap: 6 },
  xs: { height: 28, padding: '0 10px', iconPad: '0 8px', gap: 4, fontSize: 12 },
  lg: { height: 40, padding: '0 24px', iconPad: '0 16px' },
  icon: { width: 36, height: 36, padding: 0 }, 'icon-2xs': { width: 16, height: 16, padding: 0 }, 'icon-xs': { width: 24, height: 24, padding: 0 }, 'icon-sm': { width: 32, height: 32, padding: 0 }, 'icon-lg': { width: 40, height: 40, padding: 0 },
};
function variantStyle(v, hover) {
  switch (v) {
    case 'light-default': return { background: hover ? 'rgba(2,51,189,0.3)' : 'var(--ui-primary-soft)', color: 'var(--ui-primary)', boxShadow: 'var(--ui-shadow-2xs)' };
    case 'destructive': return { background: 'var(--ui-destructive)', color: '#fff', opacity: hover ? 0.9 : 1, boxShadow: 'var(--ui-shadow-2xs)' };
    case 'outline': return { background: hover ? 'var(--ui-accent)' : 'var(--ui-background)', color: hover ? 'var(--ui-accent-foreground)' : 'var(--ui-foreground)', border: '1px solid var(--ui-border)', boxShadow: 'var(--ui-shadow-2xs)' };
    case 'secondary': return { background: hover ? 'color-mix(in oklab, var(--ui-secondary) 80%, transparent)' : 'var(--ui-secondary)', color: 'var(--ui-secondary-foreground)', boxShadow: 'var(--ui-shadow-2xs)' };
    case 'ghost': return { background: hover ? 'var(--ui-accent)' : 'transparent', color: 'var(--ui-foreground)' };
    case 'ghost-default': return { background: hover ? 'var(--ui-accent)' : 'transparent', color: 'var(--ui-primary)' };
    case 'ghost-outline': return { background: hover ? 'var(--ui-accent)' : 'var(--ui-background)', color: 'var(--ui-foreground)', border: hover ? '1px solid var(--ui-border)' : '1px solid transparent', boxShadow: hover ? 'var(--ui-shadow-2xs)' : 'none' };
    case 'link': return { background: 'transparent', color: 'var(--ui-primary)', textDecoration: hover ? 'underline' : 'none', textUnderlineOffset: 4 };
    default: return { background: hover ? 'var(--ui-primary-hover)' : 'var(--ui-primary)', color: 'var(--ui-primary-foreground)', boxShadow: 'var(--ui-shadow-2xs)' };
  }
}
export function Button({ variant = 'default', size = 'default', href, type = 'button', loading = false, disabled = false, onClick, children, style, ...rest }) {
  const { hover, focus, bind } = useInteract();
  const s = SIZES[size] || SIZES.default;
  const hasIcon = React.Children.toArray(children).some(c => c && c.type === 'svg');
  const isIcon = size.startsWith('icon');
  const Tag = href ? 'a' : 'button';
  const base = { position: 'relative', display: 'inline-flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', gap: s.gap ?? 8, overflow: 'hidden', borderRadius: 'var(--ui-radius-md)', fontFamily: FONT, fontSize: s.fontSize ?? 14, fontWeight: 500, lineHeight: '20px', whiteSpace: 'nowrap', border: '1px solid transparent', cursor: disabled || loading ? 'not-allowed' : 'pointer', userSelect: 'none', transition: 'all 150ms', textDecoration: 'none', boxSizing: 'border-box', outline: 'none', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : undefined, height: s.height, width: s.width, padding: !isIcon && hasIcon ? s.iconPad : s.padding };
  const v = variantStyle(variant, hover && !disabled);
  const ring = focus ? { boxShadow: 'var(--ui-focus-ring)', borderColor: 'var(--ui-ring)' } : null;
  return <Tag href={disabled ? undefined : href} type={href ? undefined : type} disabled={!href ? disabled || loading : undefined} aria-disabled={disabled || undefined} onClick={onClick} {...bind} {...rest} style={{ ...base, ...v, ...ring, ...style }}>
    {loading && <BlockGlyph size={14} color={['default','destructive'].includes(variant) ? '#FFFFFF' : 'var(--ui-primary)'} bg={variant === 'default' ? 'var(--ui-primary)' : variant === 'destructive' ? 'var(--ui-destructive)' : 'var(--ui-background)'}/>}
    {children}
  </Tag>;
}