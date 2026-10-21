import React from 'react';
import { FONT } from '../forms/uiShared.jsx';
import { Button } from '../forms/Button.jsx';

function Root({ children, style, ...rest }) {
  return <div {...rest} style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 'calc(100vh - 48px)', width: '100%', boxSizing: 'border-box', fontFamily: FONT, color: 'var(--ui-foreground)', ...style }}>{children}</div>;
}

function Header({ isSticky = false, children, style, ...rest }) {
  return <div {...rest} style={{ display: 'flex', flexDirection: 'column', margin: '16px 0', padding: '8px 0', ...(isSticky ? { position: 'sticky', top: 44, zIndex: 10, background: 'var(--ui-background)' } : null), ...style }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>{children}</div>
  </div>;
}

function HeaderContent({ children, style, ...rest }) {
  return <div {...rest} style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>{children}</div>;
}

function Title({ children, style, ...rest }) {
  return <h1 {...rest} style={{ margin: 0, fontSize: 24, lineHeight: '32px', fontWeight: 400, letterSpacing: '-0.025em', ...style }}>{children}</h1>;
}

function Subtitle({ children, style, ...rest }) {
  return <p {...rest} style={{ margin: 0, fontSize: 14, lineHeight: '20px', color: 'var(--ui-muted-foreground)', ...style }}>{children}</p>;
}

function Action({ children, style, ...rest }) {
  return <div {...rest} style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>{children}</div>;
}

function Body({ children, style, ...rest }) {
  return <div {...rest} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowX: 'hidden', paddingBottom: 16, ...style }}>{children}</div>;
}

function BodyHeader({ align = 'right', children, style, ...rest }) {
  const justify = { left: 'flex-start', right: 'flex-end', none: 'center' }[align];
  return <div {...rest} style={{ display: 'flex', alignItems: 'center', justifyContent: justify, gap: 8, padding: 8, ...style }}>{children}</div>;
}

function FloatingBar({ show = false, status, fixed = false, badge, children, style, contentStyle, ...rest }) {
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    if (!show) { setEntered(false); return; }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [show]);
  const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return <>
    <div role="status" aria-atomic="true" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>{show ? status : ''}</div>
    {show && <div {...rest} style={{ pointerEvents: 'none', zIndex: 50, display: 'flex', flexShrink: 0, justifyContent: 'center', padding: '0 8px 40px', boxSizing: 'border-box', ...(fixed ? { position: 'fixed', left: 0, right: 0, bottom: 0 } : { position: 'sticky', bottom: 0 }), ...style }}>
      <div style={{ pointerEvents: 'auto', display: 'flex', width: 'fit-content', maxWidth: '100%', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 24, rowGap: 8, borderRadius: 'var(--ui-radius-lg)', background: 'var(--ui-foreground)', color: 'var(--ui-background)', padding: '8px 14px', boxShadow: 'var(--ui-shadow-lg)', opacity: entered ? 1 : 0, transform: entered || reduced ? 'none' : 'translateY(24px)', transition: 'opacity 200ms, transform 200ms', ...contentStyle }}>
        <div style={{ display: 'flex', minWidth: 0, alignItems: 'center', gap: 8 }}>
          {badge}
          <p style={{ margin: 0, fontSize: 14, lineHeight: '20px', fontWeight: 500 }}>{status}</p>
        </div>
        <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8 }}>{children}</div>
      </div>
    </div>}
  </>;
}

function SettingsActions({ hasChanges = false, loading = false, disabled = false, statusLabel, discardLabel, saveLabel, onSave, onDiscard, ...rest }) {
  const badge = <span aria-hidden="true" style={{ display: 'flex', width: 20, height: 20, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderRadius: 9999, background: 'var(--ui-primary)', color: 'var(--ui-primary-foreground)', fontSize: 11, fontWeight: 600, lineHeight: 1 }}>!</span>;
  return <FloatingBar show={hasChanges} status={statusLabel} badge={badge} {...rest}>
    <Button variant="secondary" size="xs" disabled={loading} onClick={onDiscard} data-testid="page-settings-discard" style={{ background: 'var(--ui-background)', color: 'var(--ui-foreground)' }}>{discardLabel}</Button>
    <Button variant="default" size="xs" loading={loading} disabled={loading || disabled} onClick={onSave} data-testid="page-settings-save">{saveLabel}</Button>
  </FloatingBar>;
}

export const Page = Object.assign(Root, { Root, Header, HeaderContent, Action, Title, Subtitle, Body, BodyHeader, FloatingBar, SettingsActions });
export const PageRoot = Root;
export const PageHeader = Header;
export const PageHeaderContent = HeaderContent;
export const PageAction = Action;
export const PageTitle = Title;
export const PageSubtitle = Subtitle;
export const PageBody = Body;
export const PageBodyHeader = BodyHeader;
export const PageFloatingBar = FloatingBar;
export const PageSettingsActions = SettingsActions;
