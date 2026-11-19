import React from 'react';
import { Ic, useInteract, FONT } from '../forms/uiShared.jsx';

const SidebarCtx = React.createContext(null);
const useSidebar = () => React.useContext(SidebarCtx) || { state: 'expanded', open: true, setOpen() {}, toggle() {}, collapsible: 'offcanvas' };

const SB = {
  bg: 'var(--ui-muted)',
  fg: 'var(--ui-foreground)',
  accent: 'var(--ui-secondary)',
  border: 'var(--ui-border)',
  ring: 'var(--ui-ring)',
};
const WIDTH = '16rem';
const WIDTH_ICON = '3rem';
const COOKIE = 'sidebar:state';

export function SidebarProvider({ open, defaultOpen = true, onOpenChange, style, children }) {
  const [inner, setInner] = React.useState(defaultOpen);
  const cur = open !== undefined ? open : inner;
  const setOpen = (v) => {
    setInner(v);
    onOpenChange && onOpenChange(v);
    try { document.cookie = `${COOKIE}=${v}; path=/; max-age=${60 * 60 * 24 * 7}`; } catch (e) {}
  };
  const toggle = () => setOpen(!cur);
  React.useEffect(() => {
    const f = (e) => { if (e.key === 'b' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); toggle(); } };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });
  const [config, setConfig] = React.useState({ collapsible: 'offcanvas', variant: 'sidebar', side: 'left' });
  const value = { open: cur, state: cur ? 'expanded' : 'collapsed', setOpen, toggle, ...config, setConfig };
  return <SidebarCtx.Provider value={value}>
    <div data-slot="sidebar-wrapper" style={{ '--sidebar-width': WIDTH, '--sidebar-width-icon': WIDTH_ICON, display: 'flex', width: '100%', maxHeight: '100svh', fontFamily: FONT, background: config.variant === 'inset' ? SB.bg : undefined, ...style }}>{children}</div>
  </SidebarCtx.Provider>;
}

/** side/variant/collapsible mirror the Svelte props; `inline` keeps the sidebar in flow instead of position: fixed. */
export function Sidebar({ side = 'left', variant = 'sidebar', collapsible = 'offcanvas', inline = false, style, children }) {
  const ctx = useSidebar();
  React.useEffect(() => { ctx.setConfig && ctx.setConfig({ side, variant, collapsible }); }, [side, variant, collapsible]);
  const collapsed = ctx.state === 'collapsed';
  const floating = variant === 'floating' || variant === 'inset';
  if (collapsible === 'none') return <div style={{ display: 'flex', height: '100%', width: WIDTH, flexDirection: 'column', background: SB.bg, color: SB.fg, ...style }}>{children}</div>;
  const iconW = floating ? 'calc(var(--sidebar-width-icon) + 16px + 2px)' : 'var(--sidebar-width-icon)';
  const gapW = collapsed ? (collapsible === 'offcanvas' ? 0 : iconW) : 'var(--sidebar-width)';
  const contW = collapsed && collapsible === 'icon' ? iconW : 'var(--sidebar-width)';
  const edge = collapsed && collapsible === 'offcanvas' ? 'calc(var(--sidebar-width) * -1)' : 0;
  return <div data-state={ctx.state} data-collapsible={collapsed ? collapsible : ''} data-variant={variant} data-side={side} data-slot="sidebar" style={{ color: SB.fg, flexShrink: 0, position: inline ? 'relative' : undefined }}>
    <div style={{ position: 'relative', background: 'transparent', width: gapW, transform: side === 'right' ? 'rotate(180deg)' : undefined, transition: 'width 200ms linear' }}/>
    <div data-slot="sidebar-container" style={{ position: inline ? 'absolute' : 'fixed', top: 0, bottom: 0, [side]: edge, zIndex: 100, display: 'flex', width: contW, maxHeight: '100svh', boxSizing: 'border-box', padding: floating ? 8 : 0, borderRight: !floating && side === 'left' ? `1px solid ${SB.border}` : undefined, borderLeft: !floating && side === 'right' ? `1px solid ${SB.border}` : undefined, transition: 'left 200ms linear, right 200ms linear, width 200ms linear', ...style }}>
      <div data-slot="sidebar-inner" style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column', background: SB.bg, boxSizing: 'border-box', overflow: 'hidden', ...(variant === 'floating' ? { border: `1px solid ${SB.border}`, borderRadius: 'var(--ui-radius-lg)', boxShadow: 'var(--ui-shadow-sm)' } : null) }}>{children}</div>
    </div>
  </div>;
}

export function SidebarInset({ style, children }) {
  const ctx = useSidebar();
  const inset = ctx.variant === 'inset';
  return <main data-slot="sidebar-inset" style={{ position: 'relative', display: 'flex', width: '100%', flex: 1, flexDirection: 'column', height: '100%', background: 'var(--ui-background)', ...(inset ? { margin: 8, marginLeft: ctx.state === 'collapsed' ? 8 : 0, borderRadius: 'var(--ui-radius-xl)', boxShadow: 'var(--ui-shadow-sm)' } : null), ...style }}>{children}</main>;
}

export function SidebarTrigger({ onClick, style }) {
  const ctx = useSidebar();
  const { hover, focus, bind } = useInteract();
  return <button type="button" data-slot="sidebar-trigger" aria-label="Toggle Sidebar" {...bind} onClick={(e) => { onClick && onClick(e); ctx.toggle(); }}
    style={{ display: 'inline-flex', width: 28, height: 28, alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: 'var(--ui-radius-md)', background: hover ? 'var(--ui-accent)' : 'transparent', color: 'var(--ui-foreground)', cursor: 'pointer', outline: 'none', boxShadow: focus ? 'var(--ui-focus-ring)' : 'none', ...style }}>{Ic('panelLeft', 16)}</button>;
}

export function SidebarRail({ style }) {
  const ctx = useSidebar();
  const [hover, setHover] = React.useState(false);
  const left = ctx.side !== 'right';
  const edge = ctx.state === 'collapsed' && ctx.collapsible === 'offcanvas' ? (left ? { right: -8 } : { left: -8 }) : (left ? { right: -16 } : { left: 0 });
  return <button type="button" tabIndex={-1} aria-label="Toggle Sidebar" title="Toggle Sidebar" onClick={ctx.toggle} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
    style={{ position: 'absolute', top: 0, bottom: 0, zIndex: 20, width: 16, padding: 0, border: 0, background: 'transparent', cursor: left === (ctx.state !== 'collapsed') ? 'w-resize' : 'e-resize', transform: 'translateX(-50%)', ...edge, ...style }}>
    <span style={{ position: 'absolute', top: 0, bottom: 0, left: 'calc(50% - 1px)', width: 2, background: hover ? SB.border : 'transparent', transition: 'all 150ms linear' }}/>
  </button>;
}

export const SidebarHeader = ({ style, children }) => <div data-slot="sidebar-header" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, ...style }}>{children}</div>;
export const SidebarFooter = ({ style, children }) => <div data-slot="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, ...style }}>{children}</div>;

export function SidebarContent({ style, children }) {
  const ctx = useSidebar();
  return <div data-slot="sidebar-content" style={{ display: 'flex', minHeight: 0, flex: 1, flexDirection: 'column', gap: 8, overflow: ctx.state === 'collapsed' && ctx.collapsible === 'icon' ? 'hidden' : 'auto', ...style }}>{children}</div>;
}

export const SidebarGroup = ({ style, children }) => <div data-slot="sidebar-group" style={{ position: 'relative', display: 'flex', width: '100%', minWidth: 0, flexDirection: 'column', padding: 8, boxSizing: 'border-box', ...style }}>{children}</div>;
export const SidebarGroupContent = ({ style, children }) => <div data-slot="sidebar-group-content" style={{ width: '100%', fontSize: 14, ...style }}>{children}</div>;

export function SidebarGroupLabel({ style, children }) {
  const ctx = useSidebar();
  const icon = ctx.state === 'collapsed' && ctx.collapsible === 'icon';
  return <div data-slot="sidebar-group-label" style={{ display: 'flex', height: 32, flexShrink: 0, alignItems: 'center', borderRadius: 'var(--ui-radius-md)', padding: '0 8px', fontSize: 12, fontWeight: 500, color: `color-mix(in oklab, ${SB.fg} 70%, transparent)`, marginTop: icon ? -32 : 0, opacity: icon ? 0 : 1, pointerEvents: icon ? 'none' : undefined, transition: 'margin 200ms linear, opacity 200ms linear', ...style }}>{children}</div>;
}

export function SidebarGroupAction({ onClick, style, children }) {
  const ctx = useSidebar();
  const { hover, focus, bind } = useInteract();
  if (ctx.state === 'collapsed' && ctx.collapsible === 'icon') return null;
  return <button type="button" data-slot="sidebar-group-action" {...bind} onClick={onClick}
    style={{ position: 'absolute', right: 12, top: 14, display: 'flex', aspectRatio: '1', width: 20, alignItems: 'center', justifyContent: 'center', padding: 0, border: 0, borderRadius: 'var(--ui-radius-md)', background: hover ? SB.accent : 'transparent', color: SB.fg, cursor: 'pointer', outline: 'none', boxShadow: focus ? `0 0 0 2px ${SB.ring}` : 'none', ...style }}>{children}</button>;
}

export const SidebarMenu = ({ style, children }) => <ul data-slot="sidebar-menu" style={{ display: 'flex', width: '100%', minWidth: 0, flexDirection: 'column', gap: 4, margin: 0, padding: 0, listStyle: 'none', ...style }}>{children}</ul>;

const ItemCtx = React.createContext({ hover: false, hasAction: false, size: 'default' });
export function SidebarMenuItem({ style, children }) {
  const [hover, setHover] = React.useState(false);
  const [focusWithin, setFocusWithin] = React.useState(false);
  const hasAction = React.Children.toArray(children).some(c => c && c.type === SidebarMenuAction);
  return <ItemCtx.Provider value={{ hover: hover || focusWithin, hasAction }}>
    <li data-slot="sidebar-menu-item" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setFocusWithin(true)} onBlur={() => setFocusWithin(false)} style={{ position: 'relative', ...style }}>{children}</li>
  </ItemCtx.Provider>;
}

const BTN_SIZE = { default: { height: 32, fontSize: 14 }, sm: { height: 28, fontSize: 12 }, lg: { height: 48, fontSize: 14 } };

export function SidebarMenuButton({ isActive = false, variant = 'default', size = 'default', tooltip, href, onClick, disabled, style, children }) {
  const ctx = useSidebar();
  const item = React.useContext(ItemCtx);
  const { hover, focus, bind } = useInteract();
  const iconMode = ctx.state === 'collapsed' && ctx.collapsible === 'icon';
  const Tag = href ? 'a' : 'button';
  const bg = isActive ? 'color-mix(in oklab, var(--ui-primary) 10%, transparent)' : hover ? SB.accent : variant === 'outline' ? 'var(--ui-background)' : 'transparent';
  const el = <Tag data-slot="sidebar-menu-button" data-active={isActive} data-size={size} {...bind} href={href} type={href ? undefined : 'button'} disabled={href ? undefined : disabled} aria-disabled={disabled || undefined} onClick={onClick}
    style={{ display: 'flex', width: iconMode ? 32 : '100%', boxSizing: 'border-box', alignItems: 'center', gap: 8, overflow: 'hidden', border: 0, borderRadius: 'var(--ui-radius-md)', textAlign: 'left', textDecoration: 'none', fontFamily: 'inherit', cursor: 'pointer', outline: 'none', transition: 'width 200ms, height 200ms, padding 200ms', ...BTN_SIZE[size], ...(iconMode ? { height: size === 'lg' ? 32 : 32, padding: size === 'lg' ? 0 : 8 } : { padding: 8, paddingRight: item.hasAction ? 32 : 8 }), color: isActive ? 'var(--ui-primary)' : hover ? 'var(--ui-accent-foreground)' : `color-mix(in oklab, ${SB.fg} 80%, transparent)`, background: bg, boxShadow: focus ? `0 0 0 2px ${SB.ring}` : variant === 'outline' ? `0 0 0 1px ${hover ? SB.accent : SB.border}` : 'none', opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : undefined, ...style }}>{children}</Tag>;
  if (!tooltip || !iconMode) return el;
  return <span style={{ position: 'relative', display: 'block' }}>
    {el}
    {hover && <span role="tooltip" style={{ position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8, zIndex: 250, whiteSpace: 'nowrap', background: 'var(--ui-foreground)', color: 'var(--ui-background)', borderRadius: 'var(--ui-radius-md)', padding: '6px 12px', fontSize: 12 }}>{tooltip}</span>}
  </span>;
}

export function SidebarMenuAction({ showOnHover = false, onClick, style, children }) {
  const ctx = useSidebar();
  const item = React.useContext(ItemCtx);
  const { hover, focus, bind } = useInteract();
  if (ctx.state === 'collapsed' && ctx.collapsible === 'icon') return null;
  return <button type="button" data-slot="sidebar-menu-action" {...bind} onClick={onClick}
    style={{ position: 'absolute', right: 4, top: 6, display: 'flex', aspectRatio: '1', width: 20, alignItems: 'center', justifyContent: 'center', padding: 0, border: 0, borderRadius: 'var(--ui-radius-md)', background: hover ? SB.accent : 'transparent', color: hover || item.hover ? 'var(--ui-accent-foreground)' : SB.fg, cursor: 'pointer', outline: 'none', boxShadow: focus ? `0 0 0 2px ${SB.ring}` : 'none', opacity: showOnHover && !item.hover && !focus ? 0 : 1, transition: 'transform 150ms', ...style }}>{children}</button>;
}

export function SidebarMenuBadge({ style, children }) {
  const ctx = useSidebar();
  if (ctx.state === 'collapsed' && ctx.collapsible === 'icon') return null;
  return <div data-slot="sidebar-menu-badge" style={{ pointerEvents: 'none', position: 'absolute', right: 4, top: 6, display: 'flex', height: 20, minWidth: 20, flexShrink: 0, userSelect: 'none', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--ui-radius-md)', padding: '0 4px', fontSize: 12, fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: `color-mix(in oklab, ${SB.fg} 50%, transparent)`, ...style }}>{children}</div>;
}

export function SidebarMenuSkeleton({ showIcon = false, style }) {
  const [width] = React.useState(() => `${Math.floor(Math.random() * 40) + 50}%`);
  const bar = { background: 'var(--ui-accent)', borderRadius: 'var(--ui-radius-md)', animation: 'ui-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' };
  return <div data-slot="sidebar-menu-skeleton" style={{ display: 'flex', height: 32, alignItems: 'center', gap: 8, borderRadius: 'var(--ui-radius-md)', padding: '0 8px', ...style }}>
    {showIcon && <div style={{ ...bar, width: 16, height: 16 }}/>}
    <div style={{ ...bar, height: 16, flex: 1, maxWidth: width }}/>
  </div>;
}

export function SidebarMenuSub({ style, children }) {
  const ctx = useSidebar();
  if (ctx.state === 'collapsed' && ctx.collapsible === 'icon') return null;
  return <ul data-slot="sidebar-menu-sub" style={{ display: 'flex', minWidth: 0, flexDirection: 'column', gap: 4, margin: '0 0 0 10px', padding: '2px 0 2px 8px', listStyle: 'none', borderLeft: `1px solid ${SB.border}`, transform: 'translateX(1px)', ...style }}>{children}</ul>;
}
export const SidebarMenuSubItem = ({ style, children }) => <li data-slot="sidebar-menu-sub-item" style={{ position: 'relative', ...style }}>{children}</li>;

export function SidebarMenuSubButton({ isActive = false, size = 'md', href, onClick, style, children }) {
  const ctx = useSidebar();
  const { hover, focus, bind } = useInteract();
  if (ctx.state === 'collapsed' && ctx.collapsible === 'icon') return null;
  return <a data-slot="sidebar-menu-sub-button" data-active={isActive} data-size={size} {...bind} href={href} onClick={onClick}
    style={{ display: 'flex', height: 28, minWidth: 0, transform: 'translateX(-1px)', alignItems: 'center', gap: 8, overflow: 'hidden', boxSizing: 'border-box', padding: '0 8px', borderRadius: 'var(--ui-radius-md)', textDecoration: 'none', fontSize: size === 'sm' ? 12 : 14, cursor: 'pointer', outline: 'none', color: isActive ? 'var(--ui-primary)' : hover ? 'var(--ui-accent-foreground)' : `color-mix(in oklab, ${SB.fg} 75%, transparent)`, background: isActive ? 'color-mix(in oklab, var(--ui-primary) 10%, transparent)' : hover ? SB.accent : 'transparent', boxShadow: focus ? `0 0 0 2px ${SB.ring}` : 'none', ...style }}>{children}</a>;
}

export const SidebarSeparator = ({ style }) => <div role="separator" data-slot="sidebar-separator" style={{ height: 1, width: 'auto', margin: '0 8px', background: SB.border, ...style }}/>;

export function SidebarInput({ value, defaultValue, onChange, placeholder, style }) {
  const { focus, bind } = useInteract();
  return <input data-slot="sidebar-input" {...bind} value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder}
    style={{ height: 32, width: '100%', boxSizing: 'border-box', background: 'var(--ui-background)', border: `1px solid ${focus ? 'var(--ui-ring)' : 'var(--ui-input)'}`, borderRadius: 'var(--ui-radius-md)', padding: '4px 12px', fontFamily: 'inherit', fontSize: 14, color: 'var(--ui-foreground)', outline: 'none', boxShadow: focus ? 'var(--ui-focus-ring)' : 'none', ...style }}/>;
}
