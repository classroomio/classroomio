import React from 'react';
import { FONT } from '../forms/uiShared.jsx';

const V = { default: { background: 'transparent' }, outline: { background: 'transparent' }, muted: { background: 'color-mix(in oklab, var(--ui-muted) 50%, transparent)' }, 'muted-border': { background: 'color-mix(in oklab, var(--ui-muted) 50%, transparent)' } };

/** Bordered list container; rows drop their own outer border and separate with a bottom rule. */
export function ResourceListGroup({ children, style }) {
  const items = React.Children.toArray(children);
  return <div role="list" style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box', borderRadius: 'var(--ui-radius-md)', border: '1px solid var(--ui-border)', overflow: 'hidden', ...style }}>
    {items.map((child, i) => React.isValidElement(child) && child.type === ResourceListRow ? React.cloneElement(child, { isLast: i === items.length - 1 }) : child)}
  </div>;
}

export function ResourceListRow({ variant = 'outline', size = 'sm', align = 'center', density = 'default', href, onClick, isLast, children, style }) {
  const [hov, setHov] = React.useState(false);
  const Tag = href ? 'a' : 'div';
  const sm = size === 'sm';
  const toolbar = density === 'toolbar';
  const pad = toolbar ? '6px 16px' : sm ? '12px 16px' : 16;
  const gap = toolbar ? 8 : sm ? 10 : 16;
  const border = variant === 'outline' || variant === 'muted-border' ? 'var(--ui-border)' : 'transparent';
  return <Tag role="listitem" href={href} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
    style={{ display: 'flex', flexWrap: 'nowrap', alignItems: align === 'start' ? 'flex-start' : 'center', gap, padding: pad, boxSizing: 'border-box', border: 0, borderBottom: isLast ? 0 : `1px solid ${border === 'transparent' ? 'var(--ui-border)' : border}`, borderRadius: 0, fontFamily: FONT, fontSize: 14, color: 'var(--ui-foreground)', textDecoration: 'none', cursor: 'pointer', transition: 'background 100ms', ...V[variant], ...(hov ? { background: 'color-mix(in oklab, var(--ui-muted) 50%, transparent)' } : null), ...style }}>{children}</Tag>;
}

export function ResourceListRowLead({ children, style }) {
  return <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', ...style }}>{children}</div>;
}

export function ResourceListRowMain({ children, style }) {
  return <div style={{ display: 'flex', flex: 1, minWidth: 0, flexDirection: 'column', gap: 2, ...style }}>{children}</div>;
}

export function ResourceListRowEnd({ children, style }) {
  return <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', justifyContent: 'flex-end', gap: 8, alignSelf: 'center', ...style }}>{children}</div>;
}
