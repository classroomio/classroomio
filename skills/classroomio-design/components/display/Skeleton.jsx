import React from 'react';
export function Skeleton({ width = '100%', height = 16, radius, circle, style }) {
  return <div aria-hidden="true" style={{ width, height, borderRadius: circle ? '50%' : radius ?? 'var(--ui-radius-md)', background: 'var(--ui-accent)', animation: 'ui-pulse 2s cubic-bezier(.4,0,.6,1) infinite', ...style }}/>;
}