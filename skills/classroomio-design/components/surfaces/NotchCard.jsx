import React from 'react';
import { notchStyle, tabStyle } from '../forms/uiShared.jsx';
export function NotchCard({ children, background = 'var(--sand-200)', pageColor = 'var(--page)', notchLeft = 24, tab = false, padding = '30px 26px 26px', as = 'div', href, style }) {
  const Tag = href ? 'a' : as;
  return <Tag href={href} style={{ position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: 10, background, padding, color: 'var(--ink-900)', ...style }}>
    {children}
    <span aria-hidden="true" style={notchStyle(pageColor, notchLeft)}/>
    {tab && <span aria-hidden="true" style={tabStyle(background, notchLeft)}/>}
  </Tag>;
}