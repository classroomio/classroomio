import React from 'react';
export function NotchCard({ children, background = 'var(--sand-200)', pageColor = 'var(--page)', notchLeft = 24, tab = false, padding = '30px 26px 26px', as = 'div', href, style }) {
  const Tag = href ? 'a' : as;
  return <Tag href={href} style={{ position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: 10, background, padding, color: 'var(--ink-900)', ...style }}>
    {children}
    <span aria-hidden="true" style={{ position: 'absolute', top: -1, left: notchLeft, width: 46, height: 10, background: pageColor, clipPath: 'polygon(0 0,100% 0,calc(100% - 8px) 100%,8px 100%)', pointerEvents: 'none', zIndex: 4 }}/>
    {tab && <span aria-hidden="true" style={{ position: 'absolute', bottom: -16, left: notchLeft + 2, width: 42, height: 16, background, clipPath: 'polygon(0 0,100% 0,calc(100% - 7px) 100%,7px 100%)', pointerEvents: 'none', zIndex: 3 }}/>}
  </Tag>;
}