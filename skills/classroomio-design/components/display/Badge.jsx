import React from 'react';
const V = {
  default: { background: 'var(--ui-primary)', color: 'var(--ui-primary-foreground)', borderColor: 'transparent' },
  secondary: { background: 'var(--ui-secondary)', color: 'var(--ui-secondary-foreground)', borderColor: 'transparent' },
  destructive: { background: 'var(--ui-destructive)', color: '#fff', borderColor: 'transparent' },
  warning: { background: '#D97706', color: '#fff', borderColor: 'transparent' },
  success: { background: '#059669', color: '#fff', borderColor: 'transparent' },
  outline: { background: 'transparent', color: 'var(--ui-foreground)', borderColor: 'var(--ui-border)' },
};
export function Badge({ variant = 'default', href, children, style }) {
  const Tag = href ? 'a' : 'span';
  return <Tag href={href} style={{ display: 'inline-flex', width: 'fit-content', flexShrink: 0, alignItems: 'center', justifyContent: 'center', gap: 4, overflow: 'hidden', whiteSpace: 'nowrap', borderRadius: 999, border: '1px solid', padding: '2px 8px', fontFamily: 'var(--font-sans)', fontSize: 12, lineHeight: '16px', fontWeight: 500, textDecoration: 'none', ...(V[variant] || V.default), ...style }}>{children}</Tag>;
}