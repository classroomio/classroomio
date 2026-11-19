import React from 'react';
const V = { default: { background: 'transparent', borderColor: 'transparent' }, outline: { background: 'transparent', borderColor: 'var(--ui-border)' }, muted: { background: 'color-mix(in oklab, var(--ui-muted) 50%, transparent)', borderColor: 'transparent' }, 'muted-border': { background: 'color-mix(in oklab, var(--ui-muted) 50%, transparent)', borderColor: 'var(--ui-border)' } };
export function Item({ media, mediaVariant = 'default', title, description, actions, variant = 'default', size = 'default', href, onClick, style }) {
  const [hov, setHov] = React.useState(false);
  const Tag = href ? 'a' : 'div';
  const sm = size === 'sm';
  return <Tag href={href} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: sm ? 10 : 16, padding: sm ? '12px 16px' : 16, borderRadius: 'var(--ui-radius-md)', border: '1px solid', fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--ui-foreground)', textDecoration: 'none', cursor: 'pointer', transition: 'background 100ms', ...(V[variant] || V.default), ...(hov && (href || onClick) ? { background: 'color-mix(in oklab, var(--ui-accent) 50%, transparent)' } : null), ...style }}>
    {media && <div style={mediaVariant === 'icon' ? { display: 'flex', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--ui-radius-sm)', border: '1px solid var(--ui-border)', background: 'var(--ui-muted)', flexShrink: 0 } : { display: 'flex', flexShrink: 0 }}>{media}</div>}
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {title && <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, lineHeight: 1.375 }}>{title}</div>}
      {description && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'var(--ui-muted-foreground)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{description}</p>}
    </div>
    {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{actions}</div>}
  </Tag>;
}